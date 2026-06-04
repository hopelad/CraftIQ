using CraftIQ.Models;

namespace CraftIQ.Services
{
    public interface IDocxService
    {
        byte[] GenerateCVDocx(CVResponse cv, string templateId,
            string? photoBase64 = null, string accentColor = "#1a1a2e");
        byte[] GenerateCoverLetterDocx(CoverLetterResponse letter, string templateId, string accentColor = "#1a1a2e");
    }
}