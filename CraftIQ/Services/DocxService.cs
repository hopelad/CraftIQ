using CraftIQ.Models;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace CraftIQ.Services
{
    public class DocxService : IDocxService
    {
        public byte[] GenerateCVDocx(
            CVResponse cv,
            string templateId,
            string? photoBase64 = null,
            string accentColor = "#1a1a2e")
        {
            var color = (accentColor ?? "#1a1a2e").TrimStart('#');
            if (color.Length != 6) color = "1a1a2e";

            using var ms = new MemoryStream();

            using (var doc = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document))
            {
                var main = doc.AddMainDocumentPart();
                main.Document = new Document(new Body());
                var body = main.Document.Body!;

                bool isSidebar = templateId is "nexus" or "onyx" or "lumis";

                if (isSidebar)
                {
                    BuildSidebarDocx(body, cv, color);
                    // SectionProperties last — zero left margin so sidebar bleeds to edge
                    body.AppendChild(new SectionProperties(
                        new PageMargin { Top = 0, Bottom = 0, Left = 0, Right = 720 }));
                }
                else
                {
                    BuildStandardDocx(body, cv, color, templateId);
                    body.AppendChild(new SectionProperties(
                        new PageMargin { Top = 720, Bottom = 720, Left = 1080, Right = 1080 }));
                }

                main.Document.Save();
            }

            return ms.ToArray();
        }

        // ── Sidebar (Lumis / Nexus / Onyx) ─────────────────────────────
        private void BuildSidebarDocx(Body body, CVResponse cv, string accentHex)
        {
            const string white  = "FFFFFF";
            const string muted  = "BBBBBB";

            var table = new Table();

            var tblPr = new TableProperties(
                new TableWidth { Width = "11880", Type = TableWidthUnitValues.Dxa },
                new TableBorders(
                    new TopBorder               { Val = BorderValues.None },
                    new BottomBorder            { Val = BorderValues.None },
                    new LeftBorder              { Val = BorderValues.None },
                    new RightBorder             { Val = BorderValues.None },
                    new InsideHorizontalBorder  { Val = BorderValues.None },
                    new InsideVerticalBorder    { Val = BorderValues.None }
                )
            );
            table.AppendChild(tblPr);

            table.AppendChild(new TableGrid(
                new GridColumn { Width = "3200" },
                new GridColumn { Width = "8680" }
            ));

            var row = new TableRow();

            // ── Left sidebar cell ────────────────────────────────────────
            var leftPr = new TableCellProperties(
                new TableCellWidth { Width = "3200", Type = TableWidthUnitValues.Dxa },
                new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = accentHex },
                new TableCellVerticalAlignment { Val = TableVerticalAlignmentValues.Top }
            );
            var leftMargin = new TableCellMargin();
            leftMargin.Append(new TopMargin    { Width = "640", Type = TableWidthUnitValues.Dxa });
            leftMargin.Append(new BottomMargin { Width = "640", Type = TableWidthUnitValues.Dxa });
            leftMargin.Append(new LeftMargin   { Width = "320", Type = TableWidthUnitValues.Dxa });
            leftMargin.Append(new RightMargin  { Width = "320", Type = TableWidthUnitValues.Dxa });
            leftPr.Append(leftMargin);

            var left = new TableCell();
            left.AppendChild(leftPr);

            // Name + job title
            left.AppendChild(SidePara(cv.FullName, 17, true, white, "120"));
            if (!string.IsNullOrWhiteSpace(cv.JobTitle))
                left.AppendChild(SidePara(cv.JobTitle.ToUpper(), 8, false, muted, "80"));

            left.AppendChild(SideSpacer("200"));

            // Contact
            left.AppendChild(SideHead("CONTACT"));
            if (!string.IsNullOrWhiteSpace(cv.Email))    left.AppendChild(SidePara(cv.Email,    9, false, white, "60"));
            if (!string.IsNullOrWhiteSpace(cv.Phone))    left.AppendChild(SidePara(cv.Phone,    9, false, white, "60"));
            if (!string.IsNullOrWhiteSpace(cv.Location)) left.AppendChild(SidePara(cv.Location, 9, false, white, "60"));
            if (!string.IsNullOrWhiteSpace(cv.LinkedIn)) left.AppendChild(SidePara(cv.LinkedIn, 9, false, white, "60"));

            // Skills
            if (cv.SkillGroups.Any() || cv.Skills.Any())
            {
                left.AppendChild(SideSpacer("200"));
                left.AppendChild(SideHead("SKILLS"));
                if (cv.SkillGroups.Any())
                {
                    foreach (var sg in cv.SkillGroups)
                    {
                        left.AppendChild(SidePara(sg.Category.ToUpper(), 8, true, muted, "40"));
                        left.AppendChild(SidePara(string.Join(", ", sg.Skills), 9, false, white, "80"));
                    }
                }
                else
                {
                    foreach (var sk in cv.Skills)
                        left.AppendChild(SidePara("•  " + sk, 9, false, white, "60"));
                }
            }

            // Languages
            if (cv.Languages.Any())
            {
                left.AppendChild(SideSpacer("160"));
                left.AppendChild(SideHead("LANGUAGES"));
                foreach (var lang in cv.Languages)
                    left.AppendChild(SidePara("•  " + lang, 9, false, white, "60"));
            }

            // Certifications
            if (cv.Certifications.Any())
            {
                left.AppendChild(SideSpacer("160"));
                left.AppendChild(SideHead("CERTIFICATIONS"));
                foreach (var cert in cv.Certifications)
                    left.AppendChild(SidePara("•  " + cert, 9, false, white, "60"));
            }

            row.AppendChild(left);

            // ── Right content cell ───────────────────────────────────────
            var rightPr = new TableCellProperties(
                new TableCellWidth { Width = "8680", Type = TableWidthUnitValues.Dxa },
                new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = "FFFFFF" },
                new TableCellVerticalAlignment { Val = TableVerticalAlignmentValues.Top }
            );
            var rightMargin = new TableCellMargin();
            rightMargin.Append(new TopMargin    { Width = "640", Type = TableWidthUnitValues.Dxa });
            rightMargin.Append(new BottomMargin { Width = "640", Type = TableWidthUnitValues.Dxa });
            rightMargin.Append(new LeftMargin   { Width = "480", Type = TableWidthUnitValues.Dxa });
            rightMargin.Append(new RightMargin  { Width = "480", Type = TableWidthUnitValues.Dxa });
            rightPr.Append(rightMargin);

            var right = new TableCell();
            right.AppendChild(rightPr);

            if (!string.IsNullOrWhiteSpace(cv.ProfessionalSummary))
            {
                right.AppendChild(SectionHead("PROFILE", accentHex));
                right.AppendChild(Para(cv.ProfessionalSummary, 10, false, "333333"));
                right.AppendChild(Spacer());
            }

            if (cv.Experience.Any())
            {
                right.AppendChild(SectionHead("EXPERIENCE", accentHex));
                foreach (var exp in cv.Experience)
                {
                    right.AppendChild(Para(exp.Heading, 11, true, "111111"));
                    foreach (var pt in exp.Points)
                        right.AppendChild(Bullet(pt, "444444"));
                }
                right.AppendChild(Spacer());
            }

            if (cv.Education.Any())
            {
                right.AppendChild(SectionHead("EDUCATION", accentHex));
                foreach (var edu in cv.Education)
                {
                    right.AppendChild(Para(edu.Heading, 11, true, "111111"));
                    foreach (var pt in edu.Points)
                        right.AppendChild(Bullet(pt, "444444"));
                }
            }

            row.AppendChild(right);
            table.AppendChild(row);
            body.AppendChild(table);
        }

        // ── Standard single-column layouts ──────────────────────────────
        private void BuildStandardDocx(Body body, CVResponse cv, string color, string templateId)
        {
            bool centered = templateId == "soleil";
            var align = centered ? JustificationValues.Center : JustificationValues.Left;

            body.AppendChild(ParaAligned(cv.FullName, 32, true, color, align));
            if (!string.IsNullOrWhiteSpace(cv.JobTitle))
                body.AppendChild(ParaAligned(cv.JobTitle, 14, false, "555555", align));

            var contact = new[] { cv.Email, cv.Phone, cv.Location, cv.LinkedIn }
                .Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
            if (contact.Any())
                body.AppendChild(ParaAligned(string.Join("   ·   ", contact), 9, false, "888888", align));

            body.AppendChild(Divider(color));

            if (!string.IsNullOrWhiteSpace(cv.ProfessionalSummary))
            {
                body.AppendChild(SectionHead("PROFESSIONAL SUMMARY", color));
                body.AppendChild(Para(cv.ProfessionalSummary, 10, false, "333333"));
                body.AppendChild(Spacer());
            }

            if (cv.Experience.Any())
            {
                body.AppendChild(SectionHead("EXPERIENCE", color));
                foreach (var exp in cv.Experience)
                {
                    body.AppendChild(Para(exp.Heading, 11, true, "111111"));
                    foreach (var pt in exp.Points)
                        body.AppendChild(Bullet(pt, "444444"));
                }
                body.AppendChild(Spacer());
            }

            if (cv.Education.Any())
            {
                body.AppendChild(SectionHead("EDUCATION", color));
                foreach (var edu in cv.Education)
                {
                    body.AppendChild(Para(edu.Heading, 11, true, "111111"));
                    foreach (var pt in edu.Points)
                        body.AppendChild(Bullet(pt, "444444"));
                }
                body.AppendChild(Spacer());
            }

            if (cv.Skills.Any())
            {
                body.AppendChild(SectionHead("SKILLS", color));
                body.AppendChild(Para(string.Join("  ·  ", cv.Skills), 10, false, "333333"));
                body.AppendChild(Spacer());
            }

            if (cv.Certifications.Any())
            {
                body.AppendChild(SectionHead("CERTIFICATIONS", color));
                foreach (var c in cv.Certifications)
                    body.AppendChild(Bullet(c, "333333"));
                body.AppendChild(Spacer());
            }

            if (cv.Languages.Any())
            {
                body.AppendChild(SectionHead("LANGUAGES", color));
                body.AppendChild(Para(string.Join("  ·  ", cv.Languages), 10, false, "333333"));
            }
        }

        // ── Sidebar paragraph helpers ────────────────────────────────────

        private Paragraph SidePara(string text, int fontSize, bool bold, string hexColor, string spaceAfter)
        {
            var p = new Paragraph();
            p.AppendChild(new ParagraphProperties
            {
                SpacingBetweenLines = new SpacingBetweenLines { After = spaceAfter }
            });
            var run = new Run();
            var rp  = new RunProperties();
            rp.AppendChild(new FontSize { Val = (fontSize * 2).ToString() });
            rp.AppendChild(new RunFonts { Ascii = "Arial", HighAnsi = "Arial" });
            rp.AppendChild(new Color    { Val = hexColor });
            if (bold) rp.AppendChild(new Bold());
            run.AppendChild(rp);
            run.AppendChild(new Text(text) { Space = SpaceProcessingModeValues.Preserve });
            p.AppendChild(run);
            return p;
        }

        private Paragraph SideHead(string title)
        {
            var p = new Paragraph();
            p.AppendChild(new ParagraphProperties
            {
                SpacingBetweenLines = new SpacingBetweenLines { Before = "200", After = "80" }
            });
            var run = new Run();
            var rp  = new RunProperties();
            rp.AppendChild(new Bold());
            rp.AppendChild(new FontSize { Val = "16" });
            rp.AppendChild(new Color    { Val = "FFFFFF" });
            rp.AppendChild(new RunFonts { Ascii = "Arial", HighAnsi = "Arial" });
            run.AppendChild(rp);
            run.AppendChild(new Text(title) { Space = SpaceProcessingModeValues.Preserve });
            p.AppendChild(run);
            return p;
        }

        private Paragraph SideSpacer(string space) =>
            new Paragraph(new ParagraphProperties
            {
                SpacingBetweenLines = new SpacingBetweenLines { After = space }
            });

        // ── Shared helpers ───────────────────────────────────────────────

        private Paragraph Para(string text, int fontSize, bool bold, string hexColor)
        {
            var p  = new Paragraph();
            var pp = new ParagraphProperties { SpacingBetweenLines = new SpacingBetweenLines { After = "80" } };
            p.AppendChild(pp);
            var run = new Run();
            var rp  = new RunProperties();
            rp.AppendChild(new FontSize { Val = (fontSize * 2).ToString() });
            rp.AppendChild(new RunFonts { Ascii = "Arial", HighAnsi = "Arial" });
            rp.AppendChild(new Color    { Val = hexColor });
            if (bold) rp.AppendChild(new Bold());
            run.AppendChild(rp);
            run.AppendChild(new Text(text) { Space = SpaceProcessingModeValues.Preserve });
            p.AppendChild(run);
            return p;
        }

        private Paragraph ParaAligned(string text, int fontSize, bool bold, string hexColor, JustificationValues alignment)
        {
            var p  = new Paragraph();
            var pp = new ParagraphProperties
            {
                SpacingBetweenLines = new SpacingBetweenLines { After = "80" },
                Justification = new Justification { Val = alignment }
            };
            p.AppendChild(pp);
            var run = new Run();
            var rp  = new RunProperties();
            rp.AppendChild(new FontSize { Val = (fontSize * 2).ToString() });
            rp.AppendChild(new RunFonts { Ascii = "Arial", HighAnsi = "Arial" });
            rp.AppendChild(new Color    { Val = hexColor });
            if (bold) rp.AppendChild(new Bold());
            run.AppendChild(rp);
            run.AppendChild(new Text(text) { Space = SpaceProcessingModeValues.Preserve });
            p.AppendChild(run);
            return p;
        }

        private Paragraph Bullet(string text, string color) =>
            Para("    •   " + text, 10, false, color);

        private Paragraph SectionHead(string title, string color)
        {
            var p  = new Paragraph();
            var pp = new ParagraphProperties
            {
                SpacingBetweenLines = new SpacingBetweenLines { Before = "160", After = "60" }
            };
            pp.AppendChild(new ParagraphBorders
            {
                BottomBorder = new BottomBorder { Val = BorderValues.Single, Size = 6, Space = 1, Color = color }
            });
            p.AppendChild(pp);
            var run = new Run();
            var rp  = new RunProperties();
            rp.AppendChild(new Bold());
            rp.AppendChild(new FontSize { Val = "17" });
            rp.AppendChild(new Color    { Val = color });
            rp.AppendChild(new RunFonts { Ascii = "Arial", HighAnsi = "Arial" });
            run.AppendChild(rp);
            run.AppendChild(new Text(title) { Space = SpaceProcessingModeValues.Preserve });
            p.AppendChild(run);
            return p;
        }

        private Paragraph Divider(string color)
        {
            var p  = new Paragraph();
            var pp = new ParagraphProperties
            {
                SpacingBetweenLines = new SpacingBetweenLines { Before = "60", After = "120" }
            };
            pp.AppendChild(new ParagraphBorders
            {
                BottomBorder = new BottomBorder { Val = BorderValues.Single, Size = 12, Space = 1, Color = color }
            });
            p.AppendChild(pp);
            return p;
        }

        private Paragraph Spacer() =>
            new Paragraph(new ParagraphProperties
            {
                SpacingBetweenLines = new SpacingBetweenLines { After = "80" }
            });

        // ── Cover Letter DOCX ────────────────────────────────────────────

        public byte[] GenerateCoverLetterDocx(
            CoverLetterResponse letter,
            string templateId,
            string accentColor = "#1a1a2e")
        {
            var color = (accentColor ?? "#1a1a2e").TrimStart('#');
            if (color.Length != 6) color = "1a1a2e";

            bool largeSub = templateId is "cl-bold" or "cl-corporate" or "cl-prestige";
            int subSize   = largeSub ? 14 : 12;

            using var ms = new MemoryStream();

            using (var doc = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document))
            {
                var main = doc.AddMainDocumentPart();
                main.Document = new Document(new Body());
                var body = main.Document.Body!;

                if (!string.IsNullOrWhiteSpace(letter.Subject))
                {
                    body.AppendChild(Para(letter.Subject, subSize, true, color));
                    body.AppendChild(Divider(color));
                }
                if (!string.IsNullOrWhiteSpace(letter.Opening))
                    body.AppendChild(Para(letter.Opening, 11, false, "333333"));
                body.AppendChild(Spacer());
                if (!string.IsNullOrWhiteSpace(letter.Body))
                    body.AppendChild(Para(letter.Body, 11, false, "333333"));
                body.AppendChild(Spacer());
                if (!string.IsNullOrWhiteSpace(letter.Closing))
                    body.AppendChild(Para(letter.Closing, 11, false, "333333"));

                body.AppendChild(new SectionProperties(
                    new PageMargin { Top = 1440, Bottom = 1440, Left = 1440, Right = 1440 }));

                main.Document.Save();
            }

            return ms.ToArray();
        }
    }
}
