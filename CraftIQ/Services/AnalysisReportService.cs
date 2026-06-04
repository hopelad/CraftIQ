using CraftIQ.Data;
using CraftIQ.Models;
using Microsoft.EntityFrameworkCore;

namespace CraftIQ.Services
{
    public class AnalysisReportService : IAnalysisReportService
    {
        private readonly AppDbContext _db;

        public AnalysisReportService(AppDbContext db) => _db = db;

        public async Task<AnalysisReport> SaveAsync(AnalysisReport report)
        {
            if (string.IsNullOrEmpty(report.Id))
                report.Id = Guid.NewGuid().ToString();

            if (report.CreatedAt == default)
                report.CreatedAt = DateTime.UtcNow;

            var existing = await _db.AnalysisReports.FirstOrDefaultAsync(x => x.Id == report.Id);
            if (existing == null)
                _db.AnalysisReports.Add(report);
            else
            {
                existing.Title        = report.Title;
                existing.AnalysisType = report.AnalysisType;
                existing.DocumentType = report.DocumentType;
                existing.JobTitle     = report.JobTitle;
                existing.OverallScore = report.OverallScore;
                existing.ResultJson   = report.ResultJson;
            }

            await _db.SaveChangesAsync();
            return report;
        }

        public async Task<List<AnalysisReport>> GetAllByUserAsync(string userId) =>
            await _db.AnalysisReports
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

        public async Task<bool> DeleteAsync(string id, string userId)
        {
            var r = await _db.AnalysisReports.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (r == null) return false;
            _db.AnalysisReports.Remove(r);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> CountByUserAsync(string userId) =>
            await _db.AnalysisReports.CountAsync(x => x.UserId == userId);
    }
}
