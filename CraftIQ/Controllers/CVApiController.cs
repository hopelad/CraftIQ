using CraftIQ.Models;
using CraftIQ.Services;
using DocumentFormat.OpenXml.Packaging;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Text;
using System.Text.Json;

namespace CraftIQ.Controllers
{
    [ApiController]
    [Route("api/cv")]
    [Authorize]
    public class CVApiController : ControllerBase
    {
        private readonly ICVService _service;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CVApiController> _logger;

        private const long MaxUploadBytes = 10 * 1024 * 1024; // 10 MB

        public CVApiController(
            ICVService service,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<CVApiController> logger)
        {
            _service           = service;
            _httpClientFactory = httpClientFactory;
            _configuration     = configuration;
            _logger            = logger;
        }

        // ── Generate CV ──────────────────────────────────────────────
        [EnableRateLimiting("ai")]
        [HttpPost("generate")]
        public async Task<IActionResult> GenerateCV(
            [FromBody] CVRequest request,
            CancellationToken ct)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { message = "Please fill in at least your name." });

            try
            {
                var result = await _service.GenerateCVAsync(request, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CV generation failed for user {User}", User.Identity?.Name);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ── Cover Letter ─────────────────────────────────────────────
        [EnableRateLimiting("ai")]
        [HttpPost("cover-letter")]
        public async Task<IActionResult> GenerateCoverLetter(
            [FromBody] CoverLetterRequest request,
            CancellationToken ct)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { message = "Please fill in your name." });

            try
            {
                var result = await _service.GenerateCoverLetterAsync(request, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cover letter generation failed for user {User}", User.Identity?.Name);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ── Extract CV from file ─────────────────────────────────────
        [HttpPost("extract")]
        [RequestSizeLimit(10_485_760)]
        [RequestFormLimits(MultipartBodyLengthLimit = 10_485_760)]
        public async Task<IActionResult> ExtractCV(
            IFormFile file,
            CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            if (file.Length > MaxUploadBytes)
                return BadRequest(new { message = "File must be under 10 MB." });

            try
            {
                string ext     = Path.GetExtension(file.FileName).ToLowerInvariant();
                string rawText = "";

                if (ext == ".docx")
                {
                    if (!await HasMagicBytes(file, new byte[] { 0x50, 0x4B, 0x03, 0x04 }))
                        return BadRequest(new { message = "File does not appear to be a valid DOCX." });
                    rawText = ExtractFromDocx(file);
                }
                else if (ext == ".pdf")
                {
                    if (!await HasMagicBytes(file, new byte[] { 0x25, 0x50, 0x44, 0x46 })) // %PDF
                        return BadRequest(new { message = "File does not appear to be a valid PDF." });
                    rawText = ExtractFromPdf(file);
                }
                else if (ext is ".png" or ".jpg" or ".jpeg" or ".webp")
                {
                    rawText = await ExtractFromImageAsync(file, ct);
                }
                else
                {
                    return BadRequest(new { message = "Unsupported file type. Use PDF, DOCX, PNG or JPG." });
                }

                if (string.IsNullOrWhiteSpace(rawText))
                    return StatusCode(500, new { message = "Could not extract text from this file. Try a different format." });

                var formData = await ParseWithAIAsync(rawText, ct);
                return Ok(new { formData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CV extraction failed for file {FileName}", file.FileName);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ── Magic byte validation ────────────────────────────────────
        private static async Task<bool> HasMagicBytes(IFormFile file, byte[] expected)
        {
            var buffer = new byte[expected.Length];
            using var stream = file.OpenReadStream();
            var read = await stream.ReadAsync(buffer, 0, buffer.Length);
            if (read < expected.Length) return false;
            for (int i = 0; i < expected.Length; i++)
                if (buffer[i] != expected[i]) return false;
            return true;
        }

        // ── PDF extraction using iText7 ───────────────────────────────
        private string ExtractFromPdf(IFormFile file)
        {
            using var ms = new MemoryStream();
            file.CopyTo(ms);
            ms.Position = 0;

            var sb = new StringBuilder();
            using var reader = new PdfReader(ms);
            using var pdfDoc = new iText.Kernel.Pdf.PdfDocument(reader);

            for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
            {
                var page     = pdfDoc.GetPage(i);
                var strategy = new SimpleTextExtractionStrategy();
                var text     = PdfTextExtractor.GetTextFromPage(page, strategy);
                if (!string.IsNullOrWhiteSpace(text))
                    sb.AppendLine(text);
            }

            return sb.ToString().Trim();
        }

        // ── DOCX extraction ──────────────────────────────────────────
        private string ExtractFromDocx(IFormFile file)
        {
            using var ms = new MemoryStream();
            file.CopyTo(ms);
            ms.Position = 0;

            var sb  = new StringBuilder();
            using var doc  = WordprocessingDocument.Open(ms, false);
            var body = doc.MainDocumentPart?.Document?.Body;

            if (body != null)
                foreach (var para in body
                    .Descendants<DocumentFormat.OpenXml.Wordprocessing.Paragraph>())
                {
                    var text = para.InnerText?.Trim();
                    if (!string.IsNullOrWhiteSpace(text))
                        sb.AppendLine(text);
                }

            return sb.ToString().Trim();
        }

        // ── Image extraction via Groq vision AI ─────────────────────
        private async Task<string> ExtractFromImageAsync(
            IFormFile file,
            CancellationToken ct)
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, ct);
            var base64   = Convert.ToBase64String(ms.ToArray());
            var mimeType = "image/jpeg"; // always override ContentType — it is attacker-controlled

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if      (ext == ".png")  mimeType = "image/png";
            else if (ext == ".webp") mimeType = "image/webp";

            var client = _httpClientFactory.CreateClient("Groq");

            var requestBody = new
            {
                model = "meta-llama/llama-4-scout-17b-16e-instruct",
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = new object[]
                        {
                            new { type = "image_url", image_url = new { url = $"data:{mimeType};base64,{base64}" } },
                            new { type = "text",      text = "This is a CV or resume image. Extract ALL text exactly as written. Include name, contact, summary, experience, education, skills, certifications, languages. Return only the raw extracted text." }
                        }
                    }
                },
                max_tokens = 4096
            };

            var json        = JsonSerializer.Serialize(requestBody);
            var httpContent = new StringContent(json, Encoding.UTF8, "application/json");
            var res         = await client.PostAsync("chat/completions", httpContent, ct);
            var raw         = await res.Content.ReadAsStringAsync(ct);

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogError("Vision API error {Status}", (int)res.StatusCode);
                throw new InvalidOperationException("Vision API request failed.");
            }

            using var doc = JsonDocument.Parse(raw);
            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "";
        }

        // ── Parse raw text into structured JSON via AI ───────────────
        private async Task<object> ParseWithAIAsync(
            string rawText,
            CancellationToken ct)
        {
            var opts   = _configuration.GetSection("Groq").Get<GroqOptions>()
                         ?? throw new InvalidOperationException("Groq configuration is missing.");
            var client = _httpClientFactory.CreateClient("Groq");

            string system =
                "You are an expert CV parser. Extract structured information from CV text. " +
                "Return ONLY valid JSON. No markdown. No extra text.";

            string user =
                "Parse this CV and return structured JSON in EXACTLY this format:\n" +
                "{\n" +
                "  \"fullName\": \"string\",\n  \"jobTitle\": \"string\",\n  \"email\": \"string\",\n" +
                "  \"phone\": \"string\",\n  \"location\": \"string\",\n  \"linkedin\": \"string\",\n" +
                "  \"summary\": \"string\",\n  \"skills\": [\"skill1\"],\n  \"certifications\": [\"cert1\"],\n" +
                "  \"languages\": [\"lang1\"],\n" +
                "  \"experience\": [{\"jobTitle\":\"string\",\"company\":\"string\",\"location\":\"string\",\"startDate\":\"string\",\"endDate\":\"string\",\"responsibilities\":\"text\"}],\n" +
                "  \"education\": [{\"degree\":\"string\",\"institution\":\"string\",\"location\":\"string\",\"graduationYear\":\"string\"}]\n" +
                "}\n\nUse empty string or empty array for missing fields.\n\nCV Text:\n" + rawText;

            var payload = new
            {
                model          = opts.Model,
                messages       = new object[] { new { role = "system", content = system }, new { role = "user", content = user } },
                temperature    = 0.1,
                max_tokens     = 4096,
                response_format = new { type = "json_object" }
            };

            var res = await client.PostAsJsonAsync("chat/completions", payload, ct);
            var raw = await res.Content.ReadAsStringAsync(ct);

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogError("CV parse AI error {Status}", (int)res.StatusCode);
                throw new InvalidOperationException("AI parsing request failed.");
            }

            using var doc = JsonDocument.Parse(raw);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";

            return JsonSerializer.Deserialize<object>(content)!;
        }
    }
}
