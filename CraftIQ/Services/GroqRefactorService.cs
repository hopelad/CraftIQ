using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using CraftIQ.Models;

namespace CraftIQ.Services
{
    public class GroqRefactorService : IRefactorService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GroqRefactorService> _logger;

        public GroqRefactorService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<GroqRefactorService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration     = configuration;
            _logger            = logger;
        }

        private string ApiKey   => _configuration["Groq:ApiKey"]   ?? throw new InvalidOperationException("Groq:ApiKey missing");
        private string Model    => _configuration["Groq:Model"]     ?? "llama-3.3-70b-versatile";
        private string BaseUrl  => _configuration["Groq:BaseUrl"]   ?? "https://api.groq.com/openai/v1/";

        public async Task<RefactorResponse> RefactorAsync(
            RefactorRequest request,
            CancellationToken cancellationToken = default)
        {
            var client = _httpClientFactory.CreateClient("Groq");

            string systemPrompt = @"
You are a senior C/C++ software engineer and code quality expert with 20+ years of experience.
Your job is to:
1. Describe in plain English what the submitted code does (1-2 sentences, no jargon).
2. Decide honestly whether the code already meets professional quality standards.
3. If it does NOT: produce a clean refactored version, list all smells, and explain every change.
4. If it DOES: set alreadyClean to true, leave refactoredCode empty, and explain why the code is already clean.

ALREADY-CLEAN RULES — mark alreadyClean: true ONLY when ALL of the following hold:
- All variable and function names are clear and meaningful.
- No magic numbers — all literals are named constants or self-evident.
- No memory leaks, every allocation is freed/deleted.
- Input validation is present wherever user input or external data is read.
- No dead code, unused variables, or redundant operations.
- Indentation is consistent (4 spaces) and formatting is clean.
- No buffer overflow risks (no strcpy, gets, sprintf without bounds).
- Error return values of scanf, malloc, fopen are checked.
- Functions are short and do one thing each.
If ANY of these fails, the code is NOT already clean.

REFACTORING RULES — follow all of them strictly:
- Preserve the exact same logic and behavior. Never change what the program does.
- Use meaningful variable and function names (no single letters like n, i, s unless as loop counters with obvious context).
- Add input validation where missing (e.g. scanf return value checks, null pointer checks).
- Use modern C++ idioms where appropriate (range-based for, const, nullptr, std::string, etc.).
- Remove all magic numbers — replace with named constants or constexpr.
- Ensure proper memory management (no memory leaks, free every malloc, delete every new).
- Add whitespace and consistent indentation (4 spaces).
- Split long functions — each function should do one thing only.
- Remove dead code, unused variables, and redundant comments.
- Add a newline at end of output (printf/cout should end with \n).
- Use const correctness wherever applicable.
- Prefer stack over heap where possible.
- Never introduce new bugs.

CODE SMELL CATEGORIES — use EXACTLY one of these names per smell:
- Naming: unclear, abbreviated, or misleading names
- Magic Numbers: hardcoded numeric or string literals
- Long Function: function doing too many things
- Dead Code: unreachable or unused code/variables
- Missing Validation: no input validation or error checking
- Memory Leak: malloc/new without free/delete
- Poor Formatting: inconsistent indentation or spacing
- Missing Newline: printf/cout output missing \n
- Redundant Code: unnecessary assignments, conditions, or operations
- Global State: unnecessary global variables
- Poor Error Handling: ignoring return values of scanf, malloc, fopen, etc.
- Integer Overflow: unchecked arithmetic that could overflow
- Buffer Overflow: unsafe string operations like strcpy, gets, sprintf
- Unused Include: #include headers that are never used

SEVERITY LEVELS:
- High: causes bugs, crashes, undefined behavior, or security issues
- Medium: hurts readability, maintainability, or correctness in edge cases
- Low: minor style or quality issue

EXPLANATION RULES:
- Each explanation item must follow this format: 'Change title. Detailed reason why this change improves the code.'
- Be specific — mention the actual variable name, line, or construct that was changed.
- Never be vague. Bad: 'Improved readability.' Good: 'Renamed s to sum so the variable purpose is immediately clear to any reader.'
- List every meaningful change made. Aim for 5–10 explanation items.

Return ONLY valid JSON, no markdown, no extra text.
";

            string userPrompt = $@"
Analyze and refactor the following C/C++ code. Be thorough — find every issue.

Return JSON in exactly this format:
{{
  ""alreadyClean"": false,
  ""codeDescription"": ""1-2 sentences in plain English describing what this code does."",
  ""refactoredCode"": ""<complete refactored source code — empty string if alreadyClean is true>"",
  ""explanation"": [
    ""Change title. Detailed explanation of why this change was made and how it improves the code.""
  ],
  ""smells"": [
    {{
      ""title"": ""Short smell name"",
      ""category"": ""One of the exact category names listed above"",
      ""severity"": ""High | Medium | Low"",
      ""lineStart"": <integer line number where smell starts>,
      ""lineEnd"": <integer line number where smell ends>,
      ""reason"": ""What exactly is wrong on those lines and why it is a problem."",
      ""impact"": ""What can go wrong if this is not fixed — be specific."",
      ""fixSuggestion"": ""Exact concrete fix — show the corrected code snippet or describe precisely what to change.""
    }}
  ]
}}

IMPORTANT:
- alreadyClean must be true ONLY when the code genuinely needs no changes (see rules above).
- codeDescription is always required, even when alreadyClean is true.
- lineStart and lineEnd must be accurate integers matching the numbered source lines below.
- refactoredCode must be the complete file when alreadyClean is false; empty string when true.
- Every smell must have a non-empty reason, impact, and fixSuggestion.
- explanation must have at least one item per meaningful change; when alreadyClean is true, explain what makes the code already clean.
- smells array must be empty when alreadyClean is true.

Source code (with line numbers):
{AddLineNumbers(request.Code)}
";

            var apiKey = ApiKey;
            _logger.LogInformation(
                "Groq config — BaseUrl={BaseUrl} Model={Model} Key={Prefix}*** (len={Len})",
                BaseUrl, Model,
                apiKey.Length >= 6 ? apiKey[..6] : apiKey,
                apiKey.Length);

            var payload = new
            {
                model = Model,
                messages = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user",   content = userPrompt   }
                },
                temperature  = 0.1,
                max_tokens   = 2048,
                response_format = new { type = "json_object" }
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
            httpRequest.Headers.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            httpRequest.Content = JsonContent.Create(payload);

            var response = await client.SendAsync(httpRequest, CancellationToken.None);

            var raw = await response.Content.ReadAsStringAsync(CancellationToken.None);

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Groq API error: {raw}");

            using var root = JsonDocument.Parse(raw);

            var content = root.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(content))
                throw new Exception("Empty response from AI.");

            return ParseResponse(content);
        }

        private string AddLineNumbers(string code)
        {
            var builder = new StringBuilder();
            var lines = code.Replace("\r\n", "\n").Split('\n');
            for (int i = 0; i < lines.Length; i++)
                builder.AppendLine($"{i + 1,3}: {lines[i]}");
            return builder.ToString();
        }

        private RefactorResponse ParseResponse(string json)
        {
            var result = new RefactorResponse();

            string cleaned = json.Trim();
            if (cleaned.StartsWith("```"))
            {
                var firstNewline = cleaned.IndexOf('\n');
                var lastFence = cleaned.LastIndexOf("```");
                if (firstNewline >= 0 && lastFence > firstNewline)
                    cleaned = cleaned.Substring(firstNewline + 1, lastFence - firstNewline - 1).Trim();
            }

            using var document = JsonDocument.Parse(cleaned);
            var root = document.RootElement;

            if (root.TryGetProperty("alreadyClean", out var ac) &&
                ac.ValueKind == JsonValueKind.True)
                result.AlreadyClean = true;

            if (root.TryGetProperty("codeDescription", out var cd))
                result.CodeDescription = cd.GetString() ?? "";

            if (root.TryGetProperty("refactoredCode", out var refCode))
                result.RefactoredCode = refCode.GetString() ?? "";

            if (root.TryGetProperty("explanation", out var explanation) &&
                explanation.ValueKind == JsonValueKind.Array)
                foreach (var item in explanation.EnumerateArray())
                {
                    var text = item.GetString();
                    if (!string.IsNullOrWhiteSpace(text))
                        result.Explanation.Add(text);
                }

            if (root.TryGetProperty("smells", out var smells) &&
                smells.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in smells.EnumerateArray())
                {
                    var smell = new CodeSmell();

                    if (item.TryGetProperty("title", out var t)) smell.Title = t.GetString() ?? "";
                    if (item.TryGetProperty("category", out var c)) smell.Category = c.GetString() ?? "";
                    if (item.TryGetProperty("severity", out var s)) smell.Severity = s.GetString() ?? "Medium";
                    if (item.TryGetProperty("reason", out var r)) smell.Reason = r.GetString() ?? "";
                    if (item.TryGetProperty("impact", out var im)) smell.Impact = im.GetString() ?? "";
                    if (item.TryGetProperty("fixSuggestion", out var f)) smell.FixSuggestion = f.GetString() ?? "";

                    if (item.TryGetProperty("lineStart", out var ls) &&
                        ls.ValueKind == JsonValueKind.Number)
                        smell.LineStart = ls.GetInt32();

                    if (item.TryGetProperty("lineEnd", out var le) &&
                        le.ValueKind == JsonValueKind.Number)
                        smell.LineEnd = le.GetInt32();

                    if (!string.IsNullOrWhiteSpace(smell.Title))
                        result.Smells.Add(smell);
                }
            }

            return result;
        }
    }
}