namespace CraftIQ.Services
{
    public class GroqRetryHandler : DelegatingHandler
    {
        private readonly ILogger<GroqRetryHandler> _logger;
        private const int MaxAttempts = 4;

        public GroqRetryHandler(ILogger<GroqRetryHandler> logger)
        {
            _logger = logger;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken ct)
        {
            // Buffer content once so we can rebuild it for each retry attempt
            byte[]? body = null;
            System.Net.Http.Headers.MediaTypeHeaderValue? contentType = null;
            if (request.Content != null)
            {
                body        = await request.Content.ReadAsByteArrayAsync(ct);
                contentType = request.Content.Headers.ContentType;
            }

            HttpResponseMessage? response = null;

            for (int attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                // Rebuild content on every attempt after the first
                if (body != null && attempt > 1)
                {
                    request.Content = new ByteArrayContent(body);
                    if (contentType != null)
                        request.Content.Headers.ContentType = contentType;
                }

                response = await base.SendAsync(request, ct);

                if ((int)response.StatusCode != 429 || attempt >= MaxAttempts)
                    break;

                // Parse wait time from Retry-After header; fall back to 5 s
                double waitSecs = 5;
                if (response.Headers.RetryAfter?.Delta.HasValue == true)
                    waitSecs = response.Headers.RetryAfter.Delta.Value.TotalSeconds + 1;
                waitSecs = Math.Clamp(waitSecs, 2, 15);

                _logger.LogWarning(
                    "Groq 429 rate limit — waiting {Wait:F1}s before retry {A}/{Max}",
                    waitSecs, attempt, MaxAttempts);

                response.Dispose();
                await Task.Delay(TimeSpan.FromSeconds(waitSecs), ct);
            }

            return response!;
        }
    }
}
