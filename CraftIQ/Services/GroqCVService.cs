using System.Net.Http.Json;
using System.Text.Json;
using CraftIQ.Models;
using Microsoft.Extensions.Options;

namespace CraftIQ.Services
{
    public class GroqCVService : ICVService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IOptionsMonitor<GroqOptions> _monitor;

        public GroqCVService(
            IHttpClientFactory httpClientFactory,
            IOptionsMonitor<GroqOptions> options)
        {
            _httpClientFactory = httpClientFactory;
            _monitor = options;
        }

        private GroqOptions Options => _monitor.CurrentValue;

        public async Task<CVResponse> GenerateCVAsync(
            CVRequest req,
            CancellationToken ct = default)
        {
            var client = _httpClientFactory.CreateClient("Groq");

            // Build experience text from structured data
            string expText = "";
            if (req.Experience != null && req.Experience.Any())
            {
                expText = string.Join("\n\n", req.Experience.Select(e =>
                    $"{e.JobTitle} at {e.Company}" +
                    (!string.IsNullOrWhiteSpace(e.Location) ? $", {e.Location}" : "") +
                    $" ({e.StartDate} – {e.EndDate}):\n{e.Responsibilities}"));
            }

            // Build education text from structured data
            string eduText = "";
            if (req.Education != null && req.Education.Any())
            {
                eduText = string.Join("\n", req.Education.Select(e =>
                    $"{e.Degree}, {e.Institution}" +
                    (!string.IsNullOrWhiteSpace(e.Location) ? $", {e.Location}" : "") +
                    $" ({e.GraduationYear})"));
            }

            var reqExtra = string.IsNullOrWhiteSpace(req.JobRequirements) ? "" :
                $"\n\nJob requirements to tailor this CV to:\n{req.JobRequirements}";

            string system =
                "You are a professional CV writer with 20+ years of experience. " +
                "Transform the provided information into a polished ATS-optimized CV. " +
                "Use strong action verbs, quantify achievements, and match job requirements closely. " +
                "Group skills into 3-5 logical categories based on the candidate's field " +
                "(e.g. 'Programming Languages', 'Frameworks & Libraries', 'Hardware & Platforms', 'Tools', 'Domain Expertise'). " +
                "Every skill must appear in both the flat 'skills' array and within exactly one group. " +
                "Do NOT use em dashes (—) anywhere in the output. Use commas or colons instead. " +
                "Return ONLY valid JSON. No markdown. No extra text.";

            string user =
                "Generate a professional CV. Return exactly this JSON:\n" +
                "{\n" +
                "  \"fullName\": \"string\",\n" +
                "  \"jobTitle\": \"string\",\n" +
                "  \"email\": \"string\",\n" +
                "  \"phone\": \"string\",\n" +
                "  \"location\": \"string\",\n" +
                "  \"linkedIn\": \"string\",\n" +
                "  \"professionalSummary\": \"3-4 sentence compelling summary\",\n" +
                "  \"experience\": [{\"heading\": \"Job Title, Company, Location (Start - End)\", \"points\": [\"Achievement bullet point\"]}],\n" +
                "  \"education\": [{\"heading\": \"Degree, Institution, Location (Year)\", \"points\": [\"Relevant detail\"]}],\n" +
                "  \"skills\": [\"skill1\", \"skill2\"],\n" +
                "  \"skillGroups\": [{\"category\": \"Category Name\", \"skills\": [\"skill1\", \"skill2\"]}],\n" +
                "  \"certifications\": [\"cert1\"],\n" +
                "  \"languages\": [\"lang1\"],\n" +
                "  \"tips\": [\"actionable tip to improve this CV\"]\n" +
                "}\n\n" +
                $"Full Name: {req.FullName}\n" +
                $"Target Job Title: {req.JobTitle}\n" +
                $"Email: {req.Email}\n" +
                $"Phone: {req.Phone}\n" +
                $"Location: {req.Location}\n" +
                $"LinkedIn: {req.LinkedIn}\n" +
                $"Summary: {req.Summary}\n" +
                $"Experience:\n{expText}\n" +
                $"Education:\n{eduText}\n" +
                $"Skills: {req.Skills}\n" +
                $"Certifications: {req.Certifications}\n" +
                $"Languages: {req.Languages}" +
                reqExtra;

            var payload = new
            {
                model = Options.Model,
                messages = new object[]
                {
                    new { role = "system", content = system },
                    new { role = "user",   content = user   }
                },
                temperature = 0.3,
                max_tokens = 2048,
                response_format = new { type = "json_object" }
            };

            var res = await client.PostAsJsonAsync("chat/completions", payload, ct);
            var raw = await res.Content.ReadAsStringAsync(ct);

            if (!res.IsSuccessStatusCode)
                throw new Exception("Groq error " + (int)res.StatusCode + ": " + raw);

            using var doc = JsonDocument.Parse(raw);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(content))
                throw new Exception("Empty AI response: " + raw);

