// ═══════════════════════════════════════════════════════════════
// CraftIQ — Career Intelligence Center  (career-intelligence.js)
// Requires: _cv (global from cv-templates.js)
// ═══════════════════════════════════════════════════════════════

// ── Core state ────────────────────────────────────────────────
var _cicOpen             = false;
var _cicAnalysisCache    = null;
var _cicUploadCache      = null;
var _cicResults          = {};
var _cicResultVersions   = {};
var _cicContentVersion   = 0;
var _cicSource           = "current";
var _cicUploadedText     = null;
var _cicUploadedFormData = null;

// ── Job Description state ─────────────────────────────────────
var _cicJobTitle       = "";
var _cicJobDescription = "";
var _cicJdConfirmed    = false;

// ── Saved report IDs (per card key, for current session) ──────
var _cicSavedReports = {};

var _cicBtnMap = {
    ats:      "cic-btn-ats",
    job:      "cic-btn-job",
    health:   "cic-btn-health",
    recruiter:"cic-btn-rec",
    interview:"cic-btn-iq",
    linkedin: "cic-btn-li",
    clreview: "cic-btn-cl-review",
    optimizer:"cic-btn-opt"
};

var _cicTitleMap = {
    ats:      "ATS Analysis",
    job:      "Job Match Analysis",
    health:   "CV Health Report",
    recruiter:"Recruiter Review",
    interview:"Interview Preparation",
    linkedin: "LinkedIn Generator",
    clreview: "Cover Letter Review",
    optimizer:"Resume Optimizer"
};

