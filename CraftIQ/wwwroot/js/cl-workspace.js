// ═══════════════════════════════════════════════════════════════
// CraftIQ — Cover Letter Workspace  (cl-workspace.js)
// Requires: _cv (global from cv-templates.js)
// ═══════════════════════════════════════════════════════════════

var _clTemplate     = "Classic";
var _clGeneratedData = null;
var _clInitialized  = false;

// ── Chip config ───────────────────────────────────────────────
// Tone: single-select  |  Type: single-select  |  Focus: multi  |  Length: single
var _clTone     = "Professional";
var _clType     = "Professional";
var _clFocus    = [];
var _clLength   = "Standard";

// ── Templates ────────────────────────────────────────────────
var CL_TEMPLATES = [
    { id: "Classic",    name: "Classic"    },
    { id: "Modern",     name: "Modern"     },
    { id: "Minimal",    name: "Minimal"    },
    { id: "Executive",  name: "Executive"  },
    { id: "Academic",   name: "Academic"   },
    { id: "Startup",    name: "Startup"    },
    { id: "Compact",    name: "Compact"    },
    { id: "Clean",      name: "Clean"      }
];

// ── Init ─────────────────────────────────────────────────────
function initCLWorkspace() {
    if (_clInitialized) return;
    _clInitialized = true;

    buildCLTemplateGrid();
    initCLChips();
    prefillCLFromCV();

    // Restore saved CL if any
    try {
        var saved = sessionStorage.getItem("craftiq_cl");
        if (saved) {
            var d = JSON.parse(saved);
            if (d && d.fullLetter) {
                _clGeneratedData = d;
                renderCLLetter(d);
                document.getElementById("clQuickEdit").style.display = "block";
            }
        }
    } catch(e) {}
}

// ── Pre-fill from CV ─────────────────────────────────────────
function prefillCLFromCV() {
    var cv = (typeof _cv !== "undefined") ? _cv : null;
    if (!cv) return;

    var roleEl = document.getElementById("cl-role");
    if (roleEl && !roleEl.value && cv.jobTitle) roleEl.value = cv.jobTitle;
}

// ── CL Template Grid ─────────────────────────────────────────
function buildCLTemplateGrid() {
    var grid = document.getElementById("clTemplateGrid");
    if (!grid) return;

    var html = "";
    CL_TEMPLATES.forEach(function(t) {
        html +=
            '<div class="cl-tmpl-item' + (t.id === _clTemplate ? " active" : "") + '"' +
            ' onclick="selectCLTemplate(\'' + t.id + '\')" title="' + t.name + '">' +
            '<div class="cl-tmpl-thumb">' + buildCLThumb(t.id) + '</div>' +
            '<div class="cl-tmpl-label">' + t.name + '</div>' +
            '</div>';
    });
    grid.innerHTML = html;
}