            return ParseCVResponse(content);
        }

        public async Task<CoverLetterResponse> GenerateCoverLetterAsync(
            CoverLetterRequest request,
            CancellationToken ct = default)
        {
            var client = _httpClientFactory.CreateClient("Groq");

            var (systemPrompt, userPrompt) = BuildCoverLetterPrompt(request);

            var payload = new
            {
                model = Options.Model,
                messages = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user",   content = userPrompt   }
                },
                temperature = 0.55,
                max_tokens = 2048,
                response_format = new { type = "json_object" }
            };

            var response = await client.PostAsJsonAsync("chat/completions", payload, ct);
            var raw = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
                throw new Exception("Groq API error " + (int)response.StatusCode + ": " + raw);

            using var rootDoc = JsonDocument.Parse(raw);
            var content = rootDoc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(content))
                throw new Exception("AI returned empty content. Response: " + raw);

            return ParseCoverLetterResponse(content);
        }

        // ── Template-aware prompt builder ──────────────────────────────
        private static (string system, string user) BuildCoverLetterPrompt(CoverLetterRequest r)
        {
            string name        = r.FullName;
            string role        = r.JobTitle;
            string company     = r.CompanyName;
            string manager     = string.IsNullOrWhiteSpace(r.HiringManager) ? "Hiring Manager" : r.HiringManager;
            string experience  = r.Experience;
            string skills      = r.Skills;
            string keySkills   = r.KeySkills;
            string whyCompany  = r.WhyCompany;
            string personalNote = r.PersonalNote;
            string template    = r.Template;

            string salutation = string.IsNullOrWhiteSpace(r.HiringManager)
                ? "Dear Hiring Manager,"
                : $"Dear {r.HiringManager},";

            string jobDesc     = r.JobDescription;
            string focusAreas  = r.FocusAreas;
            string length      = r.Length;
            string summary     = r.Summary;
            string education   = r.Education;

            // ── Length instruction ──
            string lengthInstruction = length switch {
                "Short"    => "IMPORTANT: Keep the letter SHORT — maximum 200 words. Be direct. No padding.\n",
                "Detailed" => "IMPORTANT: Write a DETAILED letter — 4 paragraphs minimum. Use specific examples and context.\n",
                _          => "Keep the letter to 3 focused paragraphs — concise and specific.\n"
            };

            // ── Focus areas instruction ──
            string focusInstruction = string.IsNullOrWhiteSpace(focusAreas)
                ? ""
                : $"Emphasise these specific areas from the candidate's background: {focusAreas}.\n";

            // ── Job description keywords ──
            string jdInstruction = string.IsNullOrWhiteSpace(jobDesc)
                ? ""
                : $"Job Description (use specific keywords and requirements from this naturally — do NOT quote it verbatim):\n{jobDesc}\n\n";

            // ── Shared context block ──
            string context =
                $"Candidate: {name}\n" +
                $"Applying for: {role} at {company}\n" +
                $"Salutation: {salutation}\n" +
                (string.IsNullOrWhiteSpace(summary) ? "" : $"Professional summary: {summary}\n") +
                $"Experience: {experience}\n" +
                (string.IsNullOrWhiteSpace(education) ? "" : $"Education: {education}\n") +
                $"Skills: {skills}\n" +
                (string.IsNullOrWhiteSpace(keySkills) ? "" : $"Key skills to emphasise: {keySkills}\n") +
                (string.IsNullOrWhiteSpace(whyCompany) ? "" : $"Why this company: {whyCompany}\n") +
                (string.IsNullOrWhiteSpace(personalNote) ? "" : $"Personal note: {personalNote}\n") +
                focusInstruction +
                lengthInstruction +
                jdInstruction;

            // ── Response format instruction (same for all templates) ──
            string formatInstruction =
                "Return ONLY valid JSON. No markdown. No extra text.\n" +
                "{\n" +
                "  \"subject\": \"Application for [role]: [name]\",\n" +
                "  \"opening\": \"First paragraph text only\",\n" +
                "  \"body\": \"Middle paragraph(s) text only\",\n" +
                "  \"closing\": \"Final paragraph text only\",\n" +
                "  \"fullLetter\": \"Complete formatted letter with salutation and sign-off. Use \\n\\n between paragraphs.\",\n" +
                "  \"tips\": [\"One specific, actionable tip for this letter\"]\n" +
                "}\n\n";

            // ── BANNED PHRASES (injected into every prompt) ──
            const string banned =
                "NEVER use: 'I am excited to apply', 'I am passionate about', 'perfect fit', " +
                "'highly motivated', 'thrilled', 'dynamic team', 'fast-paced environment', " +
                "'I would be a great addition', 'I am writing to apply', 'please find attached', " +
                "'I am a quick learner', 'I am confident that', 'looking forward to hearing from you'. " +
                "Write like a competent professional, not an AI template.\n\n";

            string system, user;

            switch (template)
            {
                case "Internship":
                    system =
                        "You write cover letters for internship candidates. " +
                        "The tone is confident for a student — not desperate or over-eager. " +
                        "Focus on academic work, relevant projects, and genuine interest in the company. " +
                        "3 paragraphs. Natural student voice. Return ONLY valid JSON.";
                    user =
                        formatInstruction + banned +
                        "Write an internship cover letter. Structure:\n" +
                        "Opening: State the role and mention one specific thing about the company that is genuinely interesting — not generic praise.\n" +
                        "Body: 1-2 academic or project examples that are directly relevant. Be concrete — name the project or course.\n" +
                        "Closing: Forward-looking, brief, not begging.\n\n" +
                        context;
                    break;

                case "Software Engineer":
                    system =
                        "You write cover letters for software engineers. " +
                        "Prioritize technical specificity. No vague claims. " +
                        "Developer-to-developer voice — clear and direct. Return ONLY valid JSON.";
                    user =
                        formatInstruction + banned +
                        "Write a technical cover letter for a software engineer. Structure:\n" +
                        "Opening: One sentence about a specific technical strength or project achievement — not a generic statement.\n" +
                        "Body: 2-3 specific technologies or technical contributions from their experience. Name actual tools, systems, or outcomes.\n" +
                        "You MAY include a short inline list (2-3 items) of technical fits before the closing.\n" +
                        "Closing: One short paragraph — direct, no filler.\n\n" +
                        context;
                    break;

                case "Academic":
                    system =
                        "You write formal academic cover letters for research and faculty positions. " +
                        "Scholarly, measured tone. Cite research areas and academic background specifically. " +
                        "4 paragraphs is appropriate. Return ONLY valid JSON.";
                    user =
                        formatInstruction + banned +
                        "Write an academic cover letter. Structure:\n" +
                        "Opening: State the position and institution. Mention research alignment in the first paragraph.\n" +
                        "Body paragraph 1: Academic and research background — be specific about areas, methods, or outputs.\n" +
                        "Body paragraph 2: How the candidate's work connects to the department's focus.\n" +
                        "Closing: Formal, professional. Mention readiness to discuss further.\n\n" +
                        context;
                    break;

                case "Startup":
                    system =
                        "You write cover letters for startup applications. " +
                        "Direct, genuine, slightly informal but competent. " +
                        "Show initiative and cultural fit without using startup clichés. Return ONLY valid JSON.";
                    user =
                        formatInstruction + banned +
                        "Write a cover letter for a startup application. Structure:\n" +
                        "Opening: Start with something genuine and specific about the company — a product decision, a mission statement, something that shows real research. Not just 'I admire your growth'.\n" +
                        "Body: 1-2 examples showing ownership, initiative, or scrappiness — real examples with context.\n" +
                        "Closing: Brief. Shows they understand the startup context without being sycophantic.\n" +
                        "AVOID: 'startup culture', 'wear many hats', 'scale quickly', 'move fast'. Write like a smart person, not a buzzword generator.\n\n" +
                        context;
                    break;

                case "Career Change":
                    system =
                        "You write cover letters for career changers. " +
                        "Own the transition confidently — never apologise for it. " +
                        "Bridge transferable skills directly. Return ONLY valid JSON.";
                    user =
                        formatInstruction + banned +
                        "Write a career change cover letter. Structure:\n" +
                        "Opening: Address the career change directly in the first sentence. Do not bury it. Frame it as a deliberate move, not a gap.\n" +
                        "Body: Identify 2-3 concrete transferable skills or experiences that directly apply to the new role. Be specific.\n" +
                        "Closing: Confident. Shows commitment to the new direction.\n" +
                        "NEVER: Apologise for lacking direct experience, use hedging language ('although I have not...'), or minimise the transition.\n\n" +
                        context;
                    break;

                case "Short & Direct":
                    system =
                        "You write very short, direct cover letters — under 200 words total. " +
                        "Every sentence earns its place. No filler. Return ONLY valid JSON.";
                    user =
                        formatInstruction + banned +
                        "Write a short, direct cover letter. Structure:\n" +
                        "Opening: One strong sentence — who they are and the single most compelling reason to consider them.\n" +
                        "Body: Use bullet points (•) to list 2-3 of the strongest relevant qualifications or achievements. Each bullet: one line maximum.\n" +
                        "Closing: One sentence — confident, no filler.\n" +
                        "Total length: under 200 words. Count carefully.\n\n" +
                        context;
                    break;

                case "Modern Formal":
                    system =
                        "You write contemporary professional cover letters that feel personal, not templated. " +
                        "Professional with a distinct human voice. " +
                        "No corporate stiffness, no AI-sounding patterns. Return ONLY valid JSON.";
                    user =
                        formatInstruction + banned +
                        "Write a modern formal cover letter. Structure:\n" +
                        "Opening: Start with a specific observation about the company or role that shows research — not generic praise. Then state interest naturally.\n" +
                        "Body: A narrative paragraph connecting 2-3 career experiences to role requirements. Write it as a story, not a list.\n" +
                        "Closing: Brief, genuine, confident — not formulaic.\n" +
                        "AVOID all: 'I am writing to apply', 'please find attached my CV', every sentence that sounds like it came from a template.\n\n" +
                        context;
                    break;

                default: // "Professional"
                    system =
                        "You are an expert cover letter writer. " +
                        "Write formal, professional cover letters that are specific and not generic. " +
                        "Natural but polished. Exactly 3 paragraphs. Return ONLY valid JSON.";
                    user =
                        formatInstruction + banned +
                        "Write a professional cover letter. Structure:\n" +
                        "Opening: Direct statement of the role being applied for and one specific reason — tied to the company's actual work or the role's requirements.\n" +
                        "Body: Concrete experience relevant to the role. Name actual responsibilities, outcomes, or contributions — not vague statements.\n" +
                        "Closing: Brief and confident. One sentence about next steps. No grovelling.\n\n" +
                        context;
                    break;
            }

            return (system, user);
        }

        // ── Parsers ─────────────────────────────────────────────────

        private CVResponse ParseCVResponse(string json)
        {
            var result  = new CVResponse();
            var cleaned = StripFences(json);

            JsonDocument doc;
            try   { doc = JsonDocument.Parse(cleaned); }
            catch { throw new InvalidOperationException("AI returned invalid JSON for CV. Please try again."); }
            using (doc)
            {
                var root = doc.RootElement;
                if (root.TryGetProperty("fullName",            out var fn)) result.FullName            = fn.GetString() ?? "";
                if (root.TryGetProperty("jobTitle",            out var jt)) result.JobTitle            = jt.GetString() ?? "";
                if (root.TryGetProperty("email",               out var em)) result.Email               = em.GetString() ?? "";
                if (root.TryGetProperty("phone",               out var ph)) result.Phone               = ph.GetString() ?? "";
                if (root.TryGetProperty("location",            out var lo)) result.Location            = lo.GetString() ?? "";
                if (root.TryGetProperty("linkedIn",            out var li)) result.LinkedIn            = li.GetString() ?? "";
                if (root.TryGetProperty("professionalSummary", out var ps)) result.ProfessionalSummary = ps.GetString() ?? "";

                if (root.TryGetProperty("experience", out var exp) && exp.ValueKind == JsonValueKind.Array)
                    foreach (var item in exp.EnumerateArray())
                        result.Experience.Add(ParseSection(item));

                if (root.TryGetProperty("education", out var edu) && edu.ValueKind == JsonValueKind.Array)
                    foreach (var item in edu.EnumerateArray())
                        result.Education.Add(ParseSection(item));

                ParseStringArray(root, "skills",         result.Skills);
                ParseStringArray(root, "certifications", result.Certifications);
                ParseStringArray(root, "languages",      result.Languages);
                ParseStringArray(root, "tips",           result.Tips);

                if (root.TryGetProperty("skillGroups", out var sgs) && sgs.ValueKind == JsonValueKind.Array)
                    foreach (var g in sgs.EnumerateArray())
                    {
                        var sg = new SkillGroup();
                        if (g.TryGetProperty("category", out var cat)) sg.Category = cat.GetString() ?? "";
                        if (g.TryGetProperty("skills",   out var gsk) && gsk.ValueKind == JsonValueKind.Array)
                            foreach (var s in gsk.EnumerateArray())
                            {
                                var sk = s.GetString();
                                if (!string.IsNullOrWhiteSpace(sk)) sg.Skills.Add(sk);
                            }
                        if (!string.IsNullOrEmpty(sg.Category) && sg.Skills.Any())
                            result.SkillGroups.Add(sg);
                    }
            }
            return result;
        }

        private CoverLetterResponse ParseCoverLetterResponse(string json)
        {
            var result  = new CoverLetterResponse();
            var cleaned = StripFences(json);

            JsonDocument doc;
            try   { doc = JsonDocument.Parse(cleaned); }
            catch { throw new InvalidOperationException("AI returned invalid JSON for cover letter. Please try again."); }
            using (doc)
            {
                var root = doc.RootElement;
                if (root.TryGetProperty("subject",    out var s))  result.Subject    = s.GetString()  ?? "";
                if (root.TryGetProperty("opening",    out var o))  result.Opening    = o.GetString()  ?? "";
                if (root.TryGetProperty("body",       out var b))  result.Body       = b.GetString()  ?? "";
                if (root.TryGetProperty("closing",    out var c))  result.Closing    = c.GetString()  ?? "";
                if (root.TryGetProperty("fullLetter", out var fl)) result.FullLetter = fl.GetString() ?? "";
                ParseStringArray(root, "tips", result.Tips);
            }
            return result;
        }

        private CVSection ParseSection(JsonElement item)
        {
            var section = new CVSection();
            if (item.TryGetProperty("heading", out var h))
                section.Heading = (h.GetString() ?? "")
                    .Replace(" — ", ", ")
                    .Replace("—", ",");
            if (item.TryGetProperty("points", out var p) && p.ValueKind == JsonValueKind.Array)
                foreach (var pt in p.EnumerateArray())
                    section.Points.Add(pt.GetString() ?? "");
            return section;
        }

        private void ParseStringArray(JsonElement root, string key, List<string> list)
        {
            if (root.TryGetProperty(key, out var arr) && arr.ValueKind == JsonValueKind.Array)
                foreach (var item in arr.EnumerateArray())
                {
                    var text = item.GetString();
                    if (!string.IsNullOrWhiteSpace(text)) list.Add(text);
                }
        }

        private string StripFences(string json)
        {
            var cleaned = json.Trim();
            if (!cleaned.StartsWith("```")) return cleaned;
            var first = cleaned.IndexOf('\n');
            var last = cleaned.LastIndexOf("```");
            if (first >= 0 && last > first)
                return cleaned.Substring(first + 1, last - first - 1).Trim();
            return cleaned;
        }
    }
}