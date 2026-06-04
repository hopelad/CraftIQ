namespace CraftIQ.Models
{
    public class CodeSmell
    {
        public string Title { get; set; } = "";
        public string Category { get; set; } = "";
        public string Severity { get; set; } = "Medium";
        public int? LineStart { get; set; }
        public int? LineEnd { get; set; }
        public string Reason { get; set; } = "";
        public string Impact { get; set; } = "";
        public string FixSuggestion { get; set; } = "";
    }
}