// ── Helpers ───────────────────────────────────────────────────
function cicEsc(t) {
    return String(t || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function cicCv()        { return (typeof _cv !== "undefined" && _cv) ? _cv : null; }
function cicScoreClass(n) { if (n >= 80) return "good"; if (n >= 60) return "warn"; return "bad"; }

function cicSetCardScore(elId, score) {
    var el = document.getElementById(elId);
    if (!el || score == null) return;
    el.textContent = score + "%";
    el.className = "cic-card-score " + cicScoreClass(score);
}
function cicSetHeaderScore(pillId, valId, score) {
    var val = document.getElementById(valId);
    if (!val) return;
    if (score == null) { val.textContent = "—"; return; }
    val.textContent = score + "%";
    var pill = document.getElementById(pillId);
    if (pill) pill.className = "cic-score-pill " + cicScoreClass(score);
}
function cicMarkStep(id) {
    var el = document.getElementById(id);
    if (el) el.className = "ciq-step done";
}

// ── Modal ─────────────────────────────────────────────────────
function cicOpenModal(title, html) {
    var modal   = document.getElementById("cicModal");
    var titleEl = document.getElementById("cicModalTitle");
    var bodyEl  = document.getElementById("cicModalBody");
    if (!modal) return;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl)  bodyEl.innerHTML = html;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}
function cicCloseModal(evt) {
    if (evt && evt.target.id !== "cicModal") return;
    cicForceClose();
}
function cicForceClose() {
    var modal = document.getElementById("cicModal");
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
}
function cicLoadingHtml() {
    return '<div style="padding:36px 20px;text-align:center;font-size:.82rem;color:var(--muted);font-family:var(--mono);">' +
        'Analyzing with AI&#8230;<br><span style="font-size:.72rem;opacity:.6;margin-top:5px;display:block;">This may take a few seconds</span></div>';
}
function cicErrorHtml(msg) {
    return '<div style="padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:.82rem;color:#dc2626;">&#9888; ' + cicEsc(msg) + '</div>';
}

// ── Result management ─────────────────────────────────────────
function cicStoreResult(cardKey, html, overallScore) {
    // Append the Save Report footer to the stored HTML
    var docType = _cicSource === "uploaded" ? "Uploaded" : "CV";
    var fullHtml = html + cicSaveReportHtml(cardKey, overallScore || 0, docType);
    _cicResults[cardKey] = fullHtml;
    _cicResultVersions[cardKey] = _cicContentVersion;
    _cicSavedReports[cardKey] = null; // reset saved status for this result

    var btnId = _cicBtnMap[cardKey];
    if (!btnId) return;
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.textContent = "View";
    btn.disabled = false;
    btn.style.background = "";
    (function(k) { btn.onclick = function() { cicViewResult(k); }; })(cardKey);
}

function cicViewResult(cardKey) {
    var html = _cicResults[cardKey];
    if (!html) return;
    var isStale = _cicResultVersions[cardKey] !== _cicContentVersion;
    var prefix = "";
    if (isStale) {
        prefix = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;' +
            'padding:10px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:7px;">' +
            '<span style="font-size:.8rem;color:#92400e;flex:1;">&#9888; Document was edited after this analysis. Results may be outdated.</span>' +
            '<button onclick="cicRun(\'' + cardKey + '\');cicForceClose();" ' +
            'style="font-size:.74rem;padding:.28rem .75rem;background:#d97706;color:#fff;border:none;' +
            'border-radius:5px;cursor:pointer;white-space:nowrap;font-family:var(--sans);">Re-analyze</button></div>';
    }
    var sourceNote = _cicSource === "uploaded" ?
        '<div style="margin-bottom:10px;font-size:.7rem;color:#1d4ed8;font-family:var(--mono);">&#128228; Analyzing uploaded document</div>' : "";
    cicOpenModal(_cicTitleMap[cardKey] || cardKey, sourceNote + prefix + html);
}

function cicRestoreBtn(cardKey, label) {
    var btnId = _cicBtnMap[cardKey];
    if (!btnId) return;
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = false;
    btn.textContent = label;
    btn.style.background = "";
    (function(k) { btn.onclick = function() { cicRun(k); }; })(cardKey);
}

// ── Job Description panel ─────────────────────────────────────
function cicToggleJdPanel() {
    var body  = document.getElementById("cicJdBody");
    var arrow = document.getElementById("cicJdArrow");
    if (!body) return;
    var open = body.classList.toggle("open");
    if (arrow) arrow.textContent = open ? "▲" : "▼";
}

function cicOnJdChange() {
    var titleEl = document.getElementById("cicJdTitle");
    var textEl  = document.getElementById("cicJdText");
    _cicJobTitle       = titleEl ? titleEl.value.trim() : "";
    _cicJobDescription = textEl  ? textEl.value.trim()  : "";
    _cicJdConfirmed    = false;
    var confirmed = document.getElementById("cicJdConfirmed");
    if (confirmed) confirmed.style.display = "none";
}

function cicJdConfirm() {
    var titleEl = document.getElementById("cicJdTitle");
    var textEl  = document.getElementById("cicJdText");
    _cicJobTitle       = titleEl ? titleEl.value.trim() : "";
    _cicJobDescription = textEl  ? textEl.value.trim()  : "";
    _cicJdConfirmed    = true;

    var confirmed = document.getElementById("cicJdConfirmed");
    if (confirmed) { confirmed.style.display = "inline"; setTimeout(function() { confirmed.style.display = "none"; }, 2500); }

    // Invalidate caches so analysis uses new JD
    _cicAnalysisCache = null;
    _cicUploadCache   = null;
}

function cicGetJobDescription() {
    // Return current JD from input even if not explicitly confirmed
    var textEl = document.getElementById("cicJdText");
    return textEl ? textEl.value.trim() : _cicJobDescription;
}

function cicCheckJdRequired(card) {
    // Cards that benefit strongly from JD
    var requiresJd = ["ats", "job"];
    if (!requiresJd.includes(card)) return true; // no restriction

    var jd = cicGetJobDescription();
    if (jd) return true; // JD available

    var warning = document.getElementById("cicJdWarning");
    if (warning) warning.style.display = "block";

    // Open the JD panel if not open
    var body = document.getElementById("cicJdBody");
    if (body && !body.classList.contains("open")) cicToggleJdPanel();

    return false; // block for ATS/Job Match if no JD
}

// ── OCR text review panel ─────────────────────────────────────
function cicShowOcrPanel(text, lowConfidence) {
    var panel    = document.getElementById("cicOcrPanel");
    var textarea = document.getElementById("cicOcrTextarea");
    var warning  = document.getElementById("cicOcrWarning");
    if (!panel || !textarea) return;
    textarea.value = text || "";
    panel.style.display = "block";
    if (warning) warning.style.display = lowConfidence ? "block" : "none";
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function cicApplyOcrText() {
    var textarea = document.getElementById("cicOcrTextarea");
    if (!textarea) return;
    _cicUploadedText  = textarea.value.trim();
    _cicUploadCache   = null;
    document.getElementById("cicOcrPanel").style.display = "none";
    var statusEl = document.getElementById("cicUploadStatus");
    if (statusEl) { statusEl.textContent = "✓ Text ready for analysis"; statusEl.className = "cic-upload-status ok"; }
}

function cicDiscardOcr() {
    document.getElementById("cicOcrPanel").style.display = "none";
    _cicUploadedText  = null;
    _cicUploadCache   = null;
    var statusEl = document.getElementById("cicUploadStatus");
    if (statusEl) { statusEl.textContent = "No file selected"; statusEl.className = "cic-upload-status"; }
}

// ── Save report button (appended to modal body) ───────────────
function cicSaveReportHtml(cardKey, overallScore, documentType) {
    return '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:.6rem;">' +
        '<button id="cic-save-btn-' + cardKey + '" onclick="cicSaveReport(\'' + cardKey + '\',' + (overallScore||0) + ',\'' + (documentType||"") + '\')" ' +
        'style="font-size:.74rem;font-weight:600;padding:.32rem .85rem;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:var(--sans);">Save Report</button>' +
        '<span id="cic-save-status-' + cardKey + '" style="font-size:.72rem;color:var(--muted);font-family:var(--mono);"></span>' +
        '</div>';
}

function cicSaveReport(cardKey, overallScore, documentType) {
    var btn    = document.getElementById("cic-save-btn-" + cardKey);
    var status = document.getElementById("cic-save-status-" + cardKey);
    if (btn) btn.disabled = true;

    var cv = cicCv();
    var title = (_cicTitleMap[cardKey] || cardKey) + " – " +
        (_cicSource === "uploaded" ? "Uploaded Document" : (cv && cv.fullName ? cv.fullName : "My CV"));

    var jdTitle = document.getElementById("cicJdTitle");
    var jobTitle = (jdTitle ? jdTitle.value.trim() : "") || (cv ? cv.jobTitle : "") || "";

    var reportHtml = _cicResults[cardKey] || "";

    fetch("/api/analysis-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title:        title,
            analysisType: _cicTitleMap[cardKey] || cardKey,
            documentType: documentType || (_cicSource === "uploaded" ? "Uploaded" : "CV"),
            jobTitle:     jobTitle,
            overallScore: overallScore || 0,
            resultJson:   reportHtml
        })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(r) {
        if (!r.ok) throw new Error(r.data.message || "Save failed.");
        _cicSavedReports[cardKey] = r.data.id;
        if (btn) btn.textContent = "Saved ✓";
        if (status) { status.textContent = "Report saved to History"; status.style.color = "var(--green)"; }
    })
    .catch(function(e) {
        if (btn) { btn.disabled = false; }
        if (status) { status.textContent = e.message; status.style.color = "var(--red)"; }
    });
}

// ── Content change tracking ───────────────────────────────────
function cicInitContentTracking() {
    var debTimer;
    function onEdit() {
        clearTimeout(debTimer);
        debTimer = setTimeout(function() {
            _cicContentVersion++;
            // If any View buttons exist, they're now potentially stale
            // (user sees warning when they next click View)
        }, 600);
    }
    var cvArea = document.getElementById("cvPreviewArea");
    var clArea = document.getElementById("clPreviewArea");
    if (cvArea) cvArea.addEventListener("input", onEdit);
    if (clArea) clArea.addEventListener("input", onEdit);
}

// ── Source switching ──────────────────────────────────────────
function cicSetSource(src) {
    _cicSource = src;

    var curBtn     = document.getElementById("cicSrcCurrentBtn");
    var upBtn      = document.getElementById("cicSrcUploadBtn");
    var uploadZone = document.getElementById("cicUploadZone");
    var badge      = document.getElementById("cicSrcBadge");

    if (curBtn) curBtn.classList.toggle("active", src === "current");
    if (upBtn)  upBtn.classList.toggle("active", src === "uploaded");
    if (uploadZone) uploadZone.style.display = src === "uploaded" ? "flex" : "none";

    if (badge) {
        badge.textContent = src === "uploaded" ? "Analyzing: Uploaded Document" : "Analyzing: Current CV";
        badge.className = "cic-src-badge " + (src === "uploaded" ? "uploaded" : "current");
    }

    // Invalidate the upload cache when switching back to current
    if (src === "current") _cicUploadCache = null;
}