function buildCLThumb(id) {
    var thumbs = {
        Classic:
            '<div style="background:#fff;padding:4px 5px;height:100%;">' +
            '<div style="height:2px;background:#111;border-radius:1px;width:60%;margin-bottom:3px;"></div>' +
            '<div style="height:1px;background:#ccc;margin-bottom:3px;"></div>' +
            '<div style="height:1px;background:#eee;margin-bottom:1px;width:90%;"></div>' +
            '<div style="height:1px;background:#eee;width:80%;margin-bottom:1px;"></div>' +
            '<div style="height:1px;background:#eee;width:85%;"></div></div>',
        Modern:
            '<div style="background:#fff;height:100%;">' +
            '<div style="background:#1a1a2e;padding:5px;margin-bottom:3px;">' +
            '<div style="height:2px;background:#fff;width:55%;border-radius:1px;margin-bottom:2px;"></div>' +
            '<div style="height:1px;background:rgba(255,255,255,.4);width:38%;"></div></div>' +
            '<div style="padding:3px 5px;">' +
            '<div style="height:1px;background:#eee;margin-bottom:2px;width:90%;"></div>' +
            '<div style="height:1px;background:#eee;width:75%;"></div></div></div>',
        Minimal:
            '<div style="background:#fff;padding:5px;height:100%;">' +
            '<div style="height:2px;background:#111;width:45%;margin-bottom:5px;border-radius:1px;"></div>' +
            '<div style="height:1px;background:#eee;margin-bottom:2px;width:90%;"></div>' +
            '<div style="height:1px;background:#eee;width:80%;margin-bottom:2px;"></div>' +
            '<div style="height:1px;background:#eee;width:85%;"></div></div>',
        Executive:
            '<div style="background:#fff;padding:5px;height:100%;text-align:center;">' +
            '<div style="height:2px;background:#111;width:70%;margin:0 auto 2px;border-radius:1px;"></div>' +
            '<div style="height:1px;background:#aaa;width:50%;margin:0 auto 4px;"></div>' +
            '<div style="height:1px;background:#eee;margin-bottom:2px;width:90%;"></div>' +
            '<div style="height:1px;background:#eee;width:75%;"></div></div>',
        Academic:
            '<div style="background:#fff;padding:4px 5px;height:100%;">' +
            '<div style="height:1.5px;background:#444;width:100%;margin-bottom:3px;"></div>' +
            '<div style="height:2px;background:#111;width:65%;margin-bottom:2px;border-radius:1px;"></div>' +
            '<div style="height:1px;background:#ccc;width:45%;margin-bottom:4px;"></div>' +
            '<div style="height:1px;background:#eee;margin-bottom:1px;width:90%;"></div>' +
            '<div style="height:1.5px;background:#444;width:100%;margin-top:3px;"></div></div>',
        Startup:
            '<div style="background:#fff;display:flex;height:100%;">' +
            '<div style="width:4px;background:#5E6AD2;flex-shrink:0;"></div>' +
            '<div style="padding:4px 5px;flex:1;">' +
            '<div style="height:2px;background:#111;width:55%;margin-bottom:3px;border-radius:1px;"></div>' +
            '<div style="height:1px;background:#eee;margin-bottom:2px;width:90%;"></div>' +
            '<div style="height:1px;background:#eee;width:75%;"></div></div></div>',
        Compact:
            '<div style="background:#fff;padding:4px 5px;height:100%;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">' +
            '<div style="height:2px;background:#111;width:42%;border-radius:1px;"></div>' +
            '<div style="height:1px;background:#aaa;width:30%;align-self:center;"></div></div>' +
            '<div style="height:1px;background:#eee;margin-bottom:1px;width:90%;"></div>' +
            '<div style="height:1px;background:#eee;width:80%;margin-bottom:1px;"></div>' +
            '<div style="height:1px;background:#eee;width:85%;"></div></div>',
        Clean:
            '<div style="background:#f9f9f9;padding:4px 5px;height:100%;">' +
            '<div style="background:#fff;padding:3px;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.08);">' +
            '<div style="height:2px;background:#111;width:55%;margin-bottom:2px;border-radius:1px;"></div>' +
            '<div style="height:1px;background:#eee;margin-bottom:1px;width:90%;"></div>' +
            '<div style="height:1px;background:#eee;width:75%;"></div></div></div>'
    };
    return thumbs[id] || thumbs.Classic;
}

function selectCLTemplate(id) {
    _clTemplate = id;
    document.querySelectorAll(".cl-tmpl-item").forEach(function(el) {
        el.classList.toggle("active", el.onclick && el.onclick.toString().indexOf("'" + id + "'") >= 0);
    });
    // Simpler active toggle
    document.querySelectorAll("#clTemplateGrid .cl-tmpl-item").forEach(function(el) {
        el.classList.remove("active");
    });
    event.currentTarget.classList.add("active");

    if (_clGeneratedData) renderCLLetter(_clGeneratedData);
}

// ── Chip initialisation ───────────────────────────────────────
function initCLChips() {
    // Tone: single-select
    initSingleChips("clToneChips", function(val) { _clTone = val; });
    // Type: single-select
    initSingleChips("clTypeChips", function(val) { _clType = val; });
    // Focus: multi-select
    initMultiChips("clFocusChips", _clFocus);
    // Length: single-select
    initSingleChips("clLengthChips", function(val) { _clLength = val; });
}

