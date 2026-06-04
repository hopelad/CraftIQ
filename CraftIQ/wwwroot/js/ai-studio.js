// ═══════════════════════════════════════════════════════════════
// CraftIQ — AI Studio  (ai-studio.js)
// Requires: _cv (global from cv-builder.js)
// ═══════════════════════════════════════════════════════════════

// ── State ────────────────────────────────────────────────────────
var _studioOpen  = false;
var _activeTab   = "analysis";
var _analysisRes = null;
var _iqFilter    = { category: "all", difficulty: "all" };

// ── Helpers ──────────────────────────────────────────────────────
function stEsc(t){ return String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function stVal(id){ var e=document.getElementById(id); return e?e.value.trim():""; }
function stCv(){ return (typeof _cv !== "undefined") ? _cv : null; }

function stShowError(containerId, msg){
    var el = document.getElementById(containerId);
    if(el) el.innerHTML =
        '<div style="padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;'+
        'font-size:.82rem;color:#dc2626;display:flex;align-items:center;gap:.5rem;">'+
        '&#9888; '+stEsc(msg)+'</div>';
}

function stShowLoading(containerId, msg){
    var el = document.getElementById(containerId);
    if(el) el.innerHTML =
        '<div style="padding:24px;text-align:center;font-family:monospace;font-size:.82rem;color:#7a6a58;">'+
        '<div style="font-size:1.6rem;margin-bottom:8px;">&#129302;</div>'+stEsc(msg||"Working…")+'</div>';
}

function stBadge(text, color){
    var colors = {
        green:  "background:#dcfce7;color:#15803d;border:1px solid #86efac;",
        red:    "background:#fef2f2;color:#dc2626;border:1px solid #fecaca;",
        yellow: "background:#fefce8;color:#92400e;border:1px solid #fde68a;",
        blue:   "background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;",
        purple: "background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe;",
        gray:   "background:#f3f4f6;color:#4b5563;border:1px solid #d1d5db;"
    };
    return '<span style="font-size:.7rem;font-weight:600;padding:2px 9px;border-radius:100px;'+
        (colors[color]||colors.gray)+'">'+stEsc(text)+'</span>';
}

function stCopyBtn(text, label){
    var id = "copy-"+Math.random().toString(36).slice(2,8);
    setTimeout(function(){
        var btn = document.getElementById(id);
        if(!btn) return;
        btn.addEventListener("click", function(){
            navigator.clipboard.writeText(text).then(function(){
                btn.textContent = "✓ Copied!";
                setTimeout(function(){ btn.textContent = label||"Copy"; }, 2000);
            });
        });
    }, 100);
    return '<button id="'+id+'" style="font-size:.7rem;padding:3px 10px;border-radius:6px;'+
        'border:1px solid var(--border);background:var(--cream);cursor:pointer;color:var(--muted);">'+
        stEsc(label||"Copy")+'</button>';
}

function stScoreColor(n){
    if(n >= 80) return "#15803d";
    if(n >= 60) return "#d97706";
    return "#dc2626";
}

function stScoreRing(score, label, size){
    size = size || 74;
    var r = (size/2)-6, circ = 2*Math.PI*r;
    var pct = Math.max(0,Math.min(100,score));
    var offset = circ - (pct/100)*circ;
    var col = stScoreColor(pct);
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;">'+
        '<svg width="'+size+'" height="'+size+'" style="transform:rotate(-90deg)">'+
        '<circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="#f0f0f0" stroke-width="5"/>'+
        '<circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="5"'+
        ' stroke-dasharray="'+circ+'" stroke-dashoffset="'+offset+'" stroke-linecap="round"/>'+
        '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" '+
        'style="transform:rotate(90deg);transform-origin:50% 50%;font-size:'+(size<60?'9':'11')+'px;font-weight:700;fill:'+col+';">'+pct+'</text>'+
        '</svg>'+
        '<div style="font-size:.65rem;color:var(--muted);text-align:center;max-width:'+size+'px;font-family:var(--mono);">'+stEsc(label)+'</div>'+
        '</div>';
}

// ── Open / Close Studio ───────────────────────────────────────────
function openStudio(tab){
    _studioOpen = true;
    var panel = document.getElementById("aiStudioPanel");
    if(panel){ panel.style.display = "block"; panel.scrollIntoView({behavior:"smooth",block:"start"}); }
    if(tab) switchStudioTab(tab);
}

function closeStudio(){
    _studioOpen = false;
    var panel = document.getElementById("aiStudioPanel");
    if(panel) panel.style.display = "none";
}

function switchStudioTab(tab){
    _activeTab = tab;
    document.querySelectorAll(".ais-tab").forEach(function(t){
        t.classList.toggle("active", t.dataset.tab === tab);
    });
    document.querySelectorAll(".ais-pane").forEach(function(p){
        p.style.display = (p.dataset.pane === tab) ? "block" : "none";
    });
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 — CV Analysis (ATS + Health + Job Match + Recruiter)
// ═══════════════════════════════════════════════════════════════
function runAnalysis(){
    var cv = stCv();
    if(!cv){ stShowError("analysisResult","Generate your CV first using the form above."); return; }

    var jobDesc = stVal("analysisJobDesc");
    stShowLoading("analysisResult","Running full CV analysis — ATS, keywords, recruiter view… (~15 sec)");
    document.getElementById("runAnalysisBtn").disabled = true;

    fetch("/api/ai-studio/analyze",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ cv: cv, jobDescription: jobDesc||null })
    })
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,data:d}; }); })
    .then(function(r){
        if(!r.ok) throw new Error(r.data.message||"Analysis failed.");
        _analysisRes = r.data;
        renderAnalysis(r.data, !!jobDesc);
    })
    .catch(function(e){ stShowError("analysisResult", e.message); })
    .finally(function(){ document.getElementById("runAnalysisBtn").disabled = false; });
}