// ── Upload handling ───────────────────────────────────────────
function cicHandleUpload(input) {
    var file = input.files[0];
    if (!file) return;
    var statusEl = document.getElementById("cicUploadStatus");

    function setStatus(msg, cls) {
        if (statusEl) {
            statusEl.textContent = msg;
            statusEl.className = "cic-upload-status" + (cls ? " " + cls : "");
        }
    }

    var ext = (file.name.split(".").pop() || "").toLowerCase();
    var isImage = ["png", "jpg", "jpeg", "webp"].includes(ext);
    var isDoc   = ["pdf", "docx", "txt"].includes(ext);

    if (!isImage && !isDoc) {
        setStatus("Unsupported type. Use PDF, DOCX, TXT, PNG, JPG, JPEG, or WEBP.", "err");
        input.value = "";
        return;
    }

    setStatus(isImage ? "Running OCR…" : "Extracting text…");

    if (ext === "txt") {
        var reader = new FileReader();
        reader.onload = function(e) {
            _cicUploadedText = (e.target.result || "").trim();
            _cicUploadedFormData = null;
            _cicUploadCache = null;
            setStatus("✓ " + file.name, "ok");
        };
        reader.onerror = function() { setStatus("Failed to read file.", "err"); };
        reader.readAsText(file);
    } else {
        // PDF, DOCX, or image — all handled by /api/cv/extract
        var fd = new FormData();
        fd.append("file", file);
        fetch("/api/cv/extract", { method: "POST", body: fd })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(r) {
            if (!r.ok) throw new Error(r.data.message || "Extraction failed.");
            _cicUploadedFormData = r.data.formData;
            var extracted = cicFormDataToText(r.data.formData);
            _cicUploadCache = null;

            if (isImage) {
                // Show OCR review panel — let user verify before analysis
                setStatus("OCR complete — review text below", "ok");
                cicShowOcrPanel(extracted, false);
                // Don't set _cicUploadedText yet — user clicks Apply
            } else {
                _cicUploadedText = extracted;
                setStatus("✓ " + file.name, "ok");
            }
        })
        .catch(function(e) { setStatus("✗ " + e.message, "err"); });
    }

    input.value = "";
}

function cicFormDataToText(fd) {
    if (!fd) return "";
    var p = [];
    if (fd.fullName)  p.push("Name: " + fd.fullName);
    if (fd.jobTitle)  p.push("Title: " + fd.jobTitle);
    if (fd.email)     p.push("Email: " + fd.email);
    if (fd.phone)     p.push("Phone: " + fd.phone);
    if (fd.location)  p.push("Location: " + fd.location);
    if (fd.linkedin)  p.push("LinkedIn: " + fd.linkedin);
    if (fd.summary)   p.push("\nSummary:\n" + fd.summary);
    if (fd.experience && fd.experience.length) {
        p.push("\nExperience:");
        fd.experience.forEach(function(e) {
            p.push("  " + (e.jobTitle||"") + " at " + (e.company||"") + " (" + (e.startDate||"") + " – " + (e.endDate||"") + ")");
            if (e.responsibilities) p.push("  " + e.responsibilities);
        });
    }
    if (fd.education && fd.education.length) {
        p.push("\nEducation:");
        fd.education.forEach(function(e) {
            p.push("  " + (e.degree||"") + ", " + (e.institution||"") + " (" + (e.graduationYear||"") + ")");
        });
    }
    if (fd.skills)         p.push("\nSkills: "         + (Array.isArray(fd.skills) ? fd.skills.join(", ") : fd.skills));
    if (fd.certifications) p.push("Certifications: "   + (Array.isArray(fd.certifications) ? fd.certifications.join(", ") : fd.certifications));
    if (fd.languages)      p.push("Languages: "        + (Array.isArray(fd.languages) ? fd.languages.join(", ") : fd.languages));
    return p.join("\n");
}

// ── Unified fetch (respects source + injects JD) ─────────────
function cicFetchAnalysisForSource(jobDesc, callback) {
    // If caller doesn't pass a JD but the panel has one, use it
    var effectiveJd = jobDesc || cicGetJobDescription() || "";

    if (_cicSource === "uploaded") {
        if (!_cicUploadedText) { callback("No uploaded document. Upload a file first.", null); return; }
        var cacheKey = !effectiveJd;
        if (cacheKey && _cicUploadCache) { callback(null, _cicUploadCache); return; }
        // Use the text as-is — document type label is already prepended in ciGoStep3
        fetch("/api/ai-studio/analyze-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawText: _cicUploadedText, jobDescription: effectiveJd })
        })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(r) {
            if (!r.ok) throw new Error(r.data.message || "Analysis failed.");
            if (cacheKey) _cicUploadCache = r.data;
            callback(null, r.data);
        })
        .catch(function(e) { callback(e.message, null); });
    } else {
        cicFetchAnalysis(effectiveJd, callback);
    }
}

// ── Shared analysis fetch for current CV (cached) ─────────────
function cicFetchAnalysis(jobDesc, callback) {
    var cv = cicCv();
    if (!cv) { callback("No CV data found. Please generate your CV first.", null); return; }
    if (!jobDesc && _cicAnalysisCache) { callback(null, _cicAnalysisCache); return; }
    fetch("/api/ai-studio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cv, jobDescription: jobDesc || null })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(r) {
        if (!r.ok) throw new Error(r.data.message || "Analysis failed.");
        if (!jobDesc) _cicAnalysisCache = r.data;
        callback(null, r.data);
    })
    .catch(function(e) { callback(e.message, null); });
}