function initSingleChips(containerId, onSelect) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll(".cl-chip").forEach(function(btn) {
        btn.addEventListener("click", function() {
            container.querySelectorAll(".cl-chip").forEach(function(b) { b.classList.remove("active"); });
            btn.classList.add("active");
            onSelect(btn.dataset.val);
        });
    });
}

function initMultiChips(containerId, targetArray) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll(".cl-chip").forEach(function(btn) {
        btn.addEventListener("click", function() {
            btn.classList.toggle("active");
            var val = btn.dataset.val;
            var idx = targetArray.indexOf(val);
            if (btn.classList.contains("active")) {
                if (idx === -1) targetArray.push(val);
            } else {
                if (idx >= 0) targetArray.splice(idx, 1);
            }
        });
    });
}

// ── Generate ─────────────────────────────────────────────────
function generateCL() {
    var cv = (typeof _cv !== "undefined") ? _cv : null;
    if (!cv) {
        alert("CV data not found. Please go back to CV Builder and generate your CV first.");
        return;
    }

    var company = (document.getElementById("cl-company") || {}).value || "";
    if (!company.trim()) { alert("Please enter a company name."); return; }

    var role    = (document.getElementById("cl-role")    || {}).value || cv.jobTitle || "";
    var manager = (document.getElementById("cl-manager") || {}).value || "";
    var jd      = (document.getElementById("cl-jd")      || {}).value || "";
    var why     = (document.getElementById("cl-why")     || {}).value || "";
    var note    = (document.getElementById("cl-note")    || {}).value || "";

    var expText = (cv.experience || []).map(function(e) {
        return (e.heading || "") + ": " + (e.points || []).join(". ");
    }).join("\n");

    var eduText = (cv.education || []).map(function(e) {
        return (e.heading || "") + (e.points && e.points.length ? ": " + e.points.join(". ") : "");
    }).join("\n");

    // Show loading in preview
    var previewEl = document.getElementById("clPreviewArea");
    var placeholder = document.getElementById("clPlaceholder");
    if (placeholder) placeholder.style.display = "none";
    if (previewEl) {
        previewEl.contentEditable = "false";
        previewEl.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;min-height:500px;gap:12px;flex-direction:column;">' +
            '<div style="font-size:.82rem;color:var(--muted);font-family:var(--mono);">Writing your cover letter&#8230;</div>' +
            '</div>';
    }

    var btn = document.getElementById("clGenerateBtn");
    if (btn) btn.disabled = true;

    fetch("/api/cv/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fullName:       cv.fullName    || "",
            jobTitle:       role,
            companyName:    company,
            hiringManager:  manager,
            experience:     expText,
            skills:         (cv.skills || []).join(", "),
            whyCompany:     why,
            tone:           _clTone,
            template:       _clType,
            keySkills:      (cv.skills || []).slice(0, 6).join(", "),
            personalNote:   note,
            jobDescription: jd,
            focusAreas:     _clFocus.join(", "),
            length:         _clLength,
            summary:        cv.professionalSummary || "",
            education:      eduText
        })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(r) {
        if (btn) btn.disabled = false;
        if (!r.ok) throw new Error(r.data.message || "Generation failed.");
        _clGeneratedData = r.data;
        renderCLLetter(r.data);
        try { sessionStorage.setItem("craftiq_cl", JSON.stringify(r.data)); } catch(e) {}
        document.getElementById("clQuickEdit").style.display = "block";
    })
    .catch(function(e) {
        if (btn) btn.disabled = false;
        if (previewEl) {
            previewEl.contentEditable = "true";
            previewEl.innerHTML =
                '<div style="padding:20px;color:#dc2626;font-size:.84rem;">&#9888; ' + e.message + '</div>';
        }
    });
}

// ── Render letter with template styling ───────────────────────
function renderCLLetter(data) {
    var previewEl = document.getElementById("clPreviewArea");
    if (!previewEl) return;

    var cv = (typeof _cv !== "undefined") ? _cv : null;
    var letter = (data.fullLetter || "").trim();

    var html = buildCLTemplateHTML(_clTemplate, letter, cv, data.tips || []);
    previewEl.innerHTML = html;
    previewEl.contentEditable = "true";

    // Hide the "fill the form" hint in the action bar once generated
    var formHint = document.querySelector("#clActionBar span");
    if (formHint) formHint.style.display = "none";
    var formSep = document.querySelector("#clActionBar .cl-bar-sep");
    if (formSep) formSep.style.display = "none";

    // Show edit hint banner (auto-hides after first click)
    showCLEditHint();
}

