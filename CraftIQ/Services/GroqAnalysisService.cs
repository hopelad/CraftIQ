using System.Net.Http.Json;
using System.Text.Json;
using CraftIQ.Models;
using Microsoft.Extensions.Options;

namespace CraftIQ.Services
{
    public class GroqAnalysisService : IGroqAnalysisService
    {
        private readonly IHttpClientFactory _http;
        private readonly IOptionsMonitor<GroqOptions> _monitor;
        private readonly ILogger<GroqAnalysisService> _logger;

        public GroqAnalysisService(
            IHttpClientFactory http,
            IOptionsMonitor<GroqOptions> opts,
            ILogger<GroqAnalysisService> logger)
        {
            _http    = http;
            _monitor = opts;
            _logger  = logger;
        }

        private GroqOptions Opts => _monitor.CurrentValue;

        // ── Comprehensive CV analysis ─────────────────────────────────────
        public async Task<AnalyzeResponse> AnalyzeCVAsync(AnalyzeRequest req, CancellationToken ct = default)
        {
            var cv = req.CV ?? throw new ArgumentNullException(nameof(req.CV));
            bool hasJob = !string.IsNullOrWhiteSpace(req.JobDescription);

            // 1. Compute objective, measurable metrics locally — no AI guesswork
            var m = ComputeMetrics(cv);
            int completenessScore = ComputeCompletenessScore(m);
            int projectScore      = ComputeProjectScore(m);
            int readabilityScore  = ComputeReadabilityScore(m);
            int skillsScore       = ComputeSkillsScore(m);

            string cvText = BuildCVText(cv);

            // 2. AI only handles what requires field knowledge
            string system =
                "You are a senior ATS expert and recruitment consultant. " +
                "Analyze the CV content for field-specific keyword coverage and recruiter perspective. " +
                "Return ONLY a valid JSON object. No markdown, no commentary outside JSON.";

            string user =
                "Analyze this CV. Some scores have already been computed from measurable data — " +
                "you must use the exact pre-computed values shown below. " +
                "Only compute the scores marked as AI.\n\n" +
                "PRE-COMPUTED (do NOT change these values):\n" +
                $"  completenessScore = {completenessScore}  " +
                $"(sections present: {m.SectionsPresent}/7, " +
                $"contact fields: {m.ContactFieldCount}/4)\n" +
                $"  projectScore = {projectScore}  " +
                $"(avg {m.AvgBulletsPerJob:F1} bullets/role across {m.ExperienceCount} roles, " +
                $"{m.TotalBullets} total bullets)\n" +
                $"  readabilityScore = {readabilityScore}  " +
                $"(summary: {m.SummaryWordCount} words, skills: {m.SkillCount})\n" +
                $"  skillsScore = {skillsScore}  " +
                $"({m.SkillCount} skills listed)\n\n" +
                "YOU MUST COMPUTE (AI-only — requires field knowledge):\n" +
                "  atsScore: 0-100 — keyword pass rate for ATS scanners in this field. " +
                "Base this on whether the CV contains standard industry keywords, action verbs, " +
                "measurable achievements, and avoids tables/graphics that break ATS parsing.\n" +
                "  keywordScore: 0-100 — density of relevant industry/role keywords in the content.\n" +
                $"  overallScore: weighted formula = " +
                $"round(atsScore*0.30 + {completenessScore}*0.20 + keywordScore*0.20 + " +
                $"{projectScore}*0.15 + {readabilityScore}*0.15)\n\n" +
                "Return JSON with EXACTLY this structure:\n" +
                "{\n" +
                $"  \"overallScore\": <compute using formula above>,\n" +
                $"  \"atsScore\": <AI: 0-100 ATS keyword pass rate>,\n" +
                $"  \"completenessScore\": {completenessScore},\n" +
                $"  \"keywordScore\": <AI: 0-100 keyword density>,\n" +
                $"  \"skillsScore\": {skillsScore},\n" +
                $"  \"readabilityScore\": {readabilityScore},\n" +
                $"  \"projectScore\": {projectScore},\n" +
                "  \"missingKeywords\": [\"specific keyword absent but standard in this field\"],\n" +
                "  \"formattingIssues\": [\"specific, measurable formatting problem found in content\"],\n" +
                "  \"weakSections\": [\"SectionName: specific reason citing actual content\"],\n" +
                "  \"improvements\": [\"all improvements combined\"],\n" +
                "  \"highPriorityImprovements\": [\"critical fix that directly blocks ATS or recruiter — cite specific text\"],\n" +
                "  \"mediumPriorityImprovements\": [\"important but not blocking — cite specific text\"],\n" +
                "  \"lowPriorityImprovements\": [\"minor polish — cite specific text\"],\n" +
                "  \"actionVerbScore\": <0-100 strength/variety of action verbs in bullet points>,\n" +
                "  \"quantificationScore\": <0-100 presence of numbers/metrics in achievements>,\n" +
                "  \"writingQualityNote\": \"one specific observation about writing quality citing actual phrases\",\n" +
                (hasJob ?
                "  \"jobMatchPercentage\": <0-100 overlap with job description>,\n" +
                "  \"requiredSkills\": [\"skill explicitly required by job\"],\n" +
                "  \"missingSkills\": [\"required skill not found in CV\"],\n" +
                "  \"matchedKeywords\": [\"keyword present in both CV and job description\"],\n" +
                "  \"roleFitExplanation\": \"2-3 sentence explanation citing CV content and job requirements\",\n" : "") +
                "  \"shortlistReasons\": [\"specific evidence-based reason citing actual CV content\"],\n" +
                "  \"rejectReasons\": [\"specific concern citing actual CV content\"],\n" +
                "  \"redFlags\": [\"concrete red flag with specific example from CV\"],\n" +
                "  \"missingEvidence\": [\"specific claim in CV with no supporting metric or example\"]\n" +
                "}\n\n" +
                "Rules: Every item must cite specific text from the CV. No generic advice. " +
                "High priority = directly impacts ATS/recruiter decision. Medium = important improvement. Low = polish.\n\n" +
                "CV:\n" + cvText +
                (hasJob ? "\n\nJob Description:\n" + req.JobDescription : "");

            var json = await CallGroqAsync(system, user, ct);

            AnalyzeResponse result;
            try
            {
                result = ParseJson<AnalyzeResponse>(json) ?? new AnalyzeResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse analysis response");
                throw new InvalidOperationException("AI returned invalid analysis data. Please try again.");
            }

            // 3. Override with locally-computed values — AI cannot override measurable facts
            result.CompletenessScore = completenessScore;
            result.ProjectScore      = projectScore;
            result.ReadabilityScore  = readabilityScore;
            result.SkillsScore       = skillsScore;

            // 4. Recompute overallScore with the guaranteed formula
            result.OverallScore = (int)Math.Round(
                result.ATSScore      * 0.30 +
                completenessScore    * 0.20 +
                result.KeywordScore  * 0.20 +
                projectScore         * 0.15 +
                readabilityScore     * 0.15);

            return result;
        }