// ── Priority improvements renderer ────────────────────────────
function cicRenderPriorityImprovements(d) {
    var html = "";
    var hasHigh   = d.highPriorityImprovements   && d.highPriorityImprovements.length;
    var hasMed    = d.mediumPriorityImprovements  && d.mediumPriorityImprovements.length;
    var hasLow    = d.lowPriorityImprovements     && d.lowPriorityImprovements.length;
    var hasFlatImprovements = d.improvements && d.improvements.length;

    if (hasHigh || hasMed || hasLow) {
        if (hasHigh) {
            html += '<div class="cic-sub-label" style="color:#dc2626;">&#128308; High Priority</div>';
            d.highPriorityImprovements.forEach(function(s) {
                html += '<div class="cic-item"><span class="cic-item-ic" style="color:#dc2626;">&#8679;</span><span>' + cicEsc(s) + '</span></div>';
            });
        }
        if (hasMed) {
            html += '<div class="cic-sub-label" style="color:#d97706;">&#128992; Medium Priority</div>';
            d.mediumPriorityImprovements.forEach(function(s) {
                html += '<div class="cic-item"><span class="cic-item-ic" style="color:#d97706;">&#128161;</span><span>' + cicEsc(s) + '</span></div>';
            });
        }
        if (hasLow) {
            html += '<div class="cic-sub-label" style="color:#15803d;">&#128309; Low Priority</div>';
            d.lowPriorityImprovements.forEach(function(s) {
                html += '<div class="cic-item"><span class="cic-item-ic" style="color:#15803d;">&#8250;</span><span>' + cicEsc(s) + '</span></div>';
            });
        }
    } else if (hasFlatImprovements) {
        html += '<div class="cic-sub-label">Improvements</div>';
        d.improvements.forEach(function(s) {
            html += '<div class="cic-item"><span class="cic-item-ic">&#128161;</span><span>' + cicEsc(s) + '</span></div>';
        });
    }
    return html;
}

// ── Writing quality + action verb scores ─────────────────────
function cicRenderWritingScores(d) {
    var html = "";
    var hasExtra = (d.actionVerbScore || d.quantificationScore || d.writingQualityNote);
    if (!hasExtra) return "";
    html += '<div class="cic-sub-label">Writing Quality</div>';
    if (d.actionVerbScore || d.quantificationScore) {
        html += '<div style="display:flex;gap:8px;margin-bottom:8px;">';
        if (d.actionVerbScore) {
            var c1 = d.actionVerbScore >= 70 ? "#15803d" : d.actionVerbScore >= 50 ? "#d97706" : "#dc2626";
            html += '<div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:8px;text-align:center;">' +
                '<div style="font-size:1.2rem;font-weight:800;color:' + c1 + ';">' + d.actionVerbScore + '</div>' +
                '<div style="font-size:.63rem;color:var(--muted);font-family:var(--mono);">Action Verbs</div></div>';
        }
        if (d.quantificationScore) {
            var c2 = d.quantificationScore >= 70 ? "#15803d" : d.quantificationScore >= 50 ? "#d97706" : "#dc2626";
            html += '<div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:8px;text-align:center;">' +
                '<div style="font-size:1.2rem;font-weight:800;color:' + c2 + ';">' + d.quantificationScore + '</div>' +
                '<div style="font-size:.63rem;color:var(--muted);font-family:var(--mono);">Quantification</div></div>';
        }
        html += '</div>';
    }
    if (d.writingQualityNote) {
        html += '<div style="font-size:.8rem;color:var(--muted);font-style:italic;padding:8px 10px;' +
            'background:var(--surface);border-radius:6px;border:1px solid var(--border);">' +
            cicEsc(d.writingQualityNote) + '</div>';
    }
    return html;
}

