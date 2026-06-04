using CraftIQ.Models;

namespace CraftIQ.Services
{
    public interface IRefactorService
    {
        Task<RefactorResponse> RefactorAsync(
            RefactorRequest request,
            CancellationToken cancellationToken = default);
    }
}