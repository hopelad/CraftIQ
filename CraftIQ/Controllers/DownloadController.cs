using System.Text;
using System.Text.Json;
using CraftIQ.Models;
using CraftIQ.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CraftIQ.Controllers
{
    [ApiController]
    [Route("api/download")]
    [Authorize]
    public class DownloadController : ControllerBase
    {
        private readonly IPdfService     _pdf;
        private readonly IDocxService    _docx;
        private readonly IHtmlPdfService _htmlPdf;
        private readonly ILogger<DownloadController> _logger;

        public DownloadController(
            IPdfService pdf,
            IDocxService docx,
            IHtmlPdfService htmlPdf,
            ILogger<DownloadController> logger)
        {
            _pdf     = pdf;
            _docx    = docx;
            _htmlPdf = htmlPdf;
            _logger  = logger;
        }

        // ── CV PDF ──────────────────────────────────────────────────────
        [HttpPost("cv/pdf")]
        public async Task<IActionResult> CvPdf([FromBody] DownloadRequest req)
        {
            if (req?.CV == null)
                return BadRequest(new { message = "No CV data." });

            try
            {
                // Prefer HTML-faithful PDF (preserves user's inline edits)
                if (!string.IsNullOrWhiteSpace(req.RenderedHtml))
                {
                    var htmlBytes = await _htmlPdf.GenerateAsync(req.RenderedHtml);
                    if (htmlBytes != null)
                        return File(htmlBytes, "application/pdf", Safe(req.CV.FullName) + "_CV.pdf");

                    _logger.LogInformation(
                        "Playwright unavailable for CV PDF — falling back to QuestPDF template render.");
                }

                var bytes = _pdf.GenerateCVPdf(
                    req.CV,
                    req.TemplateId  ?? "nexus",
                    req.PhotoBase64,
                    req.AccentColor ?? "#1a1a2e");

                return File(bytes, "application/pdf", Safe(req.CV.FullName) + "_CV.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CV PDF generation failed for user {User}", User.Identity?.Name);
                return StatusCode(500, new { message = "PDF generation failed. Please try again." });
            }
        }

        // ── CV DOCX ─────────────────────────────────────────────────────
        [HttpPost("cv/docx")]
        public IActionResult CvDocx([FromBody] DownloadRequest req)
        {
            if (req?.CV == null)
                return BadRequest(new { message = "No CV data." });
            try
            {
                var bytes = _docx.GenerateCVDocx(
                    req.CV,
                    req.TemplateId  ?? "nexus",
                    req.PhotoBase64,
                    req.AccentColor ?? "#1a1a2e");

                return File(bytes,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    Safe(req.CV.FullName) + "_CV.docx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CV DOCX generation failed for user {User}", User.Identity?.Name);
                return StatusCode(500, new { message = "DOCX generation failed. Please try again." });
            }
        }

        // ── Cover Letter PDF ─────────────────────────────────────────────
        [HttpPost("cover-letter/pdf")]
        public async Task<IActionResult> LetterPdf([FromBody] DownloadLetterRequest req)
        {
            if (req?.Letter == null)
                return BadRequest(new { message = "No letter data." });
            try
            {
                // Use HTML-faithful render if the client sent rendered HTML
                if (!string.IsNullOrWhiteSpace(req.RenderedHtml))
                {
                    var htmlBytes = await _htmlPdf.GenerateAsync(req.RenderedHtml);
                    if (htmlBytes != null)
                        return File(htmlBytes, "application/pdf", "Cover_Letter.pdf");
                }

                var bytes = _pdf.GenerateCoverLetterPdf(
                    req.Letter,
                    req.TemplateId  ?? "cl-prestige",
                    req.AccentColor ?? "#1a1a2e");

                return File(bytes, "application/pdf", "Cover_Letter.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cover letter PDF generation failed for user {User}", User.Identity?.Name);
                return StatusCode(500, new { message = "PDF generation failed. Please try again." });
            }
        }

        // ── Cover Letter DOCX ────────────────────────────────────────────
        [HttpPost("cover-letter/docx")]
        public IActionResult LetterDocx([FromBody] DownloadLetterRequest req)
        {
            if (req?.Letter == null)
                return BadRequest(new { message = "No letter data." });
            try
            {
                var bytes = _docx.GenerateCoverLetterDocx(
                    req.Letter,
                    req.TemplateId  ?? "cl-prestige",
                    req.AccentColor ?? "#1a1a2e");

                return File(bytes,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "Cover_Letter.docx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cover letter DOCX generation failed for user {User}", User.Identity?.Name);
                return StatusCode(500, new { message = "DOCX generation failed. Please try again." });
            }
        }

        // ── CV TXT ───────────────────────────────────────────────────────
        [HttpPost("cv/txt")]
        public IActionResult CvTxt([FromBody] DownloadRequest req)
        {
            if (req?.CV == null) return BadRequest(new { message = "No CV data." });
            try
            {
                var sb = new StringBuilder();
                var cv = req.CV;
                sb.AppendLine(cv.FullName);
                sb.AppendLine(cv.JobTitle);
                sb.AppendLine(string.Join(" | ", new[] { cv.Email, cv.Phone, cv.Location, cv.LinkedIn }.Where(x => !string.IsNullOrWhiteSpace(x))));
                sb.AppendLine();
                if (!string.IsNullOrWhiteSpace(cv.ProfessionalSummary))
                {
                    sb.AppendLine("PROFESSIONAL SUMMARY");
                    sb.AppendLine(new string('-', 40));
                    sb.AppendLine(cv.ProfessionalSummary);
                    sb.AppendLine();
                }
                if (cv.Experience.Any())
                {
                    sb.AppendLine("EXPERIENCE");
                    sb.AppendLine(new string('-', 40));
                    foreach (var e in cv.Experience)
                    {
                        sb.AppendLine(e.Heading);
                        foreach (var p in e.Points) sb.AppendLine("  • " + p);
                        sb.AppendLine();
                    }
                }
                if (cv.Education.Any())
                {
                    sb.AppendLine("EDUCATION");
                    sb.AppendLine(new string('-', 40));
                    foreach (var e in cv.Education)
                    {
                        sb.AppendLine(e.Heading);
                        foreach (var p in e.Points) sb.AppendLine("  " + p);
                        sb.AppendLine();
                    }
                }
                if (cv.Skills.Any()) { sb.AppendLine("SKILLS"); sb.AppendLine(string.Join(", ", cv.Skills)); sb.AppendLine(); }
                if (cv.Certifications.Any()) { sb.AppendLine("CERTIFICATIONS"); foreach (var c in cv.Certifications) sb.AppendLine("• " + c); sb.AppendLine(); }
                if (cv.Languages.Any()) { sb.AppendLine("LANGUAGES"); sb.AppendLine(string.Join(", ", cv.Languages)); }

                var bytes = Encoding.UTF8.GetBytes(sb.ToString());
                return File(bytes, "text/plain", Safe(cv.FullName) + "_CV.txt");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TXT export failed");
                return StatusCode(500, new { message = "TXT export failed." });
            }
        }

        // ── CV JSON ──────────────────────────────────────────────────────
        [HttpPost("cv/json")]
        public IActionResult CvJson([FromBody] DownloadRequest req)
        {
            if (req?.CV == null) return BadRequest(new { message = "No CV data." });
            try
            {
                var opts  = new JsonSerializerOptions { WriteIndented = true };
                var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(req.CV, opts));
                return File(bytes, "application/json", Safe(req.CV.FullName) + "_CV.json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "JSON export failed");
                return StatusCode(500, new { message = "JSON export failed." });
            }
        }

        private static string Safe(string? name) =>
            (name ?? "CV").Replace(" ", "_")
                          .Replace("/",  "")
                          .Replace("\\", "");
    }
}
