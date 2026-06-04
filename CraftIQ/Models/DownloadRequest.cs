namespace CraftIQ.Models
{
    public class DownloadRequest
    {
        public CVResponse? CV { get; set; }
        public string? TemplateId { get; set; }
        public string? AccentColor { get; set; }
        public string? PhotoBase64 { get; set; }
        public string? RenderedHtml { get; set; }
    }

    public class DownloadLetterRequest
    {
        public CoverLetterResponse? Letter      { get; set; }
        public string?              TemplateId  { get; set; }
        public string?              AccentColor { get; set; }
        public string?              RenderedHtml { get; set; }
    }
}