        // ── Local metric computation ──────────────────────────────────────

        private sealed record CvMetrics(
            int  SectionsPresent,   // 0-7
            int  SkillCount,
            int  ExperienceCount,
            int  TotalBullets,
            double AvgBulletsPerJob,
            int  SummaryWordCount,
            int  ContactFieldCount, // 0-4
            bool HasCertifications,
            bool HasLanguages,
            bool AllJobsHaveBullets
        );

        private static CvMetrics ComputeMetrics(CVResponse cv)
        {
            bool hasContact    = !string.IsNullOrEmpty(cv.Email) || !string.IsNullOrEmpty(cv.Phone);
            bool hasSummary    = !string.IsNullOrEmpty(cv.ProfessionalSummary);
            bool hasExperience = cv.Experience.Any();
            bool hasEducation  = cv.Education.Any();
            bool hasSkills     = cv.Skills.Any();
            bool hasCerts      = cv.Certifications.Any();
            bool hasLanguages  = cv.Languages.Any();

            int sectionsPresent =
                (hasContact    ? 1 : 0) + (hasSummary   ? 1 : 0) +
                (hasExperience ? 1 : 0) + (hasEducation ? 1 : 0) +
                (hasSkills     ? 1 : 0) + (hasCerts     ? 1 : 0) +
                (hasLanguages  ? 1 : 0);

            int expCount     = cv.Experience.Count;
            int totalBullets = cv.Experience.Sum(e => e.Points.Count);
            double avgBullets = expCount > 0 ? (double)totalBullets / expCount : 0;
            bool allHaveBullets = expCount > 0 && cv.Experience.All(e => e.Points.Count > 0);

            int summaryWords = string.IsNullOrEmpty(cv.ProfessionalSummary) ? 0
                : cv.ProfessionalSummary.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

            int contactFields =
                (!string.IsNullOrEmpty(cv.Email)    ? 1 : 0) +
                (!string.IsNullOrEmpty(cv.Phone)    ? 1 : 0) +
                (!string.IsNullOrEmpty(cv.Location) ? 1 : 0) +
                (!string.IsNullOrEmpty(cv.LinkedIn) ? 1 : 0);

            return new CvMetrics(
                sectionsPresent, cv.Skills.Count, expCount,
                totalBullets, avgBullets, summaryWords, contactFields,
                hasCerts, hasLanguages, allHaveBullets);
        }

