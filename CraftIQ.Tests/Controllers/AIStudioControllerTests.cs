using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
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
    public class AIStudioControllerTests
    {
        private AIStudioController CreateController(
            Mock<IGroqAnalysisService>? groqMock = null,
            Mock<ICVStorageService>? storageMock = null,
            string userId = "user1")
        {
            groqMock ??= new Mock<IGroqAnalysisService>();
            storageMock ??= new Mock<ICVStorageService>();

            var controller = new AIStudioController(
                groqMock.Object,
                storageMock.Object,
                NullLogger<AIStudioController>.Instance);

            controller.ControllerContext = AuthHelper.MakeControllerContext(userId);
            return controller;
        }

        // ----------------------------------------------------------------
        // 1. Analyze returns Ok with valid request
        // ----------------------------------------------------------------
        [Fact]
        public async Task Analyze_ReturnsOk_WithValidRequest()
        {
            // Arrange
            var groqMock = new Mock<IGroqAnalysisService>();
            var analyzeResponse = new AnalyzeResponse
            {
                OverallScore = 80,
                ATSScore = 75,
                CompletenessScore = 85
            };
            groqMock.Setup(s => s.AnalyzeCVAsync(It.IsAny<AnalyzeRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(analyzeResponse);
            var controller = CreateController(groqMock: groqMock);

            var request = new AnalyzeRequest
            {
                CV = CvBuilder.MakeCVResponse(),
                JobDescription = "Software Engineer role"
            };

            // Act
            var result = await controller.Analyze(request, CancellationToken.None);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(analyzeResponse, ok.Value);
        }

        // ----------------------------------------------------------------
        // 2. Analyze returns BadRequest when CV is null
        // ----------------------------------------------------------------
        [Fact]
        public async Task Analyze_ReturnsBadRequest_WhenCvIsNull()
        {
            // Arrange
            var controller = CreateController();
            var request = new AnalyzeRequest { CV = null, JobDescription = "Some job" };

            // Act
            var result = await controller.Analyze(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 3. Analyze returns 500 when service throws
        // ----------------------------------------------------------------
        [Fact]
        public async Task Analyze_Returns500_WhenServiceThrows()
        {
            // Arrange
            var groqMock = new Mock<IGroqAnalysisService>();
            groqMock.Setup(s => s.AnalyzeCVAsync(It.IsAny<AnalyzeRequest>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("Service failure"));
            var controller = CreateController(groqMock: groqMock);

            var request = new AnalyzeRequest
            {
                CV = CvBuilder.MakeCVResponse(),
                JobDescription = "Some job"
            };

            // Act
            var result = await controller.Analyze(request, CancellationToken.None);

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, statusResult.StatusCode);
        }

        // ----------------------------------------------------------------
        // 4. AnalyzeCoverLetter returns Ok with valid request
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalyzeCoverLetter_ReturnsOk_WithValidRequest()
        {
            // Arrange
            var groqMock = new Mock<IGroqAnalysisService>();
            var response = new AnalyzeCoverLetterResponse
            {
                OverallScore = 78,
                ToneScore = 80,
                KeywordScore = 75
            };
            groqMock.Setup(s => s.AnalyzeCoverLetterAsync(It.IsAny<AnalyzeCoverLetterRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);
            var controller = CreateController(groqMock: groqMock);

            var request = new AnalyzeCoverLetterRequest
            {
                LetterText = "Dear Hiring Manager, I am excited to apply...",
                JobDescription = "Software Engineer",
                CompanyName = "Acme Corp"
            };

            // Act
            var result = await controller.AnalyzeCoverLetter(request, CancellationToken.None);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(response, ok.Value);
        }

        // ----------------------------------------------------------------
        // 5. AnalyzeCoverLetter returns BadRequest when LetterText is empty
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalyzeCoverLetter_ReturnsBadRequest_WhenLetterTextEmpty()
        {
            // Arrange
            var controller = CreateController();
            var request = new AnalyzeCoverLetterRequest
            {
                LetterText = "",
                JobDescription = "Software Engineer",
                CompanyName = "Acme"
            };

            // Act
            var result = await controller.AnalyzeCoverLetter(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 6. AnalyzeText returns Ok with valid raw text
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalyzeText_ReturnsOk_WithValidRawText()
        {
            // Arrange
            var groqMock = new Mock<IGroqAnalysisService>();
            var response = new AnalyzeResponse { OverallScore = 72 };
            groqMock.Setup(s => s.AnalyzeCVFromTextAsync(It.IsAny<AnalyzeTextRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);
            var controller = CreateController(groqMock: groqMock);

            var request = new AnalyzeTextRequest
            {
                RawText = "John Doe - Software Engineer with 5 years of experience...",
                JobDescription = "Senior Engineer role"
            };

            // Act
            var result = await controller.AnalyzeText(request, CancellationToken.None);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(response, ok.Value);
        }

        // ----------------------------------------------------------------
        // 7. AnalyzeText returns BadRequest when text is empty
        // ----------------------------------------------------------------
        [Fact]
        public async Task AnalyzeText_ReturnsBadRequest_WhenTextEmpty()
        {
            // Arrange
            var controller = CreateController();
            var request = new AnalyzeTextRequest { RawText = "", JobDescription = "Some role" };

            // Act
            var result = await controller.AnalyzeText(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 8. InterviewQuestions returns Ok with valid CV
        // ----------------------------------------------------------------
        [Fact]
        public async Task InterviewQuestions_ReturnsOk_WithValidCv()
        {
            // Arrange
            var groqMock = new Mock<IGroqAnalysisService>();
            var response = new InterviewQuestionsResponse
            {
                Questions = new List<InterviewQuestion>
                {
                    new InterviewQuestion { Question = "Tell me about yourself", Category = "General", Difficulty = "Easy", Tip = "Be concise" }
                }
            };
            groqMock.Setup(s => s.GenerateInterviewQuestionsAsync(It.IsAny<InterviewQuestionsRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);
            var controller = CreateController(groqMock: groqMock);

            var request = new InterviewQuestionsRequest { CV = CvBuilder.MakeCVResponse() };

            // Act
            var result = await controller.InterviewQuestions(request, CancellationToken.None);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(response, ok.Value);
        }

        // ----------------------------------------------------------------
        // 9. InterviewQuestions returns BadRequest when CV is null
        // ----------------------------------------------------------------
        [Fact]
        public async Task InterviewQuestions_ReturnsBadRequest_WhenCvNull()
        {
            // Arrange
            var controller = CreateController();
            var request = new InterviewQuestionsRequest { CV = null };

            // Act
            var result = await controller.InterviewQuestions(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 10. LinkedIn returns Ok with valid CV
        // ----------------------------------------------------------------
        [Fact]
        public async Task LinkedIn_ReturnsOk_WithValidCv()
        {
            // Arrange
            var groqMock = new Mock<IGroqAnalysisService>();
            var response = new LinkedInResponse
            {
                Headline = "Software Engineer | .NET | Azure",
                About = "Experienced engineer...",
                Skills = new List<string> { "C#", ".NET" }
            };
            groqMock.Setup(s => s.GenerateLinkedInAsync(It.IsAny<LinkedInRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);
            var controller = CreateController(groqMock: groqMock);

            var request = new LinkedInRequest
            {
                CV = CvBuilder.MakeCVResponse(),
                TargetRole = "Software Engineer"
            };

            // Act
            var result = await controller.LinkedIn(request, CancellationToken.None);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(response, ok.Value);
        }

        // ----------------------------------------------------------------
        // 11. ImproveBullet returns BadRequest when bullet is empty
        // ----------------------------------------------------------------
        [Fact]
        public async Task ImproveBullet_ReturnsBadRequest_WhenBulletEmpty()
        {
            // Arrange
            var controller = CreateController();
            var request = new BulletImproveRequest
            {
                Bullet = "",
                JobTitle = "Engineer",
                Company = "Acme"
            };

            // Act
            var result = await controller.ImproveBullet(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 12. EnhanceProject returns BadRequest when title is empty
        // ----------------------------------------------------------------
        [Fact]
        public async Task EnhanceProject_ReturnsBadRequest_WhenTitleEmpty()
        {
            // Arrange
            var controller = CreateController();
            var request = new ProjectEnhanceRequest
            {
                Title = "",
                Description = "Some project",
                Tools = "C#",
                Role = "Developer",
                Impact = "Reduced costs"
            };

            // Act
            var result = await controller.EnhanceProject(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
