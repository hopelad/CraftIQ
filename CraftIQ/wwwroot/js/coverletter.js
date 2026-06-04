// ── State ────────────────────────────────────────────────────
var _selectedCLTemplate = "cl-prestige";
var _lastLetter = null;
var _clAccentColor = "#1a1a2e";
var _clSender = { name: "", title: "", email: "", phone: "" };
var _clTarget = { company: "", hiringManager: "" };

// ── Template registry ────────────────────────────────────────
var CL_TEMPLATES = [
    { id: "cl-prestige",  name: "Prestige",  color: "#1a1a2e", desc: "Executive · Navy"   },
    { id: "cl-modern",    name: "Modern",    color: "#1d4ed8", desc: "Sleek · Blue"        },
    { id: "cl-minimal",   name: "Minimal",   color: "#374151", desc: "Clean · Grey"        },
    { id: "cl-creative",  name: "Creative",  color: "#6d28d9", desc: "Vivid · Purple"      },
    { id: "cl-corporate", name: "Corporate", color: "#003f8a", desc: "Formal · Navy"       },
    { id: "cl-sidebar",   name: "Sidebar",   color: "#065f46", desc: "Split · Green"       },
    { id: "cl-elegant",   name: "Elegant",   color: "#78350f", desc: "Refined · Amber"     },
    { id: "cl-tech",      name: "Tech",      color: "#0f766e", desc: "Sharp · Teal"        },
    { id: "cl-classic",   name: "Classic",   color: "#111827", desc: "Traditional · Black" },
    { id: "cl-bold",      name: "Bold",      color: "#b91c1c", desc: "Strong · Red"        }
];

