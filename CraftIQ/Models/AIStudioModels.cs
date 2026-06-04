namespace CraftIQ.Models
{
    // ── Full CV Analysis (ATS + Health + Job Match + Recruiter) ──────────
    public class AnalyzeRequest
    {
        public CVResponse? CV             { get; set; }
        public string?     JobDescription { get; set; }
    }

    public class AnalyzeResponse
    {
        // Health dashboard scores (0-100)
        public int OverallScore      { get; set; }
        public int ATSScore          { get; set; }
        public int CompletenessScore { get; set; }
        public int KeywordScore      { get; set; }
        public int SkillsScore       { get; set; }
        public int ReadabilityScore  { get; set; }
        public int ProjectScore      { get; set; }

        // ATS report
        public List<string> MissingKeywords  { get; set; } = new();
        public List<string> FormattingIssues { get; set; } = new();
        public List<string> WeakSections     { get; set; } = new();
        public List<string> Improvements     { get; set; } = new();

        // Job match (only when JobDescription provided)
        public int          JobMatchPercentage { get; set; }
        public List<string> RequiredSkills     { get; set; } = new();
        public List<string> MissingSkills      { get; set; } = new();
        public List<string> MatchedKeywords    { get; set; } = new();
        public string       RoleFitExplanation { get; set; } = "";

        // Recruiter simulation
        public List<string> ShortlistReasons { get; set; } = new();
        public List<string> RejectReasons    { get; set; } = new();
        public List<string> RedFlags         { get; set; } = new();
        public List<string> MissingEvidence  { get; set; } = new();

        // Priority-classified improvements
        public List<string> HighPriorityImprovements   { get; set; } = new();
        public List<string> MediumPriorityImprovements { get; set; } = new();
        public List<string> LowPriorityImprovements    { get; set; } = new();

        // Writing quality
        public int    ActionVerbScore     { get; set; }
        public int    QuantificationScore { get; set; }
        public string WritingQualityNote  { get; set; } = "";
    }

    // ── Raw-text CV analysis (uploaded document) ─────────────────────────
    public class AnalyzeTextRequest
    {
        public string RawText        { get; set; } = "";
        public string JobDescription { get; set; } = "";
    }

    // ── AI Bullet Improver ───────────────────────────────────────────────
    public class BulletImproveRequest
    {
        public string? Bullet   { get; set; }
        public string? JobTitle { get; set; }
        public string? Company  { get; set; }
    }

    public class BulletImproveResponse
    {
        public string Original    { get; set; } = "";
        public string Improved    { get; set; } = "";
        public string Explanation { get; set; } = "";
    }

    // ── Project Enhancement Engine ───────────────────────────────────────
    public class ProjectEnhanceRequest
    {
        public string? Title       { get; set; }
        public string? Description { get; set; }
        public string? Tools       { get; set; }
        public string? Role        { get; set; }
        public string? Impact      { get; set; }
    }

    public class ProjectEnhanceResponse
    {
        public List<string> Bullets { get; set; } = new();
        public string       Summary { get; set; } = "";
    }

    // ── Interview Question Generator ─────────────────────────────────────
    public class InterviewQuestionsRequest
    {
        public CVResponse? CV             { get; set; }
        public string?     JobDescription { get; set; }
    }

    public class InterviewQuestion
    {
        public string Question   { get; set; } = "";
        public string Category   { get; set; } = ""; // Technical | HR | Behavioral | Project
        public string Difficulty { get; set; } = ""; // Easy | Medium | Hard
        public string Tip        { get; set; } = "";
    }

    public class InterviewQuestionsResponse
    {
        public List<InterviewQuestion> Questions { get; set; } = new();
    }

    // ── Cover Letter Review ──────────────────────────────────────────────
    public class AnalyzeCoverLetterRequest
    {
        public string LetterText     { get; set; } = "";
        public string JobDescription { get; set; } = "";
        public string CompanyName    { get; set; } = "";
    }

    public class AnalyzeCoverLetterResponse
    {
        public int          OverallScore     { get; set; }
        public int          ToneScore        { get; set; }
        public int          KeywordScore     { get; set; }
        public int          ClarityScore     { get; set; }
        public List<string> Strengths        { get; set; } = new();
        public List<string> Improvements     { get; set; } = new();
        public List<string> MissingKeywords  { get; set; } = new();
        public string       ToneSummary      { get; set; } = "";
    }

    // ── LinkedIn Profile Generator ───────────────────────────────────────
    public class LinkedInRequest
    {
        public CVResponse? CV         { get; set; }
        public string?     TargetRole { get; set; }
    }

    public class LinkedInExperience
    {
        public string       Heading     { get; set; } = "";
        public List<string> Description { get; set; } = new();
    }

    public class LinkedInResponse
    {
        public string                   Headline    { get; set; } = "";
        public string                   About       { get; set; } = "";
        public List<LinkedInExperience> Experiences { get; set; } = new();
        public List<string>             Skills      { get; set; } = new();
    }
}
