namespace CraftIQ.Models
{
    public class DashboardViewModel
    {
        public int TotalDocuments    { get; set; }
        public int CVsGenerated      { get; set; }
        public int DocumentsThisWeek { get; set; }
        public int AnalysisReports   { get; set; }
        public List<DashActivityItem> RecentActivity { get; set; } = new();
    }

    public class DashActivityItem
    {
        public string Id { get; set; } = "";
        public string Title { get; set; } = "";
        public string Status { get; set; } = "draft";
        public string RelativeTime { get; set; } = "";
        public string ReopenUrl { get; set; } = "";
    }
}
