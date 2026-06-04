using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using CraftIQ.Controllers;
using CraftIQ.Models;
using CraftIQ.Services;
using CraftIQ.Tests.Helpers;

namespace CraftIQ.Tests.Services
{
    /// <summary>
    /// Tests for cover letter request validation via controller layer.
    /// </summary>
    public class CoverLetterValidationTests
    {
        // ── helpers ──────────────────────────────────────────────────────

        private AIStudioController CreateAIStudioController(
            Mock<IGroqAnalysisService>? groqMock = null,
            Mock<ICVStorageService>?    storageMock = null,
            string userId = "user1")
        {
            groqMock    ??= new Mock<IGroqAnalysisService>();
            storageMock ??= new Mock<ICVStorageService>();

            var controller = new AIStudioController(
                groqMock.Object,
                storageMock.Object,
                NullLogger<AIStudioController>.Instance);

            controller.ControllerContext = AuthHelper.MakeControllerContext(userId);
            return controller;
        }

        private CVApiController CreateCVApiController(
            Mock<ICVService>? cvServiceMock = null,
            IHttpClientFactory? httpClientFactory = null,
            IConfiguration? configuration = null)
        {
            cvServiceMock ??= new Mock<ICVService>();

            httpClientFactory ??= new FakeHttpClientFactory(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{}", Encoding.UTF8, "application/json")
                });

            configuration ??= new ConfigurationBuilder().Build();

            var controller = new CVApiController(
                cvServiceMock.Object,
                httpClientFactory,
                configuration,
                NullLogger<CVApiController>.Instance);

            controller.ControllerContext = AuthHelper.MakeControllerContext("user1");
            return controller;
        }

        // ── tests ─────────────────────────────────────────────────────────

