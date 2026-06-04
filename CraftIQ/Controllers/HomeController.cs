using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CraftIQ.Models;
using CraftIQ.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CraftIQ.Controllers
{
    public class HomeController : Controller
    {
        private readonly IConfiguration _config;
        private readonly ILogger<HomeController> _logger;
        private readonly ICVStorageService _storage;
        private readonly IAnalysisReportService _reports;

        public HomeController(IConfiguration config, ILogger<HomeController> logger, ICVStorageService storage, IAnalysisReportService reports)
        {
            _config  = config;
            _logger  = logger;
            _storage = storage;
            _reports = reports;
        }

        [AllowAnonymous]
        public IActionResult Landing()
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction("Index");
            return View();
        }

        [Authorize]
        public async Task<IActionResult> Index()
        {
            var userId = User.FindFirst(ClaimTypes.Name)?.Value ?? "";
            var records = await _storage.GetAllByUserAsync(userId);

            var cutoff       = DateTime.UtcNow.AddDays(-7);
            var reportCount  = await _reports.CountByUserAsync(userId);
            var model = new DashboardViewModel
            {
                TotalDocuments    = records.Count,
                CVsGenerated      = records.Count(r => r.Status == "complete"),
                DocumentsThisWeek = records.Count(r => r.UpdatedAt >= cutoff),
                AnalysisReports   = reportCount,
                RecentActivity    = records
                    .OrderByDescending(r => r.UpdatedAt)
                    .Take(5)
                    .Select(r => new DashActivityItem
                    {
                        Id           = r.Id,
                        Title        = string.IsNullOrWhiteSpace(r.CVTitle) ? "Untitled CV" : r.CVTitle,
                        Status       = r.Status,
                        RelativeTime = RelativeTime(r.UpdatedAt),
                        ReopenUrl    = r.Status == "complete" && !string.IsNullOrEmpty(r.CVDataJson)
                                           ? $"/Home/CVTemplates?id={r.Id}"
                                           : $"/Home/CVBuilder?id={r.Id}"
                    })
                    .ToList()
            };

            return View(model);
        }
        [Authorize] public IActionResult Refactor() => View();

        [Authorize]
        public IActionResult CareerIntelligence() => View();

        [Authorize]
        public async Task<IActionResult> History()
        {
            var userId  = User.FindFirst(ClaimTypes.Name)?.Value ?? "";
            var records = await _storage.GetAllByUserAsync(userId);
            var rpts    = await _reports.GetAllByUserAsync(userId);

            var vm = new HistoryViewModel
            {
                Documents = records
                    .OrderByDescending(r => r.UpdatedAt)
                    .Select(r => new DashActivityItem
                    {
                        Id           = r.Id,
                        Title        = string.IsNullOrWhiteSpace(r.CVTitle) ? "Untitled CV" : r.CVTitle,
                        Status       = r.Status,
                        RelativeTime = RelativeTime(r.UpdatedAt),
                        ReopenUrl    = r.Status == "complete" && !string.IsNullOrEmpty(r.CVDataJson)
                                           ? $"/Home/CVTemplates?id={r.Id}"
                                           : $"/Home/CVBuilder?id={r.Id}"
                    })
                    .ToList(),

                Reports = rpts
                    .Select(r => new AnalysisReportItem
                    {
                        Id           = r.Id,
                        Title        = r.Title,
                        AnalysisType = r.AnalysisType,
                        DocumentType = r.DocumentType,
                        OverallScore = r.OverallScore,
                        RelativeTime = RelativeTime(r.CreatedAt)
                    })
                    .ToList()
            };

            return View(vm);
        }
        // Cover Letter is now part of Career Intelligence Center in CVTemplates
        [Authorize] public IActionResult CoverLetter() => RedirectToAction("CVBuilder");

        [Authorize]
        public IActionResult CVTemplates(string? id = null)
        {
            ViewData["CVRecordId"] = id ?? "";
            return View();
        }

        [Authorize]
        public IActionResult CVBuilder(string? id = null)
        {
            ViewData["CVRecordId"] = id ?? "";
            return View();
        }

        [AllowAnonymous]
        public IActionResult Login()
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction("Index");
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [AllowAnonymous]
        public async Task<IActionResult> Login(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                ModelState.AddModelError("", "Username and password are required.");
                return View();
            }

            if (!VerifyCredentials(username, password))
            {
                _logger.LogWarning("Failed login attempt for username: {Username} from IP: {IP}",
                    username, HttpContext.Connection.RemoteIpAddress);
                ModelState.AddModelError("", "Invalid credentials.");
                return View();
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.Name,  username),
                new Claim(ClaimTypes.Email, $"{username}@craftiq.local")
            };

            var identity  = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties { IsPersistent = true });

            _logger.LogInformation("Successful login for user: {Username}", username);
            return RedirectToAction("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Landing");
        }

        private static string RelativeTime(DateTime utc)
        {
            var diff = DateTime.UtcNow - utc;
            if (diff.TotalMinutes < 60)  return $"{Math.Max(1, (int)diff.TotalMinutes)}m ago";
            if (diff.TotalHours   < 24)  return $"{(int)diff.TotalHours}h ago";
            if (diff.TotalDays    < 2)   return "Yesterday";
            if (diff.TotalDays    < 7)   return $"{(int)diff.TotalDays}d ago";
            return utc.ToLocalTime().ToString("MMM d");
        }

        // ── Timing-safe credential verification ────────────────────────
        private bool VerifyCredentials(string username, string password)
        {
            var configUser = _config["Auth:Username"] ?? "";
            var configPass = _config["Auth:Password"] ?? "";

            // Hash both sides so FixedTimeEquals receives equal-length spans
            var hashUser   = SHA256.HashData(Encoding.UTF8.GetBytes(username));
            var hashPass   = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            var hashCUser  = SHA256.HashData(Encoding.UTF8.GetBytes(configUser));
            var hashCPass  = SHA256.HashData(Encoding.UTF8.GetBytes(configPass));

            return CryptographicOperations.FixedTimeEquals(hashUser, hashCUser)
                && CryptographicOperations.FixedTimeEquals(hashPass, hashCPass);
        }
    }
}
