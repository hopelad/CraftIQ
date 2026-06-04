using CraftIQ.Data;
using CraftIQ.Models;
using Microsoft.EntityFrameworkCore;

namespace CraftIQ.Services
{
    public class CVStorageService : ICVStorageService
    {
        private readonly AppDbContext _db;

        public CVStorageService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<CVRecord> CreateDraftAsync(string userId)
        {
            var record = new CVRecord
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                CVTitle = "New CV",
                Status = "draft",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.CVRecords.Add(record);
            await _db.SaveChangesAsync();
            return record;
        }

        public async Task<CVRecord?> GetByIdAsync(string id, string userId)
        {
            return await _db.CVRecords
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        }

        public async Task<List<CVRecord>> GetAllByUserAsync(string userId)
        {
            return await _db.CVRecords
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync();
        }

        public async Task<CVRecord> SaveAsync(CVRecord record)
        {
            if (string.IsNullOrEmpty(record.Id))
                record.Id = Guid.NewGuid().ToString();

            var now = DateTime.UtcNow;
            if (record.CreatedAt == default)
                record.CreatedAt = now;
            record.UpdatedAt = now;

            var existing = await _db.CVRecords
                .FirstOrDefaultAsync(x => x.Id == record.Id);

            if (existing == null)
            {
                _db.CVRecords.Add(record);
            }
            else
            {
                existing.CVTitle = record.CVTitle;
                existing.TemplateId = record.TemplateId;
                existing.AccentColor = record.AccentColor;
                existing.CVDataJson = record.CVDataJson;
                existing.FormDataJson = record.FormDataJson;
                existing.PhotoBase64 = record.PhotoBase64;
                existing.Status = record.Status;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return record;
        }

        public async Task<bool> DeleteAsync(string id, string userId)
        {
            var record = await _db.CVRecords
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

            if (record == null) return false;

            _db.CVRecords.Remove(record);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task AutoSaveFormAsync(
            string userId,
            string? cvRecordId,
            string formDataJson,
            string? photoBase64,
            string? cvDataJson = null)
        {
            var existing = await _db.CVAutoSaves
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.CVRecordId == cvRecordId);

            if (existing == null)
            {
                _db.CVAutoSaves.Add(new CVAutoSave
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    CVRecordId = cvRecordId,
                    FormDataJson = formDataJson,
                    CVDataJson = cvDataJson,
                    PhotoBase64 = photoBase64,
                    SavedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.FormDataJson = formDataJson;
                existing.PhotoBase64 = photoBase64;
                existing.SavedAt = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(cvDataJson))
                    existing.CVDataJson = cvDataJson;
            }

            await _db.SaveChangesAsync();
        }

        public async Task<CVAutoSave?> GetAutoSaveAsync(
            string userId,
            string? cvRecordId)
        {
            return await _db.CVAutoSaves
                .Where(x => x.UserId == userId && x.CVRecordId == cvRecordId)
                .OrderByDescending(x => x.SavedAt)
                .FirstOrDefaultAsync();
        }
    }
}