using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using CraftIQ.Controllers;
using CraftIQ.Models;
using CraftIQ.Services;
using CraftIQ.Tests.Helpers;

namespace CraftIQ.Tests.Controllers
{
    public class AnalysisReportControllerTests
    {
        private AnalysisReportController CreateController(
            Mock<IAnalysisReportService>? serviceMock = null,
            string? userId = "user1")
        {
            serviceMock ??= new Mock<IAnalysisReportService>();
            var controller = new AnalysisReportController(
                serviceMock.Object,
                NullLogger<AnalysisReportController>.Instance);

            if (userId != null)
                controller.ControllerContext = AuthHelper.MakeControllerContext(userId);
            else
            {
                var emptyPrincipal = new ClaimsPrincipal(new ClaimsIdentity());
                controller.ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = emptyPrincipal }
                };
            }
            return controller;
        }

        // ── 1. List returns Ok ─────────────────────────────────────────────
        [Fact]
        public async Task List_ReturnsOk_WithReports()
        {
            // Arrange
            var mock = new Mock<IAnalysisReportService>();
            var reports = new List<AnalysisReport>
            {
                CvBuilder.MakeAnalysisReport(userId: "user1", title: "Report A"),
                CvBuilder.MakeAnalysisReport(userId: "user1", title: "Report B")
            };
            mock.Setup(s => s.GetAllByUserAsync("user1")).ReturnsAsync(reports);
            var controller = CreateController(mock, "user1");

            // Act
            var result = await controller.List();

            // Assert — controller projects to anonymous type; just verify 200 OK
            Assert.IsType<OkObjectResult>(result);
        }

        // ── 2. List returns Unauthorized when no user claim ────────────────
        [Fact]
        public async Task List_ReturnsUnauthorized_WhenNoUserClaim()
        {
            // Arrange
            var controller = CreateController(userId: null);

            // Act
            var result = await controller.List();

            // Assert
            Assert.IsType<UnauthorizedResult>(result);
        }

        // ── 3. GetById returns report when found ───────────────────────────
        [Fact]
        public async Task GetById_ReturnsReport_WhenFound()
        {
            // Arrange
            var mock   = new Mock<IAnalysisReportService>();
            var report = CvBuilder.MakeAnalysisReport(userId: "user1", title: "My Report");

            // Controller calls GetAllByUserAsync then FirstOrDefault
            mock.Setup(s => s.GetAllByUserAsync("user1"))
                .ReturnsAsync(new List<AnalysisReport> { report });

            var controller = CreateController(mock, "user1");

            // Act
            var result = await controller.GetById(report.Id);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        // ── 4. GetById returns NotFound for missing report ─────────────────
        [Fact]
        public async Task GetById_ReturnsNotFound_WhenNotFound_OrWrongUser()
        {
            // Arrange
            var mock = new Mock<IAnalysisReportService>();
            mock.Setup(s => s.GetAllByUserAsync("user1"))
                .ReturnsAsync(new List<AnalysisReport>()); // empty — nothing found
            var controller = CreateController(mock, "user1");

            // Act
            var result = await controller.GetById("nonexistent-id");

            // Assert
            Assert.IsAssignableFrom<NotFoundObjectResult>(result);
        }

        // ── 5. Save returns Ok with id and createdAt ───────────────────────
        [Fact]
        public async Task Save_ReturnsOk_WithIdAndCreatedAt()
        {
            // Arrange
            var mock   = new Mock<IAnalysisReportService>();
            var report = CvBuilder.MakeAnalysisReport(userId: "user1", title: "Test");
            mock.Setup(s => s.SaveAsync(It.IsAny<AnalysisReport>()))
                .ReturnsAsync(report);            // SaveAsync returns Task<AnalysisReport>
            var controller = CreateController(mock, "user1");

            // Act
            var result = await controller.Save(report);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
            var idProp = ok.Value!.GetType().GetProperty("id")
                      ?? ok.Value!.GetType().GetProperty("Id");
            Assert.NotNull(idProp);
        }

        // ── 6. Save stamps UserId from claim ──────────────────────────────
        [Fact]
        public async Task Save_SetUserIdFromClaim_BeforeSaving()
        {
            // Arrange
            var mock     = new Mock<IAnalysisReportService>();
            AnalysisReport? captured = null;
            mock.Setup(s => s.SaveAsync(It.IsAny<AnalysisReport>()))
                .Callback<AnalysisReport>(r => captured = r)
                .ReturnsAsync((AnalysisReport r) => r);
            var controller = CreateController(mock, "user99");
            var report     = CvBuilder.MakeAnalysisReport(userId: "wrong-user");

            // Act
            await controller.Save(report);

            // Assert
            Assert.NotNull(captured);
            Assert.Equal("user99", captured!.UserId);
        }

        // ── 7. Save returns BadRequest when report is null ─────────────────
        [Fact]
        public async Task Save_ReturnsBadRequest_WhenReportIsNull()
        {
            // Arrange
            var controller = CreateController(userId: "user1");

            // Act
            var result = await controller.Save(null!);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ── 8. Save returns 500 when service throws ────────────────────────
        [Fact]
        public async Task Save_Returns500_WhenServiceThrows()
        {
            // Arrange
            var mock = new Mock<IAnalysisReportService>();
            mock.Setup(s => s.SaveAsync(It.IsAny<AnalysisReport>()))
                .ThrowsAsync(new Exception("DB failure"));
            var controller = CreateController(mock, "user1");
            var report = CvBuilder.MakeAnalysisReport(userId: "user1");

            // Act
            var result = await controller.Save(report);

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, statusResult.StatusCode);
        }

        // ── 9. Delete returns Ok when successful ───────────────────────────
        [Fact]
        public async Task Delete_ReturnsOk_WhenSuccessful()
        {
            // Arrange
            var mock = new Mock<IAnalysisReportService>();
            mock.Setup(s => s.DeleteAsync("rep1", "user1")).ReturnsAsync(true);
            var controller = CreateController(mock, "user1");

            // Act
            var result = await controller.Delete("rep1");

            // Assert — controller returns Ok(new { message }) = OkObjectResult
            Assert.IsAssignableFrom<OkObjectResult>(result);
        }

        // ── 10. Delete returns NotFound when not found ────────────────────
        [Fact]
        public async Task Delete_ReturnsNotFound_WhenNotFound()
        {
            // Arrange
            var mock = new Mock<IAnalysisReportService>();
            mock.Setup(s => s.DeleteAsync("missing", "user1")).ReturnsAsync(false);
            var controller = CreateController(mock, "user1");

            // Act
            var result = await controller.Delete("missing");

            // Assert — controller returns NotFound(new { message }) = NotFoundObjectResult
            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
