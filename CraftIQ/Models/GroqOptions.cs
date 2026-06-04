namespace CraftIQ.Models
{
    public class GroqOptions
    {
        public string ApiKey { get; set; } = "";
        public string BaseUrl { get; set; } = "https://api.groq.com/openai/v1/";
        public string Model { get; set; } = "llama-3.1-70b-versatile";
    }
}