function buildCLTemplateHTML(template, letter, cv, tips) {
    var name     = cv ? (cv.fullName    || "") : "";
    var email    = cv ? (cv.email       || "") : "";
    var phone    = cv ? (cv.phone       || "") : "";
    var location = cv ? (cv.location    || "") : "";
    var title    = cv ? (cv.jobTitle    || "") : "";

    var today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Escape letter text for HTML (preserve line breaks)
    var letterHtml = letter
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

    var tipsHtml = "";
    if (tips && tips.length) {
        tipsHtml =
            '<div class="cl-ai-tips" style="margin-top:24px;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;' +
            'border-radius:8px;font-family:\'Inter\',sans-serif;font-size:.76rem;color:#92400e;">' +
            '<div style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;font-size:.65rem;">Suggestions</div>';
        tips.forEach(function(t) {
            tipsHtml += '<div style="margin-bottom:3px;">&#8594; ' + t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + '</div>';
        });
        tipsHtml += '</div>';
    }

    switch (template) {
        case "Modern":
            return buildModernCL(name, title, email, phone, location, today, letterHtml, tipsHtml);
        case "Minimal":
            return buildMinimalCL(name, email, phone, location, today, letterHtml, tipsHtml);
        case "Executive":
            return buildExecutiveCL(name, title, email, phone, location, today, letterHtml, tipsHtml);
        case "Academic":
            return buildAcademicCL(name, title, email, phone, location, today, letterHtml, tipsHtml);
        case "Startup":
            return buildStartupCL(name, title, email, phone, location, today, letterHtml, tipsHtml);
        case "Compact":
            return buildCompactCL(name, email, phone, location, today, letterHtml, tipsHtml);
        case "Clean":
            return buildCleanCL(name, email, phone, today, letterHtml, tipsHtml);
        default: // Classic
            return buildClassicCL(name, title, email, phone, location, today, letterHtml, tipsHtml);
    }
}

function buildClassicCL(name, title, email, phone, location, today, body, tips) {
    return '<div style="font-family:\'Georgia\',serif;">' +
        '<div style="font-size:18pt;font-weight:700;color:#111;margin-bottom:2px;">' + esc(name) + '</div>' +
        (title ? '<div style="font-size:9.5pt;color:#555;margin-bottom:8px;">' + esc(title) + '</div>' : '') +
        '<div style="font-size:8.5pt;color:#666;margin-bottom:16px;">' + [email,phone,location].filter(Boolean).map(esc).join("&nbsp;&nbsp;·&nbsp;&nbsp;") + '</div>' +
        '<div style="height:1px;background:#ccc;margin-bottom:20px;"></div>' +
        '<div style="font-size:8.5pt;color:#555;margin-bottom:20px;">' + esc(today) + '</div>' +
        '<div style="font-size:10.5pt;line-height:1.85;color:#111;white-space:pre-line;">' + body + '</div>' +
        tips + '</div>';
}

function buildModernCL(name, title, email, phone, location, today, body, tips) {
    return '<div>' +
        '<div style="background:#1a1a2e;padding:24px 28px;margin:-52px -60px 32px;color:#fff;">' +
        '<div style="font-size:18pt;font-weight:700;margin-bottom:3px;letter-spacing:-.02em;">' + esc(name) + '</div>' +
        (title ? '<div style="font-size:9pt;color:rgba(255,255,255,.6);margin-bottom:8px;">' + esc(title) + '</div>' : '') +
        '<div style="font-size:8pt;color:rgba(255,255,255,.5);">' + [email,phone,location].filter(Boolean).map(esc).join("  ·  ") + '</div>' +
        '</div>' +
        '<div style="font-size:8.5pt;color:#555;margin-bottom:20px;">' + esc(today) + '</div>' +
        '<div style="font-size:10.5pt;line-height:1.85;color:#111;">' + body + '</div>' +
        tips + '</div>';
}

