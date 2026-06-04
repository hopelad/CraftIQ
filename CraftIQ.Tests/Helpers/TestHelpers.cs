using System;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CraftIQ.Data;
using CraftIQ.Models;

namespace CraftIQ.Tests.Helpers
{
    public static class TestDbContextFactory
    {
        public static AppDbContext Create(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new AppDbContext(options);
        }
    }

    public static class AuthHelper
    {
        public static ControllerContext MakeControllerContext(string userId)
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.Name, userId) },
                    "test"
                )
            );
            return new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        public static ClaimsPrincipal MakePrincipal(string userId)
        {
            return new ClaimsPrincipal(
                new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.Name, userId) },
                    "test"
                )
            );
        }
    }

    public static class CvBuilder
    {
        public static CVRecord MakeCV(
            string userId = "user1",
            string title = "My CV",
            string status = "Draft",
            string templateId = "template1",
            string accentColor = "#336699",
            string cvDataJson = "{}",
            string formDataJson = "{}",
            string? photoBase64 = null,
            DateTime? updatedAt = null,
            DateTime? createdAt = null)
        {
            return new CVRecord
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                CVTitle = title,
                TemplateId = templateId,
                AccentColor = accentColor,
                CVDataJson = cvDataJson,
                FormDataJson = formDataJson,
                PhotoBase64 = photoBase64,
                Status = status,
                CreatedAt = createdAt ?? DateTime.UtcNow.AddDays(-1),
                UpdatedAt = updatedAt ?? DateTime.UtcNow
            };
        }

        public static AnalysisReport MakeAnalysisReport(
            string userId = "user1",
            string title = "My Analysis",
            string documentType = "CV",
            string analysisType = "CV",
            string jobTitle = "Software Engineer",
            int overallScore = 75,
            string resultJson = "{}",
            DateTime? createdAt = null)
        {
            return new AnalysisReport
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Title = title,
                DocumentType = documentType,
                AnalysisType = analysisType,
                JobTitle = jobTitle,
                OverallScore = overallScore,
                ResultJson = resultJson,
                CreatedAt = createdAt ?? DateTime.UtcNow
            };
        }

        public static CVResponse MakeCVResponse(
            string fullName = "Jane Doe",
            string jobTitle = "Software Engineer",
            string email = "jane@example.com",
            string phone = "555-1234",
            string location = "New York, NY",
            string linkedIn = "linkedin.com/in/janedoe",
            string summary = "Experienced software engineer with expertise in .NET and cloud technologies.",
            List<CVSection>? experience = null,
            List<CVSection>? education = null,
            List<string>? skills = null,
            List<SkillGroup>? skillGroups = null,
            List<string>? certifications = null,
            List<string>? languages = null,
            List<string>? tips = null)
        {
            return new CVResponse
            {
                FullName = fullName,
                JobTitle = jobTitle,
                Email = email,
                Phone = phone,
                Location = location,
                LinkedIn = linkedIn,
                ProfessionalSummary = summary,
                Experience = experience ?? new List<CVSection>
                {
                    new CVSection
                    {
                        Heading = "Senior Software Engineer at Acme Corp (2020–2023)",
                        Points = new List<string>
                        {
                            "Built REST APIs with .NET 6",
                            "Led team of 5 engineers",
                            "Improved system performance by 40%"
                        }
                    }
                },
                Education = education ?? new List<CVSection>
                {
                    new CVSection
                    {
                        Heading = "B.Sc. Computer Science, State University (2016)",
                        Points = new List<string> { "Graduated with honors" }
                    }
                },
                Skills = skills ?? new List<string> { "C#", ".NET", "Azure", "SQL", "Docker" },
                SkillGroups = skillGroups ?? new List<SkillGroup>(),
                Certifications = certifications ?? new List<string>(),
                Languages = languages ?? new List<string>(),
                Tips = tips ?? new List<string>()
            };
        }
    }
}