function renderAnalysis(d, hasJob){
    var html = "";

    // ── Health Dashboard ──────────────────────────────────────
    html += '<div class="ais-section">';
    html += '<div class="ais-section-title">&#127775; CV Health Dashboard</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:18px 24px;justify-content:center;padding:16px 0;">';
    html += stScoreRing(d.overallScore,      "Overall",      82);
    html += stScoreRing(d.atsScore,          "ATS Score",    74);
    html += stScoreRing(d.completenessScore, "Completeness", 74);
    html += stScoreRing(d.keywordScore,      "Keywords",     74);
    html += stScoreRing(d.skillsScore,       "Skills",       74);
    html += stScoreRing(d.readabilityScore,  "Readability",  74);
    html += stScoreRing(d.projectScore,      "Bullets",      74);
    html += '</div></div>';

    // ── ATS Report ────────────────────────────────────────────
    html += '<div class="ais-section">';
    html += '<div class="ais-section-title">&#127919; ATS Score Report</div>';
    if(d.missingKeywords && d.missingKeywords.length){
        html += '<div class="ais-subsec">Missing Keywords</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">';
        d.missingKeywords.forEach(function(k){
            html += '<span style="font-size:.75rem;padding:3px 10px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:100px;">'+stEsc(k)+'</span>';
        });
        html += '</div>';
    }
    if(d.formattingIssues && d.formattingIssues.length){
        html += '<div class="ais-subsec">Formatting Issues</div>';
        html += '<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">';
        d.formattingIssues.forEach(function(i){ html += stListItem(i,"&#9888;","#d97706"); });
        html += '</div>';
    }
    if(d.weakSections && d.weakSections.length){
        html += '<div class="ais-subsec">Weak Sections</div>';
        html += '<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">';
        d.weakSections.forEach(function(s){ html += stListItem(s,"&#128308;","#dc2626"); });
        html += '</div>';
    }
    if(d.improvements && d.improvements.length){
        html += '<div class="ais-subsec">Improvement Suggestions</div>';
        html += '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:4px;">';
        d.improvements.forEach(function(s){ html += stListItem(s,"&#128161;","#d97706"); });
        html += '</div>';
    }
    html += '</div>';

    // ── Job Match ─────────────────────────────────────────────
    if(hasJob){
        html += '<div class="ais-section">';
        html += '<div class="ais-section-title">&#128269; Job Match Analysis</div>';
        var matchColor = stScoreColor(d.jobMatchPercentage);
        html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">';
        html += '<div style="font-size:2.2rem;font-weight:800;color:'+matchColor+';">'+d.jobMatchPercentage+'%</div>';
        html += '<div style="font-size:.85rem;color:var(--charcoal);line-height:1.6;">'+stEsc(d.roleFitExplanation||"")+'</div>';
        html += '</div>';
        if(d.matchedKeywords && d.matchedKeywords.length){
            html += '<div class="ais-subsec">Matched Keywords</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">';
            d.matchedKeywords.forEach(function(k){
                html += '<span style="font-size:.75rem;padding:3px 10px;background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:100px;">'+stEsc(k)+'</span>';
            });
            html += '</div>';
        }
        if(d.missingSkills && d.missingSkills.length){
            html += '<div class="ais-subsec">Missing Skills</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">';
            d.missingSkills.forEach(function(k){
                html += '<span style="font-size:.75rem;padding:3px 10px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:100px;">'+stEsc(k)+'</span>';
            });
            html += '</div>';
        }
        html += '</div>';
    }

    // ── Recruiter Simulation ──────────────────────────────────
    html += '<div class="ais-section">';
    html += '<div class="ais-section-title">&#128100; Recruiter Simulation</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    html += '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;">';
    html += '<div style="font-size:.72rem;font-weight:700;color:#15803d;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">&#9989; Why They Would Shortlist</div>';
    (d.shortlistReasons||[]).forEach(function(r){ html += stListItem(r,"•","#15803d"); });
    html += '</div>';
    html += '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;">';
    html += '<div style="font-size:.72rem;font-weight:700;color:#dc2626;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">&#10060; Why They Might Reject</div>';
    (d.rejectReasons||[]).forEach(function(r){ html += stListItem(r,"•","#dc2626"); });
    html += '</div>';
    html += '</div>';
    if(d.redFlags && d.redFlags.length){
        html += '<div style="margin-top:10px;">';
        html += '<div class="ais-subsec">&#128681; Red Flags</div>';
        (d.redFlags||[]).forEach(function(r){ html += stListItem(r,"&#128681;","#dc2626"); });
        html += '</div>';
    }
    if(d.missingEvidence && d.missingEvidence.length){
        html += '<div style="margin-top:10px;">';
        html += '<div class="ais-subsec">&#128270; Missing Evidence</div>';
        (d.missingEvidence||[]).forEach(function(r){ html += stListItem(r,"&#128270;","#7c3aed"); });
        html += '</div>';
    }
    html += '</div>';

    document.getElementById("analysisResult").innerHTML = html;
}

