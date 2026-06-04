using System.Security.Claims;
using CraftIQ.Models;
using CraftIQ.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CraftIQ.Controllers
{
    [ApiController]
    [Route("api/cv-storage")]
    [Authorize]
    public class CVStorageController : ControllerBase
    {
        private readonly ICVStorageService _storage;
        private readonly ILogger<CVStorageController> _logger;

        public CVStorageController(ICVStorageService storage, ILogger<CVStorageController> logger)
        {
            _storage = storage;
            _logger  = logger;
        }

        // Returns Unauthorized immediately if the identity claim is missing
        private string? CurrentUserId =>
            User.FindFirst(ClaimTypes.Name)?.Value;

        private IActionResult? RequireUser(out string userId)
        {
            userId = CurrentUserId ?? "";
            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Storage request with no identity claim from {IP}",
                    HttpContext.Connection.RemoteIpAddress);
                return Unauthorized(new { message = "User identity could not be determined." });
            }
            return null;
        }

        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            if (RequireUser(out var uid) is { } err) return err;
            var records = await _storage.GetAllByUserAsync(uid);
            return Ok(records.Select(r => new
            {
                r.Id, r.CVTitle, r.TemplateId, r.AccentColor,
                r.Status, r.CreatedAt, r.UpdatedAt,
                hasPhoto = !string.IsNullOrEmpty(r.PhotoBase64)
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            if (RequireUser(out var uid) is { } err) return err;
            var record = await _storage.GetByIdAsync(id, uid);
            if (record == null)
                return NotFound(new { message = "CV not found." });
            return Ok(record);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create()
        {
            if (RequireUser(out var uid) is { } err) return err;
            var record = await _storage.CreateDraftAsync(uid);
            return Ok(new { record.Id });
        }

        [HttpPost("save")]
        [RequestSizeLimit(15_728_640)]
        public async Task<IActionResult> Save([FromBody] CVRecord record)
        {
            if (record == null) return BadRequest(new { message = "No data provided." });
            if (RequireUser(out var uid) is { } err) return err;

            record.UserId = uid;
            try
            {
                var saved = await _storage.SaveAsync(record);
                _logger.LogInformation("CV saved: Id={Id}, User={User}", saved.Id, uid);
                return Ok(new { id = saved.Id, updatedAt = saved.UpdatedAt });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Save failed for user {User}: {Msg}", uid, ex.Message);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("autosave")]
        [RequestSizeLimit(15_728_640)] // 15 MB – covers large base64 photos
        public async Task<IActionResult> AutoSave([FromBody] AutoSaveRequest req)
        {
            if (req == null) return BadRequest(new { message = "No data." });
            if (RequireUser(out var uid) is { } err) return err;

            try
            {
                await _storage.AutoSaveFormAsync(
                    uid,
                    req.CVRecordId,
                    req.FormDataJson ?? "",
                    req.PhotoBase64,
                    req.CVDataJson);

                return Ok(new { savedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-save failed for user {UserId}", uid);
                return StatusCode(500, new { message = "Auto-save failed." });
            }
        }

        [HttpGet("autosave/{cvRecordId?}")]
        public async Task<IActionResult> GetAutoSave(string? cvRecordId = null)
        {
            if (RequireUser(out var uid) is { } err) return err;
            var save = await _storage.GetAutoSaveAsync(uid, cvRecordId);
            if (save == null) return Ok(null);
            return Ok(save);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (RequireUser(out var uid) is { } err) return err;
            var success = await _storage.DeleteAsync(id, uid);
            if (!success)
                return NotFound(new { message = "CV not found." });
            return Ok(new { message = "Deleted." });
        }
    }

    public class AutoSaveRequest
    {
        public string? CVRecordId   { get; set; }
        public string? FormDataJson { get; set; }
        public string? PhotoBase64  { get; set; }
        public string? CVDataJson   { get; set; }
    }
}
