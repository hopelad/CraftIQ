using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using CraftIQ.Data;
using CraftIQ.Models;
using CraftIQ.Services;
using CraftIQ.Tests.Helpers;

namespace CraftIQ.Tests.Security
{
    /// <summary>
    /// Security tests verifying that users cannot access or modify each other's data.
    /// </summary>
    public class UserIsolationTests
    {
        private static CVStorageService CreateCVService(AppDbContext db) =>
            new CVStorageService(db);

        private static AnalysisReportService CreateReportService(AppDbContext db) =>
            new AnalysisReportService(db);

        // ----------------------------------------------------------------
        // 1. UserA cannot see UserB's CV documents
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVStorage_UserA_CannotSee_UserBDocuments()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateCVService(db);
            var userBRecord = CvBuilder.MakeCV(userId: "userB", title: "UserB's CV");
            db.CVRecords.Add(userBRecord);
            await db.SaveChangesAsync();

            // Act
            var results = await service.GetAllByUserAsync("userA");

            // Assert
            Assert.Empty(results);
        }

        // ----------------------------------------------------------------
        // 2. UserA cannot delete UserB's CV documents
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVStorage_UserA_CannotDelete_UserBDocuments()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateCVService(db);
            var userBRecord = CvBuilder.MakeCV(userId: "userB", title: "UserB's CV");
            db.CVRecords.Add(userBRecord);
            await db.SaveChangesAsync();

            // Act
            var result = await service.DeleteAsync(userBRecord.Id, "userA");

            // Assert
            Assert.False(result);
            Assert.NotNull(await db.CVRecords.FindAsync(userBRecord.Id));
        }

        // ----------------------------------------------------------------
        // 3. GetById returns null for wrong user
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVStorage_GetById_ReturnsNull_ForWrongUser()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateCVService(db);
            var record = CvBuilder.MakeCV(userId: "userB");
            db.CVRecords.Add(record);
            await db.SaveChangesAsync();

            // Act
            var result = await service.GetByIdAsync(record.Id, "userA");

            // Assert
            Assert.Null(result);
        }

        // ----------------------------------------------------------------
        // 4. UserA cannot see UserB's analysis reports
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalysisReport_UserA_CannotSee_UserBReports()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateReportService(db);
            var report = CvBuilder.MakeAnalysisReport(userId: "userB", title: "UserB Report");
            db.AnalysisReports.Add(report);
            await db.SaveChangesAsync();

            // Act
            var results = await service.GetAllByUserAsync("userA");

            // Assert
            Assert.Empty(results);
        }

        // ----------------------------------------------------------------
        // 5. UserA cannot delete UserB's analysis report
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalysisReport_UserA_CannotDelete_UserBReport()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateReportService(db);
            var report = CvBuilder.MakeAnalysisReport(userId: "userB", title: "UserB Report");
            db.AnalysisReports.Add(report);
            await db.SaveChangesAsync();

            // Act
            var result = await service.DeleteAsync(report.Id, "userA");

            // Assert
            Assert.False(result);
            Assert.NotNull(await db.AnalysisReports.FindAsync(report.Id));
        }

        // ----------------------------------------------------------------
        // 6. CountByUser only counts the user's own reports
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalysisReport_CountByUser_OnlyCountsOwnReports()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateReportService(db);
            db.AnalysisReports.AddRange(
                CvBuilder.MakeAnalysisReport(userId: "userA", title: "A1"),
                CvBuilder.MakeAnalysisReport(userId: "userA", title: "A2"),
                CvBuilder.MakeAnalysisReport(userId: "userB", title: "B1")
            );
            await db.SaveChangesAsync();

            // Act
            var countA = await service.CountByUserAsync("userA");
            var countB = await service.CountByUserAsync("userB");

            // Assert
            Assert.Equal(2, countA);
            Assert.Equal(1, countB);
        }

        // ----------------------------------------------------------------
        // 7. GetAllByUserAsync filters correctly with multiple users
        // ----------------------------------------------------------------
        [Fact]
        public async Task CVStorage_GetAll_FiltersCorrectly_WithMultipleUsers()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateCVService(db);
            db.CVRecords.AddRange(
                CvBuilder.MakeCV(userId: "userA", title: "A-CV1"),
                CvBuilder.MakeCV(userId: "userA", title: "A-CV2"),
                CvBuilder.MakeCV(userId: "userB", title: "B-CV1"),
                CvBuilder.MakeCV(userId: "userC", title: "C-CV1"),
                CvBuilder.MakeCV(userId: "userC", title: "C-CV2"),
                CvBuilder.MakeCV(userId: "userC", title: "C-CV3")
            );
            await db.SaveChangesAsync();

            // Act
            var userADocs = await service.GetAllByUserAsync("userA");
            var userBDocs = await service.GetAllByUserAsync("userB");
            var userCDocs = await service.GetAllByUserAsync("userC");

            // Assert
            Assert.Equal(2, userADocs.Count);
            Assert.Single(userBDocs);
            Assert.Equal(3, userCDocs.Count);
            Assert.All(userADocs, r => Assert.Equal("userA", r.UserId));
            Assert.All(userBDocs, r => Assert.Equal("userB", r.UserId));
            Assert.All(userCDocs, r => Assert.Equal("userC", r.UserId));
        }

        // ----------------------------------------------------------------
        // 8. AutoSave for UserA does not overwrite UserB's auto-save
        // ----------------------------------------------------------------
        [Fact]
        public async Task AutoSave_UserA_DoesNotOverwrite_UserBAutoSave()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var service = CreateCVService(db);

            var cvA = CvBuilder.MakeCV(userId: "userA");
            var cvB = CvBuilder.MakeCV(userId: "userB");
            db.CVRecords.AddRange(cvA, cvB);
            await db.SaveChangesAsync();

            // Create auto-save for UserB
            db.CVAutoSaves.Add(new CVAutoSave
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "userB",
                CVRecordId = cvB.Id,
                FormDataJson = "{\"userB\":\"data\"}",
                CVDataJson = "{}",
                SavedAt = DateTime.UtcNow.AddMinutes(-5)
            });
            await db.SaveChangesAsync();

            // Act — UserA saves their own auto-save for their own record
            await service.AutoSaveFormAsync("userA", cvA.Id, "{\"userA\":\"data\"}", "{}", null);

            // Assert — UserB's auto-save is unchanged
            var userBAutoSave = db.CVAutoSaves.FirstOrDefault(a => a.UserId == "userB");
            Assert.NotNull(userBAutoSave);
            Assert.Equal("{\"userB\":\"data\"}", userBAutoSave!.FormDataJson);

            // UserA's auto-save exists separately
            var userAAutoSave = db.CVAutoSaves.FirstOrDefault(a => a.UserId == "userA");
            Assert.NotNull(userAAutoSave);
            Assert.Equal("{\"userA\":\"data\"}", userAAutoSave!.FormDataJson);
        }
    }
}
