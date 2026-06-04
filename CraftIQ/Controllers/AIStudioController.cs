using CraftIQ.Models;
using CraftIQ.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CraftIQ.Controllers
{
    [ApiController]
    [Route("api/ai-studio")]
    [Authorize]
    public class AIStudioController : ControllerBase
    {
        private readonly IGroqAnalysisService _analysis;
        private readonly ICVStorageService    _storage;
        private readonly ILogger<AIStudioController> _logger;

        public AIStudioController(
            IGroqAnalysisService analysis,
            ICVStorageService storage,
            ILogger<AIStudioController> logger)
        {
            _analysis = analysis;
            _storage  = storage;
            _logger   = logger;
        }

        // ── Full CV analysis: ATS + Health + Job Match + Recruiter ────────
        [HttpPost("analyze")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest req, CancellationToken ct)
        {
            if (req?.CV == null)
                return BadRequest(new { message = "CV data is required." });
            try
            {
                var result = await _analysis.AnalyzeCVAsync(req, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Analysis failed for {User}", User.Identity?.Name);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ── AI Bullet Improver ────────────────────────────────────────────
        [HttpPost("improve-bullet")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> ImproveBullet([FromBody] BulletImproveRequest req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req?.Bullet))
                return BadRequest(new { message = "Bullet text is required." });
            try
            {
                var result = await _analysis.ImproveBulletAsync(req, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bullet improve failed");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ── Project Enhancement Engine ────────────────────────────────────
        [HttpPost("enhance-project")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> EnhanceProject([FromBody] ProjectEnhanceRequest req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req?.Title))
                return BadRequest(new { message = "Project title is required." });
            try
            {
                var result = await _analysis.EnhanceProjectAsync(req, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Project enhance failed");
                return StatusCode(500, new { message = "Failed to enhance project. Please try again." });
            }
        }

        // ── Interview Question Generator ──────────────────────────────────
        [HttpPost("interview-questions")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> InterviewQuestions([FromBody] InterviewQuestionsRequest req, CancellationToken ct)
        {
            if (req?.CV == null)
                return BadRequest(new { message = "CV data is required." });
            try
            {
                var result = await _analysis.GenerateInterviewQuestionsAsync(req, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Interview questions failed");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ── LinkedIn Profile Generator ────────────────────────────────────
        [HttpPost("linkedin")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> LinkedIn([FromBody] LinkedInRequest req, CancellationToken ct)
        {
            if (req?.CV == null)
                return BadRequest(new { message = "CV data is required." });
            try
            {
                var result = await _analysis.GenerateLinkedInAsync(req, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LinkedIn generation failed");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ── Analyze raw text from uploaded document ───────────────────────
        [HttpPost("analyze-text")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> AnalyzeText(
            [FromBody] AnalyzeTextRequest req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req?.RawText))
                return BadRequest(new { message = "Document text is required." });
            try
            {
                var result = await _analysis.AnalyzeCVFromTextAsync(req, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Text analysis failed for {User}", User.Identity?.Name);
                return StatusCode(500, new { message = "Analysis failed. Please try again." });
            }
        }

        // ── Cover Letter Review ───────────────────────────────────────────
        [HttpPost("analyze-cover-letter")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> AnalyzeCoverLetter(
            [FromBody] AnalyzeCoverLetterRequest req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req?.LetterText))
                return BadRequest(new { message = "Letter text is required." });
            try
            {
                var result = await _analysis.AnalyzeCoverLetterAsync(req, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cover letter analysis failed for {User}", User.Identity?.Name);
                return StatusCode(500, new { message = "Analysis failed. Please try again." });
            }
        }

        // ── Version Management ────────────────────────────────────────────
        [HttpGet("versions")]
        public async Task<IActionResult> GetVersions()
        {
            var uid = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            if (string.IsNullOrWhiteSpace(uid)) return Unauthorized();

            var records = await _storage.GetAllByUserAsync(uid);
            return Ok(records.Select(r => new
            {
                r.Id, r.CVTitle, r.TemplateId, r.AccentColor,
                r.Status, r.CreatedAt, r.UpdatedAt,
                hasPhoto = !string.IsNullOrEmpty(r.PhotoBase64)
            }).OrderByDescending(r => r.UpdatedAt));
        }

        [HttpPost("versions/{id}/duplicate")]
        public async Task<IActionResult> DuplicateVersion(string id)
        {
            var uid = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            if (string.IsNullOrWhiteSpace(uid)) return Unauthorized();

            var original = await _storage.GetByIdAsync(id, uid);
            if (original == null) return NotFound(new { message = "Version not found." });

            var copy = new CVRecord
            {
                UserId       = uid,
                CVTitle      = original.CVTitle + " (Copy)",
                TemplateId   = original.TemplateId,
                AccentColor  = original.AccentColor,
                CVDataJson   = original.CVDataJson,
                FormDataJson = original.FormDataJson,
                PhotoBase64  = original.PhotoBase64,
                Status       = "complete"
            };

            var saved = await _storage.SaveAsync(copy);
            return Ok(new { saved.Id, saved.CVTitle, saved.CreatedAt });
        }

        [HttpPatch("versions/{id}/rename")]
        public async Task<IActionResult> RenameVersion(string id, [FromBody] RenameRequest req)
        {
            var uid = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            if (string.IsNullOrWhiteSpace(uid)) return Unauthorized();
            if (string.IsNullOrWhiteSpace(req?.Title)) return BadRequest(new { message = "Title is required." });

            var record = await _storage.GetByIdAsync(id, uid);
            if (record == null) return NotFound(new { message = "Version not found." });

            record.CVTitle = req.Title;
            await _storage.SaveAsync(record);
            return Ok(new { message = "Renamed successfully." });
        }
    }

    public class RenameRequest { public string? Title { get; set; } }
}
