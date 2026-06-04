namespace CraftIQ.Models
{
    public class CoverLetterResponse
    {
        public string Subject { get; set; } = "";
        public string Opening { get; set; } = "";
        public string Body { get; set; } = "";
        public string Closing { get; set; } = "";
        public string FullLetter { get; set; } = "";
        public List<string> Tips { get; set; } = new();
    }
}