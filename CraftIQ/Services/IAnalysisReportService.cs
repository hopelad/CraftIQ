using CraftIQ.Models;

namespace CraftIQ.Services
{
    public interface IAnalysisReportService
    {
        Task<AnalysisReport>       SaveAsync(AnalysisReport report);
        Task<List<AnalysisReport>> GetAllByUserAsync(string userId);
        Task<bool>                 DeleteAsync(string id, string userId);
        Task<int>                  CountByUserAsync(string userId);
    }
}
