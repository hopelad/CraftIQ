using CraftIQ.Models;

namespace CraftIQ.Services
{
    public interface ICVStorageService
    {
        Task<CVRecord> CreateDraftAsync(string userId);
        Task<CVRecord?> GetByIdAsync(string id, string userId);
        Task<List<CVRecord>> GetAllByUserAsync(string userId);
        Task<CVRecord> SaveAsync(CVRecord record);
        Task<bool> DeleteAsync(string id, string userId);
        Task AutoSaveFormAsync(
                                 string userId,
                                 string? cvRecordId,
                                 string formDataJson,
                                 string? photoBase64,
                                 string? cvDataJson = null);
        Task<CVAutoSave?> GetAutoSaveAsync(string userId, string? cvRecordId);
    }
}