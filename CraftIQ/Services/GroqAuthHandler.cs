using CraftIQ.Models;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;

namespace CraftIQ.Services
{
    public class GroqAuthHandler : DelegatingHandler
    {
        private readonly IOptionsMonitor<GroqOptions> _opts;
        private readonly ILogger<GroqAuthHandler> _logger;

        public GroqAuthHandler(IOptionsMonitor<GroqOptions> opts, ILogger<GroqAuthHandler> logger)
        {
            _opts   = opts;
            _logger = logger;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken ct)
        {
            var key = _opts.CurrentValue.ApiKey ?? "";
            _logger.LogInformation("GroqAuthHandler — key prefix: '{Prefix}', length: {Len}",
                key.Length >= 8 ? key[..8] : key, key.Length);

            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", key);
            return base.SendAsync(request, ct);
        }
    }
}
