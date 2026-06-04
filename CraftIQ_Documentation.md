# CraftIQ — Technical Documentation

**Version:** 1.0  
**Platform:** ASP.NET Core MVC 8 (.NET 8)  
**Database:** SQLite via Entity Framework Core 8  
**AI Provider:** OpenRouter API  
**Prepared:** June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Project Structure](#4-project-structure)
5. [Configuration and Startup](#5-configuration-and-startup)
6. [Authentication and Security](#6-authentication-and-security)
7. [Database Layer](#7-database-layer)
8. [Data Models](#8-data-models)
9. [Service Layer](#9-service-layer)
10. [AI Integration — OpenRouter API](#10-ai-integration--openrouter-api)
11. [Controllers and API Reference](#11-controllers-and-api-reference)
12. [CV Builder Module](#12-cv-builder-module)
13. [CV Templates](#13-cv-templates)
14. [Cover Letter Workspace](#14-cover-letter-workspace)
15. [Career Intelligence Center (CIC)](#15-career-intelligence-center-cic)
16. [Analysis Scoring System](#16-analysis-scoring-system)
17. [Code Refactor Tool](#17-code-refactor-tool)
18. [Document Extraction Pipeline](#18-document-extraction-pipeline)
19. [Export System](#19-export-system)
20. [Frontend Architecture](#20-frontend-architecture)
21. [Views and Pages](#21-views-and-pages)
22. [Rate Limiting](#22-rate-limiting)
23. [Error Handling](#23-error-handling)
24. [Testing](#24-testing)
25. [Key Workflows End-to-End](#25-key-workflows-end-to-end)
26. [Deployment Notes](#26-deployment-notes)
27. [Extension and Contribution Guide](#27-extension-and-contribution-guide)

---

# 1. Project Overview

CraftIQ is an AI-powered career productivity platform built as an ASP.NET Core MVC web application. It provides a complete suite of tools for professionals and students to create, optimize, analyze, and export career documents.

### Core Capabilities

- **CV Builder** — a multi-step form that sends user-provided career data to an LLM and receives a fully structured, ATS-optimized CV. The resulting CV is rendered into one of ten professionally designed templates with real-time inline editing.
- **Cover Letter Workspace** — an AI generation tool supporting eight distinct letter styles with tone, length, and focus-area controls.
- **Career Intelligence Center (CIC)** — a standalone analysis hub with eight AI-powered tools: ATS Analysis, CV Health Dashboard, Job Match Scanner, Recruiter Simulation, AI Bullet Improver, Project Enhancement Engine, Interview Question Generator, and LinkedIn Profile Generator. Documents can be uploaded directly (PDF, DOCX, TXT, PNG, JPG) or the current CV can be analyzed in-context.
- **Code Refactor Tool** — a specialized C/C++ code quality analyzer that detects code smells, classifies them by severity, and produces a clean refactored version with line-accurate explanations.
- **History** — a unified view of all saved CVs and analysis reports with relative timestamps and direct reopen links.
- **Export** — PDF, DOCX, PNG, TXT, and JSON export for CVs; PDF and DOCX for cover letters. Client-side rendering is used for highest fidelity, with server-side fallback.

### Design Philosophy

CraftIQ separates deterministic, measurable scoring (computed locally in C# without any AI call) from field-knowledge scoring (delegated to the LLM). This hybrid model guarantees that measurable facts — section completeness, bullet count, skill quantity — are never affected by AI hallucination, while subjective quality judgments — keyword density, ATS compatibility, action-verb quality — are handled by the LLM with explicit constraints.

---

# 2. Technology Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | ASP.NET Core MVC | .NET 8 |
| Language | C# | 12 |
| ORM | Entity Framework Core | 8.0.8 |
| Database | SQLite | via EF Core |
| Auth | Cookie Authentication | ASP.NET Core built-in |
| Rate Limiting | ASP.NET Core RateLimiter | .NET 8 built-in |
| Server | Kestrel | .NET 8 built-in |
| Health Checks | EF Core health check extension | 8.0.8 |

### AI and External Services

| Component | Technology | Notes |
|-----------|-----------|-------|
| LLM Provider | OpenRouter API | Base URL: `https://openrouter.ai/api/v1/` |
| Default Model | `openrouter/auto` | Routes to best available model |
| Vision/OCR Model | `meta-llama/llama-4-scout-17b-16e-instruct` | Used for image CV extraction |
| HTTP Client | `IHttpClientFactory` named "Groq" | 60-second timeout |

### Document Processing

| Component | Library | Version |
|-----------|---------|---------|
| PDF text extraction | iText7 | 7.2.6 |
| DOCX text extraction | DocumentFormat.OpenXml | 3.5.1 |
| DOCX generation (server-side) | DocumentFormat.OpenXml | 3.5.1 |
| PDF generation (server-side template) | QuestPDF | 2026.5.0 |
| HTML-to-PDF (server-side faithful) | Microsoft.Playwright | 1.60.0 |
| PDF parsing (alternative) | UglyToad.PdfPig | 0.1.9-alpha |

### Frontend

| Component | Technology |
|-----------|-----------|
| View Engine | Razor (cshtml) |
| Scripting | Vanilla JavaScript (ES6+) |
| Styling | CSS custom properties, single `site.css` |
| PDF export (client) | html2canvas + jsPDF |
| DOCX export (client) | JSZip (Office Open XML) |
| PNG export (client) | html2canvas |
| Libraries | Delivered via CDN / `wwwroot/lib` |

### Testing

| Component | Technology | Version |
|-----------|-----------|---------|
| Test Framework | xUnit | 2.9.2 |
| In-memory DB | EF Core InMemory | 8.0.0 |
| Coverage | coverlet.collector | 6.0.2 |

---

# 3. System Architecture

CraftIQ follows a standard ASP.NET Core MVC layered architecture with a clear boundary between the presentation layer (Razor views + vanilla JS), the application layer (controllers and service interfaces), the domain layer (service implementations and models), and the data layer (EF Core + SQLite).

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│  Razor Views (cshtml) + Vanilla JS + CSS                │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (HTTPS in production)
┌───────────────────────▼─────────────────────────────────┐
│                  Kestrel / IIS                           │
│  Middleware pipeline:                                    │
│  HTTPS Redirect → Static Files → Routing →              │
│  Rate Limiter → Session → Authentication → Authorization │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  Controllers                             │
│  HomeController (MVC views)                             │
│  CVApiController, CVStorageController,                  │
│  AIStudioController, AnalysisReportController,          │
│  RefactorApiController, DownloadController              │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐  ┌────────────▼───────────────────┐
│   Service Layer     │  │     AI HTTP Client              │
│  GroqCVService      │  │  IHttpClientFactory ("Groq")    │
│  CVStorageService   │  │  → OpenRouter API               │
│  GroqAnalysisService│  │    (openrouter/auto)            │
│  AnalysisRptService │  │  → Vision model for OCR         │
│  GroqRefactorService│  └────────────────────────────────┘
│  DocxService        │
│  QuestPdfService    │
│  PlaywrightPdfSvc   │
└──────────┬──────────┘
           │
┌──────────▼──────────────────────────────────────────────┐
│              Data Layer (EF Core 8)                     │
│  AppDbContext → SQLite (craftiq.db)                     │
│  Tables: CVRecords, CVAutoSaves, AnalysisReports        │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Single-user authentication model.** CraftIQ is designed around a single authenticated administrator user. The username is stored in configuration, credentials are verified with timing-safe SHA-256 comparison, and all data is scoped to the authenticated `ClaimTypes.Name` value. This keeps the architecture simple without sacrificing security.

**Scoped services.** All services are registered as `Scoped`, which ties their lifetime to the HTTP request. This is appropriate because `AppDbContext` itself is scoped, and services that hold a reference to it must match its lifetime.

**Interface-first service design.** Every service is defined by an interface (`ICVService`, `ICVStorageService`, `IGroqAnalysisService`, `IAnalysisReportService`, `IRefactorService`). This enables the test project to depend on implementations directly (for integration-style unit tests) while also making replacement or mocking straightforward.

**No database migrations.** The application calls `db.Database.EnsureCreated()` at startup. This is appropriate for a project of this scope and avoids migration management overhead, but means schema changes require dropping and recreating the database.

**Hybrid scoring.** Four of the seven CV analysis scores are computed in pure C# before any AI call is made. The AI receives the pre-computed values as hard constraints and is only asked to compute the remaining three. The C# values are then re-applied on the response object to guarantee they cannot be overridden by the AI.

---

# 4. Project Structure

```
CraftIQ_for_Dep/
├── CraftIQ/                          # Main web application
│   ├── Controllers/
│   │   ├── HomeController.cs         # MVC page controller + auth
│   │   ├── CVApiController.cs        # /api/cv — generate, cover letter, extract
│   │   ├── CVStorageController.cs    # /api/cv-storage — CRUD + autosave
│   │   ├── AIStudioController.cs     # /api/ai-studio — all 8 CIC tools + versions
│   │   ├── AnalysisReportController.cs # /api/analysis-reports — save/list/delete
│   │   ├── RefactorApiController.cs  # /api/refactor — C/C++ analysis
│   │   └── DownloadController.cs     # /api/download — PDF/DOCX/TXT/JSON export
│   ├── Services/
│   │   ├── ICVService.cs             # Interface: generate CV, generate cover letter
│   │   ├── GroqCVService.cs          # Implementation via OpenRouter
│   │   ├── ICVStorageService.cs      # Interface: CRUD + autosave
│   │   ├── CVStorageService.cs       # Implementation via EF Core
│   │   ├── IGroqAnalysisService.cs   # Interface: all 7 analysis methods
│   │   ├── GroqAnalysisService.cs    # Implementation — hybrid local + AI scoring
│   │   ├── IAnalysisReportService.cs # Interface: save/list/delete/count reports
│   │   ├── AnalysisReportService.cs  # Implementation via EF Core
│   │   ├── IRefactorService.cs       # Interface: refactor C/C++
│   │   ├── GroqRefactorService.cs    # Implementation via OpenRouter
│   │   ├── IDocxService.cs           # Interface: generate DOCX bytes
│   │   ├── DocxService.cs            # Implementation via DocumentFormat.OpenXml
│   │   ├── IPdfService.cs            # Interface: generate PDF bytes (template)
│   │   ├── QuestPdfService.cs        # Implementation via QuestPDF
│   │   ├── IHtmlPdfService.cs        # Interface: render HTML to PDF
│   │   └── PlaywrightPdfService.cs   # Implementation via Playwright
│   ├── Models/
│   │   ├── CVRecord.cs               # DB entity: saved CV
│   │   ├── CVAutosave.cs             # DB entity: auto-save slot
│   │   ├── AnalysisReport.cs         # DB entity + History view models
│   │   ├── CVRequest.cs              # Input for CV generation
│   │   ├── CVResponse.cs             # Structured CV output + CVSection, SkillGroup
│   │   ├── CoverLetterRequest.cs     # Input for cover letter generation
│   │   ├── CoverLetterResponse.cs    # Cover letter output
│   │   ├── AIStudioModels.cs         # All request/response models for CIC tools
│   │   ├── RefactorRequest.cs        # Input for code refactor
│   │   ├── RefactorResponse.cs       # Refactor output
│   │   ├── CodeSmell.cs              # Code smell entity
│   │   ├── DownloadRequest.cs        # Download endpoint payloads
│   │   ├── GroqOptions.cs            # Configuration binding for AI settings
│   │   ├── DashboardViewModel.cs     # Dashboard + History view models
│   │   └── ErrorViewModel.cs         # Error page model
│   ├── Data/
│   │   └── AppDbContext.cs           # EF Core DbContext with model configuration
│   ├── Views/
│   │   ├── Home/
│   │   │   ├── Landing.cshtml        # Public landing page
│   │   │   ├── Login.cshtml          # Login form
│   │   │   ├── Index.cshtml          # Dashboard (authenticated)
│   │   │   ├── CVBuilder.cshtml      # CV form builder
│   │   │   ├── CVTemplates.cshtml    # Template selector + editor + CIC panel
│   │   │   ├── CareerIntelligence.cshtml  # Standalone CIC page
│   │   │   ├── History.cshtml        # Documents + reports history
│   │   │   └── Refactor.cshtml       # Code refactor tool
│   │   └── Shared/
│   │       ├── _Layout.cshtml        # Master layout with navigation
│   │       └── _ValidationScripts.cshtml
│   ├── wwwroot/
│   │   ├── css/site.css              # All application styles
│   │   ├── js/
│   │   │   ├── cv-builder.js         # CV form logic + API calls
│   │   │   ├── cv-templates.js       # 10 templates, toolbar, save, export
│   │   │   ├── cl-workspace.js       # Cover letter workspace
│   │   │   ├── career-intelligence.js # 8 CIC tools, modals, caching
│   │   │   ├── ai-studio.js          # AI Studio tool helpers
│   │   │   ├── coverletter.js        # Legacy CL helpers
│   │   │   └── site.js               # Global utilities
│   │   ├── lib/                      # Client-side libraries
│   │   └── uploads/                  # Transient upload staging directory
│   ├── Program.cs                    # Application entry point + DI + middleware
│   ├── appsettings.json              # Configuration (connection string, Groq, Auth)
│   ├── appsettings.Development.json  # Development overrides
│   ├── CraftIQ.csproj                # Project file with NuGet dependencies
│   └── craftiq.db                    # SQLite database file
└── CraftIQ.Tests/
    ├── AnalysisServiceTests.cs       # 10 unit tests for local scoring algorithms
    ├── AnalysisReportServiceTests.cs  # 6 integration tests for report service
    ├── UnitTest1.cs                  # Placeholder
    └── CraftIQ.Tests.csproj          # Test project file
```

---

# 5. Configuration and Startup

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=craftiq.db"
  },
  "Groq": {
    "ApiKey": "<openrouter-api-key>",
    "BaseUrl": "https://openrouter.ai/api/v1/",
    "Model": "openrouter/auto"
  },
  "Auth": {
    "Username": "admin",
    "Password": "CraftIQ@2025!"
  }
}
```

The `Groq` section is bound to `GroqOptions` and injected via `IOptions<GroqOptions>`. The `Auth` section is read directly from `IConfiguration` in `HomeController.VerifyCredentials`. Neither credential is stored in source control for production deployments — they should be overridden via environment variables or secrets management.

### Program.cs — Service Registration Order

```csharp
// 1. MVC
builder.Services.AddControllersWithViews();

// 2. EF Core + SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// 3. Named HTTP client for OpenRouter
builder.Services.AddHttpClient("Groq", (sp, client) => {
    client.BaseAddress = new Uri(opts.BaseUrl);
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {opts.ApiKey}");
    client.Timeout = TimeSpan.FromSeconds(60);
});

// 4. Application services (all Scoped)
builder.Services.AddScoped<IRefactorService, GroqRefactorService>();
builder.Services.AddScoped<ICVService, GroqCVService>();
builder.Services.AddScoped<IPdfService, QuestPdfService>();
builder.Services.AddScoped<IDocxService, DocxService>();
builder.Services.AddScoped<ICVStorageService, CVStorageService>();
builder.Services.AddScoped<IHtmlPdfService, PlaywrightPdfService>();
builder.Services.AddScoped<IGroqAnalysisService, GroqAnalysisService>();
builder.Services.AddScoped<IAnalysisReportService, AnalysisReportService>();

// 5. Cookie authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options => { ... });

// 6. Session (30-minute idle, HttpOnly, SameSite=Strict)
builder.Services.AddSession(...);

// 7. Rate limiting (20 AI requests per user per minute)
builder.Services.AddRateLimiter(rl => {
    rl.AddFixedWindowLimiter("ai", opts => {
        opts.PermitLimit = 20;
        opts.Window = TimeSpan.FromMinutes(1);
        opts.QueueLimit = 0;
    });
});

// 8. Kestrel body size (15 MB global)
builder.Services.Configure<KestrelServerOptions>(opts =>
    opts.Limits.MaxRequestBodySize = 15_728_640);

// 9. Health checks
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();
```

### Middleware Pipeline Order

```
app.UseHttpsRedirection()
app.UseStaticFiles()
app.UseRouting()
app.UseRateLimiter()       ← must be after UseRouting
app.UseSession()
app.UseAuthentication()
app.UseAuthorization()
app.MapHealthChecks("/health")
app.MapControllerRoute(default: {controller=Home}/{action=Landing}/{id?})
```

### Database Initialization

On every startup, the application runs `db.Database.EnsureCreated()` inside a scoped service scope before `app.Run()`. This creates the SQLite file and all three tables if they do not already exist. No EF Core migrations are used.

---

# 6. Authentication and Security

### Cookie Authentication

CraftIQ uses ASP.NET Core cookie authentication with the following settings:

| Setting | Value |
|---------|-------|
| Login path | `/Home/Login` |
| Logout path | `/Home/Logout` |
| Expiry | 7 days (persistent) |
| HttpOnly | `true` |
| Secure policy | `SameAsRequest` (use `Always` in production) |
| SameSite | `Strict` |

On successful login, two claims are issued:

```csharp
new Claim(ClaimTypes.Name,  username)
new Claim(ClaimTypes.Email, $"{username}@craftiq.local")
```

The `ClaimTypes.Name` claim is used as the `userId` key throughout the application. All database queries include a `WHERE UserId = @userId` predicate, ensuring strict data isolation between sessions.

### Timing-Safe Credential Verification

The login handler avoids timing side-channels by hashing both the submitted credentials and the configured credentials with SHA-256 before comparing them with `CryptographicOperations.FixedTimeEquals`. This ensures that the comparison time is constant regardless of where the strings differ.

```csharp
private bool VerifyCredentials(string username, string password)
{
    var configUser = _config["Auth:Username"] ?? "";
    var configPass = _config["Auth:Password"] ?? "";

    var hashUser  = SHA256.HashData(Encoding.UTF8.GetBytes(username));
    var hashPass  = SHA256.HashData(Encoding.UTF8.GetBytes(password));
    var hashCUser = SHA256.HashData(Encoding.UTF8.GetBytes(configUser));
    var hashCPass = SHA256.HashData(Encoding.UTF8.GetBytes(configPass));

    return CryptographicOperations.FixedTimeEquals(hashUser, hashCUser)
        && CryptographicOperations.FixedTimeEquals(hashPass, hashCPass);
}
```

### CSRF Protection

All POST form actions in `HomeController` (Login, Logout) are decorated with `[ValidateAntiForgeryToken]`. API controllers receive JSON bodies and rely on cookie authentication combined with SameSite=Strict to prevent CSRF on JSON endpoints.

### Rate Limiting

AI-heavy endpoints are decorated with `[EnableRateLimiting("ai")]`. The fixed-window limiter allows 20 requests per minute per connection. Excess requests receive HTTP 429.

### File Upload Validation

The `/api/cv/extract` endpoint enforces:
- Maximum file size: 10 MB (enforced by `[RequestSizeLimit]` and explicit length check)
- Magic byte validation: PDF files must start with `%PDF` (`0x25 0x50 0x44 0x46`), DOCX files must start with the ZIP PK header (`0x50 0x4B 0x03 0x04`)
- Allowed MIME types determined by extension: `.pdf`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.webp`
- The MIME type for image OCR is derived from the file extension, not the `ContentType` header, because the `ContentType` is attacker-controlled

### Authorization

- Public routes: `Landing`, `Login` — decorated with `[AllowAnonymous]`
- All other MVC routes and API controllers: require authentication via `[Authorize]`
- The `RefactorApiController` does not carry `[Authorize]` at the class level in the current codebase — it relies on the global authorization policy applied by the middleware pipeline configuration

### Failed Login Logging

Failed login attempts are logged at Warning level including the attempted username and the remote IP address. Successful logins are logged at Information level. This provides an audit trail for security review.

---

# 7. Database Layer

### AppDbContext

`AppDbContext` extends `DbContext` and defines three `DbSet` properties:

```csharp
public DbSet<CVRecord>       CVRecords       { get; set; }
public DbSet<CVAutoSave>     CVAutoSaves     { get; set; }
public DbSet<AnalysisReport> AnalysisReports { get; set; }
```

### Model Configuration (Fluent API)

All three entities are configured in `OnModelCreating`:

- Primary key: `Id` (string, GUID-format)
- Required: `UserId`
- Optional large text fields: `CVDataJson`, `FormDataJson`, `PhotoBase64`, `ResultJson` — marked `IsRequired(false)` to allow NULL in SQLite
- Index on `UserId` for all three tables — ensures user-scoped queries do not perform full table scans

### Connection String

```
Data Source=craftiq.db
```

The database file is stored in the application's working directory (project root in development, deployment directory in production).

### Schema

#### CVRecords table

| Column | Type | Notes |
|--------|------|-------|
| Id | TEXT | GUID primary key |
| UserId | TEXT | NOT NULL, indexed |
| CVTitle | TEXT | Default: "My CV" |
| TemplateId | TEXT | Default: "apex" |
| AccentColor | TEXT | Hex color, default "#1a1a2e" |
| CVDataJson | TEXT | Serialized `CVResponse` |
| FormDataJson | TEXT | Raw form field state |
| PhotoBase64 | TEXT | NULLABLE, base64-encoded photo |
| Status | TEXT | "draft" or "complete" |
| CreatedAt | TEXT | UTC ISO datetime |
| UpdatedAt | TEXT | UTC ISO datetime |

#### CVAutoSaves table

| Column | Type | Notes |
|--------|------|-------|
| Id | TEXT | GUID primary key |
| UserId | TEXT | NOT NULL, indexed |
| CVRecordId | TEXT | NULLABLE, links to CVRecord |
| FormDataJson | TEXT | Auto-saved form state |
| CVDataJson | TEXT | NULLABLE, auto-saved CV data |
| PhotoBase64 | TEXT | NULLABLE |
| SavedAt | TEXT | UTC ISO datetime |

#### AnalysisReports table

| Column | Type | Notes |
|--------|------|-------|
| Id | TEXT | GUID primary key |
| UserId | TEXT | NOT NULL, indexed |
| Title | TEXT | Display title, e.g. "ATS Analysis – My CV" |
| DocumentType | TEXT | "CV", "CoverLetter", or "Uploaded" |
| AnalysisType | TEXT | "ATS", "JobMatch", "Health", "Recruiter", "Interview", "LinkedIn", "CLReview", "Optimizer" |
| JobTitle | TEXT | Optional job title used in analysis |
| OverallScore | INTEGER | 0–100 |
| ResultJson | TEXT | Serialized `AnalyzeResponse` or equivalent |
| CreatedAt | TEXT | UTC ISO datetime |

---

# 8. Data Models

### CVRecord

Represents a persisted CV document in the database. `CVDataJson` stores the serialized `CVResponse` object (the AI-generated structured CV). `FormDataJson` stores the raw form inputs so the builder can be re-opened and edited. `PhotoBase64` stores the user's profile photo as a base64 string.

```csharp
public class CVRecord
{
    public string   Id           { get; set; } = Guid.NewGuid().ToString();
    public string   UserId       { get; set; } = "";
    public string   CVTitle      { get; set; } = "My CV";
    public string   TemplateId   { get; set; } = "apex";
    public string   AccentColor  { get; set; } = "#1a1a2e";
    public string   CVDataJson   { get; set; } = "";
    public string   FormDataJson { get; set; } = "";
    public string?  PhotoBase64  { get; set; }
    public string   Status       { get; set; } = "draft";
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt    { get; set; } = DateTime.UtcNow;
}
```

### CVAutoSave

Stores the most recent auto-save state for a given user and optionally a specific `CVRecordId`. When the user has not yet saved a named CV, `CVRecordId` is null. This allows recovery of unsaved work after a browser close.

### CVResponse

The structured output of the AI CV generation pipeline. All templates render from this model.

```csharp
public class CVResponse
{
    public string           FullName            { get; set; }
    public string           JobTitle            { get; set; }
    public string           Email               { get; set; }
    public string           Phone               { get; set; }
    public string           Location            { get; set; }
    public string           LinkedIn            { get; set; }
    public string           ProfessionalSummary { get; set; }
    public List<CVSection>  Experience          { get; set; }
    public List<CVSection>  Education           { get; set; }
    public List<string>     Skills              { get; set; }
    public List<SkillGroup> SkillGroups         { get; set; }
    public List<string>     Certifications      { get; set; }
    public List<string>     Languages           { get; set; }
    public List<string>     Tips                { get; set; }
}
```

`CVSection` has a `Heading` string and a `List<string> Points` for bullet points. `SkillGroup` has a `Category` string and `List<string> Skills` — used by templates that group skills by category.

### CVRequest

The input model for the CV generation endpoint. Structured fields (`Experience`, `Education`) are serialized as lists of `ExperienceEntry` and `EducationEntry` respectively. Free-text fields (`Skills`, `Certifications`, `Languages`) are submitted as comma-separated strings.

### AnalyzeResponse

The output of the comprehensive CV analysis pipeline. Contains all scoring dimensions, prioritized improvement lists, and optional job-match fields.

| Field Group | Fields |
|-------------|--------|
| Core scores | `OverallScore`, `ATSScore`, `CompletenessScore`, `KeywordScore`, `SkillsScore`, `ReadabilityScore`, `ProjectScore` |
| Writing quality | `ActionVerbScore`, `QuantificationScore`, `WritingQualityNote` |
| ATS report | `MissingKeywords`, `FormattingIssues`, `WeakSections`, `Improvements` |
| Priority improvements | `HighPriorityImprovements`, `MediumPriorityImprovements`, `LowPriorityImprovements` |
| Job match (optional) | `JobMatchPercentage`, `RequiredSkills`, `MissingSkills`, `MatchedKeywords`, `RoleFitExplanation` |
| Recruiter simulation | `ShortlistReasons`, `RejectReasons`, `RedFlags`, `MissingEvidence` |

### CoverLetterRequest

```csharp
public class CoverLetterRequest
{
    public string FullName      { get; set; }
    public string JobTitle      { get; set; }
    public string CompanyName   { get; set; }
    public string HiringManager { get; set; }
    public string Experience    { get; set; }
    public string Skills        { get; set; }
    public string WhyCompany    { get; set; }
    public string Tone          { get; set; }  // "Professional" default
    public string Template      { get; set; }  // one of 8 style keys
    public string KeySkills     { get; set; }
    public string PersonalNote  { get; set; }
    public string JobDescription{ get; set; }
    public string FocusAreas    { get; set; }
    public string Length        { get; set; }  // "Short" | "Standard" | "Detailed"
    public string Summary       { get; set; }
    public string Education     { get; set; }
}
```

### CoverLetterResponse

```csharp
public class CoverLetterResponse
{
    public string       Subject    { get; set; }
    public string       Opening    { get; set; }
    public string       Body       { get; set; }
    public string       Closing    { get; set; }
    public string       FullLetter { get; set; }
    public List<string> Tips       { get; set; }
}
```

### CodeSmell

```csharp
public class CodeSmell
{
    public string Title         { get; set; }
    public string Category      { get; set; }
    public string Severity      { get; set; }  // "High" | "Medium" | "Low"
    public int?   LineStart     { get; set; }
    public int?   LineEnd       { get; set; }
    public string Reason        { get; set; }
    public string Impact        { get; set; }
    public string FixSuggestion { get; set; }
}
```

### AnalysisReport (DB entity)

Stores the serialized result of any CIC analysis tool for later retrieval on the History page. `ResultJson` contains the full serialized `AnalyzeResponse` or equivalent response object so the report can be re-rendered without re-running the AI analysis.

---

# 9. Service Layer

## 9.1 ICVService / GroqCVService

Responsible for all AI-powered document generation.

**`GenerateCVAsync(CVRequest req, CancellationToken ct)`**  
Builds a detailed system and user prompt from the request fields, sends it to the OpenRouter API with `temperature=0.3` and `response_format=json_object`, and deserializes the response into a `CVResponse`. The prompt instructs the AI to:
- Group skills into 3–5 logical categories (producing both a flat `skills` array and `skillGroups`)
- Use strong action verbs and quantify achievements
- Tailor content to any provided `JobRequirements`
- Avoid em dashes (`—`) in output (they break certain template renderers)

Response parsing is defensive: each field is read with `TryGetProperty` so a missing field in the AI response produces a blank string rather than an exception. Markdown code fences in the response are stripped before JSON parsing.

**`GenerateCoverLetterAsync(CoverLetterRequest req, CancellationToken ct)`**  
Uses a template-dispatch pattern: the `Template` field on the request selects from eight distinct `(system, user)` prompt pairs, each targeting a different professional context. A shared banned-phrases list is injected into every prompt to prevent generic AI-sounding language. Length is controlled by explicit word-count instructions. Temperature is set to `0.55` to allow more stylistic variation than CV generation.

## 9.2 ICVStorageService / CVStorageService

All methods filter by `UserId`, which is the authenticated user's `ClaimTypes.Name` value. Callers pass `userId` explicitly — the service never reads the HTTP context.

| Method | Description |
|--------|-------------|
| `CreateDraftAsync(userId)` | Creates a new `CVRecord` with `Status="draft"` and returns it |
| `GetByIdAsync(id, userId)` | Returns the record only if both `Id` and `UserId` match |
| `GetAllByUserAsync(userId)` | Returns all records for the user, ordered by `UpdatedAt` descending |
| `SaveAsync(record)` | Upserts: if `Id` exists in the database, updates it; otherwise inserts. Always sets `UpdatedAt = DateTime.UtcNow` |
| `DeleteAsync(id, userId)` | Deletes only if both `Id` and `UserId` match — prevents cross-user deletion |
| `AutoSaveFormAsync(...)` | Upserts a `CVAutoSave` record keyed by `(UserId, CVRecordId)` |
| `GetAutoSaveAsync(userId, cvRecordId)` | Returns the most recent auto-save for the given key |

## 9.3 IGroqAnalysisService / GroqAnalysisService

The most complex service in the application. Provides all seven public analysis methods, all of which share a private `CallGroqAsync` helper and a `FlexibleStringListConverter` JSON converter.

### CallGroqAsync

```csharp
private async Task<string> CallGroqAsync(string system, string user, CancellationToken ct)
{
    var payload = new {
        model = _opts.Model,
        messages = new object[] {
            new { role = "system", content = system },
            new { role = "user",   content = user   }
        },
        temperature     = 0.3,
        max_tokens      = 4096,
        response_format = new { type = "json_object" }
    };
    // POST to "chat/completions", extract choices[0].message.content
}
```

### FlexibleStringListConverter

The AI occasionally returns a single string where an array of strings is expected (e.g., `"improvements": "Fix the formatting"` instead of `"improvements": ["Fix the formatting"]`). The custom `JsonConverter<List<string>>` handles both forms transparently, as well as null, numbers, and nested objects.

### Local Metric Computation

Before any AI call in `AnalyzeCVAsync`, the service runs `ComputeMetrics(cv)` to produce a `CvMetrics` record containing:
- `SectionsPresent` (0–7): count of non-empty sections
- `SkillCount`: number of skill strings
- `ExperienceCount`: number of experience entries
- `TotalBullets`: total bullet points across all experience entries
- `AvgBulletsPerJob`: `TotalBullets / ExperienceCount`
- `SummaryWordCount`: word count of the professional summary
- `ContactFieldCount` (0–4): count of non-empty contact fields
- `HasCertifications`, `HasLanguages`: boolean flags
- `AllJobsHaveBullets`: true if every experience entry has at least one bullet

These metrics are then passed to four deterministic scoring functions (detailed in Section 16).

## 9.4 IAnalysisReportService / AnalysisReportService

Simple CRUD service for `AnalysisReport` entities. The `SaveAsync` method upserts by `Id`, allowing both creation and update. `DeleteAsync` enforces user ownership. `CountByUserAsync` is used by the dashboard to populate the "Analysis Reports" stat card.

## 9.5 IRefactorService / GroqRefactorService

Sends C/C++ code to the AI with line numbers prepended (via `AddLineNumbers`) and a detailed system prompt specifying 14 code smell categories and 3 severity levels. Temperature is set to `0.1` for highly deterministic output. `CancellationToken.None` is explicitly passed to the HTTP call to prevent browser disconnection from aborting a long-running analysis.

## 9.6 DocxService

Generates `.docx` files using the `DocumentFormat.OpenXml` SDK. Builds the document structure programmatically: section headings, name/contact paragraphs, experience and education with bullet points, skills and certifications, and languages. The accent color is applied to headings and dividers. Photo embedding is not implemented in the server-side DOCX path (the client-side JSZip path handles photo embedding).

## 9.7 QuestPdfService and PlaywrightPdfService

Two server-side PDF generation strategies:
- `QuestPdfService` uses QuestPDF's document model to render a template-faithful PDF. It is the fallback when Playwright is unavailable.
- `PlaywrightPdfService` uses a headless Chromium browser (via Microsoft.Playwright) to render the exact live HTML of the template preview and capture it as a PDF. When available, this approach perfectly preserves the user's inline edits and template styling.

The `DownloadController` tries `PlaywrightPdfService` first. If it returns null (Playwright not installed or failed), it falls back to `QuestPdfService`.

---

# 10. AI Integration — OpenRouter API

### HTTP Client Configuration

CraftIQ uses a named `IHttpClientFactory` client registered under the key `"Groq"`:

```csharp
builder.Services.AddHttpClient("Groq", (sp, client) =>
{
    client.BaseAddress = new Uri(opts.BaseUrl);  // https://openrouter.ai/api/v1/
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {opts.ApiKey}");
    client.Timeout = TimeSpan.FromSeconds(60);
});
```

All AI service classes call `_http.CreateClient("Groq")` to obtain an `HttpClient` instance. The factory manages connection pooling and lifetime automatically.

### OpenRouter Configuration

| Setting | Value |
|---------|-------|
| Base URL | `https://openrouter.ai/api/v1/` |
| Default model | `openrouter/auto` |
| OCR vision model | `meta-llama/llama-4-scout-17b-16e-instruct` |
| CV/CL generation temperature | 0.3 (CV), 0.55 (cover letter) |
| Analysis temperature | 0.3 |
| Refactor temperature | 0.1 |
| Max tokens | 4096 (all endpoints) |
| Response format | `{ "type": "json_object" }` — enforces valid JSON output |

### Prompt Engineering Principles

**System prompt role separation.** Every AI call uses a two-message pattern: the system message defines the AI's persona and constraints (e.g., "You are a senior ATS expert. Return ONLY valid JSON. No markdown."), and the user message provides the task and data.

**Structured output enforcement.** All prompts explicitly specify the JSON schema the AI must return. The `response_format: json_object` parameter provides an additional guarantee from the API level.

**Constraint injection.** For CV analysis, locally-computed scores are injected into the user prompt as hard constraints: `"PRE-COMPUTED (do NOT change these values): completenessScore = 72"`. This prevents the AI from second-guessing deterministic facts.

**Evidence-based instructions.** Analysis prompts include explicit rules such as "Every item must cite specific text from the CV. No generic advice." This reduces hallucinated or generic output.

**Banned phrases.** The cover letter prompts include a list of banned clichés that the AI must not use. This significantly improves the quality and authenticity of generated letters.

### Vision API for OCR

Image files (PNG, JPG, JPEG, WEBP) submitted to the extract endpoint are converted to base64 and sent to the `meta-llama/llama-4-scout-17b-16e-instruct` model using the OpenAI-compatible multimodal message format:

```json
{
  "role": "user",
  "content": [
    {
      "type": "image_url",
      "image_url": { "url": "data:image/png;base64,..." }
    },
    {
      "type": "text",
      "text": "This is a CV or resume image. Extract ALL text exactly as written..."
    }
  ]
}
```

The extracted text is then passed to the standard `ParseWithAIAsync` method for structured parsing.

---

# 11. Controllers and API Reference

## 11.1 HomeController

Handles all server-rendered MVC pages. Requires authentication on all actions except `Landing` and `Login`.

| Action | Method | Route | Description |
|--------|--------|-------|-------------|
| `Landing` | GET | `/` → `/Home/Landing` | Public landing page |
| `Index` | GET | `/Home/Index` | Dashboard with stats |
| `Login` | GET/POST | `/Home/Login` | Login form |
| `Logout` | POST | `/Home/Logout` | Sign out + redirect |
| `CVBuilder` | GET | `/Home/CVBuilder?id=` | CV form builder |
| `CVTemplates` | GET | `/Home/CVTemplates?id=` | Template editor |
| `CareerIntelligence` | GET | `/Home/CareerIntelligence` | Standalone CIC |
| `History` | GET | `/Home/History` | Documents + reports |
| `Refactor` | GET | `/Home/Refactor` | Code refactor tool |

The `Index` action builds a `DashboardViewModel` with four stat counters (total documents, completed CVs, documents this week, analysis reports) and a list of the five most recently updated CVs. The `ReopenUrl` for each item intelligently directs to `CVTemplates` if the record has `Status="complete"` and a non-empty `CVDataJson`, or to `CVBuilder` otherwise.

## 11.2 CVApiController — `/api/cv`

| Endpoint | Method | Rate Limited | Description |
|----------|--------|-------------|-------------|
| `/api/cv/generate` | POST | Yes | Generate CV from form data |
| `/api/cv/cover-letter` | POST | Yes | Generate cover letter |
| `/api/cv/extract` | POST | No | Extract CV from file upload |

### POST /api/cv/generate

**Request body:** `CVRequest` (JSON)  
**Response:** `CVResponse` (JSON)  
**Errors:** 400 if `FullName` is empty; 500 on AI failure

### POST /api/cv/cover-letter

**Request body:** `CoverLetterRequest` (JSON)  
**Response:** `CoverLetterResponse` (JSON)  
**Errors:** 400 if `FullName` is empty; 500 on AI failure

### POST /api/cv/extract

**Request:** `multipart/form-data` with `IFormFile file`  
**Max file size:** 10 MB (enforced at both attribute and code level)  
**Accepted types:** `.pdf`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.webp`  
**Response:** `{ "formData": { ... } }` — structured JSON ready to populate the CV form  
**Errors:** 400 for missing file, oversized file, invalid magic bytes, unsupported type; 500 on extraction failure

## 11.3 CVStorageController — `/api/cv-storage`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cv-storage/list` | GET | List all user's CVs (summary) |
| `/api/cv-storage/{id}` | GET | Get full CV record by ID |
| `/api/cv-storage/create` | POST | Create new draft |
| `/api/cv-storage/save` | POST | Save/update CV (upsert) |
| `/api/cv-storage/autosave` | POST | Auto-save form state |
| `/api/cv-storage/autosave/{cvRecordId?}` | GET | Retrieve auto-save |
| `/api/cv-storage/{id}` | DELETE | Delete CV by ID |

All endpoints enforce user identity via the `RequireUser` helper, which reads `ClaimTypes.Name` from the cookie and returns `401 Unauthorized` immediately if the claim is missing.

The `save` and `autosave` endpoints have `[RequestSizeLimit(15_728_640)]` (15 MB) to accommodate large base64-encoded photos.

## 11.4 AIStudioController — `/api/ai-studio`

| Endpoint | Method | Rate Limited | Description |
|----------|--------|-------------|-------------|
| `/api/ai-studio/analyze` | POST | Yes | Full CV analysis (structured CV) |
| `/api/ai-studio/analyze-text` | POST | Yes | Full CV analysis (raw text) |
| `/api/ai-studio/analyze-cover-letter` | POST | Yes | Cover letter review |
| `/api/ai-studio/improve-bullet` | POST | Yes | Improve a single bullet point |
| `/api/ai-studio/enhance-project` | POST | Yes | Generate project bullet points |
| `/api/ai-studio/interview-questions` | POST | Yes | Generate 12 interview questions |
| `/api/ai-studio/linkedin` | POST | Yes | Generate LinkedIn profile content |
| `/api/ai-studio/versions` | GET | No | List all user's CVs |
| `/api/ai-studio/versions/{id}/duplicate` | POST | No | Duplicate a CV |
| `/api/ai-studio/versions/{id}/rename` | PATCH | No | Rename a CV |

### POST /api/ai-studio/analyze

**Request body:**  
```json
{
  "cv": { /* CVResponse object */ },
  "jobDescription": "optional job description text"
}
```
**Response:** `AnalyzeResponse` (JSON)

The hybrid scoring pipeline runs here. Four scores are computed locally, then the AI is called with those values as constraints. The response object's local scores are overwritten with the C# values after deserialization, and `OverallScore` is recomputed from the formula.

### POST /api/ai-studio/analyze-text

**Request body:**  
```json
{
  "rawText": "plain text extracted from uploaded document",
  "jobDescription": "optional"
}
```
**Response:** `AnalyzeResponse` (JSON)  
Used by the standalone CIC page when a document has been uploaded and extracted. All scores are computed entirely by the AI since there is no structured `CVResponse` to run local metrics against.

### POST /api/ai-studio/interview-questions

**Response structure:**
```json
{
  "questions": [
    {
      "question": "string",
      "category": "Technical | HR | Behavioral | Project",
      "difficulty": "Easy | Medium | Hard",
      "tip": "string"
    }
  ]
}
```
The prompt requests 12 questions: 4 Technical, 3 HR, 3 Behavioral, 2 Project; with 3 Easy, 5 Medium, 4 Hard difficulty distribution.

## 11.5 AnalysisReportController — `/api/analysis-reports`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analysis-reports` | GET | List user's reports (summary) |
| `/api/analysis-reports/{id}` | GET | Get full report including `ResultJson` |
| `/api/analysis-reports` | POST | Save new report |
| `/api/analysis-reports/{id}` | DELETE | Delete report (user-scoped) |

The `GET /list` endpoint returns only metadata (no `ResultJson`) for performance. The `GET /{id}` endpoint returns the full payload including the serialized HTML result.

## 11.6 RefactorApiController — `/api/refactor`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/refactor` | POST | Analyze and refactor C/C++ code |

**Request body:** `{ "code": "string" }`  
**Response:** `RefactorResponse` — `RefactoredCode` (string), `Explanation` (list of strings), `Smells` (list of `CodeSmell`)

The controller validates that the submitted code looks like C or C++ using a pattern-matching heuristic before sending it to the AI. It checks for C/C++-specific patterns (`#include`, `std::`, `int main(`, etc.) and rejects code containing patterns from other languages (`System.out.println`, `def `, `console.log`, etc.).

## 11.7 DownloadController — `/api/download`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/download/cv/pdf` | POST | CV as PDF |
| `/api/download/cv/docx` | POST | CV as DOCX |
| `/api/download/cv/txt` | POST | CV as plain text |
| `/api/download/cv/json` | POST | CV as JSON |
| `/api/download/cover-letter/pdf` | POST | Cover letter as PDF |
| `/api/download/cover-letter/docx` | POST | Cover letter as DOCX |

PDF endpoints accept an optional `RenderedHtml` field in the request body. If present, `PlaywrightPdfService` is tried first for the highest-fidelity output. If Playwright is unavailable, it falls back to template-based rendering.

File names for CV exports are sanitized with the `Safe()` helper: spaces become underscores, and slash characters are removed.

---

# 12. CV Builder Module

The CV Builder is a multi-step form that collects career information and submits it to the AI generation pipeline.

### Page: `/Home/CVBuilder`

**View:** `CVBuilder.cshtml`  
**Script:** `cv-builder.js`

### Form Structure

The builder organizes fields into logical sections:

1. **Personal Information** — Full name, target job title, email, phone, location, LinkedIn
2. **Professional Summary** — Free-text summary input
3. **Experience** — Dynamic list of experience entries, each with job title, company, location, date range, and responsibilities
4. **Education** — Dynamic list of education entries with degree, institution, location, and graduation year
5. **Skills, Certifications, Languages** — Comma-separated text inputs
6. **Job Requirements (optional)** — Free-text field to paste a job description for tailored generation

### Auto-Save

The JavaScript layer sends an auto-save request to `/api/cv-storage/autosave` at regular intervals (on form change events). On page load, it checks `/api/cv-storage/autosave/{cvRecordId}` for existing auto-save data and offers to restore it.

### Generation Flow

1. User fills the form and clicks "Generate CV"
2. JavaScript collects all form fields into a `CVRequest` JSON object
3. `POST /api/cv/generate` is called with the request
4. On success, the response `CVResponse` is stored in JavaScript state
5. The user is redirected (or the page transitions) to the template selector
6. Alternatively, the user may upload an existing CV file — the extract endpoint handles parsing and pre-fills the form

### File Upload (Pre-fill from Existing CV)

The "Upload CV" button triggers a file input. On file selection:
- The file is POSTed to `/api/cv/extract`
- The server extracts text (PDF → iText7, DOCX → OpenXml, image → Vision AI)
- The structured JSON is returned and used to populate all form fields
- The user can then review, edit, and re-generate

---

# 13. CV Templates

CraftIQ provides ten professionally designed CV templates. All templates are implemented as JavaScript functions in `cv-templates.js` that receive a `CVResponse` object and a configuration object (accent color, photo) and return an HTML string.

### Template Rendering System

Templates are rendered into a preview `<div>` with `innerHTML`. The `scaleTemplateFonts()` function scales all font sizes proportionally when the preview pane width changes, ensuring the template looks correct at any viewport width.

### The Ten Templates

| Template ID | Design Style | Notable Features |
|------------|-------------|-----------------|
| `nexus` | Dark left sidebar + skill progress bars | Sidebar accent panel, circular photo, animated skill bars |
| `atlas` | Gradient header + timeline layout | Full-width gradient header, left-border timeline for experience |
| `vega` | Ultra-minimal Swiss typography | Clean sans-serif, thin rules, high whitespace ratio |
| `onyx` | Full dark mode | Dark background throughout, light text, high contrast |
| `prism` | Card-based layout | Each section in a rounded card with subtle shadow |
| `volta` | Magazine bold editorial | Large bold section headings, high visual impact |
| `soleil` | Warm serif editorial | Serif typography, warm color palette, editorial feel |
| `forge` | Technical thick accent | Bold left accent border, engineering/technical aesthetic |
| `lumis` | Gradient sidebar | Gradient-filled sidebar, skill group display |
| `coda` | Executive band header | Full-width band header with name and title |

### Accent Color

Every template accepts an accent color via the configuration object. The color is applied to headings, borders, sidebar backgrounds, and decorative elements. Users can change the accent color via a color picker in the template toolbar, and the preview re-renders instantly.

### Quick Edit (Inline Editing)

After template selection, users can click any text element in the rendered preview to edit it in place. Changes are captured and merged back into the `CVResponse` state. This allows post-generation corrections without re-running the AI.

### AI Tips Panel

The `CVResponse.Tips` array is displayed below the template as an expandable "AI Suggestions" panel. This panel is hidden during all export operations via the CSS class `.cv-ai-tips`.

### Toolbar Actions

The template toolbar provides:
- Template switcher (dropdown of all 10 templates)
- Accent color picker
- Save button (triggers `/api/cv-storage/save`)
- Export dropdown (PDF, DOCX, PNG, TXT, JSON)
- Title editor

---

# 14. Cover Letter Workspace

The cover letter workspace is embedded within the `CVTemplates` view and accessible as a tab alongside the CV editor.

### Page Context

**View:** `CVTemplates.cshtml`  
**Script:** `cl-workspace.js`

### Eight Letter Styles

| Style Key | Target Context | Key Characteristics |
|-----------|---------------|---------------------|
| `Professional` | General corporate | 3-paragraph formal structure, specific evidence |
| `Internship` | Student/intern applications | Confident student voice, academic examples |
| `Software Engineer` | Technical roles | Developer-to-developer tone, technical specificity |
| `Academic` | Research/faculty positions | Scholarly tone, 4 paragraphs, research alignment |
| `Startup` | Startup applications | Direct, genuine, avoids startup clichés |
| `Career Change` | Career transitions | Owns the transition, bridges transferable skills |
| `Short & Direct` | Quick applications | Under 200 words, bullet-point body |
| `Modern Formal` | Contemporary professional | Personal voice, narrative structure |

### Generation Parameters

- **Tone** — informational only; actual tone is controlled by the template selection
- **Length** — "Short" (under 200 words), "Standard" (3 paragraphs), "Detailed" (4+ paragraphs)
- **Hiring Manager** — if provided, personalizes the salutation; defaults to "Dear Hiring Manager"
- **Job Description** — if provided, keywords are naturally woven into the letter
- **Focus Areas** — specific aspects of the candidate's background to emphasize
- **Personal Note** — any specific information to include

### Rendering and Export

The generated letter is rendered into a styled preview pane that applies the chosen template's typography. It is exported as PDF (via Playwright or QuestPDF) or DOCX (via DocxService). The `.cl-ai-tips` CSS class is applied to the tips box to hide it during export.

---

# 15. Career Intelligence Center (CIC)

The CIC provides eight AI-powered career analysis tools. It exists in two contexts:

1. **Standalone page** (`/Home/CareerIntelligence`) — for uploading and analyzing any document
2. **Embedded panel** in `CVTemplates` — for analyzing the currently open CV

### Standalone CIC — Three-Step Upload Wizard

The standalone CIC page (`CareerIntelligence.cshtml`) implements a wizard with three steps:

**Step 1 — Upload and Extract**
- User uploads a CV, cover letter, or resume file (PDF, DOCX, TXT, PNG, JPG)
- PDF and DOCX are extracted client-side using `FileReader` + iText7/OpenXml on the server
- Images are sent to the vision API for OCR
- Extracted text is displayed in an editable "OCR Review Panel" — the user can correct any extraction errors before proceeding
- Document type is routed: CV → analysis tools; Cover Letter → cover letter review tool

**Step 2 — Job Description (optional)**
- User pastes a job description to enable Job Match analysis
- This step can be skipped for a general analysis without job matching

**Step 3 — Analysis Cards**
- Eight analysis tool cards are displayed
- Each card can be clicked to run that specific analysis
- Results are cached — if the same tool is run again without document changes, the cached result is shown immediately
- Staleness detection: if the document or job description changes after a tool has run, a "stale results" indicator is shown on that card's result

### The Eight CIC Tools

| Tool Name | API Endpoint | Input | Key Output |
|-----------|-------------|-------|-----------|
| ATS Analyzer | `/api/ai-studio/analyze` or `analyze-text` | CV + optional JD | ATS score, missing keywords, formatting issues |
| CV Health Dashboard | Same as above | CV | All 7 scores with visual gauge |
| Job Match Scanner | Same (with JD) | CV + JD | Job match %, required/missing skills, matched keywords |
| Recruiter Simulation | Same | CV | Shortlist reasons, reject reasons, red flags |
| AI Bullet Improver | `/api/ai-studio/improve-bullet` | Single bullet text | Improved version + explanation |
| Project Enhancement | `/api/ai-studio/enhance-project` | Project details | 4–5 bullet points + one-line summary |
| Interview Question Generator | `/api/ai-studio/interview-questions` | CV + optional JD | 12 categorized questions with tips |
| LinkedIn Profile Generator | `/api/ai-studio/linkedin` | CV + optional target role | Headline, About, experience bullets, top 20 skills |

### Modal Results System

Each tool opens a results modal when analysis completes. Modals are built dynamically from the AI response, with sections showing scores as visual progress bars, bullet lists for improvements and keywords, and color-coded priority badges (High/Medium/Low).

### Save Reports

After any analysis, the user can save the report via `/api/analysis-reports`. The report stores the serialized result JSON, the document type, the analysis type, the overall score, and an optional job title. Saved reports appear in the History page and can be reopened to review without re-running the analysis.

### Result Caching

Results are cached in JavaScript memory (a `Map` keyed by tool name) for the duration of the page session. Before making an API call, the JavaScript checks the cache. If a cached result exists and the document/JD has not changed since the result was computed, the cached result is displayed immediately.

---

# 16. Analysis Scoring System

The scoring system uses a hybrid model: four scores are computed deterministically in C# and four are delegated to the AI.

## 16.1 Locally Computed Scores

### CompletenessScore

Measures the presence and depth of expected CV sections. Computed from `CvMetrics`.

```
Base: 0
+ 15 if any contact field is present (email or phone)
+ 15 if professional summary is non-empty
+ 20 if at least one experience entry exists
+ 15 if at least 4 total sections are present (implies education)
+ 15 if skills list is non-empty
+ min(8, contactFieldCount × 2)   — contact depth bonus
+ 6 if certifications list is non-empty
+ 6 if languages list is non-empty
capped at 100
```

**Score bands:**
- Empty CV: ~0
- Only name+contact: 23
- With summary and experience: 65
- Fully complete (all sections, all contact, certs, languages): 100

### ProjectScore

Measures the depth and consistency of experience section bullet points.

```
Base score from avgBulletsPerJob:
  ≥ 5 bullets/job → 90
  ≥ 4 bullets/job → 80
  ≥ 3 bullets/job → 70
  ≥ 2 bullets/job → 55
  ≥ 1 bullet/job  → 35
  0 bullets/job   → 15
No experience at all → 0

Bonuses:
+ 8 if all jobs have at least one bullet (AllJobsHaveBullets)
+ 5 if total bullets ≥ 15
+ 2 if total bullets ≥ 10
capped at 100
```

### ReadabilityScore

Measures structural clarity through measurable proxies.

```
Base: 40

Summary word count:
  0 words        → +0
  1-20 words     → +5  (too short)
  21-100 words   → +20 (ideal range)
  101-160 words  → +12 (acceptable)
  > 160 words    → +6  (too long)

Skills count:
  0 skills       → +0
  1-4 skills     → +5
  5-20 skills    → +18 (ideal range)
  21-30 skills   → +10
  > 30 skills    → +5  (padded)

Bullet consistency:
  All jobs have bullets AND exp > 0 → +15
  No experience at all → -10

Result: Math.Clamp(score, 0, 100)
```

### SkillsScore

Maps skill count to a score tier.

| Skill Count | Score |
|-------------|-------|
| 0 | 0 |
| 1–3 | 20 |
| 4–6 | 40 |
| 7–10 | 60 |
| 11–15 | 75 |
| 16–22 | 88 |
| > 22 | 95 |

## 16.2 AI-Computed Scores

| Score | What the AI Measures |
|-------|---------------------|
| `ATSScore` | Keyword pass rate for ATS scanners in the candidate's field; presence of action verbs, measurable achievements; absence of ATS-breaking formatting |
| `KeywordScore` | Density of relevant industry/role keywords throughout the CV content |
| `ActionVerbScore` | Strength and variety of action verbs used in bullet points |
| `QuantificationScore` | Presence of measurable outcomes (numbers, percentages, dollar amounts) in experience bullets |

## 16.3 OverallScore Formula

```
OverallScore = round(
    ATSScore        × 0.30 +
    CompletenessScore × 0.20 +
    KeywordScore    × 0.20 +
    ProjectScore    × 0.15 +
    ReadabilityScore × 0.15
)
```

This formula is applied in C# after the AI response is received, using the guaranteed local values for `CompletenessScore`, `ProjectScore`, and `ReadabilityScore`. The formula is also injected into the AI's user prompt so the AI can attempt to compute a consistent value, but the C# re-computation always wins.

## 16.4 Cover Letter Scoring

Cover letter analysis produces four scores:

| Score | Description |
|-------|-------------|
| `OverallScore` | General quality 0–100 |
| `ToneScore` | Tone appropriateness and consistency |
| `KeywordScore` | Keyword relevance (job description overlap if provided) |
| `ClarityScore` | Clarity and conciseness |

---

# 17. Code Refactor Tool

The Code Refactor tool is a specialized static analysis and refactoring assistant for C/C++ code.

### Page: `/Home/Refactor`

**Script:** `ai-studio.js`  
**API:** `POST /api/refactor`

### Language Detection

Before sending to the AI, the controller runs a heuristic language check. It rejects code if it contains patterns exclusive to other languages (Java, Python, JavaScript, C#, PHP, Rust, Go). It accepts code if it contains any C/C++-specific patterns.

**C/C++ patterns accepted:** `#include`, `int main(`, `using namespace std`, `std::`, `cout <<`, `cin >>`, `printf(`, `scanf(`, `malloc(`, `free(`, `class `, `struct `, `->`, `nullptr`, `new `, `delete `

### Code Smell Categories

The system prompt instructs the AI to check for 14 categories:

| Category | Severity Typical |
|----------|-----------------|
| Naming (unclear/abbreviated variable names) | Medium |
| Magic Numbers (hardcoded literals) | Medium |
| Long Function (function doing too many things) | Medium |
| Dead Code (unreachable/unused code) | Low |
| Missing Validation (no input checking) | High |
| Memory Leak (malloc/new without free/delete) | High |
| Poor Formatting (inconsistent indentation) | Low |
| Missing Newline (output without `\n`) | Low |
| Redundant Code (unnecessary operations) | Low |
| Global State (unnecessary globals) | Medium |
| Poor Error Handling (ignoring return values) | High |
| Integer Overflow (unchecked arithmetic) | High |
| Buffer Overflow (unsafe string operations) | High |
| Unused Include (unreferenced headers) | Low |

### Response Structure

```json
{
  "refactoredCode": "complete refactored source as single string",
  "explanation": [
    "Change title. Specific reason why this change was made."
  ],
  "smells": [
    {
      "title": "Short smell name",
      "category": "Category name",
      "severity": "High | Medium | Low",
      "lineStart": 12,
      "lineEnd": 15,
      "reason": "What is wrong on those lines",
      "impact": "What can go wrong if not fixed",
      "fixSuggestion": "Exact corrected code snippet"
    }
  ]
}
```

Line numbers in `lineStart`/`lineEnd` are accurate because the source code is submitted with line numbers prepended by `AddLineNumbers()` before the AI call.

### Refactoring Rules

The AI is instructed to apply these transformations:
- Preserve exact logic and behavior
- Replace single-letter variable names with meaningful names
- Replace all magic numbers with named constants or `constexpr`
- Add input validation (check `scanf` return values, null pointer checks)
- Ensure proper memory management (pair every `malloc` with `free`)
- Apply consistent 4-space indentation
- Split functions that do more than one thing
- Remove dead code, unused variables, and redundant comments
- Apply `const` correctness
- Use modern C++ idioms where appropriate (`nullptr`, `std::string`, range-based for)

---

# 18. Document Extraction Pipeline

The extraction pipeline handles four input formats: PDF, DOCX, images, and plain text.

### PDF Extraction (iText7)

```csharp
using var reader = new PdfReader(memoryStream);
using var pdfDoc = new PdfDocument(reader);
for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
{
    var page     = pdfDoc.GetPage(i);
    var strategy = new SimpleTextExtractionStrategy();
    var text     = PdfTextExtractor.GetTextFromPage(page, strategy);
    sb.AppendLine(text);
}
```

`SimpleTextExtractionStrategy` preserves text order as it appears on the page. Multi-page PDFs are handled by iterating all pages.

**Magic byte validation:** `%PDF` (`0x25 0x50 0x44 0x46`) — checked before opening the file.

### DOCX Extraction (DocumentFormat.OpenXml)

```csharp
using var doc  = WordprocessingDocument.Open(memoryStream, false);
var body = doc.MainDocumentPart?.Document?.Body;
foreach (var para in body.Descendants<Paragraph>())
    sb.AppendLine(para.InnerText?.Trim());
```

**Magic byte validation:** ZIP PK header (`0x50 0x4B 0x03 0x04`) — checked before opening.

### Image Extraction (Vision AI / OCR)

The image is base64-encoded and sent to `meta-llama/llama-4-scout-17b-16e-instruct` using the multimodal message format. The AI is instructed to extract all text exactly as written. The MIME type is derived from the file extension rather than the `Content-Type` header to prevent MIME spoofing attacks.

### Plain Text (FileReader JS)

For `.txt` files, extraction is handled entirely in the browser using the `FileReader` API. The text is read directly and sent to the analysis endpoint as the `rawText` field — no server-side processing is needed.

### Text-to-Form Parsing

After extraction by any method, the raw text is passed to `ParseWithAIAsync`, which calls the OpenRouter API with a precise schema definition and `response_format=json_object` to extract a structured form-ready JSON object. This JSON maps directly to the CV builder form fields.

---

# 19. Export System

CraftIQ provides multiple export formats for CVs and cover letters.

## 19.1 Client-Side PDF Export (Primary)

```javascript
// 1. Hide AI tips panel
previewEl.classList.add('exporting');

// 2. Capture at 2× scale
const canvas = await html2canvas(previewEl, { scale: 2 });

// 3. Calculate dimensions for A4
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const imgData = canvas.toDataURL('image/jpeg', 0.95);

// 4. Multi-page support: split canvas into A4 pages
const pageHeight = (canvas.width / 210) * 297; // A4 ratio
// ... add pages as JPEG images

// 5. Download
pdf.save(`${fullName}_CV.pdf`);
previewEl.classList.remove('exporting');
```

The CSS class `.cv-ai-tips` and `.cl-ai-tips` are added to hide the AI suggestions box before capture and removed after.

## 19.2 Client-Side DOCX Export

JSZip constructs a valid Office Open XML `.docx` package. The package includes:
- `[Content_Types].xml` with proper MIME type declarations
- `_rels/.rels` with the relationship to the document part
- `word/document.xml` with the full document body, including the accent color applied to headings
- `word/_rels/document.xml.rels` with the relationship to the image part (if a photo is present)
- `word/media/photo.png` containing the base64-decoded photo
- Style definitions embedded inline in the document XML

The JSZip approach produces files that open correctly in Microsoft Word, LibreOffice, and Google Docs.

## 19.3 PNG Export

```javascript
const canvas = await html2canvas(previewEl, { scale: 2 });
const link = document.createElement('a');
link.download = `${fullName}_CV.png`;
link.href = canvas.toDataURL('image/png');
link.click();
```

Captured at 2× scale for high resolution.

## 19.4 Server-Side PDF (Fallback)

`PlaywrightPdfService` renders the submitted `RenderedHtml` string using a headless Chromium browser. This approach preserves all CSS styling, custom fonts, and inline edits. It falls back to `QuestPdfService` (template-based rendering via QuestPDF's document model) if Playwright is not available.

## 19.5 Plain Text Export

The server reconstructs a plain-text CV from the `CVResponse` object with section headers, bullet points (using `•`), and divider lines. Useful for pasting into ATS systems that do not accept formatted files.

## 19.6 JSON Export

The `CVResponse` object is serialized with `WriteIndented=true` and returned as a downloadable `.json` file. This enables programmatic consumption of the CV data.

---

# 20. Frontend Architecture

CraftIQ uses vanilla JavaScript (ES6+) without any frontend framework. This decision keeps the dependency surface minimal and aligns with the educational context of the project.

### JavaScript Modules

| File | Purpose | Key Functions |
|------|---------|---------------|
| `cv-builder.js` | CV form management | Form collection, auto-save trigger, upload handling, section add/remove |
| `cv-templates.js` | Template system | 10 template generators, toolbar, quick edit, scale fonts, save, export |
| `cl-workspace.js` | Cover letter | 8 style prompts, generate, render, export PDF/DOCX |
| `career-intelligence.js` | All 8 CIC tools | Tool dispatch, modal system, result caching, staleness detection, report saving |
| `ai-studio.js` | AI Studio helpers | Bullet improver, project enhancement client-side logic |
| `site.js` | Global utilities | Navigation, toast notifications, common helpers |

### State Management Pattern

Each JavaScript module maintains its state in module-level variables. The `CVTemplates` page state is particularly complex, tracking:
- `currentCVData` — the active `CVResponse` object
- `currentTemplate` — the selected template ID
- `currentAccentColor` — the current accent color hex value
- `currentPhotoBase64` — the user's profile photo
- `currentRecordId` — the database ID of the current `CVRecord`
- `analysisCache` — `Map<toolName, resultObject>` for CIC result caching
- `documentHash` — a hash of the current document text for staleness detection

### CSS Architecture

All styles are in a single `site.css` file using CSS custom properties (`var(--color-*)`) for theming. Dark mode is applied to certain templates by overriding the custom properties at the template root element. The `.exporting` class on the preview element triggers CSS rules that hide interactive UI elements (toolbars, edit handles, tips panels) during export capture.

### Template Font Scaling

`scaleTemplateFonts(previewEl)` is called whenever the preview pane resizes. It reads the rendered width of the preview element and computes a scale factor relative to the template's design width (typically 794px for A4). All font-size properties within the preview are then multiplied by this factor to maintain proportional rendering at any viewport size.

---

# 21. Views and Pages

### Landing.cshtml

Public marketing page. Shows product features and a login call-to-action. Redirects authenticated users to the dashboard.

### Login.cshtml

Simple username/password form with CSRF token. Displays model validation errors on failure (without revealing whether the username or password was wrong).

### Index.cshtml (Dashboard)

Displays four stat cards populated from `DashboardViewModel`:
- Total Documents
- CVs Generated (status = "complete")
- Documents This Week (updated within 7 days)
- Analysis Reports

Recent Activity section lists the 5 most recently updated CVs with relative timestamps and direct reopen links.

### CVBuilder.cshtml

Hosts the multi-section CV form. Includes file upload UI for importing existing CVs. Loads `cv-builder.js`. Passes the `CVRecordId` from `ViewData["CVRecordId"]` to JavaScript for auto-save scoping.

### CVTemplates.cshtml

The most complex view in the application. Contains:
- Template selector panel
- Live preview pane
- Toolbar (template switcher, accent color, save, export)
- Quick-edit overlay system
- Cover letter workspace tab
- Embedded CIC panel (appears after template selection)

Loads `cv-templates.js`, `cl-workspace.js`, `career-intelligence.js`.

### CareerIntelligence.cshtml

The standalone CIC page. Contains the three-step wizard markup and the OCR review panel. The inline JavaScript handles step navigation, document type routing, and wizard state. It loads `career-intelligence.js` for the tool execution layer.

### History.cshtml

Two-panel view: CV Documents and Analysis Reports. Each CV entry shows title, status, relative timestamp, and a reopen link. Each report entry shows title, analysis type, overall score (with color coding), and timestamp. Delete buttons call the respective DELETE endpoints.

### Refactor.cshtml

Code editor page. Contains a `<textarea>` for code input and result panels for the refactored code, explanation list, and code smell cards. Smell cards are color-coded by severity (High=red, Medium=orange, Low=blue). The code smell display includes the category, affected line range, reason, impact, and fix suggestion.

---

# 22. Rate Limiting

The application uses ASP.NET Core's built-in rate limiting middleware with a fixed-window limiter policy named `"ai"`.

### Configuration

```csharp
builder.Services.AddRateLimiter(rl =>
{
    rl.AddFixedWindowLimiter("ai", opts =>
    {
        opts.PermitLimit = 20;
        opts.Window      = TimeSpan.FromMinutes(1);
        opts.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opts.QueueLimit  = 0;       // no queuing — reject immediately
    });
    rl.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
```

### Applied Endpoints

Every endpoint decorated with `[EnableRateLimiting("ai")]`:

| Controller | Endpoint |
|-----------|---------|
| CVApiController | `POST /api/cv/generate` |
| CVApiController | `POST /api/cv/cover-letter` |
| AIStudioController | `POST /api/ai-studio/analyze` |
| AIStudioController | `POST /api/ai-studio/analyze-text` |
| AIStudioController | `POST /api/ai-studio/analyze-cover-letter` |
| AIStudioController | `POST /api/ai-studio/improve-bullet` |
| AIStudioController | `POST /api/ai-studio/enhance-project` |
| AIStudioController | `POST /api/ai-studio/interview-questions` |
| AIStudioController | `POST /api/ai-studio/linkedin` |

### Behavior

- Requests beyond the limit receive HTTP 429 immediately (`QueueLimit=0` means no queuing)
- The rate limit window resets every 60 seconds
- The limit is 20 requests per client per window

---

# 23. Error Handling

### Controller-Level

All AI-calling controller actions wrap their service calls in try-catch blocks. On exception:
- The error is logged at `Error` level with the exception details and the user identity
- The controller returns `500 Internal Server Error` with a user-facing message (`{ "message": "Operation failed. Please try again." }`)
- The exception stack trace is never exposed to the client

### Service-Level

Services throw typed exceptions with meaningful messages:
- `ArgumentNullException` / `ArgumentException` for invalid inputs
- `InvalidOperationException` for AI response parsing failures (the message is "AI returned invalid data. Please try again.")
- Generic `Exception` for HTTP-level failures from the OpenRouter API

### JSON Parsing Resilience

The `GroqAnalysisService.ParseJson<T>` method strips markdown code fences before parsing, because some LLM responses wrap JSON in triple backtick blocks despite the `json_object` format instruction. The `FlexibleStringListConverter` handles string/array type mismatches gracefully.

### Global Exception Handler

In production (`!app.Environment.IsDevelopment()`), unhandled exceptions are routed to `/Home/Landing` via `UseExceptionHandler`. In development, the standard developer exception page is used.

### HSTS

In production, `UseHsts()` adds the `Strict-Transport-Security` header to all responses.

### Health Check

`GET /health` returns HTTP 200 with `{"status": "Healthy"}` when the database connection is reachable. This endpoint can be monitored by a load balancer or uptime service.

---

# 24. Testing

## 24.1 Test Project Structure

The `CraftIQ.Tests` project targets .NET 8 and references the main `CraftIQ` project directly, allowing tests to access internal service implementations.

**Dependencies:**
- `xunit` 2.9.2
- `xunit.runner.visualstudio` 2.8.2
- `Microsoft.EntityFrameworkCore.InMemory` 8.0.0
- `coverlet.collector` 6.0.2

## 24.2 AnalysisServiceTests (10 tests)

File: `AnalysisServiceTests.cs`  
Class: `LocalMetricTests`

Tests the four local scoring algorithms by invoking the private static methods via reflection. The `GroqAnalysisServiceTestHelper` internal class encapsulates the reflection calls.

### Test Cases

**CompletenessScore:**

| Test | Input | Expected |
|------|-------|---------|
| `CompletenessScore_AllSections_Returns100OrNear` | Full CV (all fields, certs, languages) | score ≥ 80 |
| `CompletenessScore_NoSummary_LowerThanFull` | CV without summary vs. full CV | full > no-summary |
| `CompletenessScore_EmptyCV_IsLow` | `new CVResponse()` | score < 30 |

**ProjectScore:**

| Test | Input | Expected |
|------|-------|---------|
| `ProjectScore_FivePlusBulletsPerJob_IsHigh` | 2 jobs, 5 bullets each | score ≥ 85 |
| `ProjectScore_OneBulletPerJob_IsLow` | 2 jobs, 1 bullet each | score < 50 |
| `ProjectScore_NoExperience_IsZero` | 0 experience entries | score == 0 |

**ReadabilityScore:**

| Test | Input | Expected |
|------|-------|---------|
| `ReadabilityScore_OptimalSummary_IsHigh` | 60-word summary, 12 skills | score ≥ 60 |
| `ReadabilityScore_NoSummary_IsLower` | CV with summary vs. without | with > without |

**SkillsScore (Theory test with 4 inline data cases):**

| Skills Count | Min Expected | Max Expected |
|-------------|-------------|-------------|
| 0 | 0 | 20 |
| 3 | 15 | 30 |
| 10 | 55 | 70 |
| 15 | 70 | 90 |

### Reflection-Based Testing Approach

Because the scoring methods are `private static`, the test helper uses reflection to access them:

```csharp
private static int CallScore(string methodName, CVResponse cv)
{
    var m = typeof(GroqAnalysisService).GetMethod(methodName,
        BindingFlags.NonPublic | BindingFlags.Static)!;
    var metrics = ComputeMetrics(cv);
    return (int)m.Invoke(null, new[] { metrics })!;
}
```

This approach tests the actual production code paths without changing access modifiers, ensuring that the scoring logic tested matches exactly what runs in production.

## 24.3 AnalysisReportServiceTests (6 tests)

File: `AnalysisReportServiceTests.cs`  
Class: `AnalysisReportServiceTests`

Uses an in-memory EF Core database (new GUID-named database per test class instance) to test the `AnalysisReportService` in full without a real SQLite file. Implements `IDisposable` to clean up the `DbContext` after each test class run.

### Test Cases

| Test | What it verifies |
|------|-----------------|
| `Save_NewReport_AssignsIdAndPersists` | New report gets a non-empty ID and is stored with correct `UserId` and `OverallScore` |
| `GetAllByUser_ReturnsOnlyUsersReports` | User A's query returns only their reports, not user B's |
| `Delete_ExistingReport_RemovesIt` | Deleting by correct `(id, userId)` returns `true` and the report is gone |
| `Delete_WrongUser_ReturnsFalse` | Deleting with attacker's `userId` returns `false`, report still exists |
| `CountByUser_ReturnsCorrectCount` | Count is scoped to user — other users' reports are not counted |
| `Save_ExistingId_UpdatesRecord` | Calling `SaveAsync` with an existing ID updates fields rather than inserting a duplicate |

The `Delete_WrongUser_ReturnsFalse` test is particularly important for security: it verifies that the ownership check in `DeleteAsync` (`WHERE Id = ? AND UserId = ?`) correctly prevents cross-user deletion.

## 24.4 Running Tests

```powershell
cd "c:\Users\HoPeLaD\OneDrive\Desktop\CraftIQ_for_Dep"
dotnet test CraftIQ.Tests/CraftIQ.Tests.csproj
```

All 16 tests should pass. Coverage collection is enabled via `coverlet.collector`.

---

# 25. Key Workflows End-to-End

## 25.1 Create a New CV

```
1. Authenticate → GET /Home/CVBuilder
2. [Optional] Upload existing CV → POST /api/cv/extract
   → Server extracts text (PDF/DOCX/image)
   → AI structures it into form JSON
   → Form fields pre-populated
3. Fill/edit CV form fields
   → Periodic POST /api/cv-storage/autosave (background)
4. Click "Generate CV" → POST /api/cv/generate
   → GroqCVService builds prompt + calls OpenRouter
   → Returns CVResponse
5. Browser redirects to GET /Home/CVTemplates
6. Select template + accent color
   → Template renders from CVResponse
7. [Optional] Inline edit any text in the preview
8. [Optional] Run CIC analysis (Section 25.2)
9. Click Save → POST /api/cv-storage/save
   → CVRecord stored with Status="complete"
10. Export → PDF (html2canvas+jsPDF) or DOCX (JSZip) or PNG
```

## 25.2 Run CV Analysis (Embedded CIC)

```
1. CV is open in CVTemplates page (CVResponse is in JS state)
2. Open CIC panel below the editor
3. [Optional] Paste job description
4. Click "Run ATS Analysis"
   → POST /api/ai-studio/analyze
   → GroqAnalysisService:
       a. ComputeMetrics(cv) → local metrics
       b. ComputeCompletenessScore, ProjectScore, ReadabilityScore, SkillsScore
       c. Build prompt with pre-computed values as constraints
       d. Call OpenRouter API
       e. Parse AnalyzeResponse
       f. Override local scores on response object
       g. Recompute OverallScore with formula
   → Returns AnalyzeResponse
5. Modal opens showing score gauges, improvements, keywords
6. [Optional] Click "Save Report" → POST /api/analysis-reports
```

## 25.3 Standalone CIC Upload Flow

```
1. Authenticated → GET /Home/CareerIntelligence
2. Step 1: Upload file → POST /api/cv/extract (PDF/DOCX/image)
   OR FileReader (TXT, client-side)
3. Extracted text appears in OCR Review Panel
   → User corrects any errors
   → Document type determined (CV or Cover Letter)
4. Step 2: [Optional] Paste job description
5. Step 3: Analysis cards displayed
6. Click any tool card → POST /api/ai-studio/analyze-text (for CV)
   OR POST /api/ai-studio/analyze-cover-letter (for cover letter)
7. Result shown in modal with scores, lists, recommendations
8. [Optional] Save report → POST /api/analysis-reports
9. Results cached → clicking the same tool again shows cached result
```

## 25.4 Generate Cover Letter

```
1. Open CVTemplates page with a loaded CV
2. Switch to "Cover Letter" tab
3. Select letter style (8 options)
4. Fill: company name, role, hiring manager, focus areas, length
5. [Optional] Paste job description
6. Click "Generate" → POST /api/cv/cover-letter
   → GroqCVService.BuildCoverLetterPrompt selects style-specific prompt pair
   → OpenRouter called at temperature=0.55
   → Returns CoverLetterResponse
7. Letter rendered in preview pane
8. Inline edit if needed
9. Export → POST /api/download/cover-letter/pdf or /cover-letter/docx
```

## 25.5 Code Refactor

```
1. Authenticated → GET /Home/Refactor
2. Paste C/C++ code into editor textarea
3. Click "Analyze & Refactor" → POST /api/refactor
   a. Controller validates C/C++ patterns
   b. GroqRefactorService:
       - Prepends line numbers to code
       - Builds detailed system prompt with 14 smell categories
       - Calls OpenRouter at temperature=0.1
       - Parses response into RefactorResponse
4. Three panels update:
   - Refactored Code: complete rewritten source
   - Explanation: list of changes made
   - Code Smells: cards per smell with severity, lines, reason, impact, fix
```

---

# 26. Deployment Notes

### Environment Variables for Production

The following `appsettings.json` values must be overridden in production via environment variables or a secrets manager:

| Key | Description |
|-----|-------------|
| `Groq__ApiKey` | OpenRouter API key |
| `Auth__Username` | Admin username |
| `Auth__Password` | Admin password |
| `ConnectionStrings__DefaultConnection` | Path to SQLite database file |

### Cookie Security

In `Program.cs`, `CookieSecurePolicy.SameAsRequest` is used for local development compatibility. In production, change to `CookieSecurePolicy.Always` and ensure HTTPS is enforced.

### Playwright Installation

If server-side HTML-to-PDF export via Playwright is required, run:
```bash
dotnet tool install --global Microsoft.Playwright.CLI
playwright install chromium
```

Without this step, the server falls back to `QuestPdfService` automatically.

### Health Check Endpoint

`GET /health` returns the database connection status. Wire this to an uptime monitor or load balancer health check.

### File Upload Directory

`wwwroot/uploads/` is the staging directory for transient uploads. Ensure the application process has write access to this directory. Files are processed in memory (via `MemoryStream`) and are not persisted to disk; the directory is only needed if the application uses file system storage in the future.

### Database Backup

`craftiq.db` is a single SQLite file. Back it up by copying the file when the application is not under heavy write load, or use the SQLite `.backup` command.

### Request Size Limits

- Global Kestrel limit: 15 MB (`MaxRequestBodySize`)
- File upload endpoints: 10 MB (`[RequestSizeLimit(10_485_760)]`)
- Save/AutoSave endpoints: 15 MB (to accommodate large base64 photos)

If deploying behind a reverse proxy (nginx, IIS), ensure the proxy's body size limit is set to at least 15 MB.

---

# 27. Extension and Contribution Guide

## 27.1 Adding a New CV Template

1. Open `wwwroot/js/cv-templates.js`
2. Add a new generator function following the pattern of existing templates:
   ```javascript
   function renderMyTemplate(cv, config) {
       const { accentColor, photoBase64 } = config;
       return `<div class="cv-preview my-template">...</div>`;
   }
   ```
3. Register the template in the `TEMPLATES` map:
   ```javascript
   const TEMPLATES = {
       ...,
       'mytemplate': { name: 'My Template', render: renderMyTemplate }
   };
   ```
4. Add the template option to the template switcher dropdown in `CVTemplates.cshtml`
5. No backend changes are required — templates are pure JavaScript functions

## 27.2 Adding a New CIC Analysis Tool

1. **Define the request/response models** in `Models/AIStudioModels.cs`
2. **Add the interface method** to `IGroqAnalysisService`
3. **Implement the method** in `GroqAnalysisService.cs`, following the `CallGroqAsync` + `ParseJson<T>` pattern
4. **Add the controller action** to `AIStudioController.cs` with `[EnableRateLimiting("ai")]`
5. **Add the tool card** to `career-intelligence.js`: add a case to the tool dispatch function and a render function for the result modal
6. **Optionally add a new `AnalysisType` value** to the string enum in `AnalysisReport` if the tool's results should be saveable

## 27.3 Adding a New Cover Letter Style

1. Open `Services/GroqCVService.cs`
2. Add a new `case` to the `BuildCoverLetterPrompt` switch statement with a unique template key string
3. Write the `system` and `user` prompt pair for the new style
4. Add the style key to the `CoverLetterRequest.Template` enum choices in the frontend (`cl-workspace.js`)

## 27.4 Swapping the AI Provider

The AI provider is abstracted behind the named HTTP client `"Groq"`. To switch providers:
1. Update `appsettings.json`: change `Groq.BaseUrl` and `Groq.Model`
2. Verify the new provider supports the OpenAI-compatible chat completions API format
3. If the new provider does not support `response_format: json_object`, update the `CallGroqAsync` helper to use prompt-level JSON enforcement only
4. For vision/OCR, update the `model` constant in `CVApiController.ExtractFromImageAsync`

## 27.5 Adding Database Migrations

The project currently uses `EnsureCreated()`. To migrate to EF Core migrations:
1. Remove the `EnsureCreated()` call in `Program.cs`
2. Add the initial migration: `dotnet ef migrations add InitialCreate`
3. Apply on startup: replace `EnsureCreated()` with `db.Database.Migrate()`
4. For all future schema changes, add migrations via `dotnet ef migrations add <Name>`

## 27.6 Adding a New User

CraftIQ is single-user by design. To support multiple users:
1. Add a `Users` table to `AppDbContext` with `Username` and `PasswordHash` columns
2. Replace the `IConfiguration`-based credential check in `HomeController.VerifyCredentials` with a database lookup
3. Store passwords as salted bcrypt hashes (use `BCrypt.Net-Next` package)
4. All existing data access is already user-scoped by `UserId` — no changes to the data layer are required

## 27.7 Adding Tests for New Features

New service tests should follow the `AnalysisReportServiceTests` pattern:
- Use `UseInMemoryDatabase(Guid.NewGuid().ToString())` to isolate each test class
- Implement `IDisposable` to dispose the `DbContext`
- Test both the happy path and the authorization/scoping path (e.g., wrong user cannot access another user's data)

New algorithm tests should follow the `LocalMetricTests` pattern:
- If the method is private, use the reflection helper pattern
- Use `[Theory]` with `[InlineData]` for range tests
- Document the expected score range clearly in the test name and assertion message

---

*End of CraftIQ Technical Documentation*