function stListItem(text, icon, color){
    return '<div style="display:flex;align-items:flex-start;gap:7px;font-size:.82rem;color:var(--charcoal);line-height:1.6;padding:4px 0;">'+
        '<span style="color:'+color+';flex-shrink:0;margin-top:1px;">'+icon+'</span>'+
        '<span>'+stEsc(text)+'</span></div>';
}

// ═══════════════════════════════════════════════════════════════
// TAB 2 — Interview Questions
// ═══════════════════════════════════════════════════════════════
function generateInterviewQuestions(){
    var cv = stCv();
    if(!cv){ stShowError("iqResult","Generate your CV first."); return; }

    stShowLoading("iqResult","Generating interview questions…");
    document.getElementById("genIQBtn").disabled = true;

    fetch("/api/ai-studio/interview-questions",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ cv: cv, jobDescription: stVal("iqJobDesc")||null })
    })
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,data:d}; }); })
    .then(function(r){
        if(!r.ok) throw new Error(r.data.message||"Failed.");
        renderInterviewQuestions(r.data.questions||[]);
    })
    .catch(function(e){ stShowError("iqResult",e.message); })
    .finally(function(){ document.getElementById("genIQBtn").disabled = false; });
}

function renderInterviewQuestions(questions){
    _iqAllQuestions = questions;
    renderIQFiltered();
}

