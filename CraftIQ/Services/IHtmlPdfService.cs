namespace CraftIQ.Services
{
    public interface IHtmlPdfService
    {
        /// <summary>
        /// Converts a raw HTML string into an A4 PDF byte array.
        /// Returns null when the browser engine is not available (graceful fallback).
        /// </summary>
        Task<byte[]?> GenerateAsync(string html);
    }
}
