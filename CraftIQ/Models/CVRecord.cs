namespace CraftIQ.Models
{
    public class CVRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = "";
        public string CVTitle { get; set; } = "My CV";
        public string TemplateId { get; set; } = "apex";
        public string AccentColor { get; set; } = "#1a1a2e";
        public string CVDataJson { get; set; } = "";
        public string FormDataJson { get; set; } = "";
        public string? PhotoBase64 { get; set; }
        public string Status { get; set; } = "draft";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}