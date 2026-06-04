namespace CraftIQ.Models
{
    public class RefactorResponse
    {
        public bool AlreadyClean { get; set; } = false;
        public string CodeDescription { get; set; } = "";
        public string RefactoredCode { get; set; } = "";
        public List<string> Explanation { get; set; } = new();
        public List<CodeSmell> Smells { get; set; } = new();
    }
}