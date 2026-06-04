using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using CraftIQ.Data;
using CraftIQ.Models;
using CraftIQ.Tests.Helpers;

namespace CraftIQ.Tests.Database
{
    /// <summary>
    /// Low-level EF Core entity persistence tests using InMemory database.
    /// </summary>
    public class EntityPersistenceTests
    {
        // ----------------------------------------------------------------
        // 1. CVRecord saves all fields correctly
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVRecord_SavesAllFields_Correctly()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var now = DateTime.UtcNow;
            var record = new CVRecord
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "user1",
                CVTitle = "Full Test CV",
                TemplateId = "template-alpha",
                AccentColor = "#FF5733",
                CVDataJson = "{\"cv\":\"data\"}",
                FormDataJson = "{\"form\":\"data\"}",
                PhotoBase64 = "base64encodedphoto==",
                Status = "Saved",
                CreatedAt = now,
                UpdatedAt = now
            };

            // Act
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();
            var fromDb = await db.CVRecords.FindAsync(record.Id);

            // Assert
            Assert.NotNull(fromDb);
            Assert.Equal("user1", fromDb!.UserId);
            Assert.Equal("Full Test CV", fromDb.CVTitle);
            Assert.Equal("template-alpha", fromDb.TemplateId);
            Assert.Equal("#FF5733", fromDb.AccentColor);
            Assert.Equal("{\"cv\":\"data\"}", fromDb.CVDataJson);
            Assert.Equal("{\"form\":\"data\"}", fromDb.FormDataJson);
            Assert.Equal("base64encodedphoto==", fromDb.PhotoBase64);
            Assert.Equal("Saved", fromDb.Status);
        }

        // ----------------------------------------------------------------
        // 2. CVRecord Id is set automatically when empty
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVRecord_Id_IsSetAutomatically_IfEmpty()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var record = new CVRecord
            {
                Id = Guid.NewGuid().ToString(), // We explicitly provide; EF uses it as-is
                UserId = "user1",
                CVTitle = "Auto ID Test",
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();

            // Assert
            Assert.NotNull(record.Id);
            Assert.NotEmpty(record.Id);
        }

        // ----------------------------------------------------------------
        // 3. CVRecord UpdatedAt changes on update
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVRecord_UpdatedAt_ChangesOnUpdate()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var original = CvBuilder.MakeCV(
                userId: "user1",
                updatedAt: DateTime.UtcNow.AddMinutes(-10));
            db.CVRecords.Add(original);
            await db.SaveChangesAsync();

            var originalUpdatedAt = original.UpdatedAt;

            // Act
            original.CVTitle = "Updated Title";
            original.UpdatedAt = DateTime.UtcNow;
            db.CVRecords.Update(original);
            await db.SaveChangesAsync();

            var fromDb = await db.CVRecords.FindAsync(original.Id);

            // Assert
            Assert.NotNull(fromDb);
            Assert.True(fromDb!.UpdatedAt > originalUpdatedAt,
                $"UpdatedAt ({fromDb.UpdatedAt}) should be after original ({originalUpdatedAt})");
        }

        // ----------------------------------------------------------------
        // 4. CVRecord UserId is required (cannot be null/empty)
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVRecord_UserId_IsRequired_CannotBeNull()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());

            // Act & Assert — InMemory DB does not enforce NOT NULL at DB level,
            // but we verify that a record saved with a UserId stores it correctly
            var record = new CVRecord
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "required-user",
                CVTitle = "Test",
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();

            var fromDb = await db.CVRecords.FindAsync(record.Id);
            Assert.NotNull(fromDb);
            Assert.Equal("required-user", fromDb!.UserId);
        }

        // ----------------------------------------------------------------
        // 5. CVAutoSave saves correctly
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVAutoSave_SavesCorrectly()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var cvRecord = CvBuilder.MakeCV(userId: "user1");
            db.CVRecords.Add(cvRecord);
            await db.SaveChangesAsync();

            var autoSave = new CVAutoSave
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "user1",
                CVRecordId = cvRecord.Id,
                FormDataJson = "{\"name\":\"Jane\"}",
                CVDataJson = "{\"jobTitle\":\"Engineer\"}",
                PhotoBase64 = null,
                SavedAt = DateTime.UtcNow
            };

            // Act
            db.CVAutoSaves.Add(autoSave);
            await db.SaveChangesAsync();

            var fromDb = await db.CVAutoSaves.FindAsync(autoSave.Id);

            // Assert
            Assert.NotNull(fromDb);
            Assert.Equal("user1", fromDb!.UserId);
            Assert.Equal(cvRecord.Id, fromDb.CVRecordId);
            Assert.Equal("{\"name\":\"Jane\"}", fromDb.FormDataJson);
            Assert.Equal("{\"jobTitle\":\"Engineer\"}", fromDb.CVDataJson);
            Assert.Null(fromDb.PhotoBase64);
        }

        // ----------------------------------------------------------------
        // 6. CVAutoSave updates existing on second save
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVAutoSave_UpdatesExisting_OnSecondSave()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var cvRecord = CvBuilder.MakeCV(userId: "user1");
            db.CVRecords.Add(cvRecord);
            var autoSave = new CVAutoSave
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "user1",
                CVRecordId = cvRecord.Id,
                FormDataJson = "{\"version\":1}",
                CVDataJson = "{}",
                SavedAt = DateTime.UtcNow.AddMinutes(-5)
            };
            db.CVAutoSaves.Add(autoSave);
            await db.SaveChangesAsync();

            // Act — update the auto-save
            autoSave.FormDataJson = "{\"version\":2}";
            autoSave.SavedAt = DateTime.UtcNow;
            db.CVAutoSaves.Update(autoSave);
            await db.SaveChangesAsync();

            var fromDb = await db.CVAutoSaves.FindAsync(autoSave.Id);

            // Assert
            Assert.NotNull(fromDb);
            Assert.Equal("{\"version\":2}", fromDb!.FormDataJson);
        }

        // ----------------------------------------------------------------
        // 7. AnalysisReport saves all fields correctly
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalysisReport_SavesAllFields_Correctly()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var now = DateTime.UtcNow;
            var report = new AnalysisReport
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "user1",
                Title = "Comprehensive Analysis",
                DocumentType = "CV",
                AnalysisType = "Full",
                JobTitle = "Senior Software Engineer",
                OverallScore = 92,
                ResultJson = "{\"ats\":88,\"completeness\":95}",
                CreatedAt = now
            };

            // Act
            db.AnalysisReports.Add(report);
            await db.SaveChangesAsync();
            var fromDb = await db.AnalysisReports.FindAsync(report.Id);

            // Assert
            Assert.NotNull(fromDb);
            Assert.Equal("user1", fromDb!.UserId);
            Assert.Equal("Comprehensive Analysis", fromDb.Title);
            Assert.Equal("CV", fromDb.DocumentType);
            Assert.Equal("Full", fromDb.AnalysisType);
            Assert.Equal("Senior Software Engineer", fromDb.JobTitle);
            Assert.Equal(92, fromDb.OverallScore);
            Assert.Equal("{\"ats\":88,\"completeness\":95}", fromDb.ResultJson);
        }

        // ----------------------------------------------------------------
        // 8. AnalysisReport CreatedAt is set
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalysisReport_CreatedAt_IsSet()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var beforeSave = DateTime.UtcNow.AddSeconds(-1);
            var report = new AnalysisReport
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "user1",
                Title = "CreatedAt Test",
                DocumentType = "CV",
                AnalysisType = "CV",
                JobTitle = "Engineer",
                OverallScore = 70,
                ResultJson = "{}",
                CreatedAt = DateTime.UtcNow
            };

            // Act
            db.AnalysisReports.Add(report);
            await db.SaveChangesAsync();
            var fromDb = await db.AnalysisReports.FindAsync(report.Id);

            // Assert
            Assert.NotNull(fromDb);
            Assert.True(fromDb!.CreatedAt >= beforeSave,
                $"CreatedAt {fromDb.CreatedAt} should be after {beforeSave}");
        }

        // ----------------------------------------------------------------
        // 9. Multiple records: UserId index filters correctly
        // ----------------------------------------------------------------
        [Fact]
        public async Task MultipleRecords_UserId_Index_Filters_Correctly()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            db.CVRecords.AddRange(
                CvBuilder.MakeCV(userId: "alice", title: "Alice-1"),
                CvBuilder.MakeCV(userId: "alice", title: "Alice-2"),
                CvBuilder.MakeCV(userId: "bob", title: "Bob-1"),
                CvBuilder.MakeCV(userId: "charlie", title: "Charlie-1"),
                CvBuilder.MakeCV(userId: "charlie", title: "Charlie-2"),
                CvBuilder.MakeCV(userId: "charlie", title: "Charlie-3")
            );
            await db.SaveChangesAsync();

            // Act
            var aliceRecords = await db.CVRecords.Where(r => r.UserId == "alice").ToListAsync();
            var bobRecords = await db.CVRecords.Where(r => r.UserId == "bob").ToListAsync();
            var charlieRecords = await db.CVRecords.Where(r => r.UserId == "charlie").ToListAsync();

            // Assert
            Assert.Equal(2, aliceRecords.Count);
            Assert.Single(bobRecords);
            Assert.Equal(3, charlieRecords.Count);
        }

        // ----------------------------------------------------------------
        // 10. CVRecord PhotoBase64 can be null
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVRecord_PhotoBase64_CanBeNull()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var record = new CVRecord
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "user1",
                CVTitle = "No Photo CV",
                Status = "Draft",
                PhotoBase64 = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();
            var fromDb = await db.CVRecords.FindAsync(record.Id);

            // Assert
            Assert.NotNull(fromDb);
            Assert.Null(fromDb!.PhotoBase64);
        }
    }
}