        // 1. Empty FullName → BadRequest
        [Fact]
        public async Task CoverLetterRequest_FullName_IsRequired_ForGeneration()
        {
            // Arrange
            var controller = CreateCVApiController();
            var request = new CoverLetterRequest
            {
                FullName    = "",
                JobTitle    = "Software Engineer",
                CompanyName = "Acme Corp",
                Tone        = "Professional",
                Template    = "Standard"
            };

            // Act
            var result = await controller.GenerateCoverLetter(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // 2. Empty CompanyName is allowed
        [Fact]
        public async Task CoverLetterRequest_EmptyCompanyName_IsAllowed_ByDefault()
        {
            // Arrange
            var cvServiceMock = new Mock<ICVService>();
            var response = new CoverLetterResponse
            {
                Subject    = "Application",
                Opening    = "Dear Hiring Manager,",
                Body       = "Body text.",
                Closing    = "Sincerely,",
                FullLetter = "Dear Hiring Manager,\n\nBody text.\n\nSincerely,",
                Tips       = new List<string> { "Personalize it" }
            };
            cvServiceMock
                .Setup(s => s.GenerateCoverLetterAsync(It.IsAny<CoverLetterRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);

            var controller = CreateCVApiController(cvServiceMock: cvServiceMock);
            var request = new CoverLetterRequest
            {
                FullName    = "Jane Doe",
                JobTitle    = "Software Engineer",
                CompanyName = "",        // empty — should be allowed
                Tone        = "Professional",
                Template    = "Standard"
            };

            // Act
            var result = await controller.GenerateCoverLetter(request, CancellationToken.None);

            // Assert — not a BadRequest; service was called
            Assert.IsType<OkObjectResult>(result);
        }

        // 3. Empty LetterText → BadRequest
        [Fact]
        public async Task AnalyzeCoverLetterRequest_EmptyLetterText_ShouldFailValidation()
        {
            // Arrange
            var controller = CreateAIStudioController();
            var request = new AnalyzeCoverLetterRequest
            {
                LetterText     = "",
                JobDescription = "Software Engineer role",
                CompanyName    = "Acme Corp"
            };

            // Act
            var result = await controller.AnalyzeCoverLetter(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // 4. LetterText present → passes validation
        [Fact]
        public async Task AnalyzeCoverLetterRequest_WithLetterText_PassesValidation()
        {
            // Arrange
            var groqMock = new Mock<IGroqAnalysisService>();
            var response = new AnalyzeCoverLetterResponse
            {
                OverallScore    = 80,
                ToneScore       = 75,
                KeywordScore    = 85,
                ClarityScore    = 78,
                Strengths       = new List<string> { "Strong opening" },
                Improvements    = new List<string> { "Add more specifics" },
                MissingKeywords = new List<string> { "leadership", "innovation" },
                ToneSummary     = "Professional and confident"
            };
            groqMock
                .Setup(s => s.AnalyzeCoverLetterAsync(It.IsAny<AnalyzeCoverLetterRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);

            var controller = CreateAIStudioController(groqMock: groqMock);
            var request = new AnalyzeCoverLetterRequest
            {
                LetterText     = "Dear Hiring Manager, I am applying for this position...",
                JobDescription = "Software Engineer",
                CompanyName    = "Acme Corp"
            };

            // Act
            var result = await controller.AnalyzeCoverLetter(request, CancellationToken.None);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(response, ok.Value);
        }

        // 5. AnalyzeCoverLetterResponse holds all score properties
        [Fact]
        public void AnalyzeCoverLetterResponse_HasAllRequiredScores()
        {
            // Arrange & Act
            var response = new AnalyzeCoverLetterResponse
            {
                OverallScore    = 80,
                ToneScore       = 75,
                KeywordScore    = 85,
                ClarityScore    = 78,
                Strengths       = new List<string> { "Clear and concise" },
                Improvements    = new List<string> { "Add metrics" },
                MissingKeywords = new List<string> { "agile", "scrum" },
                ToneSummary     = "Professional"
            };

            // Assert
            Assert.Equal(80, response.OverallScore);
            Assert.Equal(75, response.ToneScore);
            Assert.Equal(85, response.KeywordScore);
            Assert.Equal(78, response.ClarityScore);
            Assert.NotEmpty(response.Strengths);
            Assert.NotEmpty(response.Improvements);
            Assert.NotEmpty(response.MissingKeywords);
            Assert.Equal("Professional", response.ToneSummary);
        }

        // 6. CoverLetterResponse has FullLetter field
        [Fact]
        public void CoverLetterResponse_HasFullLetter_Field()
        {
            // Arrange & Act
            var response = new CoverLetterResponse
            {
                Subject    = "Re: Software Engineer Application",
                Opening    = "Dear Hiring Manager,",
                Body       = "I am a skilled engineer with 5 years of experience...",
                Closing    = "Best regards, Jane Doe",
                FullLetter = "Dear Hiring Manager,\n\nI am a skilled engineer...\n\nBest regards, Jane Doe",
                Tips       = new List<string>()
            };

            // Assert
            Assert.NotNull(response.FullLetter);
            Assert.Contains("Dear Hiring Manager", response.FullLetter);
            Assert.Contains("Best regards", response.FullLetter);
        }

        // 7. CoverLetterResponse has Tips list
        [Fact]
        public void CoverLetterResponse_HasTips_List()
        {
            // Arrange & Act
            var response = new CoverLetterResponse
            {
                Subject    = "Application",
                Opening    = "Dear Sir/Madam,",
                Body       = "Body text.",
                Closing    = "Regards,",
                FullLetter = "Dear Sir/Madam,\n\nBody text.\n\nRegards,",
                Tips       = new List<string>
                {
                    "Tailor each letter to the job",
                    "Keep it to one page",
                    "Use specific metrics to quantify achievements"
                }
            };

            // Assert
            Assert.NotNull(response.Tips);
            Assert.Equal(3, response.Tips.Count);
            Assert.Contains("Tailor each letter to the job", response.Tips);
        }
    }
}
