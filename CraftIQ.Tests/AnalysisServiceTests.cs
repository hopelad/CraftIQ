using CraftIQ.Services;
using CraftIQ.Models;
using Xunit;

namespace CraftIQ.Tests
{
    /// <summary>
    /// Tests for locally-computed CV metric scoring functions.
    /// These are deterministic algorithms — no AI/HTTP involved.
    /// </summary>
    public class LocalMetricTests
    {
        // ── Helpers to build CvMetrics-style inputs ────────────────────

        private static CVResponse MakeCV(
            int expCount        = 1,
            int bulletsPerJob   = 3,
            int skillCount      = 10,
            int summaryWords    = 60,
            int contactFields   = 4,
            bool hasCerts       = false,
            bool hasLanguages   = false,
            bool hasSummary     = true,
            bool hasEducation   = true)
        {
            var cv = new CVResponse
            {
                FullName             = "Test User",
                JobTitle             = "Software Engineer",
                Email                = contactFields >= 1 ? "test@test.com" : "",
                Phone                = contactFields >= 2 ? "+1234567890"   : "",
                Location             = contactFields >= 3 ? "New York"      : "",
                LinkedIn             = contactFields >= 4 ? "linkedin.com"  : "",
                ProfessionalSummary  = hasSummary
                    ? string.Join(" ", Enumerable.Repeat("word", summaryWords))
                    : ""
            };

            for (int i = 0; i < expCount; i++)
            {
                var section = new CVSection { Heading = $"Job {i + 1}" };
                for (int b = 0; b < bulletsPerJob; b++)
                    section.Points.Add($"Bullet point {b + 1}");
                cv.Experience.Add(section);
            }

            if (hasEducation)
                cv.Education.Add(new CVSection { Heading = "BSc Computer Science" });

            for (int i = 0; i < skillCount; i++)
                cv.Skills.Add($"Skill {i + 1}");

            if (hasCerts)      cv.Certifications.Add("AWS Certified");
            if (hasLanguages)  cv.Languages.Add("English");

            return cv;
        }

        // ── CompletenessScore tests ──────────────────────────────────────

        [Fact]
        public void CompletenessScore_AllSections_Returns100OrNear()
        {
            // A fully-filled CV (all sections, all contact fields, certs, languages)
            var cv    = MakeCV(contactFields: 4, hasCerts: true, hasLanguages: true);
            var score = GroqAnalysisServiceTestHelper.CallCompletenessScore(cv);
            Assert.True(score >= 80, $"Expected ≥80 for fully-complete CV, got {score}");
        }

        [Fact]
        public void CompletenessScore_NoSummary_LowerThanFull()
        {
            var cvFull    = MakeCV(hasSummary: true);
            var cvNoSum   = MakeCV(hasSummary: false);
            var scoreFull = GroqAnalysisServiceTestHelper.CallCompletenessScore(cvFull);
            var scoreNone = GroqAnalysisServiceTestHelper.CallCompletenessScore(cvNoSum);
            Assert.True(scoreFull > scoreNone, "Full CV should score higher than one missing summary");
        }

        [Fact]
        public void CompletenessScore_EmptyCV_IsLow()
        {
            var cv = new CVResponse(); // nothing filled
            var score = GroqAnalysisServiceTestHelper.CallCompletenessScore(cv);
            Assert.True(score < 30, $"Empty CV should score <30, got {score}");
        }

        // ── ProjectScore tests ───────────────────────────────────────────

        [Fact]
        public void ProjectScore_FivePlusBulletsPerJob_IsHigh()
        {
            var cv    = MakeCV(expCount: 2, bulletsPerJob: 5);
            var score = GroqAnalysisServiceTestHelper.CallProjectScore(cv);
            Assert.True(score >= 85, $"Expected ≥85 for 5+ bullets/job, got {score}");
        }

        [Fact]
        public void ProjectScore_OneBulletPerJob_IsLow()
        {
            var cv    = MakeCV(expCount: 2, bulletsPerJob: 1);
            var score = GroqAnalysisServiceTestHelper.CallProjectScore(cv);
            Assert.True(score < 50, $"Expected <50 for 1 bullet/job, got {score}");
        }

        [Fact]
        public void ProjectScore_NoExperience_IsZero()
        {
            var cv    = MakeCV(expCount: 0);
            var score = GroqAnalysisServiceTestHelper.CallProjectScore(cv);
            Assert.Equal(0, score);
        }

        // ── ReadabilityScore tests ───────────────────────────────────────

        [Fact]
        public void ReadabilityScore_OptimalSummary_IsHigh()
        {
            var cv    = MakeCV(summaryWords: 60, skillCount: 12); // sweet spot
            var score = GroqAnalysisServiceTestHelper.CallReadabilityScore(cv);
            Assert.True(score >= 60, $"Expected ≥60 for optimal structure, got {score}");
        }

        [Fact]
        public void ReadabilityScore_NoSummary_IsLower()
        {
            var cvWith    = MakeCV(summaryWords: 60, skillCount: 10, hasSummary: true);
            var cvWithout = MakeCV(summaryWords: 0,  skillCount: 10, hasSummary: false);
            Assert.True(
                GroqAnalysisServiceTestHelper.CallReadabilityScore(cvWith) >
                GroqAnalysisServiceTestHelper.CallReadabilityScore(cvWithout),
                "Summary should improve readability score");
        }

        // ── SkillsScore tests ────────────────────────────────────────────

        [Theory]
        [InlineData(0,  0,  20)]   // 0 skills → 0
        [InlineData(3,  15, 30)]   // ≤3 → ≤25
        [InlineData(10, 55, 70)]   // 10 → 60
        [InlineData(15, 70, 90)]   // 15 → 75
        public void SkillsScore_Ranges(int count, int minExpected, int maxExpected)
        {
            var cv    = MakeCV(skillCount: count);
            var score = GroqAnalysisServiceTestHelper.CallSkillsScore(cv);
            Assert.InRange(score, minExpected, maxExpected);
        }
    }

    /// <summary>
    /// Exposes the private static methods of GroqAnalysisService via reflection for unit testing.
    /// </summary>
    internal static class GroqAnalysisServiceTestHelper
    {
        private static readonly System.Reflection.MethodInfo? _computeMetrics =
            typeof(GroqAnalysisService).GetMethod("ComputeMetrics",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);

        private static object ComputeMetrics(CVResponse cv) =>
            _computeMetrics!.Invoke(null, new object[] { cv })!;

        private static int CallScore(string methodName, CVResponse cv)
        {
            var m = typeof(GroqAnalysisService).GetMethod(methodName,
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!;
            var metrics = ComputeMetrics(cv);
            return (int)m.Invoke(null, new[] { metrics })!;
        }

        public static int CallCompletenessScore(CVResponse cv) => CallScore("ComputeCompletenessScore", cv);
        public static int CallProjectScore(CVResponse cv)      => CallScore("ComputeProjectScore",      cv);
        public static int CallReadabilityScore(CVResponse cv)  => CallScore("ComputeReadabilityScore",  cv);
        public static int CallSkillsScore(CVResponse cv)       => CallScore("ComputeSkillsScore",       cv);
    }
}
