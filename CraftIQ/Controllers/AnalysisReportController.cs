using System.Security.Claims;
using CraftIQ.Models;
using CraftIQ.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CraftIQ.Controllers
{
    [ApiController]
    [Route("api/analysis-reports")]
    [Authorize]
    public class AnalysisReportController : ControllerBase
    {
        private readonly IAnalysisReportService _reports;
        private readonly ILogger<AnalysisReportController> _logger;

        public AnalysisReportController(IAnalysisReportService reports, ILogger<AnalysisReportController> logger)
        {
            _reports = reports;
            _logger  = logger;
        }

        private string? UserId => User.FindFirst(ClaimTypes.Name)?.Value;

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var uid = UserId;
            if (string.IsNullOrEmpty(uid)) return Unauthorized();
            var items = await _reports.GetAllByUserAsync(uid);
            return Ok(items.Select(r => new
            {
                r.Id, r.Title, r.AnalysisType, r.DocumentType,
                r.JobTitle, r.OverallScore, r.CreatedAt
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var uid = UserId;
            if (string.IsNullOrEmpty(uid)) return Unauthorized();
            var items = await _reports.GetAllByUserAsync(uid);
            var report = items.FirstOrDefault(r => r.Id == id);
            if (report == null) return NotFound(new { message = "Report not found." });
            return Ok(new
            {
                report.Id, report.Title, report.AnalysisType, report.DocumentType,
                report.JobTitle, report.OverallScore, report.CreatedAt, report.ResultJson
            });
        }

        [HttpPost]
        public async Task<IActionResult> Save([FromBody] AnalysisReport report)
        {
            var uid = UserId;
            if (string.IsNullOrEmpty(uid)) return Unauthorized();
            if (report == null) return BadRequest(new { message = "No data." });

            report.UserId = uid;
            try
            {
                var saved = await _reports.SaveAsync(report);
                return Ok(new { saved.Id, saved.CreatedAt });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save analysis report for {User}", uid);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var uid = UserId;
            if (string.IsNullOrEmpty(uid)) return Unauthorized();
            var ok = await _reports.DeleteAsync(id, uid);
            return ok ? Ok(new { message = "Deleted." }) : NotFound(new { message = "Not found." });
        }
    }
}