var _iqAllQuestions = [];

function renderIQFiltered(){
    var catFilter  = stVal("iqCatFilter")  || "all";
    var diffFilter = stVal("iqDiffFilter") || "all";

    var filtered = _iqAllQuestions.filter(function(q){
        var catOk  = catFilter  === "all" || (q.category||"").toLowerCase()  === catFilter.toLowerCase();
        var diffOk = diffFilter === "all" || (q.difficulty||"").toLowerCase() === diffFilter.toLowerCase();
        return catOk && diffOk;
    });

    if(!filtered.length){
        document.getElementById("iqResult").innerHTML =
            '<div style="padding:20px;text-align:center;color:var(--muted);font-size:.82rem;">No questions match the filter.</div>';
        return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    filtered.forEach(function(q, i){
        var catColor = {technical:"blue",hr:"green",behavioral:"purple",project:"yellow"}[(q.category||"").toLowerCase()]||"gray";
        var diffColor= {easy:"green",medium:"yellow",hard:"red"}[(q.difficulty||"").toLowerCase()]||"gray";
        html += '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">';
        html += '<div style="padding:11px 14px;background:var(--warm-white);display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">';
        html += '<div style="font-size:.85rem;color:var(--dark);font-weight:500;line-height:1.5;flex:1;">'+stEsc(q.question)+'</div>';
        html += '<div style="display:flex;gap:5px;flex-shrink:0;">'+stBadge(q.category,catColor)+stBadge(q.difficulty,diffColor)+'</div>';
        html += '</div>';
        if(q.tip){
            html += '<div style="padding:8px 14px;background:#fefce8;border-top:1px solid #fde68a;font-size:.75rem;color:#92400e;">'+
                '&#128161; <strong>Tip:</strong> '+stEsc(q.tip)+'</div>';
        }
        html += '</div>';
    });
    html += '</div>';
    document.getElementById("iqResult").innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 — Writing Tools
// ═══════════════════════════════════════════════════════════════

// ── Bullet Improver ──────────────────────────────────────────────
function improveBullet(){
    var bullet = stVal("bulletInput");
    if(!bullet){ stShowError("bulletResult","Enter a bullet point to improve."); return; }

    stShowLoading("bulletResult","Improving bullet point…");
    document.getElementById("improveBulletBtn").disabled = true;

    fetch("/api/ai-studio/improve-bullet",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            bullet:   bullet,
            jobTitle: stVal("bulletJobTitle"),
            company:  stVal("bulletCompany")
        })
    })
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,data:d}; }); })
    .then(function(r){
        if(!r.ok) throw new Error(r.data.message||"Failed.");
        renderBulletResult(r.data);
    })
    .catch(function(e){ stShowError("bulletResult",e.message); })
    .finally(function(){ document.getElementById("improveBulletBtn").disabled = false; });
}

// Called from cv-builder.js inline "Improve" buttons on generated bullets
function improveBulletInline(bullet, resultContainerId, originalBtnId){
    var btn = document.getElementById(originalBtnId);
    if(btn){ btn.disabled = true; btn.textContent = "…"; }

    fetch("/api/ai-studio/improve-bullet",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ bullet: bullet })
    })
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,data:d}; }); })
    .then(function(r){
        if(!r.ok) throw new Error(r.data.message||"Failed.");
        var el = document.getElementById(resultContainerId);
        if(el){
            el.style.display = "block";
            el.innerHTML =
                '<div style="margin-top:6px;padding:10px 12px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:.8rem;">'+
                '<div style="font-size:.68rem;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">✓ Improved</div>'+
                '<div style="color:var(--dark);line-height:1.65;margin-bottom:6px;">'+stEsc(r.data.improved)+'</div>'+
                '<div style="font-size:.72rem;color:#6b7280;font-style:italic;">'+stEsc(r.data.explanation||"")+'</div>'+
                '<button onclick="useImprovedBullet(this,\''+stEsc(r.data.improved)+'\')" '+
                'style="margin-top:8px;font-size:.72rem;padding:3px 10px;background:#15803d;color:#fff;border:none;border-radius:6px;cursor:pointer;">Use This</button>'+
                '</div>';
        }
    })
    .catch(function(e){
        var el = document.getElementById(resultContainerId);
        if(el){ el.style.display="block"; el.innerHTML='<div style="font-size:.75rem;color:#dc2626;margin-top:4px;">'+stEsc(e.message)+'</div>'; }
    })
    .finally(function(){
        if(btn){ btn.disabled=false; btn.textContent="✨ Improve"; }
    });
}