// ── Init ──────────────────────────────────────────────────────
function initCIC() {
    if (_cicOpen) return;
    _cicOpen = true;
    var section = document.getElementById("cicSection");
    if (!section) return;
    section.style.display = "block";

    initCLTemplateSelector();
    cicInitContentTracking();

    var cv = cicCv();
    var roleEl = document.getElementById("cic-cl-role");
    if (roleEl && cv && cv.jobTitle && !roleEl.value)
        roleEl.value = cv.jobTitle;

    setTimeout(function() {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
}

// ── Dispatch ──────────────────────────────────────────────────
function cicRun(card) {
    if (_cicSource === "current") {
        var cv = cicCv();
        if (!cv) { alert("CV data not found. Generate your CV first."); return; }
    } else {
        if (!_cicUploadedText) {
            alert("No document available for analysis.\nUpload a PDF, DOCX, TXT, or image file above, then click 'Use for Analysis'.");
            return;
        }
    }

    // Enforce JD for ATS and Job Match
    if (!cicCheckJdRequired(card)) {
        cicOpenModal(_cicTitleMap[card] || card,
            '<div style="padding:20px 4px;font-size:.82rem;color:var(--muted);line-height:1.75;">' +
            '<strong style="color:var(--dark);">Job Description Required</strong><br>' +
            'ATS Analysis and Job Match Analysis need a real job description to give you accurate, specific feedback.<br><br>' +
            '<em>General feedback (without JD):</em> available for CV Health, Recruiter Review, Resume Optimizer.<br><br>' +
            '<button onclick="cicForceClose();cicToggleJdPanel();" style="padding:.38rem .85rem;background:var(--accent);color:#fff;' +
            'border:none;border-radius:6px;font-size:.78rem;font-weight:600;cursor:pointer;font-family:var(--sans);">' +
            'Add Job Description &#8599;</button>' +
            '<button onclick="cicForceClose();" style="margin-left:.5rem;padding:.36rem .75rem;background:none;' +
            'border:1px solid var(--border);border-radius:6px;font-size:.78rem;color:var(--muted);cursor:pointer;font-family:var(--sans);">Cancel</button>' +
            '</div>');
        return;
    }

    switch (card) {
        case "ats":         cicRunATS();        break;
        case "job":         cicOpenJobModal();  break;
        case "health":      cicRunHealth();     break;
        case "recruiter":   cicRunRecruiter();  break;
        case "interview":   cicRunInterview();  break;
        case "linkedin":    cicRunLinkedIn();   break;
        case "optimizer":   cicRunOptimizer();  break;
    }
}

// ── 1. ATS Analysis ───────────────────────────────────────────
function cicRunATS() {
    var btn = document.getElementById("cic-btn-ats");
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    cicOpenModal("ATS Analysis", cicLoadingHtml());

    cicFetchAnalysisForSource(null, function(err, d) {
        if (err) { cicRestoreBtn("ats", "Analyze"); cicOpenModal("ATS Analysis", cicErrorHtml(err)); return; }

        cicSetCardScore("cic-s-ats", d.atsScore);
        cicSetHeaderScore("cic-score-ats", "cic-val-ats", d.atsScore);

        var score = d.atsScore || 0;
        var scoreColor = score >= 80 ? "#15803d" : score >= 60 ? "#d97706" : "#dc2626";
        var scoreLabel = score >= 80 ? "Strong — likely to pass ATS filters"
                       : score >= 60 ? "Moderate — some improvements recommended"
                       : "Needs work — may be filtered out";
        var html = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;' +
            'padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:8px;">' +
            '<div style="font-size:2.6rem;font-weight:800;color:' + scoreColor + ';line-height:1;flex-shrink:0;">' + score + '%</div>' +
            '<div><div style="font-size:.84rem;font-weight:700;color:var(--dark);margin-bottom:2px;">ATS Score</div>' +
            '<div style="font-size:.75rem;color:var(--muted);">' + scoreLabel + '</div></div></div>';

        if (d.missingKeywords && d.missingKeywords.length) {
            html += '<div class="cic-sub-label">Missing Keywords</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">';
            d.missingKeywords.forEach(function(k) { html += '<span class="cic-tag red">' + cicEsc(k) + '</span>'; });
            html += '</div>';
        }
        if (d.formattingIssues && d.formattingIssues.length) {
            html += '<div class="cic-sub-label">Formatting Issues</div>';
            d.formattingIssues.forEach(function(s) {
                html += '<div class="cic-item"><span class="cic-item-ic">&#9888;</span><span>' + cicEsc(s) + '</span></div>';
            });
        }
        html += cicRenderWritingScores(d);
        html += cicRenderPriorityImprovements(d);
        if (!html.includes("cic-item") && !html.includes("cic-tag"))
            html += '<div style="color:var(--muted);font-size:.82rem;">ATS score looks strong — no critical issues found.</div>';

        cicStoreResult("ats", html, d.atsScore);
        cicOpenModal("ATS Analysis", _cicResults["ats"]);
        cicMarkStep("cic-step-analysis");
    });
}

// ── 2. Job Match ──────────────────────────────────────────────
function cicOpenJobModal() {
    if (_cicResults["job"]) {
        var viewHtml =
            '<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border);display:flex;justify-content:flex-end;">' +
            '<button onclick="cicResetJobMatch()" style="font-size:.74rem;padding:.28rem .7rem;border:1px solid var(--border);border-radius:5px;background:var(--surface);cursor:pointer;color:var(--muted);font-family:var(--sans);">New Analysis</button></div>' +
            (_cicResultVersions["job"] !== _cicContentVersion ?
                '<div style="margin-bottom:10px;padding:8px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:6px;font-size:.78rem;color:#92400e;">&#9888; Document edited since last analysis.</div>' : "") +
            _cicResults["job"];
        cicOpenModal("Job Match Analysis", viewHtml);
        return;
    }
    var formHtml =
        '<div class="cic-sub-label">Paste Job Description</div>' +
        '<textarea id="cic-modal-jobdesc" class="cic-input" rows="5" style="resize:vertical;line-height:1.5;margin-bottom:.7rem;" ' +
        'placeholder="Paste the job description for a tailored match analysis&#8230;"></textarea>' +
        '<button class="cic-run-btn" id="cic-modal-job-btn" onclick="cicRunJobMatch()" style="width:100%;justify-content:center;">Run Match Analysis</button>' +
        '<div id="cic-modal-job-result" style="margin-top:.85rem;"></div>';
    cicOpenModal("Job Match Analysis", formHtml);
}

function cicResetJobMatch() {
    _cicResults["job"] = null;
    var btn = document.getElementById("cic-btn-job");
    if (btn) { btn.textContent = "Analyze"; btn.onclick = function() { cicRun("job"); }; }
    cicOpenJobModal();
}

function cicRunJobMatch() {
    var jdEl     = document.getElementById("cic-modal-jobdesc");
    var resultEl = document.getElementById("cic-modal-job-result");
    var runBtn   = document.getElementById("cic-modal-job-btn");
    var jobDesc  = jdEl ? jdEl.value.trim() : "";

    if (!jobDesc) {
        if (resultEl) resultEl.innerHTML = '<div style="color:#d97706;font-size:.82rem;margin-top:6px;">Paste a job description above first.</div>';
        return;
    }
    if (resultEl) resultEl.innerHTML = '<div style="padding:12px;text-align:center;font-size:.82rem;color:var(--muted);font-family:var(--mono);">Running match analysis&#8230;</div>';
    if (runBtn) runBtn.disabled = true;

    cicFetchAnalysisForSource(jobDesc, function(err, d) {
        if (runBtn) runBtn.disabled = false;
        if (err) { if (resultEl) resultEl.innerHTML = cicErrorHtml(err); return; }

        cicSetCardScore("cic-s-job", d.jobMatchPercentage);
        cicSetHeaderScore("cic-score-job", "cic-val-job", d.jobMatchPercentage);

        var col = d.jobMatchPercentage >= 80 ? "#15803d" : d.jobMatchPercentage >= 60 ? "#d97706" : "#dc2626";
        var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">';
        html += '<div style="font-size:2.2rem;font-weight:800;color:' + col + ';">' + (d.jobMatchPercentage || 0) + '%</div>';
        if (d.roleFitExplanation)
            html += '<div style="font-size:.82rem;color:var(--charcoal);line-height:1.55;">' + cicEsc(d.roleFitExplanation) + '</div>';
        html += '</div>';
        if (d.matchedKeywords && d.matchedKeywords.length) {
            html += '<div class="cic-sub-label">Matched Keywords</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
            d.matchedKeywords.forEach(function(k) { html += '<span class="cic-tag green">' + cicEsc(k) + '</span>'; });
            html += '</div>';
        }
        if (d.missingSkills && d.missingSkills.length) {
            html += '<div class="cic-sub-label">Missing Skills</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
            d.missingSkills.forEach(function(k) { html += '<span class="cic-tag red">' + cicEsc(k) + '</span>'; });
            html += '</div>';
        }
        html += cicRenderPriorityImprovements(d);
        if (resultEl) resultEl.innerHTML = html;
        cicStoreResult("job", html);
        cicMarkStep("cic-step-analysis");
    });
}

// ── 3. CV Health Report ───────────────────────────────────────
function cicRunHealth() {
    var btn = document.getElementById("cic-btn-health");
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    cicOpenModal("CV Health Report", cicLoadingHtml());

    cicFetchAnalysisForSource(null, function(err, d) {
        if (err) { cicRestoreBtn("health", "Analyze"); cicOpenModal("CV Health Report", cicErrorHtml(err)); return; }

        cicSetCardScore("cic-s-health", d.overallScore);
        cicSetHeaderScore("cic-score-health", "cic-val-health", d.overallScore);

        var hscore = d.overallScore || 0;
        var hColor = hscore >= 80 ? "#15803d" : hscore >= 60 ? "#d97706" : "#dc2626";
        var hLabel = hscore >= 80 ? "Excellent overall CV health"
                   : hscore >= 60 ? "Good — a few areas to improve"
                   : "Needs attention — several weak sections";
        var html = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;' +
            'padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:8px;">' +
            '<div style="font-size:2.6rem;font-weight:800;color:' + hColor + ';line-height:1;flex-shrink:0;">' + hscore + '%</div>' +
            '<div><div style="font-size:.84rem;font-weight:700;color:var(--dark);margin-bottom:2px;">Overall Health Score</div>' +
            '<div style="font-size:.75rem;color:var(--muted);">' + hLabel + '</div></div></div>';

        var metrics = [
            ["Overall",      d.overallScore],
            ["Completeness", d.completenessScore],
            ["Keywords",     d.keywordScore],
            ["Readability",  d.readabilityScore],
            ["Bullets",      d.projectScore]
        ];
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:7px;margin-bottom:14px;">';
        metrics.forEach(function(m) {
            var n = m[1] || 0;
            var c = n >= 80 ? "#15803d" : n >= 60 ? "#d97706" : "#dc2626";
            html += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 6px;text-align:center;">' +
                '<div style="font-size:1.4rem;font-weight:800;color:' + c + ';">' + n + '</div>' +
                '<div style="font-size:.65rem;color:var(--muted);font-family:var(--mono);">' + cicEsc(m[0]) + '</div></div>';
        });
        html += '</div>';

        if (d.weakSections && d.weakSections.length) {
            html += '<div class="cic-sub-label">Areas to Strengthen</div>';
            d.weakSections.forEach(function(s) {
                html += '<div class="cic-item"><span class="cic-item-ic" style="color:#dc2626;">&#9679;</span><span>' + cicEsc(s) + '</span></div>';
            });
        }
        html += cicRenderWritingScores(d);
        html += cicRenderPriorityImprovements(d);
        cicStoreResult("health", html, d.overallScore);
        cicOpenModal("CV Health Report", _cicResults["health"]);
        cicMarkStep("cic-step-analysis");
    });
}

// ── 4. Recruiter Review ───────────────────────────────────────
function cicRunRecruiter() {
    var btn = document.getElementById("cic-btn-rec");
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    cicOpenModal("Recruiter Review", cicLoadingHtml());

    cicFetchAnalysisForSource(null, function(err, d) {
        if (err) { cicRestoreBtn("recruiter", "Analyze"); cicOpenModal("Recruiter Review", cicErrorHtml(err)); return; }

        var html = "";
        if (d.shortlistReasons && d.shortlistReasons.length) {
            html += '<div class="cic-sub-label">Why You Would Be Shortlisted</div>';
            d.shortlistReasons.forEach(function(r) {
                html += '<div class="cic-item"><span class="cic-item-ic" style="color:#15803d;">&#10003;</span><span>' + cicEsc(r) + '</span></div>';
            });
        }
        if (d.rejectReasons && d.rejectReasons.length) {
            html += '<div class="cic-sub-label">Red Flags to Address</div>';
            d.rejectReasons.forEach(function(r) {
                html += '<div class="cic-item"><span class="cic-item-ic" style="color:#dc2626;">&#10005;</span><span>' + cicEsc(r) + '</span></div>';
            });
        }
        if (d.redFlags && d.redFlags.length) {
            html += '<div class="cic-sub-label">Additional Concerns</div>';
            d.redFlags.forEach(function(f) {
                html += '<div class="cic-item"><span class="cic-item-ic">&#9888;</span><span>' + cicEsc(f) + '</span></div>';
            });
        }
        if (d.missingEvidence && d.missingEvidence.length) {
            html += '<div class="cic-sub-label">Missing Evidence</div>';
            d.missingEvidence.forEach(function(f) {
                html += '<div class="cic-item"><span class="cic-item-ic">&#128203;</span><span>' + cicEsc(f) + '</span></div>';
            });
        }
        html += cicRenderPriorityImprovements(d);
        if (!html) html = '<div style="color:var(--muted);font-size:.82rem;">Your CV presents well to recruiters — no major issues detected.</div>';
        cicStoreResult("recruiter", html);
        cicOpenModal("Recruiter Review", _cicResults["recruiter"]);
    });
}

// ── Build a CVResponse-compatible object from uploaded data ────
function cicBuildCvFromUpload() {
    var fd = _cicUploadedFormData;
    if (fd) {
        return {
            fullName:            fd.fullName    || "Candidate",
            jobTitle:            fd.jobTitle    || _cicJobTitle || "",
            email:               fd.email       || "",
            phone:               fd.phone       || "",
            location:            fd.location    || "",
            linkedIn:            fd.linkedin    || "",
            professionalSummary: fd.summary     || "",
            experience: (fd.experience || []).map(function(e) {
                return {
                    heading: (e.jobTitle || "") + (e.company ? " at " + e.company : ""),
                    points:  (e.responsibilities || "").split(/\n|\./).map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 6)
                };
            }),
            education: (fd.education || []).map(function(e) {
                return { heading: (e.degree || "") + (e.institution ? ", " + e.institution : "") + (e.graduationYear ? " (" + e.graduationYear + ")" : ""), points: [] };
            }),
            skills:         Array.isArray(fd.skills)         ? fd.skills         : (fd.skills         ? String(fd.skills).split(",").map(function(s){return s.trim();})         : []),
            certifications: Array.isArray(fd.certifications) ? fd.certifications : (fd.certifications ? [fd.certifications] : []),
            languages:      Array.isArray(fd.languages)      ? fd.languages      : (fd.languages      ? [fd.languages]      : []),
            tips: []
        };
    }
    // Fallback: raw text as summary
    if (_cicUploadedText) {
        return {
            fullName: "Candidate", jobTitle: _cicJobTitle || "",
            email: "", phone: "", location: "", linkedIn: "",
            professionalSummary: _cicUploadedText.substring(0, 2500),
            experience: [], education: [], skills: [], certifications: [], languages: [], tips: []
        };
    }
    return null;
}

// ── 5. Interview Preparation ──────────────────────────────────
function cicRunInterview() {
    var btn = document.getElementById("cic-btn-iq");
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    cicOpenModal("Interview Preparation", cicLoadingHtml());

    var cv = _cicSource === "uploaded" ? cicBuildCvFromUpload() : cicCv();
    if (!cv) {
        cicRestoreBtn("interview", "Generate");
        cicOpenModal("Interview Preparation", cicErrorHtml("No document data available. Please upload a document first."));
        return;
    }

    fetch("/api/ai-studio/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cv, jobDescription: cicGetJobDescription() || null })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(r) {
        if (!r.ok) throw new Error(r.data.message || "Failed to generate questions.");
        var qs = r.data.questions || [];
        var cats = {};
        qs.forEach(function(q) { var c = q.category || "General"; if (!cats[c]) cats[c] = []; cats[c].push(q); });
        var diffClass = { Easy: "green", Medium: "amber", Hard: "red" };
        var html = "";
        Object.keys(cats).forEach(function(cat) {
            html += '<div class="cic-sub-label">' + cicEsc(cat) + '</div>';
            cats[cat].forEach(function(q) {
                var dc = diffClass[q.difficulty] || "blue";
                html += '<div style="margin-bottom:7px;padding:8px 11px;background:var(--surface);border:1px solid var(--border);border-radius:7px;">';
                html += '<div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:3px;">';
                html += '<span class="cic-tag ' + dc + '" style="flex-shrink:0;margin:0;font-size:.63rem;">' + cicEsc(q.difficulty) + '</span>';
                html += '<span style="font-size:.82rem;font-weight:600;color:var(--dark);line-height:1.4;">' + cicEsc(q.question) + '</span></div>';
                if (q.tip) html += '<div style="font-size:.72rem;color:var(--muted);padding-left:2px;">&#128161; ' + cicEsc(q.tip) + '</div>';
                html += '</div>';
            });
        });
        if (!html) html = '<div style="color:var(--muted);font-size:.82rem;">No questions generated. Please try again.</div>';
        cicStoreResult("interview", html);
        cicOpenModal("Interview Preparation", _cicResults["interview"]);
    })
    .catch(function(e) {
        cicRestoreBtn("interview", "Generate");
        cicOpenModal("Interview Preparation", cicErrorHtml(e.message));
    });
}