        // Section completeness: did the user fill in the expected parts?
        private static int ComputeCompletenessScore(CvMetrics m)
        {
            int score = 0;
            // Core sections (each is 15 pts — essential, not optional)
            if (m.ContactFieldCount > 0)  score += 15; // has at least email or phone
            if (m.SummaryWordCount  > 0)  score += 15; // has a summary
            if (m.ExperienceCount   > 0)  score += 20; // has at least one job
            if (m.SectionsPresent  >= 4)  score += 15; // education present (inferred)
            if (m.SkillCount        > 0)  score += 15; // has skills

            // Contact depth bonus (each additional field = 2 pts, up to 8)
            score += Math.Min(8, m.ContactFieldCount * 2);

            // Optional sections bonus
            if (m.HasCertifications) score += 6;
            if (m.HasLanguages)      score += 6;

            return Math.Min(100, score);
        }

        // Bullet quality: how well the experience section is backed by evidence
        private static int ComputeProjectScore(CvMetrics m)
        {
            if (m.ExperienceCount == 0) return 0;

            int score = m.AvgBulletsPerJob switch
            {
                >= 5 => 90,
                >= 4 => 80,
                >= 3 => 70,
                >= 2 => 55,
                >= 1 => 35,
                _    => 15
            };

            // Bonus: no job left without any description
            if (m.AllJobsHaveBullets) score = Math.Min(100, score + 8);

            // Bonus: strong total bullet count (suggests detailed, thorough entries)
            if (m.TotalBullets >= 15) score = Math.Min(100, score + 5);
            else if (m.TotalBullets >= 10) score = Math.Min(100, score + 2);

            return score;
        }

        // Readability: structural clarity the reader can measure
        private static int ComputeReadabilityScore(CvMetrics m)
        {
            int score = 40; // base

            // Summary length sweet-spot: 30-100 words is ideal
            score += m.SummaryWordCount switch
            {
                0         => 0,
                <= 20     => 5,   // too short — almost no value
                <= 100    => 20,  // good range
                <= 160    => 12,  // acceptable but verbose
                _         => 6    // too long — hurts scannability
            };

            // Skills count sweet-spot: 5-20
            score += m.SkillCount switch
            {
                0        => 0,
                <= 4     => 5,
                <= 20    => 18,
                <= 30    => 10,
                _        => 5   // too many, looks padded
            };

            // Consistent bullet structure across all jobs
            if (m.AllJobsHaveBullets && m.ExperienceCount > 0) score += 15;
            else if (m.ExperienceCount == 0)                    score -= 10;

            return Math.Clamp(score, 0, 100);
        }

        // Skills score: based purely on quantity (AI will judge relevance separately)
        private static int ComputeSkillsScore(CvMetrics m)
        {
            return m.SkillCount switch
            {
                0        => 0,
                <= 3     => 20,
                <= 6     => 40,
                <= 10    => 60,
                <= 15    => 75,
                <= 22    => 88,
                _        => 95   // AI may adjust up/down for relevance, max 95
            };
        }

