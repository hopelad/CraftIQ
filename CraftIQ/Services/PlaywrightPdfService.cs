using Microsoft.Playwright;

namespace CraftIQ.Services
{
    public class PlaywrightPdfService : IHtmlPdfService
    {
        private readonly ILogger<PlaywrightPdfService> _logger;

        public PlaywrightPdfService(ILogger<PlaywrightPdfService> logger)
        {
            _logger = logger;
        }

        private static readonly string HtmlTemplate =
            "<!DOCTYPE html>" +
            "<html lang=\"en\"><head>" +
            "<meta charset=\"utf-8\">" +
            "<style>" +
            "*, *::before, *::after {{ box-sizing: border-box; }}" +
            "html, body {{ margin: 0; padding: 0; background: #fff; }}" +
            "body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}" +
            ".cv-ai-tips {{ display: none !important; }}" +
            ".cv-tb-handle {{ display: none !important; }}" +
            ".cv-textbox {{ border: none !important; box-shadow: none !important;" +
            "              padding: 0 !important; background: transparent !important; }}" +
            "</style>" +
            "</head><body>{0}</body></html>";

        public async Task<byte[]?> GenerateAsync(string html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return null;

            try
            {
                using var playwright = await Playwright.CreateAsync();
                await using var browser = await playwright.Chromium.LaunchAsync(
                    new BrowserTypeLaunchOptions { Headless = true });

                // JavaScript disabled — prevents any XSS/SSRF from rendered HTML
                await using var context = await browser.NewContextAsync(
                    new BrowserNewContextOptions { JavaScriptEnabled = false });

                var page = await context.NewPageAsync();

                var fullHtml = string.Format(HtmlTemplate, html);
                await page.SetContentAsync(fullHtml,
                    new PageSetContentOptions { WaitUntil = WaitUntilState.Load });

                var pdf = await page.PdfAsync(new PagePdfOptions
                {
                    Format          = "A4",
                    PrintBackground = true,
                    Margin = new Margin
                    {
                        Top    = "0mm",
                        Bottom = "0mm",
                        Left   = "0mm",
                        Right  = "0mm"
                    }
                });

                return pdf;
            }
            catch (OperationCanceledException)
            {
                throw; // let the framework handle client disconnects
            }
            catch (Exception ex)
            {
                // Log and return null — caller falls back to QuestPDF template render
                _logger.LogWarning(ex,
                    "Playwright PDF generation failed (browser may not be installed). " +
                    "Falling back to QuestPDF. Run 'playwright install chromium' to enable HTML-faithful export.");
                return null;
            }
        }
    }
}
