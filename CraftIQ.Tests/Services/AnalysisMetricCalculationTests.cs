using System;
using System.Collections.Generic;
using System.Reflection;
using Xunit;
using CraftIQ.Models;
using CraftIQ.Services;
using CraftIQ.Tests.Helpers;

namespace CraftIQ.Tests.Services
{
    /// <summary>
    /// Tests for private scoring methods in GroqAnalysisService accessed via reflection.
    /// </summary>
    public class AnalysisMetricCalculationTests
    {
        // ----------------------------------------------------------------
        // Reflection helpers
        // ----------------------------------------------------------------
        private static readonly Type ServiceType = typeof(GroqAnalysisService);

        private static object InvokeComputeMetrics(CVResponse cv)
        {
            var method = ServiceType.GetMethod("ComputeMetrics",
                BindingFlags.NonPublic | BindingFlags.Static)
                ?? throw new InvalidOperationException("ComputeMetrics not found");
            return method.Invoke(null, new object[] { cv })!;
        }

        private static int InvokeCompletenessScore(object metrics)
        {
            var method = ServiceType.GetMethod("ComputeCompletenessScore",
                BindingFlags.NonPublic | BindingFlags.Static)
                ?? throw new InvalidOperationException("ComputeCompletenessScore not found");
            return (int)method.Invoke(null, new object[] { metrics })!;
        }

        private static int InvokeProjectScore(object metrics)
        {
            var method = ServiceType.GetMethod("ComputeProjectScore",
                BindingFlags.NonPublic | BindingFlags.Static)
                ?? throw new InvalidOperationException("ComputeProjectScore not found");
            return (int)method.Invoke(null, new object[] { metrics })!;
        }

        private static int InvokeReadabilityScore(object metrics)
        {
            var method = ServiceType.GetMethod("ComputeReadabilityScore",
                BindingFlags.NonPublic | BindingFlags.Static)
                ?? throw new InvalidOperationException("ComputeReadabilityScore not found");
            return (int)method.Invoke(null, new object[] { metrics })!;
        }

        private static int InvokeSkillsScore(object metrics)
        {
            var method = ServiceType.GetMethod("ComputeSkillsScore",
                BindingFlags.NonPublic | BindingFlags.Static)
                ?? throw new InvalidOperationException("ComputeSkillsScore not found");
            return (int)method.Invoke(null, new object[] { metrics })!;
        }

        // ----------------------------------------------------------------
        // Completeness Score Tests
        // ----------------------------------------------------------------

        // 1. All sections filled → high completeness score
        [Fact]
        public void CompletenessScore_WithAllSections_ReturnsHigh()
        {
            // Arrange
            var cv = CvBuilder.MakeCVResponse(
                fullName: "Jane Doe",
                jobTitle: "Engineer",
                email: "jane@example.com",
                phone: "555-1234",
                location: "NY",
                linkedIn: "linkedin.com/in/jane",
                summary: "Experienced engineer with a strong background in distributed systems.",
                skills: new List<string> { "C#", ".NET", "Azure", "SQL", "Docker", "Kubernetes", "Python" },
                certifications: new List<string> { "AWS Certified Developer" },
                languages: new List<string> { "English", "Spanish" }
            );

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeCompletenessScore(metrics);

            // Assert
            Assert.True(score >= 80, $"Expected high completeness score (>=80), got {score}");
        }

        // 2. No certifications or languages → below max
        [Fact]
        public void CompletenessScore_WithNoCertificationsOrLanguages_IsBelowMax()
        {
            // Arrange
            var cv = CvBuilder.MakeCVResponse(
                certifications: null,
                languages: null
            );

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeCompletenessScore(metrics);

            // Assert
            Assert.True(score < 100, $"Expected score below 100 without certs/languages, got {score}");
        }

        // 3. Empty CV → zero or very low score
        [Fact]
        public void CompletenessScore_EmptyCV_IsZero_OrVeryLow()
        {
            // Arrange
            var cv = new CVResponse
            {
                FullName = "",
                JobTitle = "",
                Email = "",
                Phone = "",
                Location = "",
                LinkedIn = "",
                ProfessionalSummary = "",
                Experience = new List<CVSection>(),
                Education = new List<CVSection>(),
                Skills = new List<string>(),
                SkillGroups = new List<SkillGroup>()
            };

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeCompletenessScore(metrics);

            // Assert
            Assert.True(score <= 20, $"Expected very low completeness score (<=20), got {score}");
        }

        // 4. Certifications field adds bonus to score
        [Fact]
        public void CompletenessScore_WithCertifications_AddsBonus()
        {
            // Arrange
            var cvWithout = CvBuilder.MakeCVResponse(certifications: null, languages: null);
            var cvWith = CvBuilder.MakeCVResponse(certifications: new List<string> { "AWS Certified" }, languages: null);

            // Act
            var metricsWithout = InvokeComputeMetrics(cvWithout);
            var metricsWithCerts = InvokeComputeMetrics(cvWith);
            var scoreWithout = InvokeCompletenessScore(metricsWithout);
            var scoreWith = InvokeCompletenessScore(metricsWithCerts);

            // Assert
            Assert.True(scoreWith > scoreWithout,
                $"Expected certifications to add bonus: {scoreWith} should be > {scoreWithout}");
        }