        // ── AI Bullet Improver ────────────────────────────────────────────
        public async Task<BulletImproveResponse> ImproveBulletAsync(BulletImproveRequest req, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(req.Bullet))
                throw new ArgumentException("Bullet point cannot be empty.");

            string system =
                "You are a professional CV writer. Improve resume bullet points to be powerful, ATS-friendly, and measurable. " +
                "Use strong action verbs. Add metrics where logical. Return ONLY valid JSON.";

            string user =
                "Improve this resume bullet point. Return JSON:\n" +
                "{ \"original\": \"<exact original>\", \"improved\": \"<improved version>\", \"explanation\": \"<1-2 sentences on what changed and why>\" }\n\n" +
                "Original bullet: " + req.Bullet + "\n" +
                (string.IsNullOrWhiteSpace(req.JobTitle) ? "" : "Job title: " + req.JobTitle + "\n") +
                (string.IsNullOrWhiteSpace(req.Company)  ? "" : "Company: " + req.Company + "\n") +
                "\nRules: Start with a strong past-tense action verb. Add measurable impact. Keep under 20 words. Be specific.";

            var json = await CallGroqAsync(system, user, ct);

            try
            {
                var result = ParseJson<BulletImproveResponse>(json) ?? new BulletImproveResponse();
                result.Original = req.Bullet;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse bullet improve response");
                throw new InvalidOperationException("AI returned invalid data. Please try again.");
            }
        }

        // ── Project Enhancement Engine ────────────────────────────────────
        public async Task<ProjectEnhanceResponse> EnhanceProjectAsync(ProjectEnhanceRequest req, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(req.Title))
                throw new ArgumentException("Project title cannot be empty.");

            string system =
                "You are a professional CV writer specializing in software engineering and technical roles. " +
                "Transform project descriptions into powerful resume-ready bullet points. Return ONLY valid JSON.";

            string user =
                "Generate strong resume bullet points for this project. Return JSON:\n" +
                "{\n" +
                "  \"bullets\": [\"4-5 strong bullet points using action verbs, technologies, and measurable impact\"],\n" +
                "  \"summary\": \"One-line project summary for a resume\"\n" +
                "}\n\n" +
                "Project Title: " + req.Title + "\n" +
                (string.IsNullOrWhiteSpace(req.Description) ? "" : "Description: " + req.Description + "\n") +
                (string.IsNullOrWhiteSpace(req.Tools)       ? "" : "Tools/Technologies: " + req.Tools + "\n") +
                (string.IsNullOrWhiteSpace(req.Role)        ? "" : "Your Role: " + req.Role + "\n") +
                (string.IsNullOrWhiteSpace(req.Impact)      ? "" : "Impact/Result: " + req.Impact + "\n") +
                "\nRules: Use action verbs. Mention specific technologies. Include measurable impact. Each bullet should stand alone.";

            var json = await CallGroqAsync(system, user, ct);

