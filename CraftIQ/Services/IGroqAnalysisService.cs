using CraftIQ.Models;

namespace CraftIQ.Services
{
    public interface IGroqAnalysisService
    {
        Task<AnalyzeResponse>            AnalyzeCVAsync(AnalyzeRequest req, CancellationToken ct = default);
        Task<BulletImproveResponse>      ImproveBulletAsync(BulletImproveRequest req, CancellationToken ct = default);
        Task<ProjectEnhanceResponse>     EnhanceProjectAsync(ProjectEnhanceRequest req, CancellationToken ct = default);
        Task<InterviewQuestionsResponse> GenerateInterviewQuestionsAsync(InterviewQuestionsRequest req, CancellationToken ct = default);
        Task<LinkedInResponse>                GenerateLinkedInAsync(LinkedInRequest req, CancellationToken ct = default);
        Task<AnalyzeCoverLetterResponse>      AnalyzeCoverLetterAsync(AnalyzeCoverLetterRequest req, CancellationToken ct = default);
        Task<AnalyzeResponse>                 AnalyzeCVFromTextAsync(AnalyzeTextRequest req, CancellationToken ct = default);
    }
}
