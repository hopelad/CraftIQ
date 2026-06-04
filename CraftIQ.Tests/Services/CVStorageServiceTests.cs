using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using CraftIQ.Data;
using CraftIQ.Models;
using CraftIQ.Services;
using CraftIQ.Tests.Helpers;

namespace CraftIQ.Tests.Services
{
    public class CVStorageServiceTests
    {
        private CVStorageService CreateService(AppDbContext db)
        {
            return new CVStorageService(db);
        }

        // ----------------------------------------------------------------
        // 1. CreateDraftAsync creates a record with Draft status
        // ----------------------------------------------------------------
        [Fact]
        public async Task CreateDraftAsync_CreatesRecordWithDraftStatus()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);

            // Act
            var record = await service.CreateDraftAsync("user1");

            // Assert
            Assert.NotNull(record);
            Assert.Equal("draft", record!.Status);   // service sets lowercase "draft"
            Assert.Equal("user1", record.UserId);
            Assert.NotEmpty(record.Id);              // Id was assigned by service
        }

        // ----------------------------------------------------------------
        // 2. SaveAsync with no Id generates a new Id
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveAsync_NewRecord_GeneratesId_WhenNullId()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var record = new CVRecord
            {
                Id = null!,
                UserId = "user1",
                CVTitle = "New CV",
                Status = "Draft"
            };

            // Act
            await service.SaveAsync(record);

            // Assert
            Assert.NotNull(record.Id);
            Assert.NotEmpty(record.Id);
        }

        // ----------------------------------------------------------------
        // 3. SaveAsync updates title for existing record
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveAsync_ExistingRecord_UpdatesTitle()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var original = CvBuilder.MakeCV(userId: "user1", title: "Original Title");
            db.CVRecords.Add(original);
            await db.SaveChangesAsync();

            // Act
            original.CVTitle = "Updated Title";
            await service.SaveAsync(original);

            // Assert
            var fromDb = await db.CVRecords.FindAsync(original.Id);
            Assert.Equal("Updated Title", fromDb!.CVTitle);
        }

        // ----------------------------------------------------------------
        // 4. SaveAsync sets UpdatedAt to UtcNow
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveAsync_SetsUpdatedAt_ToUtcNow()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var before = DateTime.UtcNow.AddSeconds(-1);
            var record = new CVRecord
            {
                UserId = "user1",
                CVTitle = "Test CV",
                Status = "Draft"
            };

            // Act
            await service.SaveAsync(record);

            // Assert
            Assert.True(record.UpdatedAt >= before);
            Assert.True(record.UpdatedAt <= DateTime.UtcNow.AddSeconds(5));
        }

        // ----------------------------------------------------------------
        // 5. SaveAsync sets CreatedAt when it is default
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveAsync_SetsCreatedAt_WhenDefault()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var record = new CVRecord
            {
                UserId = "user1",
                CVTitle = "Test CV",
                Status = "Draft",
                CreatedAt = default
            };

            // Act
            await service.SaveAsync(record);

            // Assert
            Assert.NotEqual(default, record.CreatedAt);
        }

        // ----------------------------------------------------------------
        // 6. GetByIdAsync returns record for the correct user
        // ----------------------------------------------------------------
        [Fact]
        public async Task GetByIdAsync_ReturnsRecord_ForCorrectUser()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var record = CvBuilder.MakeCV(userId: "user1", title: "My CV");
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();

            // Act
            var result = await service.GetByIdAsync(record.Id, "user1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(record.Id, result!.Id);
        }

        // ----------------------------------------------------------------
        // 7. GetByIdAsync returns null for the wrong user
        // ----------------------------------------------------------------
        [Fact]
        public async Task GetByIdAsync_ReturnsNull_ForWrongUser()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var record = CvBuilder.MakeCV(userId: "user1", title: "My CV");
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();

            // Act
            var result = await service.GetByIdAsync(record.Id, "user2");

            // Assert
            Assert.Null(result);
        }

        // ----------------------------------------------------------------
        // 8. GetAllByUserAsync returns only records for the specified user
        // ----------------------------------------------------------------
        [Fact]
        public async Task GetAllByUserAsync_ReturnsOnlyUserRecords()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            db.CVRecords.AddRange(
                CvBuilder.MakeCV(userId: "user1", title: "CV A"),
                CvBuilder.MakeCV(userId: "user1", title: "CV B"),
                CvBuilder.MakeCV(userId: "user2", title: "CV C")
            );
            await db.SaveChangesAsync();

            // Act
            var results = await service.GetAllByUserAsync("user1");

            // Assert
            Assert.Equal(2, results.Count);
            Assert.All(results, r => Assert.Equal("user1", r.UserId));
        }

        // ----------------------------------------------------------------
        // 9. GetAllByUserAsync orders by UpdatedAt descending
        // ----------------------------------------------------------------
        [Fact]
        public async Task GetAllByUserAsync_OrdersByUpdatedAtDescending()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var older = CvBuilder.MakeCV(userId: "user1", title: "Older", updatedAt: DateTime.UtcNow.AddDays(-2));
            var newer = CvBuilder.MakeCV(userId: "user1", title: "Newer", updatedAt: DateTime.UtcNow);
            db.CVRecords.AddRange(older, newer);
            await db.SaveChangesAsync();

            // Act
            var results = await service.GetAllByUserAsync("user1");

            // Assert
            Assert.Equal("Newer", results[0].CVTitle);
            Assert.Equal("Older", results[1].CVTitle);
        }

        // ----------------------------------------------------------------
        // 10. DeleteAsync removes a record for the owner
        // ----------------------------------------------------------------
        [Fact]
        public async Task DeleteAsync_RemovesRecord_ForOwner()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var record = CvBuilder.MakeCV(userId: "user1");
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();

            // Act
            var result = await service.DeleteAsync(record.Id, "user1");

            // Assert
            Assert.True(result);
            Assert.Null(await db.CVRecords.FindAsync(record.Id));
        }

        // ----------------------------------------------------------------
        // 11. DeleteAsync returns false for wrong user
        // ----------------------------------------------------------------
        [Fact]
        public async Task DeleteAsync_ReturnsFalse_ForWrongUser()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var record = CvBuilder.MakeCV(userId: "user1");
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();

            // Act
            var result = await service.DeleteAsync(record.Id, "user2");

            // Assert
            Assert.False(result);
            Assert.NotNull(await db.CVRecords.FindAsync(record.Id));
        }

        // ----------------------------------------------------------------
        // 12. AutoSaveFormAsync creates new entry when none exists
        // ----------------------------------------------------------------
        [Fact]
        public async Task AutoSaveFormAsync_CreatesNewEntry_WhenNoneExists()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var cvRecord = CvBuilder.MakeCV(userId: "user1");
            db.CVRecords.Add(cvRecord);
            await db.SaveChangesAsync();

            // Act
            await service.AutoSaveFormAsync("user1", cvRecord.Id, "{\"name\":\"Jane\"}", "{}", null);

            // Assert
            var autoSave = db.CVAutoSaves.FirstOrDefault(a => a.UserId == "user1" && a.CVRecordId == cvRecord.Id);
            Assert.NotNull(autoSave);
            Assert.Equal("{\"name\":\"Jane\"}", autoSave!.FormDataJson);
        }

        // ----------------------------------------------------------------
        // 13. AutoSaveFormAsync updates existing entry
        // ----------------------------------------------------------------
        [Fact]
        public async Task AutoSaveFormAsync_UpdatesExisting_WhenEntryExists()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var cvRecord = CvBuilder.MakeCV(userId: "user1");
            db.CVRecords.Add(cvRecord);
            var existing = new CVAutoSave
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "user1",
                CVRecordId = cvRecord.Id,
                FormDataJson = "{\"name\":\"Old\"}",
                CVDataJson = "{}",
                SavedAt = DateTime.UtcNow.AddMinutes(-5)
            };
            db.CVAutoSaves.Add(existing);
            await db.SaveChangesAsync();

            // Act
            await service.AutoSaveFormAsync("user1", cvRecord.Id, "{\"name\":\"New\"}", "{}", null);

            // Assert
            var autoSaves = db.CVAutoSaves.Where(a => a.UserId == "user1" && a.CVRecordId == cvRecord.Id).ToList();
            Assert.Single(autoSaves);
            Assert.Equal("{\"name\":\"New\"}", autoSaves[0].FormDataJson);
        }

        // ----------------------------------------------------------------
        // 14. GetAutoSaveAsync returns the latest entry for the user
        // ----------------------------------------------------------------
        [Fact]
        public async Task GetAutoSaveAsync_ReturnsLatest_ForUser()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateService(db);
            var cvRecord = CvBuilder.MakeCV(userId: "user1");
            db.CVRecords.Add(cvRecord);
            db.CVAutoSaves.AddRange(
                new CVAutoSave
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = "user1",
                    CVRecordId = cvRecord.Id,
                    FormDataJson = "{\"version\":\"old\"}",
                    CVDataJson = "{}",
                    SavedAt = DateTime.UtcNow.AddMinutes(-10)
                },
                new CVAutoSave
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = "user1",
                    CVRecordId = cvRecord.Id,
                    FormDataJson = "{\"version\":\"new\"}",
                    CVDataJson = "{}",
                    SavedAt = DateTime.UtcNow.AddMinutes(-1)
                }
            );
            await db.SaveChangesAsync();

            // Act
            var result = await service.GetAutoSaveAsync("user1", cvRecord.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("{\"version\":\"new\"}", result!.FormDataJson);
        }
    }
}