function buildMinimalCL(name, email, phone, location, today, body, tips) {
    return '<div style="font-family:\'Inter\',sans-serif;">' +
        '<div style="font-size:16pt;font-weight:700;color:#111;letter-spacing:-.03em;margin-bottom:8px;">' + esc(name) + '</div>' +
        '<div style="font-size:8pt;color:#888;margin-bottom:28px;">' + [email,phone,location].filter(Boolean).map(esc).join("  ·  ") + '</div>' +
        '<div style="font-size:8.5pt;color:#aaa;margin-bottom:24px;font-family:var(--mono);">' + esc(today) + '</div>' +
        '<div style="font-size:10.5pt;line-height:1.9;color:#222;">' + body + '</div>' +
        tips + '</div>';
}

function buildExecutiveCL(name, title, email, phone, location, today, body, tips) {
    return '<div style="font-family:\'Georgia\',serif;text-align:center;">' +
        '<div style="font-size:20pt;font-weight:700;color:#111;letter-spacing:.02em;margin-bottom:4px;">' + esc(name) + '</div>' +
        (title ? '<div style="font-size:9.5pt;color:#666;margin-bottom:6px;letter-spacing:.1em;text-transform:uppercase;font-size:7.5pt;">' + esc(title) + '</div>' : '') +
        '<div style="height:1px;background:#111;width:80%;margin:8px auto;"></div>' +
        '<div style="font-size:8pt;color:#888;margin-bottom:28px;">' + [email,phone,location].filter(Boolean).map(esc).join("  ·  ") + '</div>' +
        '<div style="text-align:left;font-size:8.5pt;color:#555;margin-bottom:20px;">' + esc(today) + '</div>' +
        '<div style="text-align:left;font-size:10.5pt;line-height:1.85;color:#111;">' + body + '</div>' +
        tips + '</div>';
}

function buildAcademicCL(name, title, email, phone, location, today, body, tips) {
    return '<div style="font-family:\'Times New Roman\',serif;">' +
        '<div style="border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:14px;">' +
        '<div style="font-size:16pt;font-weight:700;color:#111;">' + esc(name) + '</div>' +
        (title ? '<div style="font-size:9pt;color:#555;margin-top:2px;">' + esc(title) + '</div>' : '') +
        '</div>' +
        '<div style="font-size:8.5pt;color:#666;margin-bottom:20px;display:flex;justify-content:space-between;">' +
        '<span>' + [email,phone,location].filter(Boolean).map(esc).join("  ·  ") + '</span>' +
        '<span>' + esc(today) + '</span>' +
        '</div>' +
        '<div style="font-size:10.5pt;line-height:1.9;color:#111;">' + body + '</div>' +
        '<div style="border-top:1px solid #ccc;margin-top:20px;"></div>' +
        tips + '</div>';
}

function buildStartupCL(name, title, email, phone, location, today, body, tips) {
    return '<div style="font-family:\'Inter\',sans-serif;display:flex;gap:20px;min-height:400px;">' +
        '<div style="width:4px;background:#5E6AD2;flex-shrink:0;border-radius:2px;"></div>' +
        '<div style="flex:1;">' +
        '<div style="font-size:16pt;font-weight:800;color:#0F172A;letter-spacing:-.03em;margin-bottom:3px;">' + esc(name) + '</div>' +
        (title ? '<div style="font-size:9pt;color:#5E6AD2;font-weight:600;margin-bottom:6px;">' + esc(title) + '</div>' : '') +
        '<div style="font-size:7.5pt;color:#94A3B8;margin-bottom:24px;font-family:var(--mono);">' + [email,phone,location].filter(Boolean).map(esc).join("  ·  ") + '</div>' +
        '<div style="font-size:8pt;color:#94A3B8;margin-bottom:18px;font-family:var(--mono);">' + esc(today) + '</div>' +
        '<div style="font-size:10.5pt;line-height:1.85;color:#1E293B;">' + body + '</div>' +
        tips + '</div></div>';
}

