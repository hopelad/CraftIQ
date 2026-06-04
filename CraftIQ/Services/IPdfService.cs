using CraftIQ.Models;

namespace CraftIQ.Services
{
    public interface IPdfService
    {
        byte[] GenerateCVPdf(CVResponse cv, string templateId,
            string? photoBase64 = null, string accentColor = "#1a1a2e");
        byte[] GenerateCoverLetterPdf(CoverLetterResponse letter, string templateId, string accentColor = "#1a1a2e");
    }
}