function useImprovedBullet(btn, improved){
    var container = btn.closest(".bullet-improve-result");
    var textarea  = container ? container.closest(".bullet-block")?.querySelector("textarea") : null;
    if(textarea){
        var lines = textarea.value.split("\n");
        // Replace the last line or insert if empty
        textarea.value = improved;
        container.style.display = "none";
    } else {
        // For standalone improver — copy to textarea
        var input = document.getElementById("bulletInput");
        if(input) input.value = improved;
        container.closest("#bulletResult").innerHTML =
            '<div style="font-size:.8rem;color:#15803d;padding:8px 0;">&#10003; Bullet applied to input field.</div>';
    }
}

function renderBulletResult(d){
    var html =
        '<div style="display:flex;flex-direction:column;gap:10px;">'+
        '<div style="padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">'+
        '<div style="font-size:.68rem;font-weight:700;color:#dc2626;text-transform:uppercase;margin-bottom:5px;">Before</div>'+
        '<div style="font-size:.85rem;color:var(--dark);">'+stEsc(d.original)+'</div>'+
        '</div>'+
        '<div style="padding:12px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">'+
        '<div style="font-size:.68rem;font-weight:700;color:#15803d;text-transform:uppercase;">After</div>'+
        stCopyBtn(d.improved,"Copy")+
        '</div>'+
        '<div style="font-size:.85rem;color:var(--dark);font-weight:500;">'+stEsc(d.improved)+'</div>'+
        '</div>'+
        '<div style="padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:.78rem;color:#1d4ed8;">'+
        '&#128161; '+stEsc(d.explanation||"")+'</div>'+
        '</div>';
    document.getElementById("bulletResult").innerHTML = html;
}

// ── Project Enhancement Engine ────────────────────────────────────
function enhanceProject(){
    var title = stVal("projTitle");
    if(!title){ stShowError("projResult","Enter a project title."); return; }

    stShowLoading("projResult","Generating project bullets…");
    document.getElementById("enhanceProjBtn").disabled = true;

    fetch("/api/ai-studio/enhance-project",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            title:       title,
            description: stVal("projDesc"),
            tools:       stVal("projTools"),
            role:        stVal("projRole"),
            impact:      stVal("projImpact")
        })
    })
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,data:d}; }); })
    .then(function(r){
        if(!r.ok) throw new Error(r.data.message||"Failed.");
        renderProjectResult(r.data);
    })
    .catch(function(e){ stShowError("projResult",e.message); })
    .finally(function(){ document.getElementById("enhanceProjBtn").disabled = false; });
}

function renderProjectResult(d){
    var allBullets = (d.bullets||[]).join("\n");
    var html =
        '<div style="margin-bottom:10px;font-size:.82rem;color:var(--muted);">'+stEsc(d.summary||"")+'</div>'+
        '<div style="display:flex;flex-direction:column;gap:6px;">';
    (d.bullets||[]).forEach(function(b,i){
        html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;'+
            'padding:9px 12px;background:var(--warm-white);border:1px solid var(--border);border-radius:8px;">'+
            '<span style="font-size:.84rem;color:var(--dark);line-height:1.6;flex:1;">• '+stEsc(b)+'</span>'+
            stCopyBtn(b,"Copy")+
            '</div>';
    });
    html += '</div><div style="margin-top:10px;">'+stCopyBtn(allBullets,"Copy All Bullets")+'</div>';
    document.getElementById("projResult").innerHTML = html;
}

