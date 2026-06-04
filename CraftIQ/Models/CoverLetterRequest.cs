namespace CraftIQ.Models
{
    public class CoverLetterRequest
    {
        public string FullName { get; set; } = "";
        public string JobTitle { get; set; } = "";
        public string CompanyName { get; set; } = "";
        public string HiringManager { get; set; } = "";
        public string Experience { get; set; } = "";
        public string Skills { get; set; } = "";
        public string WhyCompany { get; set; } = "";
        public string Tone { get; set; } = "Professional";
        public string Template { get; set; } = "Professional";
        public string KeySkills { get; set; } = "";
        public string PersonalNote { get; set; } = "";
        public string JobDescription { get; set; } = "";
        public string FocusAreas { get; set; } = "";
        public string Length { get; set; } = "Standard";
        public string Summary { get; set; } = "";
        public string Education { get; set; } = "";
    }
}