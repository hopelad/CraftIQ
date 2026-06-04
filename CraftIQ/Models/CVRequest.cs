namespace CraftIQ.Models
{
    public class ExperienceEntry
    {
        public string JobTitle { get; set; } = "";
        public string Company { get; set; } = "";
        public string Location { get; set; } = "";
        public string StartDate { get; set; } = "";
        public string EndDate { get; set; } = "";
        public string Responsibilities { get; set; } = "";
    }

    public class EducationEntry
    {
        public string Degree { get; set; } = "";
        public string Institution { get; set; } = "";
        public string Location { get; set; } = "";
        public string GraduationYear { get; set; } = "";
    }

    public class CVRequest
    {
        public string FullName { get; set; } = "";
        public string JobTitle { get; set; } = "";
        public string Email { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Location { get; set; } = "";
        public string LinkedIn { get; set; } = "";
        public string Summary { get; set; } = "";
        public string Skills { get; set; } = "";
        public string Certifications { get; set; } = "";
        public string Languages { get; set; } = "";
        public string JobRequirements { get; set; } = "";
        public List<ExperienceEntry> Experience { get; set; } = new();
        public List<EducationEntry> Education { get; set; } = new();
    }
}