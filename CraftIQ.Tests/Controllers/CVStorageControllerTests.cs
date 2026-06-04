using System;
using System.Collections;
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
    public class CVStorageControllerTests
    {
        private CVStorageController CreateController(
            Mock<ICVStorageService>? serviceMock = null,
            string? userId = "user1")
        {
            serviceMock ??= new Mock<ICVStorageService>();
            var controller = new CVStorageController(
                serviceMock.Object,
                NullLogger<CVStorageController>.Instance);

            if (userId != null)
                controller.ControllerContext = AuthHelper.MakeControllerContext(userId);

            return controller;
        }

        // ----------------------------------------------------------------
        // 1. List returns Ok with records for authenticated user
        // ----------------------------------------------------------------
        [Fact]
        public async Task List_ReturnsOk_WithRecords_ForAuthenticatedUser()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            var records = new List<CVRecord>
            {
                CvBuilder.MakeCV(userId: "user1", title: "CV A"),
                CvBuilder.MakeCV(userId: "user1", title: "CV B")
            };
            mockService.Setup(s => s.GetAllByUserAsync("user1")).ReturnsAsync(records);
            var controller = CreateController(mockService, "user1");

            // Act
            var result = await controller.List();

            // Assert — controller projects to anonymous type; verify 200 OK and non-null value
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
            // Cast to IEnumerable and check count via LINQ
            var items = ok.Value as System.Collections.IEnumerable;
            Assert.NotNull(items);
            Assert.Equal(2, items!.Cast<object>().Count());
        }

        // ----------------------------------------------------------------
        // 2. List returns Unauthorized when no user claim
        // ----------------------------------------------------------------
        [Fact]
        public async Task List_ReturnsUnauthorized_WhenNoUserClaim()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            var controller = new CVStorageController(
                mockService.Object,
                NullLogger<CVStorageController>.Instance);
            // Set up a principal with no Name claim
            var emptyPrincipal = new ClaimsPrincipal(new ClaimsIdentity());
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = emptyPrincipal }
            };

            // Act
            var result = await controller.List();

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 3. Get returns record when found
        // ----------------------------------------------------------------
        [Fact]
        public async Task Get_ReturnsRecord_WhenFound()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            var record = CvBuilder.MakeCV(userId: "user1", title: "My CV");
            mockService.Setup(s => s.GetByIdAsync(record.Id, "user1")).ReturnsAsync(record);
            var controller = CreateController(mockService, "user1");

            // Act
            var result = await controller.Get(record.Id);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(record, ok.Value);
        }

        // ----------------------------------------------------------------
        // 4. Get returns NotFound when record is missing
        // ----------------------------------------------------------------
        [Fact]
        public async Task Get_ReturnsNotFound_WhenRecordMissing()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            mockService.Setup(s => s.GetByIdAsync("nonexistent", "user1")).ReturnsAsync((CVRecord?)null);
            var controller = CreateController(mockService, "user1");

            // Act
            var result = await controller.Get("nonexistent");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 5. Create returns the new draft Id
        // ----------------------------------------------------------------
        [Fact]
        public async Task Create_ReturnsDraftId()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            var newId  = Guid.NewGuid().ToString();
            var draftRecord = CvBuilder.MakeCV(userId: "user1");
            draftRecord.Id = newId;
            draftRecord.Status = "draft";
            mockService.Setup(s => s.CreateDraftAsync("user1")).ReturnsAsync(draftRecord);
            var controller = CreateController(mockService, "user1");

            // Act
            var result = await controller.Create();

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var value = ok.Value!;
            // Anonymous type: new { record.Id } → property is "Id" (PascalCase)
            var idProp = value.GetType().GetProperty("Id");
            Assert.NotNull(idProp);
            Assert.Equal(newId, idProp!.GetValue(value));
        }

        // ----------------------------------------------------------------
        // 6. Save returns Ok with Id and UpdatedAt
        // ----------------------------------------------------------------
        [Fact]
        public async Task Save_ReturnsOk_WithIdAndUpdatedAt()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            mockService.Setup(s => s.SaveAsync(It.IsAny<CVRecord>()))
                .ReturnsAsync((CVRecord r) => r);
            var controller = CreateController(mockService, "user1");
            var record = CvBuilder.MakeCV(userId: "user1");

            // Act
            var result = await controller.Save(record);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var value = ok.Value!;
            Assert.NotNull(value.GetType().GetProperty("id")?.GetValue(value));
        }

        // ----------------------------------------------------------------
        // 7. Save returns BadRequest when record is null
        // ----------------------------------------------------------------
        [Fact]
        public async Task Save_ReturnsBadRequest_WhenRecordIsNull()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            var controller = CreateController(mockService, "user1");

            // Act
            var result = await controller.Save(null!);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 8. Save sets UserId from the claim
        // ----------------------------------------------------------------
        [Fact]
        public async Task Save_SetsUserIdFromClaim()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            CVRecord? captured = null;
            mockService.Setup(s => s.SaveAsync(It.IsAny<CVRecord>()))
                .Callback<CVRecord>(r => captured = r)
                .ReturnsAsync((CVRecord r) => r);
            var controller = CreateController(mockService, "user42");
            var record = CvBuilder.MakeCV(userId: "old-user");

            // Act
            await controller.Save(record);

            // Assert
            Assert.NotNull(captured);
            Assert.Equal("user42", captured!.UserId);
        }

        // ----------------------------------------------------------------
        // 9. Delete returns Ok when successful
        // ----------------------------------------------------------------
        [Fact]
        public async Task Delete_ReturnsOk_WhenSuccessful()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            mockService.Setup(s => s.DeleteAsync("rec1", "user1")).ReturnsAsync(true);
            var controller = CreateController(mockService, "user1");

            // Act
            var result = await controller.Delete("rec1");

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 10. Delete returns NotFound when record not found
        // ----------------------------------------------------------------
        [Fact]
        public async Task Delete_ReturnsNotFound_WhenNotFound()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            mockService.Setup(s => s.DeleteAsync("missing", "user1")).ReturnsAsync(false);
            var controller = CreateController(mockService, "user1");

            // Act
            var result = await controller.Delete("missing");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 11. AutoSave returns Ok with SavedAt
        // ----------------------------------------------------------------
        [Fact]
        public async Task AutoSave_ReturnsOk_WithSavedAt()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            mockService.Setup(s => s.AutoSaveFormAsync(
                "user1", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()))
                .Returns(Task.CompletedTask);
            var controller = CreateController(mockService, "user1");

            var request = new AutoSaveRequest
            {
                CVRecordId = "rec1",
                FormDataJson = "{\"name\":\"Jane\"}",
                CVDataJson = "{}",
                PhotoBase64 = null
            };

            // Act
            var result = await controller.AutoSave(request);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        // ----------------------------------------------------------------
        // 12. AutoSave returns BadRequest when request is null
        // ----------------------------------------------------------------
        [Fact]
        public async Task AutoSave_ReturnsBadRequest_WhenRequestIsNull()
        {
            // Arrange
            var mockService = new Mock<ICVStorageService>();
            var controller = CreateController(mockService, "user1");

            // Act
            var result = await controller.AutoSave(null!);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