// ── 6. LinkedIn Generator ─────────────────────────────────────
function cicRunLinkedIn() {
    var btn = document.getElementById("cic-btn-li");
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    cicOpenModal("LinkedIn Generator", cicLoadingHtml());

    var cv = _cicSource === "uploaded" ? cicBuildCvFromUpload() : cicCv();
    if (!cv) {
        cicRestoreBtn("linkedin", "Generate");
        cicOpenModal("LinkedIn Generator", cicErrorHtml("No document data available. Please upload a document first."));
        return;
    }

    fetch("/api/ai-studio/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cv, targetRole: cv.jobTitle || _cicJobTitle || "" })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(r) {
        if (!r.ok) throw new Error(r.data.message || "Failed to generate LinkedIn profile.");
        var d = r.data;
        var copyBtnStyle = 'position:absolute;top:8px;right:8px;padding:2px 9px;font-size:.68rem;font-weight:500;' +
            'border:1px solid var(--border);border-radius:4px;background:#fff;color:var(--muted);cursor:pointer;font-family:var(--sans);';
        var html = "";
        if (d.headline) {
            html += '<div class="cic-sub-label">Headline</div><div style="position:relative;margin-bottom:10px;">' +
                '<button onclick="cicCopyBlock(this)" style="' + copyBtnStyle + '">Copy</button>' +
                '<div class="cic-copy-text" style="font-size:.88rem;font-weight:600;color:var(--dark);padding:10px 12px;padding-right:60px;' +
                'background:var(--surface);border:1px solid var(--border);border-radius:7px;line-height:1.55;">' + cicEsc(d.headline) + '</div></div>';
        }
        if (d.about) {
            html += '<div class="cic-sub-label">About Section</div><div style="position:relative;margin-bottom:10px;">' +
                '<button onclick="cicCopyBlock(this)" style="' + copyBtnStyle + '">Copy</button>' +
                '<div class="cic-copy-text" style="font-size:.82rem;color:var(--charcoal);line-height:1.75;padding:10px 12px;padding-right:60px;' +
                'background:var(--surface);border:1px solid var(--border);border-radius:7px;white-space:pre-line;">' + cicEsc(d.about) + '</div></div>';
        }
        if (d.experiences && d.experiences.length) {
            html += '<div class="cic-sub-label">Experience Rewrites</div>';
            d.experiences.forEach(function(exp) {
                html += '<div style="position:relative;margin-bottom:7px;"><button onclick="cicCopyBlock(this)" style="' + copyBtnStyle + '">Copy</button>' +
                    '<div class="cic-copy-text" style="padding:10px 12px;padding-right:60px;background:var(--surface);border:1px solid var(--border);border-radius:7px;">';
                if (exp.heading) html += '<div style="font-size:.8rem;font-weight:700;color:var(--dark);margin-bottom:4px;">' + cicEsc(exp.heading) + '</div>';
                if (exp.description) html += '<div style="font-size:.8rem;color:var(--charcoal);line-height:1.65;white-space:pre-line;">' + cicEsc(exp.description) + '</div>';
                html += '</div></div>';
            });
        }
        if (!html) html = '<div style="color:var(--muted);font-size:.82rem;">Could not generate profile. Please try again.</div>';
        cicStoreResult("linkedin", html);
        cicOpenModal("LinkedIn Generator", _cicResults["linkedin"]);
    })
    .catch(function(e) {
        cicRestoreBtn("linkedin", "Generate");
        cicOpenModal("LinkedIn Generator", cicErrorHtml(e.message));
    });
}

