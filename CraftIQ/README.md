# CraftIQ

AI-powered CV builder, career tools, and C/C++ code refactor tool built with ASP.NET Core MVC (.NET 8).

## Features

- **CV Builder** — Fill a multi-step form or upload an existing CV (PDF/DOCX/image). AI generates a polished, ATS-optimised CV.
- **10 CV Templates** — Lumis, Nexus, Onyx, Atlas, Volta, Coda, Soleil, Forge, Prism, Vega. Live colour picker. Inline text editing.
- **Export** — PDF (pixel-perfect via Playwright), DOCX (template-aware sidebar layout), PNG, TXT, JSON.
- **AI Studio** — ATS score, Job Match, CV Health analysis, bullet improver, LinkedIn profile generator, interview question generator.
- **Career Intelligence** — Cover letter generator with 8 tone templates (Professional, Software Engineer, Startup, Academic, etc.).
- **Refactor Tool** — Paste C/C++ code, get a clean refactored version with categorised code smells, severity levels, and explanations. No login required.
- **History** — All saved CVs and analysis reports in one place.

---

## Requirements

### Runtime
| Requirement | Version |
|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | **8.0** or later |
| OS | Windows, macOS, or Linux |

### API Key
CraftIQ uses the [Groq API](https://console.groq.com) for all AI features. You need a free Groq account.

1. Sign up at https://console.groq.com
2. Create an API key under **API Keys**
3. Copy the key — you will add it to `appsettings.json` in the setup steps below

### Optional — Playwright (for pixel-perfect PDF export)
Without Playwright, PDF export falls back to QuestPDF (still works, just less faithful to the template). To enable Playwright:

```bash
dotnet tool install --global Microsoft.Playwright.CLI
playwright install chromium
```

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/CraftIQ.git
cd CraftIQ
```

### 2. Configure credentials and API key

Open `CraftIQ/appsettings.json` and fill in your values:

```json
{
  "Groq": {
    "ApiKey": "gsk_YOUR_GROQ_API_KEY_HERE",
    "BaseUrl": "https://api.groq.com/openai/v1/",
    "Model": "llama-3.1-8b-instant"
  },
  "Auth": {
    "Username": "admin",
    "Password": "YourPasswordHere"
  }
}
```

> **Model options** (Groq free tier):
> | Model | Tokens/day | Tokens/min | Quality |
> |---|---|---|---|
> | `llama-3.1-8b-instant` | 500,000 | 6,000 | Good, fast |
> | `llama-3.3-70b-versatile` | 100,000 | 12,000 | Best quality |

### 3. Restore packages

```bash
cd CraftIQ
dotnet restore
```

### 4. Run the app

```bash
dotnet run
```

The app starts at **http://localhost:5058**. Open it in your browser and log in with the username/password you set in `appsettings.json`.

The SQLite database (`craftiq.db`) is created automatically on first run. No migrations needed.

---

## Running Tests

```bash
# All tests
dotnet test CraftIQ.Tests/CraftIQ.Tests.csproj

# Single test class
dotnet test CraftIQ.Tests/CraftIQ.Tests.csproj --filter "FullyQualifiedName~CVStorageServiceTests"

# Single test method
dotnet test CraftIQ.Tests/CraftIQ.Tests.csproj --filter "FullyQualifiedName~CVStorageServiceTests.SaveAsync_NewRecord_PersistsToDatabase"
```

---

## Project Structure

```
CraftIQ/
├── Controllers/          # MVC + API controllers
│   ├── HomeController.cs         # Page routing
│   ├── CVApiController.cs        # CV generation, extraction
│   ├── AIStudioController.cs     # Analysis, LinkedIn, interview prep
│   ├── DownloadController.cs     # PDF / DOCX / TXT / JSON export
│   └── RefactorApiController.cs  # C/C++ refactor (no auth)
├── Services/             # Business logic
│   ├── GroqCVService.cs          # CV + cover letter generation
│   ├── GroqAnalysisService.cs    # ATS, scoring, LinkedIn, bullets
│   ├── GroqRefactorService.cs    # Code refactoring
│   ├── GroqAuthHandler.cs        # Injects Bearer token on every request
│   ├── GroqRetryHandler.cs       # Auto-retries on Groq 429 rate limits
│   ├── PlaywrightPdfService.cs   # HTML-faithful PDF via headless Chromium
│   ├── QuestPdfService.cs        # Programmatic PDF fallback
│   └── DocxService.cs            # Template-aware DOCX generation
├── Models/               # Request / response models
├── Views/                # Razor views (CVBuilder, CVTemplates, etc.)
├── wwwroot/              # Static assets (JS, CSS)
│   └── js/
│       ├── cv-builder.js
│       ├── cv-templates.js
│       └── ai-studio.js
├── Data/                 # EF Core DbContext
├── appsettings.json      # Configuration (API key, auth, DB)
└── Program.cs            # App startup + DI registration

CraftIQ.Tests/            # xUnit test project
```

---

## Configuration Reference

All settings live in `appsettings.json`:

| Key | Description |
|---|---|
| `Groq:ApiKey` | Your Groq API key |
| `Groq:BaseUrl` | Groq endpoint — `https://api.groq.com/openai/v1/` |
| `Groq:Model` | Model name — see model options above |
| `Auth:Username` | Login username |
| `Auth:Password` | Login password |
| `ConnectionStrings:DefaultConnection` | SQLite path — default `Data Source=craftiq.db` |

---

## Resetting the Database

Delete `craftiq.db` and restart the app. The schema is recreated automatically via `EnsureCreated()`.

```bash
rm craftiq.db
dotnet run
```

---

## Security Notes

- `appsettings.json` contains your API key and login password. **Do not commit it to a public repository.**
- Add `appsettings.json` to `.gitignore` before pushing, or replace secret values with environment variables.
- The Refactor Tool endpoint (`/api/refactor`) is intentionally unauthenticated so it can be used without logging in.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | ASP.NET Core MVC (.NET 8) |
| Database | SQLite via Entity Framework Core |
| AI | Groq API (OpenAI-compatible) |
| PDF export | Playwright (Chromium) + QuestPDF fallback |
| DOCX export | DocumentFormat.OpenXml |
| PDF parsing | iText7 |
| Authentication | Cookie auth with timing-safe comparison |
| Tests | xUnit + Moq + EF InMemory |
