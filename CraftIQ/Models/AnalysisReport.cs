namespace CraftIQ.Models
{
    public class AnalysisReport
    {
        public string   Id           { get; set; } = Guid.NewGuid().ToString();
        public string   UserId       { get; set; } = "";
        public string   Title        { get; set; } = "";  // e.g. "ATS Analysis – My CV"
        public string   DocumentType { get; set; } = "";  // CV | CoverLetter | Uploaded
        public string   AnalysisType { get; set; } = "";  // ATS | JobMatch | Health | Recruiter | Interview | LinkedIn | CLReview | Optimizer
        public string   JobTitle     { get; set; } = "";
        public int      OverallScore { get; set; }
        public string   ResultJson   { get; set; } = "";  // serialized AnalyzeResponse or equivalent
        public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;
    }

    // ── View-model helpers for History page ──────────────────────────────
    public class HistoryViewModel
    {
        public List<DashActivityItem>    Documents { get; set; } = new();
        public List<AnalysisReportItem>  Reports   { get; set; } = new();
    }

    public class AnalysisReportItem
    {
        public string Id           { get; set; } = "";
        public string Title        { get; set; } = "";
        public string AnalysisType { get; set; } = "";
        public string DocumentType { get; set; } = "";
        public int    OverallScore { get; set; }
        public string RelativeTime { get; set; } = "";
    }
}
