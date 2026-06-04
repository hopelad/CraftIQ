using CraftIQ.Data;
using CraftIQ.Models;
using CraftIQ.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

// ── SQLite Database ──
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Groq HTTP Client ──
builder.Services.Configure<GroqOptions>(
    builder.Configuration.GetSection("Groq"));

builder.Services.AddTransient<GroqAuthHandler>();
builder.Services.AddTransient<GroqRetryHandler>();
builder.Services.AddHttpClient("Groq", (sp, client) =>
{
    var opts = builder.Configuration.GetSection("Groq").Get<GroqOptions>()!;
    client.BaseAddress = new Uri(opts.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(90);
}).AddHttpMessageHandler<GroqRetryHandler>()
  .AddHttpMessageHandler<GroqAuthHandler>();

// ── Services ──
builder.Services.AddScoped<IRefactorService, GroqRefactorService>();
builder.Services.AddScoped<ICVService, GroqCVService>();
builder.Services.AddScoped<IPdfService, QuestPdfService>();
builder.Services.AddScoped<IDocxService, DocxService>();
builder.Services.AddScoped<ICVStorageService, CVStorageService>();
builder.Services.AddScoped<IHtmlPdfService, PlaywrightPdfService>();
builder.Services.AddScoped<IGroqAnalysisService, GroqAnalysisService>();
builder.Services.AddScoped<IAnalysisReportService, AnalysisReportService>();

// ── Auth ──
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath    = "/Home/Login";
        options.LogoutPath   = "/Home/Logout";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.Cookie.HttpOnly     = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // Always in prod; SameAsRequest works locally too
        options.Cookie.SameSite     = SameSiteMode.Strict;
    });

builder.Services.AddAuthorization();

// ── Session ──
builder.Services.AddSession(options =>
{
    options.IdleTimeout        = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly    = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite     = SameSiteMode.Strict;
});

// ── Rate limiting — AI endpoints ──
// 20 requests per user per minute on AI-heavy endpoints
builder.Services.AddRateLimiter(rl =>
{
    rl.AddFixedWindowLimiter("ai", opts =>
    {
        opts.PermitLimit      = 20;
        opts.Window           = TimeSpan.FromMinutes(1);
        opts.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opts.QueueLimit       = 0;
    });
    rl.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ── Global request size limit (15 MB) ──
builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(opts =>
    opts.Limits.MaxRequestBodySize = 15_728_640);

// ── Health checks ──
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();

var app = builder.Build();

// ── Auto-create database on startup ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Landing");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseRateLimiter();
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Landing}/{id?}");

app.Run();
