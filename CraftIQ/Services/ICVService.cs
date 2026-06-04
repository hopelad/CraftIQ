using CraftIQ.Models;

namespace CraftIQ.Services
{
    public interface ICVService
    {
        Task<CVResponse> GenerateCVAsync(CVRequest request, CancellationToken ct = default);
        Task<CoverLetterResponse> GenerateCoverLetterAsync(CoverLetterRequest request, CancellationToken ct = default);
    }
}