        // 5. Languages field adds bonus to score
        [Fact]
        public void CompletenessScore_WithLanguages_AddsBonus()
        {
            // Arrange
            var cvWithout = CvBuilder.MakeCVResponse(certifications: null, languages: null);
            var cvWith = CvBuilder.MakeCVResponse(certifications: null, languages: new List<string> { "English", "French" });

            // Act
            var metricsWithout = InvokeComputeMetrics(cvWithout);
            var metricsWithLang = InvokeComputeMetrics(cvWith);
            var scoreWithout = InvokeCompletenessScore(metricsWithout);
            var scoreWith = InvokeCompletenessScore(metricsWithLang);

            // Assert
            Assert.True(scoreWith > scoreWithout,
                $"Expected languages to add bonus: {scoreWith} should be > {scoreWithout}");
        }

        // 6. All four contact fields → max contact depth bonus
        [Fact]
        public void CompletenessScore_WithAllFourContactFields_AddsMaxBonus()
        {
            // Arrange — all four contact fields: email, phone, location, linkedin
            var cv = CvBuilder.MakeCVResponse(
                email: "jane@example.com",
                phone: "555-1234",
                location: "New York",
                linkedIn: "linkedin.com/in/jane"
            );

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeCompletenessScore(metrics);

            // Assert: contact depth bonus is min(8, contactFields*2) = min(8, 4*2) = 8
            Assert.True(score >= 60, $"Expected score with all contact fields >= 60, got {score}");
        }

        // ----------------------------------------------------------------
        // Project Score Tests
        // ----------------------------------------------------------------

        // 7. 5 bullets per job → high project score
        [Fact]
        public void ProjectScore_WithFiveBulletsPerJob_ReturnsHigh()
        {
            // Arrange
            var cv = CvBuilder.MakeCVResponse(
                experience: new List<CVSection>
                {
                    new CVSection
                    {
                        Heading = "Senior Engineer at Acme",
                        Points = new List<string>
                        {
                            "Built microservices", "Led team", "Improved performance by 40%",
                            "Mentored juniors", "Deployed on AWS"
                        }
                    },
                    new CVSection
                    {
                        Heading = "Engineer at Beta Corp",
                        Points = new List<string>
                        {
                            "Developed REST APIs", "Optimized queries", "Wrote unit tests",
                            "Reviewed PRs", "Integrated CI/CD"
                        }
                    }
                }
            );

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeProjectScore(metrics);

            // Assert: ≥5 bullets/job → base 90
            Assert.True(score >= 90, $"Expected project score >= 90, got {score}");
        }

        // 8. No bullets → very low project score
        [Fact]
        public void ProjectScore_WithNoBullets_IsVeryLow()
        {
            // Arrange
            var cv = CvBuilder.MakeCVResponse(
                experience: new List<CVSection>
                {
                    new CVSection
                    {
                        Heading = "Engineer at Acme",
                        Points = new List<string>()
                    }
                }
            );

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeProjectScore(metrics);

            // Assert: 0 avg bullets/job → base 15
            Assert.True(score <= 20, $"Expected very low project score (<=20), got {score}");
        }

        // 9. Total > 15 bullets → adds bonus points
        [Fact]
        public void ProjectScore_WithTotalAbove15Bullets_AddsBonusPoints()
        {
            // Arrange — 3 jobs × 6 bullets = 18 total
            var experience = new List<CVSection>();
            for (int i = 0; i < 3; i++)
            {
                experience.Add(new CVSection
                {
                    Heading = $"Role {i} at Company {i}",
                    Points = new List<string>
                    {
                        "Task 1", "Task 2", "Task 3", "Task 4", "Task 5", "Task 6"
                    }
                });
            }
            var cv = CvBuilder.MakeCVResponse(experience: experience);

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeProjectScore(metrics);

            // Assert: ≥5 per job → 90, +8 allHaveBullets, +5 total≥15 = 103 → capped at some max
            Assert.True(score >= 95, $"Expected score >= 95 with 18 total bullets, got {score}");
        }

