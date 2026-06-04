using CraftIQ.Data;
using CraftIQ.Models;
using CraftIQ.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CraftIQ.Tests
{
    public class AnalysisReportServiceTests : IDisposable
    {
        private readonly AppDbContext _db;
        private readonly AnalysisReportService _svc;

        public AnalysisReportServiceTests()
        {
            var opts = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _db  = new AppDbContext(opts);
            _svc = new AnalysisReportService(_db);
        }

        public void Dispose() => _db.Dispose();

        [Fact]
        public async Task Save_NewReport_AssignsIdAndPersists()
        {
            var report = new AnalysisReport
            {
                UserId       = "user1",
                Title        = "ATS Analysis – My CV",
                AnalysisType = "ATS",
                OverallScore = 78
            };

            var saved = await _svc.SaveAsync(report);

            Assert.NotEmpty(saved.Id);
            Assert.Equal("user1", saved.UserId);
            Assert.Equal(78, saved.OverallScore);
        }

        [Fact]
        public async Task GetAllByUser_ReturnsOnlyUsersReports()
        {
            await _svc.SaveAsync(new AnalysisReport { UserId = "a", Title = "A-Report1" });
            await _svc.SaveAsync(new AnalysisReport { UserId = "a", Title = "A-Report2" });
            await _svc.SaveAsync(new AnalysisReport { UserId = "b", Title = "B-Report1" });

            var results = await _svc.GetAllByUserAsync("a");

            Assert.Equal(2, results.Count);
            Assert.All(results, r => Assert.Equal("a", r.UserId));
        }

        [Fact]
        public async Task Delete_ExistingReport_RemovesIt()
        {
            var saved = await _svc.SaveAsync(new AnalysisReport { UserId = "u", Title = "To Delete" });
            var ok    = await _svc.DeleteAsync(saved.Id, "u");

            Assert.True(ok);
            Assert.Empty(await _svc.GetAllByUserAsync("u"));
        }

        [Fact]
        public async Task Delete_WrongUser_ReturnsFalse()
        {
            var saved = await _svc.SaveAsync(new AnalysisReport { UserId = "owner", Title = "Private" });
            var ok    = await _svc.DeleteAsync(saved.Id, "attacker");

            Assert.False(ok);
        }

        [Fact]
        public async Task CountByUser_ReturnsCorrectCount()
        {
            await _svc.SaveAsync(new AnalysisReport { UserId = "u" });
            await _svc.SaveAsync(new AnalysisReport { UserId = "u" });
            await _svc.SaveAsync(new AnalysisReport { UserId = "other" });

            var count = await _svc.CountByUserAsync("u");

            Assert.Equal(2, count);
        }

        [Fact]
        public async Task Save_ExistingId_UpdatesRecord()
        {
            var first = await _svc.SaveAsync(new AnalysisReport { UserId = "u", Title = "Original", OverallScore = 50 });

            first.Title        = "Updated";
            first.OverallScore = 80;
            await _svc.SaveAsync(first);

            var all = await _svc.GetAllByUserAsync("u");
            Assert.Single(all);
            Assert.Equal("Updated", all[0].Title);
            Assert.Equal(80, all[0].OverallScore);
        }
    }
}