function buildCompactCL(name, email, phone, location, today, body, tips) {
    return '<div style="font-family:\'Inter\',sans-serif;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px;">' +
        '<div style="font-size:15pt;font-weight:700;color:#111;letter-spacing:-.02em;">' + esc(name) + '</div>' +
        '<div style="font-size:7.5pt;color:#aaa;text-align:right;font-family:var(--mono);">' + esc(today) + '</div>' +
        '</div>' +
        '<div style="font-size:7.5pt;color:#888;margin-bottom:18px;">' + [email,phone,location].filter(Boolean).map(esc).join("  ·  ") + '</div>' +
        '<div style="height:1px;background:#eee;margin-bottom:18px;"></div>' +
        '<div style="font-size:10pt;line-height:1.8;color:#111;">' + body + '</div>' +
        tips + '</div>';
}

function buildCleanCL(name, email, phone, today, body, tips) {
    return '<div style="font-family:\'Inter\',sans-serif;">' +
        '<div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;margin-bottom:24px;">' +
        '<div style="font-size:15pt;font-weight:700;color:#111827;letter-spacing:-.02em;margin-bottom:4px;">' + esc(name) + '</div>' +
        '<div style="font-size:8pt;color:#6B7280;">' + [email,phone].filter(Boolean).map(esc).join("  ·  ") + '</div>' +
        '</div>' +
        '<div style="font-size:8.5pt;color:#9CA3AF;margin-bottom:20px;font-family:var(--mono);">' + esc(today) + '</div>' +
        '<div style="font-size:10.5pt;line-height:1.85;color:#1F2937;">' + body + '</div>' +
        tips + '</div>';
}

// ── Edit hint ────────────────────────────────────────────────
function showCLEditHint() {
    var wrap = document.getElementById("clPreviewWrap");
    if (!wrap) return;

    // Remove any existing hint
    var existing = document.getElementById("clEditHint");
    if (existing) existing.remove();

    var hint = document.createElement("div");
    hint.id = "clEditHint";
    hint.style.cssText =
        "position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid var(--border);" +
        "padding:.55rem 1rem;display:flex;align-items:center;justify-content:space-between;" +
        "font-size:.76rem;color:var(--muted);font-family:var(--sans);";
    hint.innerHTML =
        '<span>' +
        '<strong style="color:var(--dark);">Click anywhere in the letter to edit.</strong> ' +
        'Use the toolbar above for fonts, alignment, and formatting.' +
        '</span>' +
        '<button onclick="document.getElementById(\'clEditHint\').remove();document.getElementById(\'clPreviewArea\').focus();" ' +
        'style="border:none;background:none;color:var(--muted);cursor:pointer;font-size:.8rem;padding:2px 6px;" ' +
        'title="Dismiss">&#10005;</button>';

    // Insert before the preview paper
    var previewEl = document.getElementById("clPreviewArea");
    if (previewEl && previewEl.parentNode) {
        previewEl.parentNode.insertBefore(hint, previewEl);
    }

    // Auto-dismiss on first click in the preview
    var previewEl2 = document.getElementById("clPreviewArea");
    if (previewEl2) {
        previewEl2.addEventListener("click", function removeHint() {
            var h = document.getElementById("clEditHint");
            if (h) h.remove();
            previewEl2.removeEventListener("click", removeHint);
        });
    }
}

