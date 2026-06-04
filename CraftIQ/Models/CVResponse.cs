namespace CraftIQ.Models
{
    public class CVSection
    {
        public string Heading { get; set; } = "";
        public List<string> Points { get; set; } = new();
    }

    public class SkillGroup
    {
        public string Category { get; set; } = "";
        public List<string> Skills { get; set; } = new();
    }

    public class CVResponse
    {
        public string FullName { get; set; } = "";
        public string JobTitle { get; set; } = "";
        public string Email { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Location { get; set; } = "";
        public string LinkedIn { get; set; } = "";
        public string ProfessionalSummary { get; set; } = "";
        public List<CVSection> Experience { get; set; } = new();
        public List<CVSection> Education { get; set; } = new();
        public List<string> Skills { get; set; } = new();
        public List<SkillGroup> SkillGroups { get; set; } = new();
        public List<string> Certifications { get; set; } = new();
        public List<string> Languages { get; set; } = new();
        public List<string> Tips { get; set; } = new();
    }
}