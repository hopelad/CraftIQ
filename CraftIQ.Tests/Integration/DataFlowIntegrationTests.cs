using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using CraftIQ.Data;
using CraftIQ.Models;
using CraftIQ.Services;
using CraftIQ.Tests.Helpers;

namespace CraftIQ.Tests.Integration
{
    /// <summary>
    /// End-to-end integration tests wiring real services together with InMemory DB.
    /// No real HTTP or AI calls are made.
    /// </summary>
    public class DataFlowIntegrationTests
    {
        private static CVStorageService CreateCVService(AppDbContext db) =>
            new CVStorageService(db);

        private static AnalysisReportService CreateReportService(AppDbContext db) =>
            new AnalysisReportService(db);

        // ----------------------------------------------------------------
        // 1. Save CV, then get all → document appears in history
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveCV_ThenGetHistory_DocumentAppearsInHistory()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var cvService = CreateCVService(db);
            var record = CvBuilder.MakeCV(userId: "user1", title: "Integration Test CV");

            // Act
            await cvService.SaveAsync(record);
            var history = await cvService.GetAllByUserAsync("user1");

            // Assert
            Assert.Single(history);
            Assert.Equal("Integration Test CV", history[0].CVTitle);
        }

        // ----------------------------------------------------------------
        // 2. Save multiple CVs → dashboard counts correctly
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveMultipleCVs_DashboardCountsCorrectly()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var cvService = CreateCVService(db);

            // Act
            await cvService.SaveAsync(CvBuilder.MakeCV(userId: "user1", title: "CV1"));
            await cvService.SaveAsync(CvBuilder.MakeCV(userId: "user1", title: "CV2"));
            await cvService.SaveAsync(CvBuilder.MakeCV(userId: "user1", title: "CV3"));

            var allDocs = await cvService.GetAllByUserAsync("user1");