function esc(t) {
    return String(t || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Save / Export ─────────────────────────────────────────────
function saveCL() {
    try {
        var previewEl = document.getElementById("clPreviewArea");
        if (previewEl) {
            var data = _clGeneratedData || {};
            data._editedHtml = previewEl.innerHTML;
            sessionStorage.setItem("craftiq_cl", JSON.stringify(data));
            var btn = document.getElementById("clSaveBtn");
            if (btn) { btn.textContent = "✓ Saved"; setTimeout(function() { btn.textContent = "💾 Save"; }, 2000); }
        }
    } catch(e) {}
}

function clCopyText() {
    var previewEl = document.getElementById("clPreviewArea");
    if (!previewEl) return;
    var text = previewEl.innerText || previewEl.textContent || "";
    navigator.clipboard.writeText(text).then(function() {
        var btn = document.getElementById("clCopyBtn");
        if (btn) { btn.textContent = "✓ Copied!"; setTimeout(function() { btn.innerHTML = "📋 Copy Text"; }, 2000); }
    });
}

function dlCLPdf() {
    if (!_clGeneratedData) { alert("Generate a cover letter first."); return; }
    var cv   = (typeof _cv !== "undefined") ? _cv : {};
    var name = (cv.fullName || "Cover_Letter").replace(/\s+/g, "_");
    if (typeof exportAsPdf === "function")
        exportAsPdf("clPreviewArea", name + "_Cover_Letter.pdf", "clPdfBtn");
}

function buildCLDocx(letterText, cv) {
    function xe(s) {
        return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function sz(pt) { return String(Math.round(pt * 2)); }
    function rpr(o) {
        var x = "";
        if (o.b)     x += "<w:b/><w:bCs/>";
        if (o.i)     x += "<w:i/><w:iCs/>";
        if (o.size)  x += '<w:sz w:val="' + sz(o.size) + '"/><w:szCs w:val="' + sz(o.size) + '"/>';
        if (o.color) x += '<w:color w:val="' + o.color + '"/>';
        return "<w:rPr>" + x + "</w:rPr>";
    }
    function r(text, o) {
        if (text == null) return "";
        return "<w:r>" + rpr(o || {}) + '<w:t xml:space="preserve">' + xe(text) + "</w:t></w:r>";
    }
    function p(runs, sa, jc) {
        return "<w:p><w:pPr>" +
            '<w:spacing w:after="' + (sa || 120) + '"/>' +
            (jc ? '<w:jc w:val="' + jc + '"/>' : '') +
            "</w:pPr>" + runs + "</w:p>";
    }
    function hr() {
        return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="CCCCCC"/>' +
            '</w:pBdr><w:spacing w:after="200" w:before="80"/></w:pPr></w:p>';
    }

    var body = "";

    // Header: name + contact
    if (cv && cv.fullName)
        body += p(r(cv.fullName, { b: true, size: 18 }), 60, "center");
    var contacts = cv ? [cv.email, cv.phone, cv.location].filter(Boolean).join("  ·  ") : "";
    if (contacts)
        body += p(r(contacts, { size: 9, color: "888888" }), 200, "center");

    body += hr();

    // Letter body — split on newlines, preserve paragraph breaks
    var lines = (letterText || "").split("\n");
    lines.forEach(function(line) {
        var trimmed = line.trim();
        body += p(r(trimmed, { size: 11 }), trimmed === "" ? 60 : 160);
    });

    body += '<w:sectPr>' +
        '<w:pgSz w:w="11906" w:h="16838"/>' +
        '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>' +
        '</w:sectPr>';

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '<w:body>' + body + '</w:body></w:document>';
}

function dlCLDocx() {
    if (!_clGeneratedData) { alert("Generate a cover letter first."); return; }
    if (typeof JSZip === "undefined") { alert("Export library not loaded — please refresh the page."); return; }

    var cv = (typeof _cv !== "undefined") ? _cv : {};

    // Always read the live (possibly edited) letter text from the preview
    var previewEl = document.getElementById("clPreviewArea");
    var letterText = previewEl
        ? (previewEl.innerText || previewEl.textContent || "").trim()
        : (_clGeneratedData.fullLetter || "").trim();

    var docXml = buildCLDocx(letterText, cv);

    var contentTypes =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>';

    var rels =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>';

    var wordRels =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

    var zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", rels);
    zip.file("word/document.xml", docXml);
    zip.file("word/_rels/document.xml.rels", wordRels);

    var name = (cv.fullName || "Cover_Letter").replace(/\s+/g, "_");
    zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }).then(function(blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name + "_Cover_Letter.docx";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }).catch(function(e) {
        console.error("CL DOCX error:", e);
        alert("DOCX export failed: " + e.message);
    });
}

function dlCLPng() {
    if (!_clGeneratedData) { alert("Generate a cover letter first."); return; }
    var cv   = (typeof _cv !== "undefined") ? _cv : {};
    var name = (cv.fullName || "Cover_Letter").replace(/\s+/g, "_");
    if (typeof exportAsPng === "function")
        exportAsPng("clPreviewArea", name + "_Cover_Letter.png", "clPngBtn");
}