// ── LinkedIn Generator ────────────────────────────────────────────
function generateLinkedIn(){
    var cv = stCv();
    if(!cv){ stShowError("linkedinResult","Generate your CV first."); return; }

    stShowLoading("linkedinResult","Generating LinkedIn profile…");
    document.getElementById("genLinkedInBtn").disabled = true;

    fetch("/api/ai-studio/linkedin",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ cv: cv, targetRole: stVal("liTargetRole")||null })
    })
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,data:d}; }); })
    .then(function(r){
        if(!r.ok) throw new Error(r.data.message||"Failed.");
        renderLinkedIn(r.data);
    })
    .catch(function(e){ stShowError("linkedinResult",e.message); })
    .finally(function(){ document.getElementById("genLinkedInBtn").disabled = false; });
}

function renderLinkedIn(d){
    function liSection(title, content, copyText){
        return '<div style="margin-bottom:14px;">'+
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'+
            '<div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--tan);font-family:var(--mono);">'+stEsc(title)+'</div>'+
            stCopyBtn(copyText||content,"Copy")+
            '</div>'+
            '<div style="padding:12px 14px;background:var(--warm-white);border:1px solid var(--border);border-radius:8px;font-size:.84rem;color:var(--dark);line-height:1.7;white-space:pre-wrap;">'+stEsc(content)+'</div>'+
            '</div>';
    }

    var html = liSection("Headline",  d.headline||"",  d.headline||"");
    html    += liSection("About Section", d.about||"", d.about||"");

    if(d.experiences && d.experiences.length){
        html += '<div style="margin-bottom:14px;">';
        html += '<div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--tan);font-family:var(--mono);margin-bottom:8px;">Experience Descriptions</div>';
        d.experiences.forEach(function(e){
            var desc = Array.isArray(e.description)
                ? e.description.map(function(b){ return "• " + b; }).join("\n")
                : (e.description || "");
            html += '<div style="margin-bottom:8px;padding:12px 14px;background:var(--warm-white);border:1px solid var(--border);border-radius:8px;">'+
                '<div style="font-size:.8rem;font-weight:600;color:var(--dark);margin-bottom:5px;">'+stEsc(e.heading||"")+'</div>'+
                '<div style="font-size:.82rem;color:var(--charcoal);line-height:1.65;white-space:pre-wrap;">'+stEsc(desc)+'</div>'+
                '<div style="margin-top:6px;">'+stCopyBtn(desc,"Copy")+'</div>'+
                '</div>';
        });
        html += '</div>';
    }

    if(d.skills && d.skills.length){
        html += '<div style="margin-bottom:14px;">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'+
            '<div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--tan);font-family:var(--mono);">Skills to Add</div>'+
            stCopyBtn(d.skills.join(", "),"Copy All")+'</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:5px;">';
        d.skills.forEach(function(s){
            html += '<span style="font-size:.75rem;padding:3px 10px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:100px;">'+stEsc(s)+'</span>';
        });
        html += '</div></div>';
    }

    document.getElementById("linkedinResult").innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// TAB 4 — Version Management
// ═══════════════════════════════════════════════════════════════
function loadVersions(){
    stShowLoading("versionsResult","Loading saved versions…");

    fetch("/api/ai-studio/versions")
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,data:d}; }); })
    .then(function(r){
        if(!r.ok) throw new Error(r.data.message||"Failed to load versions.");
        renderVersions(r.data);
    })
    .catch(function(e){ stShowError("versionsResult",e.message); });
}