            // Assert
            Assert.Equal(3, allDocs.Count);
        }

        // ----------------------------------------------------------------
        // 3. Save CV, then delete it → disappears from history
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveCV_ThenDeleteIt_DisappearsFromHistory()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var cvService = CreateCVService(db);
            var record = CvBuilder.MakeCV(userId: "user1", title: "Temporary CV");
            await cvService.SaveAsync(record);

            // Act
            var deleted = await cvService.DeleteAsync(record.Id, "user1");
            var history = await cvService.GetAllByUserAsync("user1");

            // Assert
            Assert.True(deleted);
            Assert.Empty(history);
        }

        // ----------------------------------------------------------------
        // 4. Save analysis report, then retrieve by Id → contains correct data
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveAnalysisReport_ThenRetrieveById_ContainsCorrectData()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var reportService = CreateReportService(db);
            var report = CvBuilder.MakeAnalysisReport(
                userId: "user1",
                title: "My Analysis",
                overallScore: 85,
                resultJson: "{\"score\":85}");

            // Act
            await reportService.SaveAsync(report);
            var allReports = await reportService.GetAllByUserAsync("user1");
            var retrieved   = allReports.FirstOrDefault(r => r.Id == report.Id);

            // Assert
            Assert.NotNull(retrieved);
            Assert.Equal("My Analysis", retrieved!.Title);
            Assert.Equal(85, retrieved.OverallScore);
            Assert.Equal("{\"score\":85}", retrieved.ResultJson);
        }

        // ----------------------------------------------------------------
        // 5. Save analysis report, then get history → report appears
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveAnalysisReport_ThenGetHistory_ReportAppearsInReports()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var reportService = CreateReportService(db);
            var report = CvBuilder.MakeAnalysisReport(userId: "user1", title: "Report Alpha");

            // Act
            await reportService.SaveAsync(report);
            var all = await reportService.GetAllByUserAsync("user1");

            // Assert
            Assert.Single(all);
            Assert.Equal("Report Alpha", all[0].Title);
        }

        // ----------------------------------------------------------------
        // 6. CountByUser increases after each save
        // ----------------------------------------------------------------
        [Fact]
        public async Task SaveAnalysisReport_CountByUser_IncreasesAfterEachSave()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var reportService = CreateReportService(db);

            // Act & Assert
            var count0 = await reportService.CountByUserAsync("user1");
            Assert.Equal(0, count0);

            await reportService.SaveAsync(CvBuilder.MakeAnalysisReport(userId: "user1", title: "R1"));
            var count1 = await reportService.CountByUserAsync("user1");
            Assert.Equal(1, count1);

            await reportService.SaveAsync(CvBuilder.MakeAnalysisReport(userId: "user1", title: "R2"));
            var count2 = await reportService.CountByUserAsync("user1");
            Assert.Equal(2, count2);
        }

        // ----------------------------------------------------------------
        // 7. Multiple users each see only their own data
        // ----------------------------------------------------------------
        [Fact]
        public async Task MultipleUsers_EachSeesOnlyTheirData()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var cvService = CreateCVService(db);
            var reportService = CreateReportService(db);

            // Save CVs and reports for two users
            await cvService.SaveAsync(CvBuilder.MakeCV(userId: "alice", title: "Alice CV1"));
            await cvService.SaveAsync(CvBuilder.MakeCV(userId: "alice", title: "Alice CV2"));
            await cvService.SaveAsync(CvBuilder.MakeCV(userId: "bob", title: "Bob CV1"));

            await reportService.SaveAsync(CvBuilder.MakeAnalysisReport(userId: "alice", title: "Alice Report"));
            await reportService.SaveAsync(CvBuilder.MakeAnalysisReport(userId: "bob", title: "Bob Report1"));
            await reportService.SaveAsync(CvBuilder.MakeAnalysisReport(userId: "bob", title: "Bob Report2"));

            // Act
            var aliceCVs = await cvService.GetAllByUserAsync("alice");
            var bobCVs = await cvService.GetAllByUserAsync("bob");
            var aliceReports = await reportService.GetAllByUserAsync("alice");
            var bobReports = await reportService.GetAllByUserAsync("bob");

            // Assert
            Assert.Equal(2, aliceCVs.Count);
            Assert.Single(bobCVs);
            Assert.Single(aliceReports);
            Assert.Equal(2, bobReports.Count);
        }

        // ----------------------------------------------------------------
        // 8. AutoSave, then save CV → data is preserved
        // ----------------------------------------------------------------
        [Fact]
        public async Task AutoSave_ThenSaveCV_DataIsPreserved()
        {
            // Arrange
            using var db = TestDbContextFactory.Create(Guid.NewGuid().ToString());
            var cvService = CreateCVService(db);
            var record = CvBuilder.MakeCV(userId: "user1", title: "Draft CV");
            await cvService.SaveAsync(record);

            // Act — auto-save some form data
            await cvService.AutoSaveFormAsync(
                "user1",
                record.Id,
                "{\"name\":\"Jane\",\"email\":\"jane@example.com\"}",
                "{\"cvData\":true}",
                null);

            // Retrieve auto-save
            var autoSave = await cvService.GetAutoSaveAsync("user1", record.Id);

            // Now save the CV with updated data based on auto-save
            record.CVTitle = "Finalized CV";
            record.FormDataJson = autoSave?.FormDataJson ?? "{}";
            await cvService.SaveAsync(record);

            var final = await cvService.GetByIdAsync(record.Id, "user1");

            // Assert
            Assert.NotNull(autoSave);
            Assert.Equal("{\"name\":\"Jane\",\"email\":\"jane@example.com\"}", autoSave!.FormDataJson);
            Assert.NotNull(final);
            Assert.Equal("Finalized CV", final!.CVTitle);
            Assert.Equal("{\"name\":\"Jane\",\"email\":\"jane@example.com\"}", final.FormDataJson);
        }
    }
}
