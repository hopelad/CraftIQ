namespace CraftIQ.Models
{
    public class CVAutoSave
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = "";
        public string? CVRecordId { get; set; }
        public string FormDataJson { get; set; } = "";
        public string? CVDataJson { get; set; }
        public string? PhotoBase64 { get; set; }
        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    }
}