function renderVersions(versions){
    if(!versions || !versions.length){
        document.getElementById("versionsResult").innerHTML =
            '<div style="padding:24px;text-align:center;color:var(--muted);font-size:.82rem;">'+
            'No saved versions yet. Generate and save a CV to create your first version.</div>';
        return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    versions.forEach(function(v){
        var date = v.updatedAt ? new Date(v.updatedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "";
        html += '<div id="vrow-'+stEsc(v.id)+'" style="display:flex;align-items:center;gap:10px;padding:11px 14px;'+
            'background:var(--warm-white);border:1px solid var(--border);border-radius:10px;">'+
            '<div style="flex:1;min-width:0;">'+
            '<div style="font-size:.85rem;font-weight:600;color:var(--dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="vtitle-'+stEsc(v.id)+'">'+stEsc(v.cvTitle||"Untitled CV")+'</div>'+
            '<div style="font-size:.7rem;color:var(--muted);margin-top:2px;">'+stEsc(date)+(v.hasPhoto?' · Has photo':'')+'</div>'+
            '</div>'+
            '<div style="display:flex;gap:6px;flex-shrink:0;">'+
            '<a href="/Home/CVBuilder?id='+stEsc(v.id)+'" style="font-size:.72rem;padding:4px 10px;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;text-decoration:none;font-weight:500;">Edit</a>'+
            '<button onclick="duplicateVersion(\''+stEsc(v.id)+'\')" style="font-size:.72rem;padding:4px 10px;background:var(--cream);color:var(--charcoal);border:1px solid var(--border);border-radius:6px;cursor:pointer;">Duplicate</button>'+
            '<button onclick="renameVersionPrompt(\''+stEsc(v.id)+'\',\''+stEsc(v.cvTitle||"")+'\')" style="font-size:.72rem;padding:4px 10px;background:var(--cream);color:var(--charcoal);border:1px solid var(--border);border-radius:6px;cursor:pointer;">Rename</button>'+
            '</div>'+
            '</div>';
    });
    html += '</div>';
    document.getElementById("versionsResult").innerHTML = html;
}

function duplicateVersion(id){
    fetch("/api/ai-studio/versions/"+id+"/duplicate",{method:"POST"})
    .then(function(r){ return r.json(); })
    .then(function(){ loadVersions(); })
    .catch(function(e){ alert("Duplicate failed: "+e.message); });
}

function renameVersionPrompt(id, currentTitle){
    var newTitle = prompt("Rename version:", currentTitle);
    if(!newTitle || newTitle.trim() === currentTitle) return;

    fetch("/api/ai-studio/versions/"+id+"/rename",{
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title: newTitle.trim() })
    })
    .then(function(){ loadVersions(); })
    .catch(function(e){ alert("Rename failed: "+e.message); });
}

// ═══════════════════════════════════════════════════════════════
// TAB 5 — Export
// ═══════════════════════════════════════════════════════════════
function exportAs(format){
    var cv = stCv();
    if(!cv){ alert("Generate your CV first."); return; }

    var btn = document.getElementById("export-"+format+"-btn");
    if(btn){ btn.disabled=true; }

    var url      = "/api/download/cv/"+format;
    var filename = ((cv.fullName||"CV").replace(/\s+/g,"_"))+"_CV."+format;
    var body     = { cv: cv, templateId:"nexus", accentColor:"#1a1a2e" };

    if(format === "pdf"){
        var area = document.getElementById("cvPreviewArea") ||
                   document.getElementById("cvPreview");
        if(area) body.renderedHtml = area.innerHTML;
    }

    fetch(url,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) })
    .then(function(r){ if(!r.ok) throw new Error("Export failed."); return r.blob(); })
    .then(function(blob){
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    })
    .catch(function(e){ alert(e.message); })
    .finally(function(){ if(btn){ btn.disabled=false; } });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", function(){
    var panel = document.getElementById("aiStudioPanel");
    if(!panel) return;

    // Tab click handlers
    panel.querySelectorAll(".ais-tab").forEach(function(tab){
        tab.addEventListener("click", function(){
            switchStudioTab(tab.dataset.tab);
            if(tab.dataset.tab === "versions") loadVersions();
        });
    });

    // IQ filter changes
    ["iqCatFilter","iqDiffFilter"].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.addEventListener("change", renderIQFiltered);
    });
});