            try
            {
                return ParseJson<ProjectEnhanceResponse>(json) ?? new ProjectEnhanceResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse project enhance response");
                throw new InvalidOperationException("AI returned invalid data. Please try again.");
            }
        }

        // ── Interview Question Generator ──────────────────────────────────
        public async Task<InterviewQuestionsResponse> GenerateInterviewQuestionsAsync(
            InterviewQuestionsRequest req, CancellationToken ct = default)
        {
            var cv = req.CV ?? throw new ArgumentNullException(nameof(req.CV));
            string cvText = BuildCVText(cv);

            string system =
                "You are a senior interviewer. Generate short, focused interview questions based on the candidate's CV. " +
                "Keep each question under 15 words. Keep each tip under 10 words. Return ONLY valid JSON.";

            string user =
                "Generate 12 concise interview questions for this candidate. Keep each question under 15 words. Return JSON:\n" +
                "{\n" +
                "  \"questions\": [\n" +
                "    { \"question\": \"short focused question\", \"category\": \"Technical|HR|Behavioral|Project\", \"difficulty\": \"Easy|Medium|Hard\", \"tip\": \"one-line hint\" }\n" +
                "  ]\n" +
                "}\n\n" +
                "Include: 4 Technical, 3 HR, 3 Behavioral, 2 Project-based questions.\n" +
                "Mix: 3 Easy, 5 Medium, 4 Hard.\n\n" +
                "CV:\n" + cvText +
                (string.IsNullOrWhiteSpace(req.JobDescription) ? "" : "\n\nJob Description:\n" + req.JobDescription);

            var json = await CallGroqAsync(system, user, ct);

            try
            {
                return ParseJson<InterviewQuestionsResponse>(json) ?? new InterviewQuestionsResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse interview questions response");
                throw new InvalidOperationException("AI returned invalid data. Please try again.");
            }
        }

        // ── LinkedIn Profile Generator ────────────────────────────────────
        public async Task<LinkedInResponse> GenerateLinkedInAsync(LinkedInRequest req, CancellationToken ct = default)
        {
            var cv = req.CV ?? throw new ArgumentNullException(nameof(req.CV));
            string cvText = BuildCVText(cv);

            string system =
                "You are a LinkedIn profile optimization expert. Create compelling, keyword-rich LinkedIn content. " +
                "Return ONLY valid JSON.";

            string user =
                "Generate a LinkedIn profile from this CV. Return JSON:\n" +
                "{\n" +
                "  \"headline\": \"Headline under 200 chars: role + top 2-3 skills + value\",\n" +
                "  \"about\": \"About section, first person, 120-150 words max. Hook sentence, 2-3 key strengths, brief CTA.\",\n" +
                "  \"experiences\": [\n" +
                "    { \"heading\": \"Job Title at Company (dates)\", \"description\": \"2 bullet points of achievements\" }\n" +
                "  ],\n" +
                "  \"skills\": [\"top 15 skills\"]\n" +
                "}\n\n" +
                "CV:\n" + cvText +
                (string.IsNullOrWhiteSpace(req.TargetRole) ? "" : "\nTarget Role: " + req.TargetRole);

            var json = await CallGroqAsync(system, user, ct);

            try
            {
                return ParseJson<LinkedInResponse>(json) ?? new LinkedInResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse LinkedIn response: {Json}", json);
                throw new InvalidOperationException("LinkedIn parse error: " + ex.Message);
            }
        }

        // ── Shared helpers ────────────────────────────────────────────────

        private async Task<string> CallGroqAsync(string system, string user, CancellationToken ct)
        {
            var client = _http.CreateClient("Groq");

            var payload = new
            {
                model = Opts.Model,
                messages = new object[]
                {
                    new { role = "system", content = system },
                    new { role = "user",   content = user   }
                },
                temperature     = 0.3,
                max_tokens      = 2048,
                response_format = new { type = "json_object" }
            };

            var res = await client.PostAsJsonAsync("chat/completions", payload, ct);
            var raw = await res.Content.ReadAsStringAsync(ct);

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogError("Groq API error {Status}: {Body}", (int)res.StatusCode, raw);
                throw new InvalidOperationException($"Groq API error {(int)res.StatusCode}: {raw}");
            }

            using var doc = JsonDocument.Parse(raw);
            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";
        }

        private static readonly JsonSerializerOptions _parseOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new FlexibleStringListConverter() }
        };

        private static T? ParseJson<T>(string json)
        {
            var cleaned = json.Trim();
            if (cleaned.StartsWith("```"))
            {
                var first = cleaned.IndexOf('\n');
                var last  = cleaned.LastIndexOf("```");
                if (first >= 0 && last > first)
                    cleaned = cleaned.Substring(first + 1, last - first - 1).Trim();
            }
            return JsonSerializer.Deserialize<T>(cleaned, _parseOptions);
        }

        // Handles AI returning a plain string where an array is expected (and vice-versa)
        private sealed class FlexibleStringListConverter : System.Text.Json.Serialization.JsonConverter<List<string>>
        {
            public override List<string> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                var list = new List<string>();

                switch (reader.TokenType)
                {
                    case JsonTokenType.StartArray:
                        while (reader.Read() && reader.TokenType != JsonTokenType.EndArray)
                        {
                            if (reader.TokenType == JsonTokenType.String)
                                list.Add(reader.GetString() ?? "");
                            else if (reader.TokenType is JsonTokenType.Number)
                                list.Add(reader.GetDouble().ToString());
                            else if (reader.TokenType is JsonTokenType.StartObject or JsonTokenType.StartArray)
                            {
                                using var nested = JsonDocument.ParseValue(ref reader);
                                list.Add(nested.RootElement.GetRawText());
                            }
                            // skip null / booleans silently
                        }
                        break;

                    case JsonTokenType.String:
                        // AI returned a single string — wrap it as one-element list
                        var s = reader.GetString() ?? "";
                        if (!string.IsNullOrWhiteSpace(s))
                            list.Add(s);
                        break;

                    case JsonTokenType.Null:
                        break; // return empty list

                    default:
                        // Consume & discard any other token type to keep the reader in sync
                        using (JsonDocument.ParseValue(ref reader)) { }
                        break;
                }

                return list;
            }

            public override void Write(Utf8JsonWriter writer, List<string> value, JsonSerializerOptions options)
            {
                writer.WriteStartArray();
                foreach (var item in value) writer.WriteStringValue(item);
                writer.WriteEndArray();
            }
        }

        // ── Cover Letter Review ───────────────────────────────────────────
        public async Task<AnalyzeCoverLetterResponse> AnalyzeCoverLetterAsync(
            AnalyzeCoverLetterRequest req, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(req.LetterText))
                throw new ArgumentException("Letter text is required.");

            bool hasJob = !string.IsNullOrWhiteSpace(req.JobDescription);

            string system =
                "You are a senior career coach and hiring expert. " +
                "Analyze this cover letter and return ONLY valid JSON. No markdown.";

            string user =
                "Analyze this cover letter. Return JSON with EXACTLY this structure:\n" +
                "{\n" +
                "  \"overallScore\": <0-100 overall quality>,\n" +
                "  \"toneScore\": <0-100 tone appropriateness and consistency>,\n" +
                "  \"keywordScore\": <0-100" + (hasJob ? " — how well it uses keywords from the job description" : " — relevance of keywords") + ">,\n" +
                "  \"clarityScore\": <0-100 clarity and conciseness>,\n" +
                "  \"toneSummary\": \"1-sentence description of the letter's tone\",\n" +
                "  \"strengths\": [\"specific strength of this letter\"],\n" +
                "  \"improvements\": [\"specific, actionable improvement\"],\n" +
                "  \"missingKeywords\": [\"keyword or phrase that should appear but doesn't\"]\n" +
                "}\n\n" +
                "Cover Letter:\n" + req.LetterText +
                (hasJob ? "\n\nJob Description:\n" + req.JobDescription : "") +
                (string.IsNullOrWhiteSpace(req.CompanyName) ? "" : "\n\nCompany: " + req.CompanyName);

            var json = await CallGroqAsync(system, user, ct);

            try
            {
                return ParseJson<AnalyzeCoverLetterResponse>(json) ?? new AnalyzeCoverLetterResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse cover letter analysis response");
                throw new InvalidOperationException("AI returned invalid data. Please try again.");
            }
        }

        // ── Analyze raw text from uploaded document ───────────────────────────
        public async Task<AnalyzeResponse> AnalyzeCVFromTextAsync(
            AnalyzeTextRequest req, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(req.RawText))
                throw new ArgumentException("Document text is required.");

            bool hasJob = !string.IsNullOrWhiteSpace(req.JobDescription);

            string system =
                "You are a senior ATS expert and recruitment consultant with 20+ years experience. " +
                "Analyze the CV/resume text below. Be specific and evidence-based — cite actual text from the document. " +
                "Return ONLY a valid JSON object. No markdown, no commentary outside JSON.";

            string user =
                "Analyze this CV/resume text comprehensively. Compute all scores from the content. " +
                "Every item must reference specific content from the document — no generic advice.\n\n" +
                "Return JSON with EXACTLY this structure:\n{\n" +
                "  \"overallScore\": <0-100 weighted average>,\n" +
                "  \"atsScore\": <0-100 ATS keyword pass rate for this field>,\n" +
                "  \"completenessScore\": <0-100 all expected sections present and filled>,\n" +
                "  \"keywordScore\": <0-100 industry keyword density>,\n" +
                "  \"skillsScore\": <0-100 skills relevance and variety>,\n" +
                "  \"readabilityScore\": <0-100 structure and clarity>,\n" +
                "  \"projectScore\": <0-100 bullet point strength with action verbs and metrics>,\n" +
                "  \"actionVerbScore\": <0-100 action verb quality in experience bullets>,\n" +
                "  \"quantificationScore\": <0-100 measurable outcomes present>,\n" +
                "  \"writingQualityNote\": \"specific 1-sentence observation citing actual phrases\",\n" +
                "  \"missingKeywords\": [\"keyword absent but expected in this field\"],\n" +
                "  \"formattingIssues\": [\"specific formatting problem\"],\n" +
                "  \"weakSections\": [\"SectionName: specific reason citing content\"],\n" +
                "  \"highPriorityImprovements\": [\"critical fix citing specific CV text\"],\n" +
                "  \"mediumPriorityImprovements\": [\"important improvement citing specific text\"],\n" +
                "  \"lowPriorityImprovements\": [\"minor polish citing specific text\"],\n" +
                "  \"improvements\": [\"all improvements combined\"],\n" +
                (hasJob ?
                "  \"jobMatchPercentage\": <0-100 overlap with job description>,\n" +
                "  \"requiredSkills\": [\"skill required by job\"],\n" +
                "  \"missingSkills\": [\"required skill not in CV\"],\n" +
                "  \"matchedKeywords\": [\"keyword in both CV and JD\"],\n" +
                "  \"roleFitExplanation\": \"2-3 sentence fit explanation\",\n" : "") +
                "  \"shortlistReasons\": [\"evidence-based shortlist reason from CV content\"],\n" +
                "  \"rejectReasons\": [\"evidence-based rejection concern from CV content\"],\n" +
                "  \"redFlags\": [\"concrete red flag with CV example\"],\n" +
                "  \"missingEvidence\": [\"specific claim with no supporting metric\"]\n}\n\n" +
                "overallScore formula: round(atsScore*0.30 + completenessScore*0.20 + keywordScore*0.20 + projectScore*0.15 + readabilityScore*0.15)\n\n" +
                "CV Text:\n" + req.RawText +
                (hasJob ? "\n\nJob Description:\n" + req.JobDescription : "");

            var json = await CallGroqAsync(system, user, ct);

            try
            {
                return ParseJson<AnalyzeResponse>(json) ?? new AnalyzeResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse text analysis response");
                throw new InvalidOperationException("AI returned invalid analysis data. Please try again.");
            }
        }

        private static string BuildCVText(CVResponse cv)
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Name: " + cv.FullName);
            sb.AppendLine("Title: " + cv.JobTitle);
            sb.AppendLine("Email: " + cv.Email);
            sb.AppendLine("Phone: " + cv.Phone);
            sb.AppendLine("Location: " + cv.Location);
            if (!string.IsNullOrWhiteSpace(cv.ProfessionalSummary))
                sb.AppendLine("\nSummary:\n" + cv.ProfessionalSummary);
            if (cv.Experience.Any())
            {
                sb.AppendLine("\nExperience:");
                foreach (var e in cv.Experience)
                {
                    sb.AppendLine("  " + e.Heading);
                    foreach (var p in e.Points) sb.AppendLine("    - " + p);
                }
            }
            if (cv.Education.Any())
            {
                sb.AppendLine("\nEducation:");
                foreach (var e in cv.Education)
                {
                    sb.AppendLine("  " + e.Heading);
                    foreach (var p in e.Points) sb.AppendLine("    " + p);
                }
            }
            if (cv.Skills.Any())
                sb.AppendLine("\nSkills: " + string.Join(", ", cv.Skills));
            if (cv.Certifications.Any())
                sb.AppendLine("Certifications: " + string.Join(", ", cv.Certifications));
            if (cv.Languages.Any())
                sb.AppendLine("Languages: " + string.Join(", ", cv.Languages));
            return sb.ToString();
        }
    }
}
