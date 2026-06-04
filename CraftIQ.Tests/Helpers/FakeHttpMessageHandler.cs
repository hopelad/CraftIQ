using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace CraftIQ.Tests.Helpers
{
    /// <summary>
    /// A fake HttpMessageHandler that returns a preset HttpResponseMessage for all requests.
    /// </summary>
    public class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly HttpResponseMessage _response;

        public FakeHttpMessageHandler(HttpResponseMessage response)
        {
            _response = response ?? throw new ArgumentNullException(nameof(response));
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(_response);
        }
    }

    /// <summary>
    /// A fake IHttpClientFactory that returns an HttpClient backed by a FakeHttpMessageHandler.
    /// </summary>
    public class FakeHttpClientFactory : IHttpClientFactory
    {
        private readonly HttpResponseMessage _response;

        public FakeHttpClientFactory(HttpResponseMessage response)
        {
            _response = response ?? throw new ArgumentNullException(nameof(response));
        }

        public HttpClient CreateClient(string name)
        {
            var handler = new FakeHttpMessageHandler(_response);
            return new HttpClient(handler)
            {
                BaseAddress = new Uri("https://fake-api.example.com/")
            };
        }
    }
}
