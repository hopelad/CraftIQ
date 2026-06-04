using CraftIQ.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CraftIQ.Services
{
    public class QuestPdfService : IPdfService
    {
        public QuestPdfService()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GenerateCVPdf(
            CVResponse cv,
            string templateId,
            string? photoBase64 = null,
            string accentColor = "#1a1a2e")
        {
            bool showPhoto = !string.IsNullOrWhiteSpace(photoBase64);
            bool sidebar    = templateId is "nexus" or "onyx" or "lumis";
            bool boldHdr    = templateId is "atlas" or "volta" or "coda";
            bool centered   = templateId is "soleil";
            bool borderLeft = templateId is "forge";
            bool strip      = templateId is "prism";
            bool minimal    = templateId is "vega";

            byte[]? photoBytes = null;
            if (showPhoto)
            {
                try
                {
                    var b64 = photoBase64!.Contains(",")
                        ? photoBase64.Split(',')[1] : photoBase64;
                    photoBytes = Convert.FromBase64String(b64);
                }
                catch { showPhoto = false; }
            }

            string color = accentColor;

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(0);
                    page.DefaultTextStyle(x =>
                        x.FontFamily(minimal ? "Georgia" : "Arial").FontSize(10));

                    if (sidebar)
                    {
                        page.Content().Row(row =>
                        {
                            // Sidebar column
                            row.ConstantItem(190).Background(color).Padding(16)
                                .Column(col =>
                                {
                                    if (showPhoto && photoBytes != null)
                                    {
                                        col.Item().AlignCenter()
                                            .Width(80).Height(80)
                                            .Image(photoBytes).FitArea();
                                        col.Item().Height(10);
                                    }

                                    col.Item().Text(cv.FullName)
                                        .FontSize(13).Bold()
                                        .FontColor("#ffffff").LineHeight(1.2f);
                                    col.Item().PaddingBottom(10)
                                        .Text(cv.JobTitle)
                                        .FontSize(9).FontColor("#ccddee");

                                    SidebarTitle(col, "CONTACT");
                                    if (!string.IsNullOrEmpty(cv.Email))
                                        col.Item().PaddingTop(2).Text(cv.Email)
                                            .FontSize(8).FontColor("#ccddee");
                                    if (!string.IsNullOrEmpty(cv.Phone))
                                        col.Item().PaddingTop(2).Text(cv.Phone)
                                            .FontSize(8).FontColor("#ccddee");
                                    if (!string.IsNullOrEmpty(cv.Location))
                                        col.Item().PaddingTop(2).Text(cv.Location)
                                            .FontSize(8).FontColor("#ccddee");

                                    if (cv.Skills.Any())
                                    {
                                        SidebarTitle(col, "SKILLS");
                                        foreach (var s in cv.Skills)
                                            col.Item().PaddingTop(2)
                                                .Text("• " + s)
                                                .FontSize(8.5f).FontColor("#ccddee");
                                    }
                                    if (cv.Languages.Any())
                                    {
                                        SidebarTitle(col, "LANGUAGES");
                                        foreach (var l in cv.Languages)
                                            col.Item().PaddingTop(2)
                                                .Text("• " + l)
                                                .FontSize(8.5f).FontColor("#ccddee");
                                    }
                                    if (cv.Certifications.Any())
                                    {
                                        SidebarTitle(col, "CERTIFICATIONS");
                                        foreach (var c in cv.Certifications)
                                            col.Item().PaddingTop(2)
                                                .Text("• " + c)
                                                .FontSize(8.5f).FontColor("#ccddee");
                                    }
                                });

                            // Main column
                            row.RelativeItem().Padding(20).Column(main =>
                            {
                                BuildMain(main, cv, color, false);
                            });
                        });
                    }
                    else
                    {
                        page.Content().Column(col =>
                        {
                            if (boldHdr)
                            {
                                col.Item().Background(color)
                                    .Padding(20).Row(hdr =>
                                    {
                                        hdr.RelativeItem().Column(h =>
                                        {
                                            h.Item().Text(cv.FullName)
                                                .FontSize(26).Bold()
                                                .FontColor("#ffffff");
                                            h.Item().Text(cv.JobTitle)
                                                .FontSize(12)
                                                .FontColor("#dddddd");
                                            h.Item().PaddingTop(5)
                                                .Text(ContactLine(cv))
                                                .FontSize(8.5f)
                                                .FontColor("#aaaaaa");
                                        });
                                        if (showPhoto && photoBytes != null)
                                            hdr.ConstantItem(75).Height(75)
                                                .Image(photoBytes).FitArea();
                                    });
                            }
                            else if (centered)
                            {
                                col.Item().PaddingTop(20).PaddingHorizontal(20)
                                    .Column(h =>
                                    {
                                        if (showPhoto && photoBytes != null)
                                            h.Item().AlignCenter()
                                                .Width(80).Height(80)
                                                .Image(photoBytes).FitArea();
                                        h.Item().AlignCenter().PaddingTop(8)
                                            .Text(cv.FullName)
                                            .FontSize(24).Bold().FontColor(color);
                                        h.Item().AlignCenter()
                                            .Text(cv.JobTitle)
                                            .FontSize(12).Italic().FontColor("#666666");
                                        h.Item().AlignCenter().PaddingTop(4)
                                            .Text(ContactLine(cv))
                                            .FontSize(8.5f).FontColor("#888888");
                                    });
                                col.Item().PaddingHorizontal(20).PaddingTop(8)
                                    .LineHorizontal(2).LineColor(color);
                            }
                            else if (strip)
                            {
                                col.Item().Height(6).Background(color);
                                col.Item().PaddingTop(16).PaddingHorizontal(20)
                                    .Row(hdr =>
                                    {
                                        hdr.RelativeItem().Column(h =>
                                        {
                                            h.Item().Text(cv.FullName)
                                                .FontSize(24).Bold().FontColor("#111111");
                                            h.Item().Text(cv.JobTitle)
                                                .FontSize(12).FontColor(color).Bold();
                                            h.Item().PaddingTop(4)
                                                .Text(ContactLine(cv))
                                                .FontSize(8.5f).FontColor("#888888");
                                        });
                                        if (showPhoto && photoBytes != null)
                                            hdr.ConstantItem(72).Height(72)
                                                .Image(photoBytes).FitArea();
                                    });
                                col.Item().PaddingHorizontal(20).PaddingTop(8)
                                    .LineHorizontal(1).LineColor("#e0e0e0");
                            }
                            else if (borderLeft)
                            {
                                col.Item().PaddingTop(20).PaddingHorizontal(20)
                                    .Row(hdr =>
                                    {
                                        hdr.ConstantItem(5).Background(color);
                                        hdr.RelativeItem().PaddingLeft(12).Column(h =>
                                        {
                                            h.Item().Text(cv.FullName)
                                                .FontSize(24).Bold().FontColor(color);
                                            h.Item().Text(cv.JobTitle)
                                                .FontSize(12).FontColor("#555555");
                                            h.Item().PaddingTop(4)
                                                .Text(ContactLine(cv))
                                                .FontSize(8.5f).FontColor("#888888");
                                        });
                                    });
                                col.Item().PaddingHorizontal(20).PaddingTop(8)
                                    .LineHorizontal(1).LineColor("#e0e0e0");
                            }
                            else
                            {
                                // Standard header
                                col.Item().PaddingTop(18).PaddingHorizontal(20)
                                    .Row(hdr =>
                                    {
                                        hdr.RelativeItem().Column(h =>
                                        {
                                            h.Item().Text(cv.FullName)
                                                .FontSize(24).Bold().FontColor(color);
                                            h.Item().Text(cv.JobTitle)
                                                .FontSize(12).FontColor("#555555");
                                            h.Item().PaddingTop(4)
                                                .Text(ContactLine(cv))
                                                .FontSize(8.5f).FontColor("#777777");
                                        });
                                        if (showPhoto && photoBytes != null)
                                            hdr.ConstantItem(75).Height(75)
                                                .Image(photoBytes).FitArea();
                                    });
                                col.Item().PaddingHorizontal(20).PaddingTop(8)
                                    .LineHorizontal(2).LineColor(color);
                            }

                            col.Item().Padding(20).PaddingTop(boldHdr ? 10 : 0)
                                .Column(main =>
                                {
                                    BuildMain(main, cv, color, true);
                                });
                        });
                    }
                });
            }).GeneratePdf();
        }

        public byte[] GenerateCoverLetterPdf(CoverLetterResponse letter, string templateId, string accentColor = "#1a1a2e")
        {
            var color = string.IsNullOrWhiteSpace(accentColor) ? "#1a1a2e" : accentColor;

            bool hasBand   = templateId is "cl-prestige" or "cl-corporate" or "cl-bold" or "cl-creative";
            bool hasSidebar = templateId == "cl-sidebar";
            bool hasLeftBar = templateId is "cl-modern" or "cl-tech";
            bool isElegant  = templateId is "cl-elegant" or "cl-classic";
            string font     = isElegant ? "Georgia" : "Arial";

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(0);
                    page.DefaultTextStyle(x => x.FontFamily(font).FontSize(11));

                    if (hasSidebar)
                    {
                        page.Content().Row(row =>
                        {
                            row.ConstantItem(165).Background(color).Padding(22).Column(sb =>
                            {
                                if (!string.IsNullOrWhiteSpace(letter.Subject))
                                {
                                    sb.Item().Text("Re:")
                                        .FontSize(8).Bold().FontColor("#ffffff80");
                                    sb.Item().PaddingTop(4).Text(letter.Subject)
                                        .FontSize(10).Bold().FontColor("#ffffff").LineHeight(1.4f);
                                    sb.Item().Height(14);
                                }
                            });
                            row.RelativeItem().Padding(28).Column(main =>
                            {
                                CLBodyContent(main, letter);
                            });
                        });
                    }
                    else if (hasLeftBar)
                    {
                        page.Content().Row(row =>
                        {
                            row.ConstantItem(5).Background(color);
                            row.RelativeItem().Padding(30).Column(body =>
                            {
                                if (!string.IsNullOrWhiteSpace(letter.Subject))
                                {
                                    body.Item()
                                        .BorderBottom(1.5f).BorderColor(color)
                                        .PaddingBottom(8)
                                        .Text(letter.Subject)
                                        .FontSize(13).Bold().FontColor(color);
                                    body.Item().Height(14);
                                }
                                CLBodyContent(body, letter);
                            });
                        });
                    }
                    else if (hasBand)
                    {
                        page.Content().Column(col =>
                        {
                            col.Item().Background(color).Padding(26).Column(hdr =>
                            {
                                if (!string.IsNullOrWhiteSpace(letter.Subject))
                                    hdr.Item().Text(letter.Subject)
                                        .FontSize(15).Bold().FontColor("#ffffff");
                            });
                            col.Item().PaddingHorizontal(30).PaddingTop(22).PaddingBottom(30).Column(body =>
                            {
                                CLBodyContent(body, letter);
                            });
                        });
                    }
                    else
                    {
                        // Minimal / Classic / Elegant / default — clean top stripe
                        page.Content().Column(col =>
                        {
                            col.Item().Height(5).Background(color);
                            col.Item().Padding(30).Column(body =>
                            {
                                if (!string.IsNullOrWhiteSpace(letter.Subject))
                                {
                                    body.Item().Text(letter.Subject)
                                        .FontSize(13).Bold().FontColor(color);
                                    body.Item().PaddingTop(6).LineHorizontal(1).LineColor(color);
                                    body.Item().Height(16);
                                }
                                CLBodyContent(body, letter);
                            });
                        });
                    }
                });
            }).GeneratePdf();
        }

        private void CLBodyContent(ColumnDescriptor col, CoverLetterResponse letter)
        {
            if (!string.IsNullOrWhiteSpace(letter.Opening))
                col.Item().PaddingBottom(12).Text(letter.Opening).FontSize(11).LineHeight(1.7f);
            if (!string.IsNullOrWhiteSpace(letter.Body))
                col.Item().PaddingBottom(12).Text(letter.Body).FontSize(11).LineHeight(1.7f);
            if (!string.IsNullOrWhiteSpace(letter.Closing))
                col.Item().Text(letter.Closing).FontSize(11).LineHeight(1.7f);
        }

        // ── Helpers ─────────────────────────────────────────────

        private void BuildMain(
            ColumnDescriptor col,
            CVResponse cv,
            string color,
            bool showSkillsLangs)
        {
            if (!string.IsNullOrWhiteSpace(cv.ProfessionalSummary))
            {
                SectionTitle(col, "PROFESSIONAL SUMMARY", color);
                col.Item().PaddingBottom(10)
                    .Text(cv.ProfessionalSummary)
                    .FontSize(9.5f).LineHeight(1.6f).FontColor("#333333");
            }

            if (cv.Experience.Any())
            {
                SectionTitle(col, "EXPERIENCE", color);
                foreach (var exp in cv.Experience)
                {
                    col.Item().PaddingTop(5)
                        .Text(exp.Heading)
                        .FontSize(10).Bold().FontColor("#111111");
                    foreach (var pt in exp.Points)
                        col.Item().PaddingLeft(10)
                            .Text("• " + pt)
                            .FontSize(9).LineHeight(1.45f).FontColor("#444444");
                    col.Item().Height(4);
                }
            }

            if (cv.Education.Any())
            {
                SectionTitle(col, "EDUCATION", color);
                foreach (var edu in cv.Education)
                {
                    col.Item().PaddingTop(4)
                        .Text(edu.Heading)
                        .FontSize(10).Bold().FontColor("#111111");
                    foreach (var pt in edu.Points)
                        col.Item().PaddingLeft(10)
                            .Text("• " + pt)
                            .FontSize(9).FontColor("#444444");
                }
                col.Item().Height(6);
            }

            if (showSkillsLangs && cv.Skills.Any())
            {
                SectionTitle(col, "SKILLS", color);
                col.Item().PaddingBottom(8)
                    .Text(string.Join("  ·  ", cv.Skills))
                    .FontSize(9).FontColor("#333333");
            }

            if (cv.Certifications.Any())
            {
                SectionTitle(col, "CERTIFICATIONS", color);
                foreach (var c in cv.Certifications)
                    col.Item().Text("• " + c)
                        .FontSize(9).FontColor("#333333");
                col.Item().Height(6);
            }

            if (showSkillsLangs && cv.Languages.Any())
            {
                SectionTitle(col, "LANGUAGES", color);
                col.Item().Text(string.Join("  ·  ", cv.Languages))
                    .FontSize(9).FontColor("#333333");
            }
        }

        private void SectionTitle(ColumnDescriptor col, string title, string color)
        {
            col.Item().BorderBottom(1.5f).BorderColor(color).PaddingBottom(3)
                .Text(title)
                .FontSize(8.5f).Bold().FontColor(color).LetterSpacing(1.5f);
            col.Item().Height(3);
        }

        private void SidebarTitle(ColumnDescriptor col, string title)
        {
            col.Item().PaddingTop(12).PaddingBottom(3)
                .BorderBottom(0.5f).BorderColor("#ffffff40")
                .Text(title)
                .FontSize(7.5f).Bold()
                .FontColor("#ffffff60").LetterSpacing(1.5f);
        }

        private string ContactLine(CVResponse cv)
        {
            return string.Join("   ·   ",
                new[] { cv.Email, cv.Phone, cv.Location, cv.LinkedIn }
                    .Where(x => !string.IsNullOrWhiteSpace(x)));
        }
    }
}