// ── 7. Cover Letter Review ────────────────────────────────────
function cicReviewCoverLetter() {
    var letterText = "";
    var previewEl   = document.getElementById("clPreviewArea");
    var placeholder = document.getElementById("clPlaceholder");

    if (_cicSource === "uploaded" && _cicUploadedText) {
        letterText = _cicUploadedText;
    } else if (previewEl && !(placeholder && placeholder.style.display !== "none")) {
        letterText = (previewEl.innerText || previewEl.textContent || "").trim();
    }

    if (!letterText || letterText.length < 50) {
        cicOpenModal("Cover Letter Review",
            '<div style="padding:16px 4px;font-size:.82rem;color:var(--muted);line-height:1.7;">' +
            'Generate a cover letter in the <strong>Cover Letter</strong> workspace first, or upload a cover letter document above.<br><br>' +
            '<button onclick="cicForceClose();switchWorkspace(\'cl\');window.scrollTo({top:0,behavior:\'smooth\'});" ' +
            'style="padding:.38rem .85rem;border:1px solid var(--accent);border-radius:6px;background:var(--accent-light);color:var(--accent);' +
            'font-size:.78rem;font-weight:600;cursor:pointer;font-family:var(--sans);">Open Cover Letter &#8599;</button></div>');
        return;
    }

    var btn = document.getElementById("cic-btn-cl-review");
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    cicOpenModal("Cover Letter Review", cicLoadingHtml());

    var jdEl  = document.getElementById("cl-jd");
    var cmpEl = document.getElementById("cl-company");

    fetch("/api/ai-studio/analyze-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            letterText:     letterText,
            jobDescription: jdEl  ? (jdEl.value  || "") : "",
            companyName:    cmpEl ? (cmpEl.value || "") : ""
        })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(r) {
        if (!r.ok) throw new Error(r.data.message || "Review failed.");
        var d = r.data;
        var metrics = [["Overall",d.overallScore],["Tone",d.toneScore],["Keywords",d.keywordScore],["Clarity",d.clarityScore]];
        var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px;">';
        metrics.forEach(function(m) {
            var n = m[1] || 0; var c = n >= 80 ? "#15803d" : n >= 60 ? "#d97706" : "#dc2626";
            html += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 4px;text-align:center;">' +
                '<div style="font-size:1.4rem;font-weight:800;color:' + c + ';">' + n + '</div>' +
                '<div style="font-size:.65rem;color:var(--muted);font-family:var(--mono);">' + cicEsc(m[0]) + '</div></div>';
        });
        html += '</div>';
        if (d.toneSummary) {
            html += '<div style="font-size:.82rem;color:var(--muted);font-style:italic;margin-bottom:10px;padding:9px 11px;' +
                'background:var(--surface);border-radius:6px;border:1px solid var(--border);">' + cicEsc(d.toneSummary) + '</div>';
        }
        if (d.strengths && d.strengths.length) {
            html += '<div class="cic-sub-label">What Works</div>';
            d.strengths.forEach(function(s) { html += '<div class="cic-item"><span class="cic-item-ic" style="color:#15803d;">&#10003;</span><span>' + cicEsc(s) + '</span></div>'; });
        }
        if (d.improvements && d.improvements.length) {
            html += '<div class="cic-sub-label">Improvements</div>';
            d.improvements.forEach(function(s) { html += '<div class="cic-item"><span class="cic-item-ic">&#128161;</span><span>' + cicEsc(s) + '</span></div>'; });
        }
        if (d.missingKeywords && d.missingKeywords.length) {
            html += '<div class="cic-sub-label">Consider Adding</div><div style="display:flex;flex-wrap:wrap;gap:4px;">';
            d.missingKeywords.forEach(function(k) { html += '<span class="cic-tag amber">' + cicEsc(k) + '</span>'; });
            html += '</div>';
        }
        cicStoreResult("clreview", html);
        cicOpenModal("Cover Letter Review", _cicResults["clreview"]);
        cicMarkStep("cic-step-analysis");
    })
    .catch(function(e) {
        cicRestoreBtn("clreview", "Review");
        cicOpenModal("Cover Letter Review", cicErrorHtml(e.message));
    });
}

