# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the app
dotnet run --project CraftIQ/CraftIQ.csproj

# Build
dotnet build

# Run all tests (from repo root or CraftIQ.Tests/)
dotnet test CraftIQ.Tests/CraftIQ.Tests.csproj

# Run a single test class
dotnet test CraftIQ.Tests/CraftIQ.Tests.csproj --filter "FullyQualifiedName~CVStorageServiceTests"

# Run a single test method
dotnet test CraftIQ.Tests/CraftIQ.Tests.csproj --filter "FullyQualifiedName~CVStorageServiceTests.SaveAsync_NewRecord_PersistsToDatabase"

# Install Playwright browser (required for HTML-faithful PDF export)
dotnet tool install --global Microsoft.Playwright.CLI
playwright install chromium

# EF Core — no migrations are used; schema is created via EnsureCreated on startup
# To reset the database, delete craftiq.db and restart the app
```

## Architecture

### Technology stack
ASP.NET Core MVC (.NET 8), SQLite via EF Core, cookie authentication, xUnit + Moq tests.

### AI provider
The named HTTP client is called `"Groq"` in code but the `BaseUrl` in `appsettings.json` points to **OpenRouter** (`https://openrouter.ai/api/v1/`), not Groq directly. The model is `openrouter/auto`. The `Groq` section in config (`ApiKey`, `BaseUrl`, `Model`) is consumed by `GroqOptions` and bound to all three AI service classes.

### Authentication
Single-user, credential-based. Username/password are read from `appsettings.json` (`Auth:Username`, `Auth:Password`) and verified with `CryptographicOperations.FixedTimeEquals` to prevent timing attacks. Cookie auth, 7-day persistence. `RefactorApiController` is the only API controller without `[Authorize]` — it is publicly accessible.

### Database
No EF migrations. `db.Database.EnsureCreated()` runs on startup and creates the SQLite file (`craftiq.db`) if absent. **Schema changes require deleting `craftiq.db` and restarting.** Three tables: `CVRecords`, `CVAutoSaves`, `AnalysisReports`. All are keyed by GUID strings, not integers.

### PDF generation — two paths
`DownloadController` always tries Playwright first, then falls back to QuestPDF:

1. **`PlaywrightPdfService` (`IHtmlPdfService`)** — receives the already-rendered HTML from the browser, prints it with headless Chromium. This preserves inline text edits the user made in the template. JavaScript is intentionally disabled in the browser context to prevent XSS/SSRF. Requires `playwright install chromium`; if the browser is not installed, `GenerateAsync` returns `null` and logs a warning.

2. **`QuestPdfService` (`IPdfService`)** — programmatic template engine (QuestPDF). Used as fallback when Playwright is unavailable, and as the sole renderer for DOCX export (`DocxService`). Template behaviour is selected by `templateId` string (`nexus`/`onyx`/`lumis` → sidebar layout; `atlas`/`volta`/`coda` → bold header; `soleil` → centered; `forge` → left border; `prism` → strip; `vega` → minimal/Georgia).

### CV data flow
```
User fills form → CVRequest (flat + structured) 
  → GroqCVService.GenerateCVAsync → AI returns CVResponse (JSON)
  → CVResponse stored as CVDataJson inside CVRecord (SQLite)
  → CVTemplates view renders CVResponse into HTML
  → DownloadController: sends rendered HTML + CVResponse to PDF/DOCX services
```
`CVAutoSave` stores the raw form JSON separately from the finalised `CVRecord`, keyed by `(UserId, CVRecordId)`. There is at most one autosave row per user per CV record.

### AI analysis scoring (GroqAnalysisService)
Measurable metrics (completeness, project quality, readability, skills count) are computed **locally** in `ComputeMetrics()` and passed as pre-computed values in the prompt. The AI is explicitly told not to change these values and only handles field-specific keyword coverage and recruiter perspective. This prevents hallucinated scores for objective measurements.

### File upload / extraction (CVApiController.ExtractCV)
Supports PDF (iText7), DOCX (DocumentFormat.OpenXml), and images (PNG/JPG/WEBP via Groq vision). File type is validated by magic bytes, not `ContentType` (which is attacker-controlled). Images are sent to `meta-llama/llama-4-scout-17b-16e-instruct` hardcoded — this is not the configured model from `GroqOptions`.

### Feature areas
| View | Controller/Route | Purpose |
|------|-----------------|---------|
| CVBuilder | `HomeController` + `api/cv` | Multi-step form, AI CV generation, autosave |
| CVTemplates | `HomeController` + `api/ai-studio` | Template selector, inline editing, download, AI studio |
| CareerIntelligence | `HomeController` + `api/cv` (cover-letter) | Cover letter generator with 8 template styles |
| Refactor | `api/refactor` | C/C++ code refactor (unauthenticated endpoint) |
| History | `HomeController` | Lists saved CVs and analysis reports |

### Rate limiting
Fixed-window limiter named `"ai"` — 20 requests per user per minute. Applied via `[EnableRateLimiting("ai")]` on all AI-hitting endpoints. Returns HTTP 429 on breach.

### Test structure
Tests live in `CraftIQ.Tests/` (sibling project). Use `EF InMemory` for database tests, `Moq` for service mocks, and `TestHelpers/TestDbContextFactory` + `AuthHelper` for test scaffolding. Tests are organised into `Controllers/`, `Database/`, `Integration/`, `Security/`, and `Services/` subdirectories.