        // 10. All jobs having bullets → adds bonus
        [Fact]
        public void ProjectScore_WithAllJobsHavingBullets_AddsBonus()
        {
            // Arrange — compare 1 job with bullets vs 1 job without
            var cvAllBullets = CvBuilder.MakeCVResponse(
                experience: new List<CVSection>
                {
                    new CVSection { Heading = "Job A", Points = new List<string> { "Did X", "Did Y" } },
                    new CVSection { Heading = "Job B", Points = new List<string> { "Did A", "Did B" } }
                }
            );
            var cvMissingBullets = CvBuilder.MakeCVResponse(
                experience: new List<CVSection>
                {
                    new CVSection { Heading = "Job A", Points = new List<string> { "Did X", "Did Y" } },
                    new CVSection { Heading = "Job B", Points = new List<string>() }
                }
            );

            // Act
            var metricsAll = InvokeComputeMetrics(cvAllBullets);
            var metricsMissing = InvokeComputeMetrics(cvMissingBullets);
            var scoreAll = InvokeProjectScore(metricsAll);
            var scoreMissing = InvokeProjectScore(metricsMissing);

            // Assert
            Assert.True(scoreAll > scoreMissing,
                $"Expected all-bullets score ({scoreAll}) > missing-bullets score ({scoreMissing})");
        }

        // ----------------------------------------------------------------
        // Readability Score Tests
        // ----------------------------------------------------------------

        // 11. Optimal summary length and skill count → high readability
        [Fact]
        public void ReadabilityScore_WithOptimalSummaryAndSkills_IsHigh()
        {
            // Arrange: summary 50–100 words, 8–15 skills
            var words = string.Join(" ", System.Linq.Enumerable.Repeat("word", 60));
            var skills = new List<string>
            {
                "C#", ".NET", "Azure", "SQL", "Docker", "Kubernetes", "Python", "REST", "CI/CD", "Agile"
            };
            var cv = CvBuilder.MakeCVResponse(summary: words, skills: skills);

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeReadabilityScore(metrics);

            // Assert
            Assert.True(score >= 60, $"Expected readability score >= 60, got {score}");
        }

        // 12. Too many skills reduces readability score
        [Fact]
        public void ReadabilityScore_WithTooManySills_ReducesScore()
        {
            // Arrange: 35 skills (>30) → reduced skill portion
            var manySkills = new List<string>();
            for (int i = 0; i < 35; i++) manySkills.Add($"Skill{i}");
            var cvMany = CvBuilder.MakeCVResponse(skills: manySkills);

            var optimalSkills = new List<string> { "C#", ".NET", "Azure", "SQL", "Docker", "Kubernetes", "Python", "REST" };
            var cvOptimal = CvBuilder.MakeCVResponse(skills: optimalSkills);

            // Act
            var metricsMany = InvokeComputeMetrics(cvMany);
            var metricsOptimal = InvokeComputeMetrics(cvOptimal);
            var scoreMany = InvokeReadabilityScore(metricsMany);
            var scoreOptimal = InvokeReadabilityScore(metricsOptimal);

            // Assert
            Assert.True(scoreMany <= scoreOptimal,
                $"Expected too-many-skills score ({scoreMany}) <= optimal score ({scoreOptimal})");
        }

        // 13. No experience penalizes readability
        [Fact]
        public void ReadabilityScore_WithNoExperience_PenalizesScore()
        {
            // Arrange
            var cvWithExp = CvBuilder.MakeCVResponse(
                experience: new List<CVSection>
                {
                    new CVSection { Heading = "Engineer at Acme", Points = new List<string> { "Did X", "Did Y" } }
                }
            );
            var cvNoExp = CvBuilder.MakeCVResponse(
                experience: new List<CVSection>()
            );

            // Act
            var metricsWithExp = InvokeComputeMetrics(cvWithExp);
            var metricsNoExp = InvokeComputeMetrics(cvNoExp);
            var scoreWithExp = InvokeReadabilityScore(metricsWithExp);
            var scoreNoExp = InvokeReadabilityScore(metricsNoExp);

            // Assert
            Assert.True(scoreWithExp > scoreNoExp,
                $"Expected experience score ({scoreWithExp}) > no-experience score ({scoreNoExp})");
        }

        // ----------------------------------------------------------------
        // Skills Score Tests
        // ----------------------------------------------------------------

        // 14. 0 skills → score is 0
        [Fact]
        public void SkillsScore_With0Skills_IsZero()
        {
            // Arrange
            var cv = CvBuilder.MakeCVResponse(skills: new List<string>());

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeSkillsScore(metrics);

            // Assert
            Assert.Equal(0, score);
        }

        // 15. 15 skills → medium-high score
        [Fact]
        public void SkillsScore_With15Skills_IsMediumHigh()
        {
            // Arrange
            var skills = new List<string>();
            for (int i = 0; i < 15; i++) skills.Add($"Skill{i}");
            var cv = CvBuilder.MakeCVResponse(skills: skills);

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeSkillsScore(metrics);

            // Assert: ≤15 → 75
            Assert.Equal(75, score);
        }

        // 16. 22 skills → near-max score
        [Fact]
        public void SkillsScore_With22Skills_IsNearMax()
        {
            // Arrange
            var skills = new List<string>();
            for (int i = 0; i < 22; i++) skills.Add($"Skill{i}");
            var cv = CvBuilder.MakeCVResponse(skills: skills);

            // Act
            var metrics = InvokeComputeMetrics(cv);
            var score = InvokeSkillsScore(metrics);

            // Assert: ≤22 → 88
            Assert.Equal(88, score);
        }
    }
}