// ── Utility helpers ──────────────────────────────────────────
function clEsc(t) {
    return String(t || "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
        .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function clNl(t) { return clEsc(t).replace(/\n/g,"<br>"); }
function valCL(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
function clDate() {
    return new Date().toLocaleDateString("en-US",{ year:"numeric", month:"long", day:"numeric" });
}
function clMix(hex, pct) {
    hex = hex.replace("#","");
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16);
    r = Math.round(r+(255-r)*pct); g = Math.round(g+(255-g)*pct); b = Math.round(b+(255-b)*pct);
    return "rgb("+r+","+g+","+b+")";
}

// ── Template card thumbnails ─────────────────────────────────
function buildCLMiniPreview(t) {
    var c = t.color;
    switch (t.id) {
        case "cl-prestige":
            return '<div style="background:'+c+';height:28px;"></div>'+
                   '<div style="height:2px;background:rgba(255,255,255,.18);"></div>'+
                   '<div style="padding:4px 5px;">'+
                   '<div style="height:3px;background:#e2e8f0;border-radius:1px;width:80%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:55%;"></div>'+
                   '</div>';
        case "cl-modern":
            return '<div style="display:flex;height:68px;">'+
                   '<div style="width:4px;background:'+c+';flex-shrink:0;"></div>'+
                   '<div style="padding:5px 5px;flex:1;">'+
                   '<div style="height:5px;background:'+c+';border-radius:1px;width:65%;margin-bottom:4px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:100%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:85%;"></div>'+
                   '</div></div>';
        case "cl-minimal":
            return '<div style="padding:10px 6px;text-align:center;">'+
                   '<div style="height:4px;background:'+c+';border-radius:1px;width:46%;margin:0 auto 3px;"></div>'+
                   '<div style="height:1px;background:#d1d5db;width:80%;margin:0 auto 6px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:90%;margin:0 auto 2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:75%;margin:0 auto;"></div>'+
                   '</div>';
        case "cl-creative":
            return '<div style="background:'+c+';height:30px;clip-path:polygon(0 0,100% 0,100% 65%,0 100%);"></div>'+
                   '<div style="padding:2px 5px;margin-top:-2px;">'+
                   '<div style="height:2px;background:'+clMix(c,0.6)+';border-radius:1px;width:85%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:100%;"></div>'+
                   '</div>';
        case "cl-corporate":
            return '<div style="background:'+c+';height:36px;padding:6px 5px;">'+
                   '<div style="height:3px;background:rgba(255,255,255,.45);border-radius:1px;width:65%;margin-bottom:3px;"></div>'+
                   '<div style="height:2px;background:rgba(255,255,255,.25);border-radius:1px;width:80%;"></div>'+
                   '</div>'+
                   '<div style="padding:3px 5px;">'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:90%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:70%;"></div>'+
                   '</div>';
        case "cl-sidebar":
            return '<div style="display:flex;height:68px;">'+
                   '<div style="width:20px;background:'+c+';flex-shrink:0;"></div>'+
                   '<div style="padding:5px 5px;flex:1;">'+
                   '<div style="height:3px;background:#e2e8f0;border-radius:1px;width:100%;margin-bottom:3px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:85%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:70%;"></div>'+
                   '</div></div>';
        case "cl-elegant":
            return '<div style="padding:7px 5px;text-align:center;">'+
                   '<div style="width:18px;height:18px;border:1.5px solid '+c+';border-radius:50%;margin:0 auto 3px;"></div>'+
                   '<div style="height:3px;background:#e2e8f0;border-radius:1px;width:65%;margin:0 auto 2px;"></div>'+
                   '<div style="color:'+c+';font-size:7px;margin:2px 0;letter-spacing:2px;">— ✦ —</div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:90%;margin:0 auto;"></div>'+
                   '</div>';
        case "cl-tech":
            return '<div style="background:#0f172a;height:68px;padding:5px 5px;">'+
                   '<div style="background:'+c+';height:13px;border-radius:1px;margin-bottom:4px;display:flex;align-items:center;padding:0 4px;gap:3px;">'+
                   '<span style="width:5px;height:5px;border-radius:50%;background:#ff5f57;display:inline-block;"></span>'+
                   '<span style="width:5px;height:5px;border-radius:50%;background:#ffbd2e;display:inline-block;"></span>'+
                   '<span style="width:5px;height:5px;border-radius:50%;background:#28c840;display:inline-block;"></span>'+
                   '</div>'+
                   '<div style="height:2px;background:#1e293b;border-radius:1px;width:85%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#1e293b;border-radius:1px;width:70%;"></div>'+
                   '</div>';
        case "cl-classic":
            return '<div style="padding:6px 5px;">'+
                   '<div style="height:3px;background:#d1d5db;border-radius:1px;width:48%;margin-bottom:4px;"></div>'+
                   '<div style="height:1px;background:#d1d5db;margin-bottom:5px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:100%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:88%;"></div>'+
                   '</div>';
        case "cl-bold":
            return '<div style="background:'+c+';height:34px;padding:9px 5px;">'+
                   '<div style="height:5px;background:rgba(255,255,255,.8);border-radius:1px;width:75%;"></div>'+
                   '</div>'+
                   '<div style="height:3px;background:'+c+';"></div>'+
                   '<div style="padding:3px 5px;">'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:88%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;border-radius:1px;width:65%;"></div>'+
                   '</div>';
        default:
            return '<div style="border-top:4px solid '+c+';padding:4px 5px;">'+
                   '<div style="height:3px;background:'+c+';width:70%;margin-bottom:2px;"></div>'+
                   '<div style="height:2px;background:#e2e8f0;width:100%;"></div>'+
                   '</div>';
    }
}

function buildCLCard(t) {
    return '<div class="tmpl-card" data-id="'+t.id+'">'+
        '<div class="tmpl-preview">'+buildCLMiniPreview(t)+'</div>'+
        '<div class="tmpl-name">'+t.name+'</div>'+
        '<div class="tmpl-desc">'+t.desc+'</div>'+
    '</div>';
}

function buildCLTemplateSelector() {
    var container = document.getElementById("clTemplateSelector");
    if (!container) return;
    var html = '<div class="tmpl-grid">';
    CL_TEMPLATES.forEach(function(t) { html += buildCLCard(t); });
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll(".tmpl-card").forEach(function(card) {
        card.addEventListener("click", function() {
            container.querySelectorAll(".tmpl-card").forEach(function(c) { c.classList.remove("active"); });
            card.classList.add("active");
            _selectedCLTemplate = card.dataset.id;
            var tmpl = CL_TEMPLATES.find(function(t) { return t.id === _selectedCLTemplate; });
            if (tmpl) {
                _clAccentColor = tmpl.color;
                var cp = document.getElementById("clColorPicker");
                if (cp) cp.value = tmpl.color;
                var ch = document.getElementById("clColorHex");
                if (ch) ch.value = tmpl.color;
                var nm = document.getElementById("selectedCLTmplName");
                if (nm) nm.textContent = tmpl.name;
            }
            if (_lastLetter) renderLetter(_lastLetter);
        });
    });
    var first = container.querySelector(".tmpl-card");
    if (first) first.classList.add("active");
    var nm = document.getElementById("selectedCLTmplName");
    if (nm) nm.textContent = CL_TEMPLATES[0].name;
}

// ── 10 Premium template rendering functions ──────────────────

// 1. PRESTIGE — dark header, white name, RE: subject line
function CLT_PRESTIGE(cl, c, s, t) {
    var lc = clMix(c, 0.92);
    return '<div style="background:#fff;font-family:Georgia,serif;color:#1e293b;max-width:680px;margin:0 auto;border-radius:3px;overflow:hidden;">'+
        '<div style="background:'+c+';padding:26px 36px 20px;">'+
            '<div style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;letter-spacing:.05em;text-transform:uppercase;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</div>'+
            (s.title ? '<div style="font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,.6);margin-top:3px;letter-spacing:.08em;">'+clEsc(s.title)+'</div>' : '')+
            '<div style="margin-top:10px;display:flex;gap:16px;flex-wrap:wrap;">'+
                (s.email ? '<span style="font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,.6);">&#x2709; '+clEsc(s.email)+'</span>' : '')+
                (s.phone ? '<span style="font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,.6);">&#x260E; '+clEsc(s.phone)+'</span>' : '')+
            '</div>'+
        '</div>'+
        '<div style="height:3px;background:'+clMix(c,0.45)+'"></div>'+
        '<div style="background:'+lc+';padding:11px 36px;border-bottom:1px solid rgba(0,0,0,.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">'+
            '<div style="font-family:Arial,sans-serif;font-size:10px;color:#475569;">'+
                (t.hiringManager ? '<strong>'+clEsc(t.hiringManager)+'</strong> &mdash; ' : '')+clEsc(t.company)+
            '</div>'+
            '<div style="font-family:Arial,sans-serif;font-size:9.5px;color:#94a3b8;">'+clDate()+'</div>'+
        '</div>'+
        '<div style="padding:26px 36px;">'+
            (cl.subject ? '<div style="font-family:Arial,sans-serif;font-size:11.5px;font-weight:700;color:'+c+';border-bottom:2px solid '+c+';padding-bottom:7px;margin-bottom:20px;letter-spacing:.04em;text-transform:uppercase;">Re: '+clEsc(cl.subject)+'</div>' : '')+
            (cl.opening ? '<p style="font-size:11px;line-height:1.82;margin:0 0 13px;color:#334155;">'+clNl(cl.opening)+'</p>' : '')+
            (cl.body    ? '<p style="font-size:11px;line-height:1.82;margin:0 0 13px;color:#334155;">'+clNl(cl.body)   +'</p>' : '')+
            (cl.closing ? '<p style="font-size:11px;line-height:1.82;margin:0;color:#334155;">'+clNl(cl.closing)+'</p>' : '')+
        '</div>'+
        '<div style="padding:9px 36px;background:'+lc+';border-top:1px solid rgba(0,0,0,.06);text-align:center;">'+
            '<span style="font-family:Arial,sans-serif;font-size:8px;color:#94a3b8;letter-spacing:.14em;text-transform:uppercase;">'+(s.name ? clEsc(s.name)+' &mdash; ' : '')+'Confidential</span>'+
        '</div>'+
    '</div>';
}

// 2. MODERN — bold left accent bar, strong name
function CLT_MODERN(cl, c, s, t) {
    var lc = clMix(c, 0.92);
    return '<div style="background:#fff;font-family:Arial,sans-serif;color:#1e293b;max-width:680px;margin:0 auto;border-radius:3px;overflow:hidden;display:flex;">'+
        '<div style="width:5px;background:'+c+';flex-shrink:0;"></div>'+
        '<div style="flex:1;padding:34px 34px 34px 30px;">'+
            '<div style="border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">'+
                '<div style="font-size:21px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</div>'+
                (s.title ? '<div style="font-size:10.5px;color:'+c+';font-weight:600;margin-top:4px;">'+clEsc(s.title)+'</div>' : '')+
                '<div style="margin-top:9px;display:flex;gap:14px;flex-wrap:wrap;">'+
                    (s.email ? '<span style="font-size:9.5px;color:#64748b;">'+clEsc(s.email)+'</span>' : '')+
                    (s.phone ? '<span style="font-size:9.5px;color:#64748b;">'+clEsc(s.phone)+'</span>' : '')+
                '</div>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px;">'+
                '<div style="font-size:10px;color:#475569;">'+
                    (t.hiringManager ? '<div style="font-weight:600;color:#0f172a;">'+clEsc(t.hiringManager)+'</div>' : '')+
                    '<div>'+clEsc(t.company)+'</div>'+
                '</div>'+
                '<div style="font-size:9.5px;color:#94a3b8;">'+clDate()+'</div>'+
            '</div>'+
            (cl.subject ? '<div style="background:'+lc+';border-left:3px solid '+c+';padding:8px 12px;margin-bottom:20px;font-size:11px;font-weight:600;color:'+c+';">'+clEsc(cl.subject)+'</div>' : '')+
            (cl.opening ? '<p style="font-size:11px;line-height:1.78;margin:0 0 12px;color:#334155;">'+clNl(cl.opening)+'</p>' : '')+
            (cl.body    ? '<p style="font-size:11px;line-height:1.78;margin:0 0 12px;color:#334155;">'+clNl(cl.body)   +'</p>' : '')+
            (cl.closing ? '<p style="font-size:11px;line-height:1.78;margin:0;color:#334155;">'+clNl(cl.closing)+'</p>' : '')+
        '</div>'+
    '</div>';
}

// 3. MINIMAL — centered caps name, triple rule, lots of space
function CLT_MINIMAL(cl, c, s, t) {
    return '<div style="background:#fff;font-family:Arial,sans-serif;color:#1e293b;max-width:680px;margin:0 auto;border-radius:3px;padding:48px 52px;">'+
        '<div style="text-align:center;margin-bottom:6px;">'+
            '<div style="font-size:19px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#0f172a;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</div>'+
            (s.title ? '<div style="font-size:9.5px;color:#64748b;margin-top:4px;letter-spacing:.1em;">'+clEsc(s.title)+'</div>' : '')+
        '</div>'+
        '<div style="text-align:center;margin-bottom:5px;">'+
            '<span style="font-size:9px;color:#94a3b8;">'+(s.email && s.phone ? clEsc(s.email)+'  &middot;  '+clEsc(s.phone) : clEsc(s.email || s.phone))+'</span>'+
        '</div>'+
        '<div style="text-align:center;margin:14px 0 26px;">'+
            '<div style="display:inline-block;width:52px;">'+
                '<div style="height:2px;background:'+c+';margin-bottom:3px;border-radius:1px;"></div>'+
                '<div style="height:1px;background:#e2e8f0;margin-bottom:3px;"></div>'+
                '<div style="height:1px;background:#e2e8f0;"></div>'+
            '</div>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:22px;font-size:10px;color:#64748b;flex-wrap:wrap;gap:8px;">'+
            '<div>'+clDate()+'</div>'+
            '<div style="text-align:right;">'+
                (t.hiringManager ? '<div style="font-weight:600;color:#0f172a;">'+clEsc(t.hiringManager)+'</div>' : '')+
                '<div>'+clEsc(t.company)+'</div>'+
            '</div>'+
        '</div>'+
        (cl.subject ? '<div style="font-size:10.5px;font-weight:700;color:'+c+';text-transform:uppercase;letter-spacing:.09em;margin-bottom:18px;">'+clEsc(cl.subject)+'</div>' : '')+
        (cl.opening ? '<p style="font-size:11px;line-height:1.82;margin:0 0 14px;color:#334155;">'+clNl(cl.opening)+'</p>' : '')+
        (cl.body    ? '<p style="font-size:11px;line-height:1.82;margin:0 0 14px;color:#334155;">'+clNl(cl.body)   +'</p>' : '')+
        (cl.closing ? '<p style="font-size:11px;line-height:1.82;margin:0;color:#334155;">'+clNl(cl.closing)+'</p>' : '')+
    '</div>';
}

// 4. CREATIVE — slanted color header, bottom accent strip
function CLT_CREATIVE(cl, c, s, t) {
    var lc = clMix(c, 0.90);
    return '<div style="background:#fff;font-family:Arial,sans-serif;color:#1e293b;max-width:680px;margin:0 auto;border-radius:3px;overflow:hidden;">'+
        '<div style="background:'+c+';padding:28px 36px 40px;position:relative;">'+
            '<div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-.01em;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</div>'+
            (s.title ? '<div style="font-size:10.5px;color:rgba(255,255,255,.68);margin-top:5px;">'+clEsc(s.title)+'</div>' : '')+
        '</div>'+
        '<div style="height:28px;background:#fff;margin-top:-24px;clip-path:polygon(0 100%,100% 0,100% 100%);position:relative;"></div>'+
        '<div style="padding:0 36px 30px;margin-top:-4px;">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px;">'+
                '<div style="font-size:9.5px;color:#64748b;">'+
                    (s.email ? clEsc(s.email) : '')+(s.email && s.phone ? '&nbsp;&nbsp;&middot;&nbsp;&nbsp;' : '')+(s.phone ? clEsc(s.phone) : '')+
                '</div>'+
                '<div style="text-align:right;font-size:9.5px;">'+
                    (t.hiringManager ? '<div style="font-weight:600;color:#0f172a;">'+clEsc(t.hiringManager)+'</div>' : '')+
                    '<div style="color:#64748b;">'+clEsc(t.company)+'</div>'+
                    '<div style="color:#94a3b8;">'+clDate()+'</div>'+
                '</div>'+
            '</div>'+
            (cl.subject ? '<div style="background:'+lc+';border-radius:6px;padding:10px 14px;margin-bottom:18px;font-size:11px;font-weight:600;color:'+c+';">'+clEsc(cl.subject)+'</div>' : '')+
            (cl.opening ? '<p style="font-size:11px;line-height:1.78;margin:0 0 13px;color:#334155;">'+clNl(cl.opening)+'</p>' : '')+
            (cl.body    ? '<p style="font-size:11px;line-height:1.78;margin:0 0 13px;color:#334155;">'+clNl(cl.body)   +'</p>' : '')+
            (cl.closing ? '<p style="font-size:11px;line-height:1.78;margin:0;color:#334155;">'+clNl(cl.closing)+'</p>' : '')+
        '</div>'+
        '<div style="height:4px;background:'+c+'"></div>'+
    '</div>';
}

// 5. CORPORATE — two-row header band, horizontal rule contact
function CLT_CORPORATE(cl, c, s, t) {
    var lc = clMix(c, 0.91);
    return '<div style="background:#fff;font-family:Arial,sans-serif;color:#1e293b;max-width:680px;margin:0 auto;border-radius:3px;overflow:hidden;">'+
        '<div style="background:'+c+';">'+
            '<div style="padding:20px 36px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">'+
                '<div>'+
                    '<div style="font-size:21px;font-weight:700;color:#fff;letter-spacing:.02em;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</div>'+
                    (s.title ? '<div style="font-size:9.5px;color:rgba(255,255,255,.6);margin-top:3px;letter-spacing:.07em;text-transform:uppercase;">'+clEsc(s.title)+'</div>' : '')+
                '</div>'+
                '<div style="text-align:right;">'+
                    (s.email ? '<div style="font-size:9.5px;color:rgba(255,255,255,.72);">'+clEsc(s.email)+'</div>' : '')+
                    (s.phone ? '<div style="font-size:9.5px;color:rgba(255,255,255,.72);margin-top:2px;">'+clEsc(s.phone)+'</div>' : '')+
                '</div>'+
            '</div>'+
            '<div style="height:1px;background:rgba(255,255,255,.15);"></div>'+
            '<div style="padding:9px 36px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">'+
                '<div style="font-size:9.5px;color:rgba(255,255,255,.8);">'+
                    (t.hiringManager ? clEsc(t.hiringManager)+'&nbsp;&nbsp;&vert;&nbsp;&nbsp;' : '')+clEsc(t.company)+
                '</div>'+
                '<div style="font-size:9.5px;color:rgba(255,255,255,.55);">'+clDate()+'</div>'+
            '</div>'+
        '</div>'+
        '<div style="padding:26px 36px;">'+
            (cl.subject ? '<div style="font-size:11.5px;font-weight:700;color:'+c+';margin-bottom:18px;border-bottom:1.5px solid '+lc+';padding-bottom:9px;">'+clEsc(cl.subject)+'</div>' : '')+
            (cl.opening ? '<p style="font-size:11px;line-height:1.75;margin:0 0 13px;color:#334155;">'+clNl(cl.opening)+'</p>' : '')+
            (cl.body    ? '<p style="font-size:11px;line-height:1.75;margin:0 0 13px;color:#334155;">'+clNl(cl.body)   +'</p>' : '')+
            (cl.closing ? '<p style="font-size:11px;line-height:1.75;margin:0;color:#334155;">'+clNl(cl.closing)+'</p>' : '')+
        '</div>'+
    '</div>';
}

// 6. SIDEBAR — colored left panel with metadata, body right
function CLT_SIDEBAR(cl, c, s, t) {
    var lc = clMix(c, 0.88);
    return '<div style="background:#fff;font-family:Arial,sans-serif;color:#1e293b;max-width:680px;margin:0 auto;border-radius:3px;overflow:hidden;display:flex;min-height:580px;">'+
        '<div style="width:195px;flex-shrink:0;background:'+c+';padding:28px 18px;display:flex;flex-direction:column;gap:18px;">'+
            '<div>'+
                '<div style="font-size:15px;font-weight:700;color:#fff;line-height:1.3;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</div>'+
                (s.title ? '<div style="font-size:8.5px;color:rgba(255,255,255,.6);margin-top:4px;letter-spacing:.07em;text-transform:uppercase;">'+clEsc(s.title)+'</div>' : '')+
            '</div>'+
            '<div style="height:1px;background:rgba(255,255,255,.2);"></div>'+
            '<div>'+
                '<div style="font-size:7.5px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;">Contact</div>'+
                (s.email ? '<div style="font-size:8.5px;color:rgba(255,255,255,.8);word-break:break-all;margin-bottom:3px;">'+clEsc(s.email)+'</div>' : '')+
                (s.phone ? '<div style="font-size:8.5px;color:rgba(255,255,255,.8);">'+clEsc(s.phone)+'</div>' : '')+
            '</div>'+
            '<div style="height:1px;background:rgba(255,255,255,.2);"></div>'+
            '<div>'+
                '<div style="font-size:7.5px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;">Date</div>'+
                '<div style="font-size:8.5px;color:rgba(255,255,255,.8);">'+clDate()+'</div>'+
            '</div>'+
            '<div style="height:1px;background:rgba(255,255,255,.2);"></div>'+
            '<div>'+
                '<div style="font-size:7.5px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;">To</div>'+
                (t.hiringManager ? '<div style="font-size:8.5px;font-weight:600;color:#fff;">'+clEsc(t.hiringManager)+'</div>' : '')+
                '<div style="font-size:8.5px;color:rgba(255,255,255,.8);">'+clEsc(t.company)+'</div>'+
            '</div>'+
        '</div>'+
        '<div style="flex:1;padding:28px 26px;">'+
            (cl.subject ? '<div style="font-size:13px;font-weight:700;color:'+c+';margin-bottom:18px;border-bottom:2px solid '+lc+';padding-bottom:9px;">'+clEsc(cl.subject)+'</div>' : '')+
            (cl.opening ? '<p style="font-size:11px;line-height:1.75;margin:0 0 13px;color:#334155;">'+clNl(cl.opening)+'</p>' : '')+
            (cl.body    ? '<p style="font-size:11px;line-height:1.75;margin:0 0 13px;color:#334155;">'+clNl(cl.body)   +'</p>' : '')+
            (cl.closing ? '<p style="font-size:11px;line-height:1.75;margin:0;color:#334155;">'+clNl(cl.closing)+'</p>' : '')+
        '</div>'+
    '</div>';
}

// 7. ELEGANT — serif, monogram circle, decorative rule
function CLT_ELEGANT(cl, c, s, t) {
    var initial = (s.name ? s.name.charAt(0).toUpperCase() : "A");
    return '<div style="background:#fff;font-family:Georgia,serif;color:#1e293b;max-width:680px;margin:0 auto;border-radius:3px;padding:46px 52px;">'+
        '<div style="text-align:center;margin-bottom:12px;">'+
            '<div style="display:inline-flex;width:50px;height:50px;border:2px solid '+c+';border-radius:50%;align-items:center;justify-content:center;font-size:19px;font-weight:700;color:'+c+';">'+clEsc(initial)+'</div>'+
        '</div>'+
        '<div style="text-align:center;margin-bottom:4px;">'+
            '<span style="font-size:18px;font-weight:700;font-style:italic;color:#0f172a;letter-spacing:.01em;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</span>'+
        '</div>'+
        (s.title ? '<div style="text-align:center;font-size:9.5px;color:#64748b;margin-bottom:8px;letter-spacing:.09em;">'+clEsc(s.title)+'</div>' : '')+
        '<div style="text-align:center;font-size:9px;color:#94a3b8;margin-bottom:5px;">'+(s.email && s.phone ? clEsc(s.email)+'  &middot;  '+clEsc(s.phone) : clEsc(s.email || s.phone))+'</div>'+
        '<div style="text-align:center;margin:14px 0 26px;">'+
            '<span style="color:'+c+';font-size:13px;letter-spacing:8px;">&#8212; &#10022; &#8212;</span>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:22px;font-size:10.5px;flex-wrap:wrap;gap:8px;">'+
            '<div style="color:#64748b;">'+clDate()+'</div>'+
            '<div style="text-align:right;">'+
                (t.hiringManager ? '<div style="font-weight:700;font-style:italic;color:#0f172a;">'+clEsc(t.hiringManager)+'</div>' : '')+
                '<div style="color:#64748b;">'+clEsc(t.company)+'</div>'+
            '</div>'+
        '</div>'+
        (cl.subject ? '<div style="font-size:11.5px;font-weight:700;font-style:italic;color:'+c+';margin-bottom:18px;text-align:center;">&ldquo;'+clEsc(cl.subject)+'&rdquo;</div>' : '')+
        (cl.opening ? '<p style="font-size:11px;line-height:1.86;margin:0 0 14px;color:#334155;text-indent:2em;">'+clNl(cl.opening)+'</p>' : '')+
        (cl.body    ? '<p style="font-size:11px;line-height:1.86;margin:0 0 14px;color:#334155;text-indent:2em;">'+clNl(cl.body)   +'</p>' : '')+
        (cl.closing ? '<p style="font-size:11px;line-height:1.86;margin:0;color:#334155;text-indent:2em;">'+clNl(cl.closing)+'</p>' : '')+
    '</div>';
}

// 8. TECH — dark terminal aesthetic, monospace accents
function CLT_TECH(cl, c, s, t) {
    return '<div style="background:#0f172a;font-family:\'Courier New\',monospace;color:#e2e8f0;max-width:680px;margin:0 auto;border-radius:3px;overflow:hidden;">'+
        '<div style="background:'+c+';padding:9px 16px;display:flex;align-items:center;gap:7px;">'+
            '<span style="width:10px;height:10px;border-radius:50%;background:#ff5f57;display:inline-block;flex-shrink:0;"></span>'+
            '<span style="width:10px;height:10px;border-radius:50%;background:#ffbd2e;display:inline-block;flex-shrink:0;"></span>'+
            '<span style="width:10px;height:10px;border-radius:50%;background:#28c840;display:inline-block;flex-shrink:0;"></span>'+
            '<span style="margin-left:8px;font-size:9px;color:rgba(255,255,255,.5);letter-spacing:.12em;">COVER_LETTER.txt</span>'+
        '</div>'+
        '<div style="padding:26px 30px;">'+
            '<div style="font-size:8.5px;color:#475569;letter-spacing:.1em;margin-bottom:3px;">// FROM</div>'+
            '<div style="font-size:17px;font-weight:700;color:#f1f5f9;font-family:Arial,sans-serif;margin-bottom:2px;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</div>'+
            (s.title ? '<div style="font-size:10px;color:'+c+';margin-bottom:7px;font-family:Arial,sans-serif;">'+clEsc(s.title)+'</div>' : '')+
            '<div style="font-size:9px;color:#475569;margin-bottom:18px;">'+
                (s.email ? clEsc(s.email) : '')+(s.email && s.phone ? '  <span style="color:#334155;">|</span>  ' : '')+(s.phone ? clEsc(s.phone) : '')+
            '</div>'+
            '<div style="border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;padding:5px 0;margin-bottom:18px;">'+
                '<span style="font-size:8.5px;color:#1e293b;letter-spacing:.12em;">&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;</span>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:6px;">'+
                '<div style="font-size:9.5px;color:#64748b;">'+
                    '<span style="color:#475569;">TO:&nbsp;&nbsp;</span>'+
                    (t.hiringManager ? clEsc(t.hiringManager)+' &lt;'+clEsc(t.company)+'&gt;' : clEsc(t.company))+
                '</div>'+
                '<div style="font-size:9.5px;color:#475569;">DATE: '+clDate()+'</div>'+
            '</div>'+
            (cl.subject ? '<div style="font-size:9.5px;color:#64748b;margin-bottom:14px;"><span style="color:#475569;">RE:&nbsp;&nbsp;&nbsp;</span>'+clEsc(cl.subject)+'</div>' : '')+
            '<div style="height:1px;background:#1e293b;margin:14px 0;"></div>'+
            (cl.opening ? '<p style="font-size:10.5px;line-height:1.75;margin:0 0 11px;color:#cbd5e1;font-family:Arial,sans-serif;">'+clNl(cl.opening)+'</p>' : '')+
            (cl.body    ? '<p style="font-size:10.5px;line-height:1.75;margin:0 0 11px;color:#cbd5e1;font-family:Arial,sans-serif;">'+clNl(cl.body)   +'</p>' : '')+
            (cl.closing ? '<p style="font-size:10.5px;line-height:1.75;margin:0;color:#cbd5e1;font-family:Arial,sans-serif;">'+clNl(cl.closing)+'</p>' : '')+
        '</div>'+
    '</div>';
}

// 9. CLASSIC — traditional US business letter
function CLT_CLASSIC(cl, c, s, t) {
    return '<div style="background:#fff;font-family:\'Times New Roman\',Times,serif;color:#1a1a1a;max-width:680px;margin:0 auto;border-radius:3px;padding:52px 62px;">'+
        '<div style="margin-bottom:22px;">'+
            '<div style="font-size:12px;font-weight:700;">'+(s.name ? clEsc(s.name) : '&nbsp;')+'</div>'+
            (s.title ? '<div style="font-size:11px;color:#555;">'+clEsc(s.title)+'</div>' : '')+
            (s.email ? '<div style="font-size:11px;color:#555;">'+clEsc(s.email)+'</div>' : '')+
            (s.phone ? '<div style="font-size:11px;color:#555;">'+clEsc(s.phone)+'</div>' : '')+
        '</div>'+
        '<div style="font-size:11.5px;margin-bottom:22px;">'+clDate()+'</div>'+
        '<div style="margin-bottom:22px;">'+
            (t.hiringManager ? '<div style="font-size:11.5px;font-weight:700;">'+clEsc(t.hiringManager)+'</div>' : '')+
            '<div style="font-size:11.5px;">'+clEsc(t.company)+'</div>'+
        '</div>'+
        (cl.subject ? '<div style="font-size:11.5px;font-weight:700;margin-bottom:18px;border-bottom:1px solid #d1d5db;padding-bottom:5px;">Re: '+clEsc(cl.subject)+'</div>' : '')+
        (cl.opening ? '<p style="font-size:11.5px;line-height:1.88;margin:0 0 13px;">'+clNl(cl.opening)+'</p>' : '')+
        (cl.body    ? '<p style="font-size:11.5px;line-height:1.88;margin:0 0 13px;">'+clNl(cl.body)   +'</p>' : '')+
        (cl.closing ? '<p style="font-size:11.5px;line-height:1.88;margin:0;">'+clNl(cl.closing)+'</p>' : '')+
    '</div>';
}

// 10. BOLD — large color block, giant white name, high contrast
function CLT_BOLD(cl, c, s, t) {
    var lc = clMix(c, 0.91);
    return '<div style="background:#fff;font-family:Arial,sans-serif;color:#1e293b;max-width:680px;margin:0 auto;border-radius:3px;overflow:hidden;">'+
        '<div style="background:'+c+';padding:32px 36px 26px;">'+
            '<div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.1;">'+(s.name ? clEsc(s.name).toUpperCase() : '&nbsp;')+'</div>'+
            (s.title ? '<div style="font-size:11.5px;color:rgba(255,255,255,.68);margin-top:7px;font-weight:500;letter-spacing:.04em;">'+clEsc(s.title)+'</div>' : '')+
            '<div style="margin-top:12px;display:flex;gap:14px;flex-wrap:wrap;">'+
                (s.email ? '<span style="font-size:9.5px;color:rgba(255,255,255,.8);">'+clEsc(s.email)+'</span>' : '')+
                (s.phone ? '<span style="font-size:9.5px;color:rgba(255,255,255,.8);">'+clEsc(s.phone)+'</span>' : '')+
            '</div>'+
        '</div>'+
        '<div style="padding:14px 36px;border-bottom:3px solid '+c+';display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">'+
            '<div style="font-size:11px;">'+
                (t.hiringManager ? '<strong>'+clEsc(t.hiringManager)+'</strong> &mdash; ' : '')+clEsc(t.company)+
            '</div>'+
            '<div style="font-size:9.5px;color:#94a3b8;">'+clDate()+'</div>'+
        '</div>'+
        '<div style="padding:26px 36px;">'+
            (cl.subject ? '<div style="font-size:12.5px;font-weight:700;color:'+c+';margin-bottom:18px;text-transform:uppercase;letter-spacing:.05em;">'+clEsc(cl.subject)+'</div>' : '')+
            (cl.opening ? '<p style="font-size:11px;line-height:1.75;margin:0 0 13px;color:#334155;">'+clNl(cl.opening)+'</p>' : '')+
            (cl.body    ? '<p style="font-size:11px;line-height:1.75;margin:0 0 13px;color:#334155;">'+clNl(cl.body)   +'</p>' : '')+
            (cl.closing ? '<p style="font-size:11px;line-height:1.75;margin:0;color:#334155;">'+clNl(cl.closing)+'</p>' : '')+
        '</div>'+
    '</div>';
}

// ── Template dispatch ─────────────────────────────────────────
function renderCLTemplate(cl, templateId, accentColor, sender, target) {
    var c = accentColor || "#1a1a2e";
    var s = sender || {};
    var t = target || {};
    switch (templateId) {
        case "cl-prestige":  return CLT_PRESTIGE(cl, c, s, t);
        case "cl-modern":    return CLT_MODERN(cl, c, s, t);
        case "cl-minimal":   return CLT_MINIMAL(cl, c, s, t);
        case "cl-creative":  return CLT_CREATIVE(cl, c, s, t);
        case "cl-corporate": return CLT_CORPORATE(cl, c, s, t);
        case "cl-sidebar":   return CLT_SIDEBAR(cl, c, s, t);
        case "cl-elegant":   return CLT_ELEGANT(cl, c, s, t);
        case "cl-tech":      return CLT_TECH(cl, c, s, t);
        case "cl-classic":   return CLT_CLASSIC(cl, c, s, t);
        case "cl-bold":      return CLT_BOLD(cl, c, s, t);
        default:             return CLT_PRESTIGE(cl, c, s, t);
    }
}

// ── Render to preview ─────────────────────────────────────────
function renderLetter(cl) {
    _lastLetter = cl;
    var db = document.getElementById("clDownloadBar");
    if (db) db.style.display = "flex";

    var html = renderCLTemplate(cl, _selectedCLTemplate, _clAccentColor, _clSender, _clTarget);

    if (cl.tips && cl.tips.length) {
        html += '<div class="cl-tips" style="margin-top:1.25rem;">';
        html += '<div style="font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#c8b89a;font-family:monospace;margin-bottom:.4rem;">&#128161; AI Tips</div>';
        cl.tips.forEach(function(tip) {
            html += '<div class="cl-tip">&#128161; ' + clEsc(tip) + '</div>';
        });
        html += '</div>';
    }

    document.getElementById("clPreview").innerHTML = html;
}

// ── Download ──────────────────────────────────────────────────
function downloadCLFile(url, body) {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    }).then(function(res) {
        if (!res.ok) throw new Error("Download failed");
        return res.blob();
    }).then(function(blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = url.includes("pdf") ? "Cover_Letter.pdf" : "Cover_Letter.docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    });
}

// ── Init ──────────────────────────────────────────────────────
function clInit() {
    _clAccentColor = CL_TEMPLATES[0].color;
    buildCLTemplateSelector();

    var generateBtn = document.getElementById("generateBtnCL");
    var clearBtn    = document.getElementById("clearBtnCL");
    var dlPdf       = document.getElementById("clDlPdf");
    var dlDocx      = document.getElementById("clDlDocx");
    var toneRow     = document.getElementById("toneRow");
    var colorPicker = document.getElementById("clColorPicker");
    var colorHex    = document.getElementById("clColorHex");
    var selectedTone = "Professional";

    if (!generateBtn) return;

    // Color picker sync
    if (colorPicker) {
        colorPicker.value = _clAccentColor;
        colorPicker.addEventListener("input", function() {
            _clAccentColor = colorPicker.value;
            if (colorHex) colorHex.value = colorPicker.value;
            if (_lastLetter) renderLetter(_lastLetter);
        });
    }
    if (colorHex) {
        colorHex.value = _clAccentColor;
        colorHex.addEventListener("input", function() {
            var v = colorHex.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                _clAccentColor = v;
                if (colorPicker) colorPicker.value = v;
                if (_lastLetter) renderLetter(_lastLetter);
            }
        });
    }

    // Tone selection
    if (toneRow) {
        toneRow.addEventListener("click", function(e) {
            var pill = e.target.closest(".tone-pill");
            if (!pill) return;
            document.querySelectorAll(".tone-pill").forEach(function(p) { p.classList.remove("active"); });
            pill.classList.add("active");
            selectedTone = pill.dataset.tone;
        });
    }

    // Generate
    generateBtn.addEventListener("click", function() {
        if (!valCL("fullNameCL") || !valCL("companyName") || !valCL("experienceCL") || !valCL("whyCompany")) {
            alert("Please fill in: Full Name, Company Name, Experience, and Why This Company.");
            return;
        }
        _clSender = { name: valCL("fullNameCL"), title: valCL("jobTitleCL"), email: "", phone: "" };
        _clTarget = { company: valCL("companyName"), hiringManager: valCL("hiringManager") };

        generateBtn.disabled = true;
        generateBtn.innerHTML = "&#9203; Writing...";
        document.getElementById("clPreview").innerHTML =
            '<div style="padding:2rem;text-align:center;font-family:monospace;font-size:.85rem;color:#7a6a58;">'+
            '&#129302; Writing your cover letter&#8230;<br><small>This may take 10&#8211;20 seconds</small></div>';

        fetch("/api/cv/cover-letter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName:      valCL("fullNameCL"),
                jobTitle:      valCL("jobTitleCL"),
                companyName:   valCL("companyName"),
                hiringManager: valCL("hiringManager"),
                experience:    valCL("experienceCL"),
                skills:        valCL("skillsCL"),
                whyCompany:    valCL("whyCompany"),
                tone:          selectedTone
            })
        })
        .then(function(res) { return res.text().then(function(t) { return { status: res.status, text: t }; }); })
        .then(function(r) {
            if (!r.text || r.text.trim() === "") {
                document.getElementById("clPreview").innerHTML =
                    '<div style="padding:1rem;color:#dc2626;font-family:monospace;font-size:.8rem;">Empty response. Check API key.</div>';
                return;
            }
            var data;
            try { data = JSON.parse(r.text); } catch(e) { return; }
            if (r.status !== 200) return;
            renderLetter(data);
        })
        .catch(function(err) { console.error(err); })
        .finally(function() {
            generateBtn.disabled = false;
            generateBtn.innerHTML = "&#10024; Write My Cover Letter";
        });
    });

    // Downloads
    if (dlPdf) {
        dlPdf.addEventListener("click", function() {
            if (!_lastLetter) { alert("Generate your letter first."); return; }
            dlPdf.disabled = true;
            downloadCLFile("/api/download/cover-letter/pdf", {
                letter: _lastLetter, templateId: _selectedCLTemplate, accentColor: _clAccentColor,
                renderedHtml: (function(){ var p = document.getElementById("clPreview"); return p ? p.innerHTML : ""; }())
            }).catch(function(e) { alert(e.message); })
              .finally(function() { dlPdf.disabled = false; dlPdf.innerHTML = "&#128196; PDF"; });
        });
    }

    if (dlDocx) {
        dlDocx.addEventListener("click", function() {
            if (!_lastLetter) { alert("Generate your letter first."); return; }
            dlDocx.disabled = true;
            downloadCLFile("/api/download/cover-letter/docx", {
                letter: _lastLetter, templateId: _selectedCLTemplate, accentColor: _clAccentColor,
                renderedHtml: (function(){ var p = document.getElementById("clPreview"); return p ? p.innerHTML : ""; }())
            }).catch(function(e) { alert(e.message); })
              .finally(function() { dlDocx.disabled = false; dlDocx.innerHTML = "&#128196; DOCX"; });
        });
    }

    // Clear
    if (clearBtn) {
        clearBtn.addEventListener("click", function() {
            ["fullNameCL","jobTitleCL","companyName","hiringManager","experienceCL","skillsCL","whyCompany"]
                .forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ""; });
            document.querySelectorAll(".tone-pill").forEach(function(p) { p.classList.remove("active"); });
            var prof = document.querySelector('[data-tone="Professional"]');
            if (prof) prof.classList.add("active");
            selectedTone = "Professional";
            document.getElementById("clPreview").innerHTML =
                '<div class="cl-empty"><div class="cl-empty-ico">&#9993;</div>'+
                '<div class="cl-empty-title">Your cover letter will appear here</div>'+
                '<div class="cl-empty-sub">Choose a template and fill in the details</div></div>';
            var db = document.getElementById("clDownloadBar");
            if (db) db.style.display = "none";
            _lastLetter = null;
            _clSender = { name: "", title: "", email: "", phone: "" };
            _clTarget = { company: "", hiringManager: "" };
        });
    }
}

document.addEventListener("DOMContentLoaded", clInit);