// ── 8. Resume Optimizer ───────────────────────────────────────
function cicRunOptimizer() {
    var btn = document.getElementById("cic-btn-opt");
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    cicOpenModal("Resume Optimizer", cicLoadingHtml());

    cicFetchAnalysisForSource(null, function(err, d) {
        if (err) { cicRestoreBtn("optimizer", "Optimize"); cicOpenModal("Resume Optimizer", cicErrorHtml(err)); return; }

        var html = cicRenderPriorityImprovements(d);

        if (!html && d.improvements && d.improvements.length) {
            html += '<div class="cic-sub-label">Priority Improvements</div>';
            d.improvements.forEach(function(s) {
                html += '<div class="cic-item"><span class="cic-item-ic">&#10022;</span><span>' + cicEsc(s) + '</span></div>';
            });
        }
        if (d.weakSections && d.weakSections.length) {
            html += '<div class="cic-sub-label">Weak Sections to Rewrite</div>';
            d.weakSections.forEach(function(s) {
                html += '<div class="cic-item"><span class="cic-item-ic" style="color:#dc2626;">&#9679;</span><span>' + cicEsc(s) + '</span></div>';
            });
        }
        if (d.missingKeywords && d.missingKeywords.length) {
            html += '<div class="cic-sub-label">Keywords to Add</div><div style="display:flex;flex-wrap:wrap;gap:4px;">';
            d.missingKeywords.forEach(function(k) { html += '<span class="cic-tag amber">' + cicEsc(k) + '</span>'; });
            html += '</div>';
        }
        html += cicRenderWritingScores(d);
        if (!html) html = '<div style="color:var(--muted);font-size:.82rem;">Your CV is well-optimized — no major changes needed.</div>';
        cicStoreResult("optimizer", html);
        cicOpenModal("Resume Optimizer", _cicResults["optimizer"]);
        cicMarkStep("cic-step-analysis");
    });
}

// ── Copy helper (LinkedIn Generator) ─────────────────────────
function cicCopyBlock(btn) {
    var textEl = btn.parentElement && btn.parentElement.querySelector(".cic-copy-text");
    if (!textEl) return;
    var text = (textEl.innerText || textEl.textContent || "").trim();
    function flash() {
        btn.innerHTML = "&#10003; Copied";
        btn.style.color = "#15803d";
        btn.style.borderColor = "#86efac";
        setTimeout(function() { btn.innerHTML = "Copy"; btn.style.color = ""; btn.style.borderColor = ""; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(text).then(flash).catch(function(){});
    else {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;top:-999px;left:-999px;opacity:0;";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch(e) {}
        document.body.removeChild(ta);
        flash();
    }
}

// ── CL Template selector ──────────────────────────────────────
function initCLTemplateSelector() {
    var grid = document.getElementById("clTmplGrid");
    if (!grid) return;
    grid.querySelectorAll(".cl-tmpl-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            grid.querySelectorAll(".cl-tmpl-btn").forEach(function(b) { b.classList.remove("active"); });
            btn.classList.add("active");
        });
    });
}

function cicGetSelectedTemplate() {
    var active = document.querySelector("#clTmplGrid .cl-tmpl-btn.active");
    return active ? active.dataset.tmpl : "Professional";
}
