// ═══════════════════════════════════════════════════════════════════
// CRAFTIQ — cv-templates.js  |  10 Premium Templates
// ═══════════════════════════════════════════════════════════════════

var _cv = null, _photo = null, _selectedTmpl = "nexus",
    _accentColor = "#1a1a2e", _cvRecordId = null,
    _fontSize = 10, _fontFamily = "Arial";

var TEMPLATES = [
    { id: "nexus",  name: "Nexus"  },
    { id: "atlas",  name: "Atlas"  },
    { id: "vega",   name: "Vega"   },
    { id: "onyx",   name: "Onyx"   },
    { id: "prism",  name: "Prism"  },
    { id: "volta",  name: "Volta"  },
    { id: "soleil", name: "Soleil" },
    { id: "forge",  name: "Forge"  },
    { id: "lumis",  name: "Lumis"  },
    { id: "coda",   name: "Coda"   }
];

function getTmpl(id) { for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i]; return TEMPLATES[0]; }
function esc(t) { return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function hex2rgb(h) { try { return parseInt(h.slice(1,3),16)+","+parseInt(h.slice(3,5),16)+","+parseInt(h.slice(5,7),16); } catch(e) { return "0,0,0"; } }
function mix(hex, w) { try { var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); r=Math.min(255,r+w);g=Math.min(255,g+w);b=Math.min(255,b+w); return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); } catch(e) { return hex; } }
function dark(hex, w) { try { var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); r=Math.max(0,r-w);g=Math.max(0,g-w);b=Math.max(0,b-w); return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); } catch(e) { return hex; } }

// ── TEMPLATE GRID ──────────────────────────────────────────────────────
function buildTemplateGrid() {
    var g = document.getElementById("templateGrid"); if (!g) return;
    var html = "";
    TEMPLATES.forEach(function(t) {
        html += '<div class="tmpl-item'+(t.id===_selectedTmpl?" active":"")+'" data-id="'+t.id+'" onclick="selectTemplate(\''+t.id+'\')">' +
            '<div class="tmpl-item-thumb">'+buildThumb(t.id)+'</div>' +
            '<div class="tmpl-item-label"><span>'+t.name+'</span></div></div>';
    });
    g.innerHTML = html;
    var b = document.getElementById("activeTmplName");
    if (b) b.textContent = getTmpl(_selectedTmpl).name;
}

function buildThumb(id) {
    var c = _accentColor, r = "border-radius:3px;overflow:hidden;height:100%;";
    var thumbs = {
        nexus:
            '<div style="'+r+'background:#fff;display:flex;">'+
            '<div style="width:38%;background:'+c+';padding:5px 4px;">'+
            '<div style="width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.25);margin:0 auto 4px;"></div>'+
            '<div style="height:2px;background:rgba(255,255,255,.8);border-radius:1px;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:rgba(255,255,255,.35);margin-bottom:1px;width:80%;"></div>'+
            '<div style="height:1px;background:rgba(255,255,255,.35);width:65%;"></div></div>'+
            '<div style="flex:1;padding:5px 4px;">'+
            '<div style="height:3px;background:#111;border-radius:1px;width:72%;margin-bottom:3px;"></div>'+
            '<div style="height:1px;background:#e0e0e0;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#eee;width:90%;margin-bottom:1px;"></div>'+
            '<div style="height:1px;background:#eee;width:75%;"></div></div></div>',

        atlas:
            '<div style="'+r+'background:#fff;">'+
            '<div style="background:linear-gradient(135deg,'+c+','+mix(c,65)+');padding:8px 6px;">'+
            '<div style="height:4px;background:rgba(255,255,255,.9);border-radius:1px;width:55%;margin-bottom:2px;"></div>'+
            '<div style="height:1.5px;background:rgba(255,255,255,.5);width:38%;"></div></div>'+
            '<div style="padding:4px 6px;">'+
            '<div style="height:1px;background:#e0e0e0;margin-bottom:3px;"></div>'+
            '<div style="height:1px;background:#eee;width:88%;margin-bottom:1px;"></div>'+
            '<div style="height:1px;background:#eee;width:70%;"></div></div></div>',

        vega:
            '<div style="'+r+'background:#fff;padding:7px 6px;">'+
            '<div style="height:5px;background:#111;border-radius:1px;font-weight:200;width:60%;margin-bottom:3px;"></div>'+
            '<div style="width:20px;height:2px;background:'+c+';border-radius:2px;margin-bottom:6px;"></div>'+
            '<div style="height:1px;background:#f0f0f0;margin-bottom:3px;"></div>'+
            '<div style="height:1px;background:#f0f0f0;width:85%;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#f0f0f0;width:70%;"></div></div>',

        onyx:
            '<div style="'+r+'background:#1c1c1c;display:flex;">'+
            '<div style="width:38%;background:#111;padding:5px 4px;">'+
            '<div style="width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.15);margin:0 auto 4px;"></div>'+
            '<div style="height:2px;background:'+c+';border-radius:1px;margin-bottom:2px;width:80%;"></div>'+
            '<div style="height:1px;background:rgba(255,255,255,.18);width:65%;"></div></div>'+
            '<div style="flex:1;padding:5px 4px;">'+
            '<div style="height:1px;background:rgba(255,255,255,.12);margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:rgba(255,255,255,.08);width:88%;margin-bottom:1px;"></div>'+
            '<div style="height:1px;background:rgba(255,255,255,.08);width:72%;"></div></div></div>',

        prism:
            '<div style="'+r+'background:#f4f5f7;padding:4px;">'+
            '<div style="background:#fff;border:1px solid #e8eaed;border-top:3px solid '+c+';border-radius:3px;padding:4px;margin-bottom:3px;">'+
            '<div style="height:3px;background:#111;border-radius:1px;width:55%;margin-bottom:2px;"></div>'+
            '<div style="height:1.5px;background:'+c+';width:38%;"></div></div>'+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">'+
            '<div style="background:#fff;border:1px solid #e8eaed;border-radius:3px;padding:3px;">'+
            '<div style="height:1px;background:#eee;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#eee;width:85%;"></div></div>'+
            '<div style="background:#fff;border:1px solid #e8eaed;border-radius:3px;padding:3px;">'+
            '<div style="height:1px;background:#eee;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#eee;width:75%;"></div></div>'+
            '</div></div>',

        volta:
            '<div style="'+r+'background:#fff;padding:6px;">'+
            '<div style="height:5.5px;background:#111;border-radius:1px;font-weight:900;width:65%;margin-bottom:4px;"></div>'+
            '<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">'+
            '<div style="width:18px;height:2.5px;background:'+c+';flex-shrink:0;"></div>'+
            '<div style="height:2px;background:'+c+';border-radius:1px;width:40%;"></div></div>'+
            '<div style="height:2px;background:#111;margin-bottom:3px;"></div>'+
            '<div style="height:1px;background:#eee;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#eee;width:85%;"></div></div>',

        soleil:
            '<div style="'+r+'background:#faf8f4;text-align:center;padding:5px;">'+
            '<div style="height:1px;background:linear-gradient(90deg,transparent,'+c+',transparent);margin-bottom:4px;"></div>'+
            '<div style="width:14px;height:14px;border-radius:50%;background:rgba('+hex2rgb(c)+',.15);border:1px solid rgba('+hex2rgb(c)+',.3);margin:0 auto 3px;"></div>'+
            '<div style="height:3px;background:'+c+';border-radius:1px;width:45%;margin:0 auto 2px;opacity:.7;"></div>'+
            '<div style="height:1px;background:#d4b896;width:25%;margin:0 auto 4px;"></div>'+
            '<div style="height:1px;background:#e8e0d4;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#e8e0d4;width:80%;margin:0 auto;"></div></div>',

        forge:
            '<div style="'+r+'background:#fff;display:flex;">'+
            '<div style="width:6px;background:'+c+';flex-shrink:0;"></div>'+
            '<div style="flex:1;padding:5px 5px;">'+
            '<div style="height:4px;background:'+c+';border-radius:1px;width:60%;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#ccc;width:36%;margin-bottom:4px;"></div>'+
            '<div style="height:1px;background:#eee;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#eee;width:88%;"></div></div></div>',

        lumis:
            '<div style="'+r+'background:#fff;display:flex;">'+
            '<div style="width:38%;background:linear-gradient(180deg,'+c+','+dark(c,25)+');padding:5px 4px;">'+
            '<div style="width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.2);margin:0 auto 4px;"></div>'+
            '<div style="height:2px;background:rgba(255,255,255,.75);border-radius:1px;margin-bottom:2px;width:80%;"></div>'+
            '<div style="height:1px;background:rgba(255,255,255,.35);width:65%;"></div></div>'+
            '<div style="flex:1;padding:5px 4px;">'+
            '<div style="height:3px;background:#111;border-radius:1px;width:70%;margin-bottom:3px;"></div>'+
            '<div style="height:1px;background:#e0e0e0;margin-bottom:2px;"></div>'+
            '<div style="height:1px;background:#eee;width:88%;"></div></div></div>',

        coda:
            '<div style="'+r+'background:#f0f0f0;">'+
            '<div style="background:'+c+';padding:6px;display:flex;justify-content:space-between;align-items:center;">'+
            '<div><div style="height:3px;background:#fff;opacity:.9;border-radius:1px;width:50px;margin-bottom:2px;"></div>'+
            '<div style="height:1.5px;background:#fff;opacity:.5;width:34px;"></div></div>'+
            '<div style="width:12px;height:12px;border:2px solid rgba(255,255,255,.35);border-radius:2px;"></div></div>'+
            '<div style="margin:3px;background:#fff;border-radius:3px;padding:4px;">'+
            '<div style="height:1px;background:#e0e0e0;margin-bottom:3px;"></div>'+
            '<div style="height:1px;background:#eee;width:90%;"></div></div></div>'
    };
    return thumbs[id] || thumbs.nexus;
}

function selectTemplate(id) {
    _selectedTmpl = id;
    document.querySelectorAll(".tmpl-item").forEach(function(el) { el.classList.toggle("active", el.dataset.id === id); });
    var b = document.getElementById("activeTmplName"); if (b) b.textContent = getTmpl(id).name;
    renderPreview();
}

function applyColor(color) {
    _accentColor = color;
    document.querySelectorAll(".color-dot").forEach(function(d) { d.classList.toggle("active", d.dataset.color === color); });
    var ci = document.getElementById("hexInput"), cn = document.getElementById("colorWheel");
    if (ci) ci.value = color; if (cn) cn.value = color;
    buildTemplateGrid(); renderPreview();
}

function initColorPicker() {
    document.querySelectorAll(".color-dot").forEach(function(d) { d.addEventListener("click", function() { applyColor(d.dataset.color); }); });
    var w = document.getElementById("colorWheel"); if (w) w.addEventListener("input", function() { applyColor(w.value); });
    var h = document.getElementById("hexInput"); if (h) h.addEventListener("input", function() { var v = h.value.trim(); if (!v.startsWith("#")) v = "#"+v; if (/^#[0-9a-fA-F]{6}$/.test(v)) applyColor(v); });
}

function updateColorUI() {
    document.querySelectorAll(".color-dot").forEach(function(d) { d.classList.toggle("active", d.dataset.color === _accentColor); });
    var ci = document.getElementById("hexInput"), cn = document.getElementById("colorWheel");
    if (ci) ci.value = _accentColor; if (cn) cn.value = _accentColor;
}

// ── TOOLBAR ────────────────────────────────────────────────────────────

// Ordered font-size steps (pt / px — same for screen)
var FONT_SIZES = [7,8,9,10,11,12,14,16,18,20,22,24,28,32,36,48,72];

function execCmd(cmd, val) {
    var a = document.getElementById("cvPreviewArea");
    if (!a) return;
    a.focus();
    try { document.execCommand(cmd, false, val !== undefined ? val : null); } catch(e) {}
}

function applyFontSizePx(px) {
    var a = document.getElementById("cvPreviewArea");
    if (!a) return;
    a.focus();
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { _fontSize = px; return; }
    // Use execCommand fontSize=7 (maps to HTML size "7") as a sentinel value not in FONT_SIZES,
    // then replace those font tags with span elements carrying the real px size.
    document.execCommand("fontSize", false, "7");
    var fonts = a.querySelectorAll("font[size='7']");
    fonts.forEach(function(el) {
        var span = document.createElement("span");
        span.style.fontSize = px + "px";
        while (el.firstChild) span.appendChild(el.firstChild);
        el.parentNode.replaceChild(span, el);
    });
    _fontSize = px;
}

function updateToolbarState() {
    var area = document.getElementById("cvPreviewArea");
    var sel  = window.getSelection();
    if (!area || !sel || !sel.anchorNode || !area.contains(sel.anchorNode)) return;

    function setActive(id, state) {
        var el = document.getElementById(id);
        if (el) el.classList.toggle("active", !!state);
    }

    try {
        setActive("fmtBold",      document.queryCommandState("bold"));
        setActive("fmtItalic",    document.queryCommandState("italic"));
        setActive("fmtUnderline", document.queryCommandState("underline"));
        setActive("fmtStrike",    document.queryCommandState("strikeThrough"));
        setActive("fmtSup",       document.queryCommandState("superscript"));
        setActive("fmtSub",       document.queryCommandState("subscript"));
        setActive("fmtUL",        document.queryCommandState("insertUnorderedList"));
        setActive("fmtOL",        document.queryCommandState("insertOrderedList"));
        setActive("fmtAlignL",    document.queryCommandState("justifyLeft"));
        setActive("fmtAlignC",    document.queryCommandState("justifyCenter"));
        setActive("fmtAlignR",    document.queryCommandState("justifyRight"));
        setActive("fmtAlignJ",    document.queryCommandState("justifyFull"));
    } catch(e) {}
}

function initToolbar() {
    var area = document.getElementById("cvPreviewArea");

    // ── Font family ──
    var fs = document.getElementById("fontFamilySel");
    if (fs) fs.addEventListener("change", function() {
        _fontFamily = fs.value; execCmd("fontName", _fontFamily);
        if (area) area.focus();
    });

    // ── Font size input ──
    var sizeInput = document.getElementById("fontSizeInput");

    function commitSize() {
        var v = parseInt(sizeInput ? sizeInput.value : _fontSize) || _fontSize;
        v = Math.max(6, Math.min(144, v));
        if (sizeInput) sizeInput.value = v;
        applyFontSizePx(v);
        if (area) area.focus();
    }

    if (sizeInput) {
        sizeInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") { e.preventDefault(); commitSize(); }
        });
        sizeInput.addEventListener("blur", commitSize);
        sizeInput.addEventListener("click", function() { sizeInput.select(); });
    }

    // ── Increase / Decrease font size ──
    var btnInc = document.getElementById("fontIncrease");
    var btnDec = document.getElementById("fontDecrease");

    if (btnInc) btnInc.addEventListener("click", function() {
        var cur = parseInt(sizeInput ? sizeInput.value : _fontSize) || _fontSize;
        var next = FONT_SIZES.find(function(s) { return s > cur; }) || cur;
        if (sizeInput) sizeInput.value = next;
        applyFontSizePx(next);
        if (area) area.focus();
    });

    if (btnDec) btnDec.addEventListener("click", function() {
        var cur = parseInt(sizeInput ? sizeInput.value : _fontSize) || _fontSize;
        var prev = FONT_SIZES.slice().reverse().find(function(s) { return s < cur; }) || cur;
        if (sizeInput) sizeInput.value = prev;
        applyFontSizePx(prev);
        if (area) area.focus();
    });

    // ── Basic format buttons (bold, italic, underline, etc.) ──
    var fmtMap = {
        fmtBold:      "bold",
        fmtItalic:    "italic",
        fmtUnderline: "underline",
        fmtStrike:    "strikeThrough",
        fmtSup:       "superscript",
        fmtSub:       "subscript",
        fmtClear:     "removeFormat",
        fmtUL:        "insertUnorderedList",
        fmtOL:        "insertOrderedList",
        fmtIndent:    "indent",
        fmtOutdent:   "outdent"
    };
    Object.keys(fmtMap).forEach(function(id) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            execCmd(fmtMap[id]);
            updateToolbarState();
            if (area) area.focus();
        });
    });

    // ── Alignment buttons ──
    var alignMap = {
        fmtAlignL: "justifyLeft",
        fmtAlignC: "justifyCenter",
        fmtAlignR: "justifyRight",
        fmtAlignJ: "justifyFull"
    };
    Object.keys(alignMap).forEach(function(id) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            execCmd(alignMap[id]);
            updateToolbarState();
            if (area) area.focus();
        });
    });

    // ── Text colour ──
    var tc    = document.getElementById("txtColorPicker");
    var tcBar = document.getElementById("txtColorBar");
    if (tc) tc.addEventListener("input", function() {
        if (tcBar) tcBar.style.background = tc.value;
        execCmd("foreColor", tc.value);
        if (area) area.focus();
    });

    // ── Highlight colour ──
    var hc    = document.getElementById("hlColorPicker");
    var hcBar = document.getElementById("hlColorBar");
    if (hc) hc.addEventListener("input", function() {
        if (hcBar) hcBar.style.background = hc.value;
        execCmd("hiliteColor", hc.value);
        if (area) area.focus();
    });

    // ── Line spacing ──
    var ls = document.getElementById("lineSpacingSel");
    if (ls) ls.addEventListener("change", function() {
        if (area) area.style.lineHeight = ls.value;
    });

    // ── Update button states on selection change ──
    document.addEventListener("selectionchange", updateToolbarState);

    // ── Keyboard shortcuts (Ctrl+B, I, U, etc.) already handled by browser for contenteditable ──
    // We just sync the state visually:
    if (area) {
        area.addEventListener("keyup", updateToolbarState);
        area.addEventListener("mouseup", updateToolbarState);
    }
}

// ══════════════════════════════════════════════════════════════════════
// SHARED RENDER UTILITIES
// ══════════════════════════════════════════════════════════════════════
function cl(sep) { sep = sep||" · "; return [_cv.email,_cv.phone,_cv.location,_cv.linkedIn].filter(Boolean).map(esc).join(sep); }
function ff() { return "'"+_fontFamily+"','Segoe UI',Arial,sans-serif"; }

function EXP(opts) {
    if (!_cv.experience || !_cv.experience.length) return "";
    opts = opts||{}; var hSz=opts.hSz||11.5, ptSz=opts.ptSz||10, hCol=opts.hColor||"#111",
        ptCol=opts.ptColor||"#555", bCol=opts.bulletColor||"#bbb", mb=opts.mb||16, accentLine=opts.accentLine||"";
    return _cv.experience.map(function(e) {
        var pts = (e.points||[]).map(function(p) {
            return '<div style="font-size:'+ptSz+'px;color:'+ptCol+';padding-left:14px;line-height:1.75;position:relative;margin-bottom:1px;">'+
                '<span style="position:absolute;left:3px;top:1px;color:'+bCol+';">–</span>'+esc(p)+'</div>';
        }).join("");
        var wrap = accentLine ? 'padding-left:12px;border-left:2.5px solid '+accentLine+';margin-bottom:'+mb+'px;' : 'margin-bottom:'+mb+'px;';
        return '<div style="'+wrap+'"><div style="font-size:'+hSz+'px;font-weight:700;color:'+hCol+';margin-bottom:4px;line-height:1.3;">'+esc(e.heading)+'</div>'+pts+'</div>';
    }).join("");
}

function EDU(opts) {
    if (!_cv.education || !_cv.education.length) return "";
    opts = opts||{}; var hSz=opts.hSz||11.5, ptSz=opts.ptSz||10, hCol=opts.hColor||"#111", ptCol=opts.ptColor||"#666";
    return _cv.education.map(function(e) {
        var pts = (e.points||[]).map(function(p) {
            return '<div style="font-size:'+ptSz+'px;color:'+ptCol+';line-height:1.65;margin-top:1px;">'+esc(p)+'</div>';
        }).join("");
        return '<div style="margin-bottom:12px;"><div style="font-size:'+hSz+'px;font-weight:700;color:'+hCol+';margin-bottom:3px;">'+esc(e.heading)+'</div>'+pts+'</div>';
    }).join("");
}

function PILLS(col, inv, opts) {
    if (!_cv.skills || !_cv.skills.length) return "";
    opts = opts||{}; var bg = inv?col:"rgba("+hex2rgb(col)+",.09)", tc = inv?"#fff":col,
        bdr = inv?"none":"1px solid rgba("+hex2rgb(col)+",.22)", sz=opts.sz||9, pad=opts.pad||"4px 13px", rad=opts.radius||"100px";
    return '<div style="display:flex;flex-wrap:wrap;gap:5px 6px;">'+
        _cv.skills.map(function(s) {
            return '<span style="font-size:'+sz+'px;padding:'+pad+';border-radius:'+rad+';background:'+bg+';color:'+tc+';border:'+bdr+';font-weight:500;">'+esc(s)+'</span>';
        }).join("")+'</div>';
}

function SKILL_DOTS(col) {
    if (!_cv.skills || !_cv.skills.length) return "";
    return _cv.skills.map(function(s) {
        return '<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">'+
            '<span style="width:5px;height:5px;border-radius:50%;background:'+col+';flex-shrink:0;display:inline-block;"></span>'+
            '<span style="font-size:9px;color:rgba(255,255,255,.82);font-weight:400;">'+esc(s)+'</span></div>';
    }).join("");
}

function SKILL_LIST_2COL(col) {
    if (!_cv.skills || !_cv.skills.length) return "";
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 18px;">'+
        _cv.skills.map(function(s) {
            return '<div style="font-size:9px;color:#555;padding:2px 0;display:flex;align-items:center;gap:6px;">'+
                '<span style="width:4px;height:4px;border-radius:50%;background:'+col+';flex-shrink:0;display:inline-block;"></span>'+esc(s)+'</div>';
        }).join("")+'</div>';
}

// Grouped skills — light background templates (comma-separated per category)
function SKILL_GROUPS(col) {
    var groups = _cv.skillGroups;
    if (!groups || !groups.length) return SKILL_LIST_2COL(col);
    return groups.filter(function(g) { return g.skills && g.skills.length; }).map(function(g) {
        return '<div style="margin-bottom:7px;">' +
            '<div style="font-size:6.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.8px;' +
            'color:' + col + ';margin-bottom:2px;">' + esc(g.category) + '</div>' +
            '<div style="font-size:9px;color:#555;line-height:1.65;">' +
            g.skills.map(esc).join(', ') + '</div></div>';
    }).join('');
}

// Grouped skills — dark sidebar templates (comma-separated per category)
function SKILL_GROUPS_DARK(col) {
    var groups = _cv.skillGroups;
    if (!groups || !groups.length) return SKILL_DOTS(col);
    return groups.filter(function(g) { return g.skills && g.skills.length; }).map(function(g) {
        return '<div style="margin-bottom:8px;">' +
            '<div style="font-size:6px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;' +
            'color:rgba(255,255,255,.38);margin-bottom:3px;">' + esc(g.category) + '</div>' +
            '<div style="font-size:8.5px;color:rgba(255,255,255,.75);line-height:1.65;">' +
            g.skills.map(esc).join(', ') + '</div></div>';
    }).join('');
}

function CROW(col, opts) {
    opts = opts||{}; var items=[_cv.email,_cv.phone,_cv.location,_cv.linkedIn].filter(Boolean);
    return '<div style="display:flex;flex-wrap:wrap;gap:'+(opts.gap||"4px 16px")+';font-size:'+(opts.sz||9)+'px;color:'+(opts.color||"#888")+';line-height:1.6;">'+
        items.map(function(x){ return '<span>'+esc(x)+'</span>'; }).join("")+'</div>';
}

function SEC(title, col, style, opts) {
    opts=opts||{}; style=style||"underline"; var sz=opts.sz||8, fw=opts.fw||700, tc=opts.tc||col, ls=opts.ls||"2.5px", mb=opts.mb||12;
    if (style==="underline")
        return '<div style="margin-bottom:'+mb+'px;"><div style="font-size:'+sz+'px;font-weight:'+fw+';text-transform:uppercase;letter-spacing:'+ls+';color:'+tc+';border-bottom:1.5px solid '+col+';padding-bottom:5px;margin-bottom:10px;">'+title+'</div>';
    if (style==="filled")
        return '<div style="margin-bottom:'+mb+'px;"><span style="display:inline-block;background:'+col+';color:#fff;font-size:'+sz+'px;font-weight:'+fw+';text-transform:uppercase;letter-spacing:'+ls+';padding:4px 12px;border-radius:3px;margin-bottom:10px;">'+title+'</span><div>';
    if (style==="dot")
        return '<div style="margin-bottom:'+mb+'px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="width:7px;height:7px;border-radius:50%;background:'+col+';flex-shrink:0;display:inline-block;"></span><span style="font-size:'+sz+'px;font-weight:'+fw+';text-transform:uppercase;letter-spacing:'+ls+';color:'+tc+';">'+title+'</span><div style="flex:1;height:1px;background:rgba('+hex2rgb(col)+',.18);"></div></div>';
    if (style==="side")
        return '<div style="margin-bottom:'+mb+'px;"><div style="border-left:3px solid '+col+';padding-left:10px;margin-bottom:10px;"><span style="font-size:'+sz+'px;font-weight:'+fw+';text-transform:uppercase;letter-spacing:'+ls+';color:'+tc+';">'+title+'</span></div>';
    if (style==="bar")
        return '<div style="margin-bottom:'+mb+'px;"><div style="background:rgba('+hex2rgb(col)+',.08);border-left:3px solid '+col+';padding:5px 10px;margin-bottom:10px;"><span style="font-size:'+sz+'px;font-weight:'+fw+';text-transform:uppercase;letter-spacing:'+ls+';color:'+tc+';">'+title+'</span></div>';
    if (style==="center")
        return '<div style="margin-bottom:'+mb+'px;text-align:center;"><div style="font-size:'+sz+'px;font-weight:'+fw+';text-transform:uppercase;letter-spacing:'+(opts.ls||"3.5px")+';color:'+tc+';margin-bottom:4px;">'+title+'</div><div style="width:36px;height:1.5px;background:'+col+';margin:0 auto 10px;opacity:.7;"></div>';
    if (style==="plain")
        return '<div style="margin-bottom:'+mb+'px;"><div style="font-size:'+sz+'px;font-weight:'+fw+';text-transform:uppercase;letter-spacing:'+ls+';color:'+tc+';margin-bottom:9px;">'+title+'</div>';
    return '<div style="margin-bottom:'+mb+'px;"><div style="font-size:'+sz+'px;font-weight:'+fw+';text-transform:uppercase;letter-spacing:'+ls+';color:'+tc+';border-bottom:1.5px solid '+col+';padding-bottom:5px;margin-bottom:10px;">'+title+'</div>';
}

function SI(txt, col) { return '<div style="font-size:9px;color:'+(col||"rgba(255,255,255,.78)")+';margin-bottom:6px;line-height:1.6;word-break:break-word;">'+txt+'</div>'; }
function SS(title, col, bord) { return '<div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:'+(col||"rgba(255,255,255,.38)")+';border-bottom:1px solid '+(bord||"rgba(255,255,255,.12)")+';padding-bottom:5px;margin:14px 0 8px;">'+title+'</div>'; }
function PHOTO(size, radius, border) { return _photo ? '<div style="text-align:center;margin-bottom:18px;"><img src="'+_photo+'" style="width:'+size+'px;height:'+size+'px;border-radius:'+radius+';object-fit:cover;border:'+border+';display:block;margin:0 auto;" /></div>' : ''; }

function EXTRA(opts) {
    var h=""; opts=opts||{}; var sz=opts.sz||9.5, col=opts.color||"#555";
    if (_cv.certifications && _cv.certifications.length)
        h += _cv.certifications.map(function(c){ return '<div style="font-size:'+sz+'px;color:'+col+';margin-bottom:4px;line-height:1.6;">&#10003; '+esc(c)+'</div>'; }).join("");
    if (_cv.languages && _cv.languages.length)
        h += '<div style="font-size:'+sz+'px;color:'+col+';margin-top:5px;line-height:1.9;">'+_cv.languages.map(esc).join("  ·  ")+'</div>';
    return h;
}

function TIPS() {
    // AI suggestions are intentionally hidden from the editor.
    // Users refine the CV using the Career Intelligence Center analysis tools instead.
    return "";
}

// ══════════════════════════════════════════════════════════════════════
// RENDER DISPATCH
// ── Scale template font sizes to professional A4 standards ─────────────
// Target: body text 10-11pt (13.3-14.7px), headings 12pt (16px),
//         section labels 9pt (12px), contact 9pt (12px).
// Scale factor: 1.42× applied to all fonts ≤ 20px.
// Name/display fonts > 20px are untouched.
function scaleTemplateFonts(html) {
    var factor    = 1.42;
    var threshold = 20;
    return html.replace(/font-size:([\d.]+)px/g, function(match, sizeStr) {
        var s = parseFloat(sizeStr);
        if (s <= threshold) {
            s = Math.round(s * factor * 10) / 10;
        }
        return 'font-size:' + s + 'px';
    });
}

// ══════════════════════════════════════════════════════════════════════
function renderPreview() {
    var area = document.getElementById("cvPreviewArea");
    if (!area || !_cv) return;
    var c = _accentColor;
    var map = {
        nexus: T_NEXUS, atlas: T_ATLAS, vega: T_VEGA, onyx: T_ONYX, prism: T_PRISM,
        volta: T_VOLTA, soleil: T_SOLEIL, forge: T_FORGE, lumis: T_LUMIS, coda: T_CODA
    };
    area.innerHTML = scaleTemplateFonts((map[_selectedTmpl] || T_NEXUS)(c));
    area.setAttribute("contenteditable", "true");
    area.setAttribute("spellcheck", "false");
    area.style.outline = "none";
}

// ══════════════════════════════════════════════════════════════════════
// 10 PREMIUM TEMPLATE DEFINITIONS
// ══════════════════════════════════════════════════════════════════════

/* ─────────────────────────────────────────────────────────────────────
   Shared micro-helpers used across premium templates
───────────────────────────────────────────────────────────────────── */
function SB_SKILL_BAR(s, pct, c) {
    return '<div style="margin-bottom:9px;">'+
        '<div style="font-size:8.5px;color:rgba(255,255,255,.88);margin-bottom:3px;font-family:inherit;">'+esc(s)+'</div>'+
        '<div style="height:3px;background:rgba(255,255,255,.15);border-radius:2px;">'+
        '<div style="height:3px;width:'+pct+'%;background:rgba(255,255,255,.68);border-radius:2px;"></div>'+
        '</div></div>';
}
function CONTACT_ROW_ICONS(col) {
    var items=[{v:_cv.email,i:"✉"},{v:_cv.phone,i:"✆"},{v:_cv.location,i:"◉"},{v:_cv.linkedIn,i:"⊞"}];
    return '<div style="display:flex;flex-wrap:wrap;gap:3px 14px;font-size:9px;color:'+col+';">'+
        items.filter(function(x){return !!x.v;}).map(function(x){return '<span>'+x.i+' '+esc(x.v)+'</span>';}).join("")+'</div>';
}
var _skillPcts=[92,85,78,90,72,88,68,82,76,95];

// ════════════════════════════════════════════════════════════════════
// PRESTIGE — Executive sidebar with visual skill bars
// ════════════════════════════════════════════════════════════════════
function T_NEXUS(c) {
    var sb =
        '<div style="width:228px;min-width:228px;background:'+c+';padding:34px 22px;color:#fff;min-height:800px;position:relative;overflow:hidden;">'+
        // Decorative circles
        '<div style="position:absolute;top:-52px;right:-52px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none;"></div>'+
        '<div style="position:absolute;bottom:60px;left:-55px;width:170px;height:170px;border-radius:50%;background:rgba(255,255,255,.03);pointer-events:none;"></div>'+
        // Photo + name
        PHOTO(98,"50%","4px solid rgba(255,255,255,.28)")+
        '<div style="font-size:17px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:4px;letter-spacing:-.025em;">'+esc(_cv.fullName)+'</div>'+
        '<div style="font-size:8.5px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:2.8px;margin-bottom:22px;font-weight:500;">'+esc(_cv.jobTitle)+'</div>'+
        // Thin divider
        '<div style="height:1px;background:linear-gradient(90deg,rgba(255,255,255,.35),rgba(255,255,255,.04));margin-bottom:20px;"></div>'+
        // Contact
        SS("Contact")+
        (_cv.email    ? SI("&#9993;  "+esc(_cv.email))    : "")+
        (_cv.phone    ? SI("&#9742;  "+esc(_cv.phone))    : "")+
        (_cv.location ? SI("&#9670;  "+esc(_cv.location)) : "")+
        (_cv.linkedIn ? SI(esc(_cv.linkedIn))            : "")+
        // Skills — grouped if available, else flat bars
        (_cv.skills && _cv.skills.length ?
            SS("Skills")+
            (function() {
                var groups = _cv.skillGroups;
                if (!groups || !groups.length)
                    return _cv.skills.map(function(s,i){return SB_SKILL_BAR(s,_skillPcts[i%10],c);}).join("");
                return groups.map(function(g) {
                    if (!g.skills || !g.skills.length) return "";
                    return '<div style="font-size:6px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.38);margin:9px 0 5px;">'+esc(g.category)+'</div>'+
                        g.skills.map(function(s,i){return SB_SKILL_BAR(s,_skillPcts[i%10],c);}).join("");
                }).join("");
            })() : "")+
        (_cv.languages && _cv.languages.length ?
            SS("Languages")+_cv.languages.map(function(l){return SI(esc(l));}).join("") : "")+
        (_cv.certifications && _cv.certifications.length ?
            SS("Certifications")+_cv.certifications.map(function(x){return SI("&#10003;  "+esc(x));}).join("") : "")+
        '</div>';

    var mn =
        '<div style="flex:1;padding:36px 32px;background:#fff;">'+
        (_cv.professionalSummary ?
            '<div style="margin-bottom:24px;padding:15px 18px;background:#f8f8fc;border-left:4px solid '+c+';border-radius:0 6px 6px 0;">'+
            '<p style="font-size:10.5px;color:#444;line-height:1.9;margin:0;font-style:italic;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        (_cv.experience && _cv.experience.length ?
            SEC("Work Experience",c,"underline",{sz:7.5,ls:"2px"})+
            EXP({hSz:12.5,ptSz:10,hColor:"#111",ptColor:"#555",bulletColor:c,mb:16})+"</div>":"")+
        (_cv.education && _cv.education.length ?
            SEC("Education",c,"underline",{sz:7.5,ls:"2px"})+EDU({hSz:12.5,ptSz:10})+"</div>":"")+
        TIPS()+'</div>';

    return '<div style="font-family:'+ff()+';display:flex;min-height:800px;">'+sb+mn+'</div>';
}

// ════════════════════════════════════════════════════════════════════
// MERIDIAN — Timeline experience with gradient header + photo
// ════════════════════════════════════════════════════════════════════
function T_ATLAS(c) {
    var g = 'linear-gradient(135deg,'+c+' 0%,'+mix(c,50)+' 100%)';
    var hdr =
        '<div style="background:'+g+';padding:32px 42px 26px;position:relative;overflow:hidden;">'+
        '<div style="position:absolute;left:-60px;bottom:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none;"></div>'+
        (_photo ? '<img src="'+_photo+'" style="width:86px;height:86px;border-radius:50%;object-fit:cover;border:4px solid rgba(255,255,255,.28);position:absolute;top:26px;right:42px;" />' : '')+
        '<div style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:.95;margin-bottom:7px;">'+esc(_cv.fullName)+'</div>'+
        '<div style="font-size:12.5px;color:rgba(255,255,255,.72);margin-bottom:14px;font-weight:400;">'+esc(_cv.jobTitle)+'</div>'+
        '<div style="height:1px;background:rgba(255,255,255,.2);margin-bottom:10px;"></div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:3px 16px;font-size:8.5px;color:rgba(255,255,255,.48);">'+
        [_cv.email,_cv.phone,_cv.location,_cv.linkedIn].filter(Boolean).map(esc).map(function(x){return '<span>'+x+'</span>';}).join("")+
        '</div></div>';

    // Timeline experience renderer
    function TIMELINE_EXP() {
        if (!_cv.experience || !_cv.experience.length) return "";
        return '<div style="position:relative;padding-left:20px;border-left:2px solid rgba('+hex2rgb(c)+',.18);margin-left:5px;">'+
            _cv.experience.map(function(e) {
                var pts = (e.points||[]).map(function(p){
                    return '<div style="font-size:10px;color:#555;padding-left:14px;position:relative;line-height:1.75;margin-bottom:1px;"><span style="position:absolute;left:3px;color:rgba('+hex2rgb(c)+',.5);">–</span>'+esc(p)+'</div>';
                }).join("");
                return '<div style="margin-bottom:18px;position:relative;">'+
                    '<div style="position:absolute;left:-25px;top:4px;width:9px;height:9px;border-radius:50%;background:'+c+';border:2px solid #fff;box-shadow:0 0 0 2px rgba('+hex2rgb(c)+',.3);"></div>'+
                    '<div style="font-size:12.5px;font-weight:700;color:#111;margin-bottom:4px;">'+esc(e.heading)+'</div>'+
                    pts+'</div>';
            }).join("")+'</div>';
    }

    var body =
        '<div style="padding:26px 42px;">'+
        (_cv.professionalSummary ?
            SEC("Profile",c,"dot",{sz:8})+
            '<p style="font-size:10.5px;color:#444;line-height:1.88;margin:0 0 6px;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        (_cv.experience && _cv.experience.length ?
            SEC("Experience",c,"dot",{sz:8})+TIMELINE_EXP()+"</div>":"")+
        '<div style="display:grid;grid-template-columns:3fr 2fr;gap:28px;">'+
        '<div>'+(_cv.education && _cv.education.length ? SEC("Education",c,"dot",{sz:8})+EDU({hSz:12.5,ptSz:10})+"</div>":"")+'</div>'+
        '<div>'+(_cv.skills && _cv.skills.length ? SEC("Skills",c,"dot",{sz:8})+SKILL_GROUPS(c)+"</div>":"")+
        ((_cv.certifications&&_cv.certifications.length)||(_cv.languages&&_cv.languages.length) ? SEC("Additional",c,"dot",{sz:8})+EXTRA()+"</div>" : "")+
        '</div></div>'+TIPS()+'</div>';

    return '<div style="font-family:'+ff()+';background:#fff;">'+hdr+body+'</div>';
}

// ════════════════════════════════════════════════════════════════════
// APEX — Swiss ultra-minimal, lots of whitespace
// ════════════════════════════════════════════════════════════════════
function T_VEGA(c) {
    return '<div style="font-family:\'Segoe UI\',\'Helvetica Neue\',Arial,sans-serif;background:#fff;padding:54px 66px;">'+
        '<div style="margin-bottom:44px;">'+
        '<div style="font-size:46px;font-weight:200;color:#111;letter-spacing:-.07em;line-height:.88;margin-bottom:12px;">'+esc(_cv.fullName)+'</div>'+
        '<div style="width:52px;height:3px;background:'+c+';border-radius:2px;margin-bottom:10px;"></div>'+
        '<div style="font-size:14px;color:#999;font-weight:300;margin-bottom:13px;letter-spacing:.01em;">'+esc(_cv.jobTitle)+'</div>'+
        '<div style="font-family:\'Courier New\',monospace;font-size:9px;color:#ccc;display:flex;flex-wrap:wrap;gap:4px 22px;">'+
        [_cv.email,_cv.phone,_cv.location,_cv.linkedIn].filter(Boolean).map(esc).map(function(x){return '<span>'+x+'</span>';}).join("")+
        '</div></div>'+
        (_cv.professionalSummary ?
            '<div style="margin-bottom:34px;max-width:560px;">'+
            '<p style="font-size:11px;color:#777;line-height:1.95;margin:0;font-weight:300;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        '<div style="height:1px;background:#f0f0f0;margin-bottom:30px;"></div>'+
        (_cv.experience && _cv.experience.length ?
            '<div style="margin-bottom:32px;">'+
            '<div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:#cccccc;margin-bottom:16px;">Experience</div>'+
            EXP({hSz:13,ptSz:10.5,hColor:"#111",ptColor:"#777",bulletColor:c,mb:20})+'</div>':"")+
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;">'+
        '<div>'+(_cv.education && _cv.education.length ?
            '<div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:#ccc;margin-bottom:10px;">Education</div>'+
            EDU({hSz:12,ptSz:10,hColor:"#111",ptColor:"#888"}):"")+
        '</div><div>'+(_cv.skills && _cv.skills.length ?
            '<div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:#ccc;margin-bottom:10px;">Skills</div>'+
            (function() {
                var groups = _cv.skillGroups;
                if (!groups || !groups.length)
                    return _cv.skills.map(function(s){return '<div style="font-size:10px;color:#777;line-height:2.1;font-weight:300;">'+esc(s)+'</div>';}).join("");
                return groups.filter(function(g){return g.skills&&g.skills.length;}).map(function(g) {
                    return '<div style="margin-bottom:8px;">'+
                        '<div style="font-size:6.5px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#ccc;margin-bottom:3px;">'+esc(g.category)+'</div>'+
                        '<div style="font-size:10px;color:#777;line-height:1.8;font-weight:300;">'+g.skills.map(esc).join(', ')+'</div></div>';
                }).join("");
            })():"")+
        '</div><div>'+((_cv.certifications&&_cv.certifications.length)||(_cv.languages&&_cv.languages.length) ?
            '<div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:#ccc;margin-bottom:10px;">Additional</div>'+
            EXTRA({sz:10,color:"#777"}):"")+
        '</div></div>'+TIPS()+'</div>';
}

// ════════════════════════════════════════════════════════════════════
// ECLIPSE — Full dark mode: deep sidebar + dark main
// ════════════════════════════════════════════════════════════════════
function T_ONYX(c) {
    var sb =
        '<div style="width:220px;min-width:220px;background:#0f172a;padding:32px 20px;min-height:800px;">'+
        PHOTO(92,"50%","3px solid "+c)+
        '<div style="font-size:16px;font-weight:800;color:#f1f5f9;line-height:1.2;margin-bottom:4px;">'+esc(_cv.fullName)+'</div>'+
        '<div style="font-size:9px;color:'+c+';font-weight:700;text-transform:uppercase;letter-spacing:1.8px;margin-bottom:22px;">'+esc(_cv.jobTitle)+'</div>'+
        SS("Contact","rgba(255,255,255,.28)","rgba(255,255,255,.08)")+
        (_cv.email    ? SI(esc(_cv.email),"rgba(255,255,255,.65)")    : "")+
        (_cv.phone    ? SI(esc(_cv.phone),"rgba(255,255,255,.65)")    : "")+
        (_cv.location ? SI(esc(_cv.location),"rgba(255,255,255,.65)") : "")+
        (_cv.linkedIn ? SI(esc(_cv.linkedIn),"rgba(255,255,255,.65)") : "")+
        (_cv.skills && _cv.skills.length ?
            SS("Skills","rgba(255,255,255,.28)","rgba(255,255,255,.08)")+
            SKILL_GROUPS_DARK(c):"")+
        (_cv.languages&&_cv.languages.length ?
            SS("Languages","rgba(255,255,255,.28)","rgba(255,255,255,.08)")+_cv.languages.map(function(l){return SI(esc(l),"rgba(255,255,255,.65)");}).join(""):"")+
        (_cv.certifications&&_cv.certifications.length ?
            SS("Certifications","rgba(255,255,255,.28)","rgba(255,255,255,.08)")+_cv.certifications.map(function(x){return SI("&#10003; "+esc(x),"rgba(255,255,255,.65)");}).join(""):"")+
        '</div>';

    var mn =
        '<div style="flex:1;padding:32px 28px;background:#1e293b;">'+
        (_cv.professionalSummary ?
            '<div style="margin-bottom:22px;padding:12px 16px;background:#0f172a;border-left:3px solid '+c+';border-radius:0 5px 5px 0;">'+
            '<p style="font-size:10px;color:rgba(255,255,255,.52);line-height:1.88;margin:0;font-style:italic;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        (_cv.experience && _cv.experience.length ?
            '<div style="margin-bottom:14px;"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:'+c+';border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:6px;margin-bottom:11px;">Experience</div>'+
            EXP({hSz:12,ptSz:10,hColor:"#f1f5f9",ptColor:"rgba(255,255,255,.55)",bulletColor:c,mb:14})+'</div>':"")+
        (_cv.education && _cv.education.length ?
            '<div style="margin-bottom:14px;"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:'+c+';border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:6px;margin-bottom:11px;">Education</div>'+
            EDU({hSz:12,ptSz:10,hColor:"#f1f5f9",ptColor:"rgba(255,255,255,.52)"})+'</div>':"")+
        TIPS()+'</div>';

    return '<div style="font-family:'+ff()+';display:flex;min-height:800px;">'+sb+mn+'</div>';
}

// ════════════════════════════════════════════════════════════════════
// VAULT — Elevated white cards on warm gray background
// ════════════════════════════════════════════════════════════════════
function T_PRISM(c) {
    var card = 'background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08);';
    return '<div style="font-family:'+ff()+';background:#eeece9;padding:22px 24px;">'+
        // Header card
        '<div style="'+card+'border-top:5px solid '+c+';padding:24px 26px;margin-bottom:14px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:18px;">'+
        '<div style="flex:1;">'+
        '<div style="font-size:28px;font-weight:800;color:#111;letter-spacing:-.035em;margin-bottom:5px;">'+esc(_cv.fullName)+'</div>'+
        '<div style="font-size:13px;font-weight:600;color:'+c+';margin-bottom:10px;">'+esc(_cv.jobTitle)+'</div>'+
        CROW(c,{sz:8.5,color:"#999",gap:"3px 14px"})+
        '</div>'+PHOTO(74,"50%","3px solid "+c)+
        '</div>'+
        (_cv.professionalSummary ?
            '<div style="margin-top:14px;padding-top:13px;border-top:1px solid #f0f0f0;"><p style="font-size:10px;color:#555;line-height:1.85;margin:0;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        '</div>'+
        // Experience card
        '<div style="'+card+'padding:22px 26px;margin-bottom:14px;">'+
        (_cv.experience && _cv.experience.length ?
            SEC("Work Experience",c,"bar",{sz:7.5})+
            EXP({hSz:12,ptSz:10,hColor:"#111",ptColor:"#555",bulletColor:c,mb:14})+"</div>":"")+'</div>'+
        // Bottom grid cards
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'+
        '<div style="'+card+'padding:20px 22px;">'+
        (_cv.education && _cv.education.length ? SEC("Education",c,"bar",{sz:7.5})+EDU({hSz:12,ptSz:10})+"</div>" : "")+'</div>'+
        '<div style="'+card+'padding:20px 22px;">'+
        (_cv.skills && _cv.skills.length ? SEC("Skills",c,"bar",{sz:7.5})+SKILL_GROUPS(c)+"</div>" : "")+
        ((_cv.certifications&&_cv.certifications.length)||(_cv.languages&&_cv.languages.length) ? SEC("Additional",c,"bar",{sz:7.5})+EXTRA()+"</div>" : "")+
        '</div></div>'+TIPS()+'</div>';
}

// ════════════════════════════════════════════════════════════════════
// IMPACT — Bold magazine typography
// ════════════════════════════════════════════════════════════════════
function T_VOLTA(c) {
    return '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;background:#fff;padding:44px 52px;">'+
        // Giant name section
        '<div style="border-top:3px solid #111;padding-top:14px;margin-bottom:14px;">'+
        '<div style="font-size:50px;font-weight:900;color:#111;letter-spacing:-.07em;line-height:.88;margin-bottom:10px;">'+esc(_cv.fullName)+'</div>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;">'+
        '<div style="height:3.5px;width:46px;background:'+c+';flex-shrink:0;"></div>'+
        '<div style="font-size:13.5px;font-weight:700;color:'+c+';text-transform:uppercase;letter-spacing:.12em;">'+esc(_cv.jobTitle)+'</div>'+
        '</div>'+
        '<div style="border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:22px;">'+
        CONTACT_ROW_ICONS("#aaa")+
        '</div>'+
        (_cv.professionalSummary ?
            '<div style="margin-bottom:24px;"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:#ddd;margin-bottom:8px;">&#8212; Profile</div>'+
            '<p style="font-size:10.5px;color:#333;line-height:1.92;margin:0;font-style:italic;max-width:580px;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        (_cv.experience && _cv.experience.length ?
            SEC("Experience",c,"filled")+
            EXP({hSz:12.5,ptSz:10,hColor:"#111",ptColor:"#444",bulletColor:c,mb:16})+"</div>":"")+
        '<div style="display:grid;grid-template-columns:3fr 2fr;gap:30px;">'+
        '<div>'+(_cv.education && _cv.education.length ? SEC("Education",c,"filled")+EDU({hSz:12,ptSz:10})+"</div>" : "")+'</div>'+
        '<div>'+(_cv.skills && _cv.skills.length ? SEC("Skills",c,"filled")+SKILL_GROUPS(c)+"</div>" : "")+
        ((_cv.certifications&&_cv.certifications.length)||(_cv.languages&&_cv.languages.length) ? SEC("Additional",c,"filled")+EXTRA()+"</div>" : "")+
        '</div></div>'+TIPS()+'</div>';
}

// ════════════════════════════════════════════════════════════════════
// SERENITY — Warm serif editorial with ornamental dividers
// ════════════════════════════════════════════════════════════════════
function T_SOLEIL(c) {
    var ornament = '<div style="text-align:center;margin:14px 0;"><span style="color:rgba('+hex2rgb(c)+',.45);font-size:11px;letter-spacing:10px;">&#10022; &#10022; &#10022;</span></div>';
    return '<div style="font-family:Georgia,\'Palatino Linotype\',serif;background:#fdf9f4;padding:44px 54px;">'+
        // Centered header
        '<div style="text-align:center;margin-bottom:4px;">'+
        '<div style="height:1px;background:linear-gradient(90deg,transparent,rgba('+hex2rgb(c)+',.4),transparent);margin-bottom:20px;"></div>'+
        PHOTO(96,"50%","3px solid rgba('+hex2rgb(c)+',.35)")+
        '<div style="font-size:34px;font-weight:700;color:#1e1208;letter-spacing:-.015em;margin-bottom:5px;">'+esc(_cv.fullName)+'</div>'+
        '<div style="font-size:13px;color:rgba('+hex2rgb(c)+',.85);font-style:italic;margin-bottom:9px;">'+esc(_cv.jobTitle)+'</div>'+
        '<div style="font-size:8.5px;color:#b8a888;font-family:Arial,sans-serif;margin-bottom:18px;">'+[_cv.email,_cv.phone,_cv.location,_cv.linkedIn].filter(Boolean).map(esc).join("  &#183;  ")+'</div>'+
        '<div style="height:1px;background:linear-gradient(90deg,transparent,rgba('+hex2rgb(c)+',.4),transparent);"></div>'+
        '</div>'+
        (_cv.professionalSummary ?
            ornament+'<p style="font-size:11px;color:#3d2d20;line-height:1.95;font-style:italic;margin:0 auto 22px;max-width:500px;text-align:center;">'+esc(_cv.professionalSummary)+'</p>':"")+
        '<div style="height:1px;background:rgba('+hex2rgb(c)+',.15);margin:0 0 24px;"></div>'+
        (_cv.experience && _cv.experience.length ?
            '<div style="margin-bottom:20px;">'+
            '<div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:rgba('+hex2rgb(c)+',.55);text-align:center;margin-bottom:5px;">Experience</div>'+
            '<div style="width:38px;height:1.5px;background:'+c+';margin:0 auto 14px;opacity:.65;"></div>'+
            EXP({hSz:12,ptSz:10,hColor:"#1e1208",ptColor:"#5a4030",bulletColor:"rgba('+hex2rgb(c)+',.5)",mb:15})+'</div>':"")+
        '<div style="height:1px;background:rgba('+hex2rgb(c)+',.12);margin:0 0 22px;"></div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;">'+
        '<div>'+(_cv.education && _cv.education.length ?
            '<div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:rgba('+hex2rgb(c)+',.55);text-align:center;margin-bottom:5px;">Education</div>'+
            '<div style="width:38px;height:1.5px;background:'+c+';margin:0 auto 14px;opacity:.65;"></div>'+
            EDU({hSz:12,ptSz:10,hColor:"#1e1208",ptColor:"#5a4030"}):"")+
        '</div><div>'+(_cv.skills && _cv.skills.length ?
            '<div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:rgba('+hex2rgb(c)+',.55);text-align:center;margin-bottom:5px;">Skills</div>'+
            '<div style="width:38px;height:1.5px;background:'+c+';margin:0 auto 14px;opacity:.65;"></div>'+
            SKILL_GROUPS(c):"")+
        '</div></div>'+TIPS()+'</div>';
}

// ════════════════════════════════════════════════════════════════════
// FORGE — Technical precision with thick accent bar
// ════════════════════════════════════════════════════════════════════
function T_FORGE(c) {
    return '<div style="font-family:'+ff()+';display:flex;min-height:800px;background:#fff;">'+
        '<div style="width:7px;background:'+c+';flex-shrink:0;"></div>'+
        '<div style="flex:1;padding:36px 38px;">'+
        // Header
        '<div style="margin-bottom:26px;">'+
        '<div style="font-size:34px;font-weight:800;color:'+c+';letter-spacing:-.04em;line-height:1;margin-bottom:6px;">'+esc(_cv.fullName)+'</div>'+
        '<div style="font-size:13px;color:#777;font-weight:400;margin-bottom:11px;">'+esc(_cv.jobTitle)+'</div>'+
        '<div style="height:1.5px;background:#f0f0f0;margin-bottom:10px;"></div>'+
        CROW(c,{sz:9,color:"#aaa",gap:"3px 18px"})+
        '</div>'+
        (_cv.professionalSummary ?
            SEC("About",c,"side")+
            '<p style="font-size:10.5px;color:#555;line-height:1.88;margin:0 0 6px;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        (_cv.experience && _cv.experience.length ?
            SEC("Experience",c,"side")+
            EXP({hSz:12.5,ptSz:10,hColor:"#111",ptColor:"#555",bulletColor:c,mb:15})+"</div>":"")+
        '<div style="display:grid;grid-template-columns:3fr 2fr;gap:26px;">'+
        '<div>'+(_cv.education && _cv.education.length ? SEC("Education",c,"side")+EDU({hSz:12,ptSz:10})+"</div>" : "")+'</div>'+
        '<div>'+(_cv.skills && _cv.skills.length ? SEC("Skills",c,"side")+SKILL_GROUPS(c)+"</div>" : "")+
        ((_cv.certifications&&_cv.certifications.length)||(_cv.languages&&_cv.languages.length) ? SEC("Additional",c,"side")+EXTRA()+"</div>" : "")+
        '</div></div>'+TIPS()+'</div></div>';
}

// ════════════════════════════════════════════════════════════════════
// LUMIS — Gradient sidebar with clean white main
// ════════════════════════════════════════════════════════════════════
function T_LUMIS(c) {
    var g='linear-gradient(180deg,'+c+' 0%,'+dark(c,32)+' 100%)';
    var sb =
        '<div style="width:215px;min-width:215px;background:'+g+';padding:32px 20px;min-height:800px;">'+
        PHOTO(92,"50%","4px solid rgba(255,255,255,.25)")+
        '<div style="font-size:16.5px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:4px;">'+esc(_cv.fullName)+'</div>'+
        '<div style="font-size:9px;color:rgba(255,255,255,.52);text-transform:uppercase;letter-spacing:2px;margin-bottom:20px;font-weight:500;">'+esc(_cv.jobTitle)+'</div>'+
        SS("Contact")+
        (_cv.email    ? SI(esc(_cv.email))    : "")+
        (_cv.phone    ? SI(esc(_cv.phone))    : "")+
        (_cv.location ? SI(esc(_cv.location)) : "")+
        (_cv.linkedIn ? SI(esc(_cv.linkedIn)) : "")+
        (_cv.skills && _cv.skills.length ?
            SS("Skills")+SKILL_GROUPS_DARK(c):"")+
        (_cv.languages && _cv.languages.length ? SS("Languages")+_cv.languages.map(function(l){return SI(esc(l));}).join(""):"")+
        (_cv.certifications && _cv.certifications.length ? SS("Certifications")+_cv.certifications.map(function(x){return SI("&#10003; "+esc(x));}).join(""):"")+
        '</div>';

    var mn =
        '<div style="flex:1;padding:34px 30px;background:#fff;">'+
        (_cv.professionalSummary ?
            SEC("Profile",c,"dot",{sz:8})+
            '<p style="font-size:10.5px;color:#444;line-height:1.9;margin:0 0 6px;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        (_cv.experience && _cv.experience.length ?
            SEC("Experience",c,"dot",{sz:8})+EXP({hSz:12.5,ptSz:10,hColor:"#111",ptColor:"#555",bulletColor:c,mb:14})+"</div>":"")+
        (_cv.education && _cv.education.length ?
            SEC("Education",c,"dot",{sz:8})+EDU({hSz:12.5,ptSz:10})+"</div>":"")+
        TIPS()+'</div>';

    return '<div style="font-family:'+ff()+';display:flex;min-height:800px;">'+sb+mn+'</div>';
}

// ════════════════════════════════════════════════════════════════════
// ROYAL — C-suite executive with floating card body
// ════════════════════════════════════════════════════════════════════
function T_CODA(c) {
    return '<div style="font-family:'+ff()+';background:#e8e6e1;">'+
        // Header band
        '<div style="background:'+c+';padding:26px 40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">'+
        '<div>'+
        '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:rgba(255,255,255,.38);margin-bottom:8px;">Curriculum Vitae</div>'+
        '<div style="font-size:29px;font-weight:700;color:#fff;letter-spacing:-.025em;margin-bottom:4px;">'+esc(_cv.fullName)+'</div>'+
        '<div style="font-size:12.5px;color:rgba(255,255,255,.62);margin-bottom:9px;">'+esc(_cv.jobTitle)+'</div>'+
        '<div style="font-size:8.5px;color:rgba(255,255,255,.38);">'+[_cv.email,_cv.phone,_cv.location,_cv.linkedIn].filter(Boolean).map(esc).join("   &#183;   ")+'</div>'+
        '</div>'+
        '<div style="width:56px;height:56px;border:2px solid rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:26px;color:rgba(255,255,255,.28);">&#10022;</div>'+
        '</div>'+
        // Floating white card
        '<div style="margin:16px;background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.1);padding:26px 30px;">'+
        (_cv.professionalSummary ?
            '<div style="margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid #f0f0f0;">'+
            '<p style="font-size:10.5px;color:#444;line-height:1.88;margin:0;font-style:italic;">'+esc(_cv.professionalSummary)+'</p></div>':"")+
        (_cv.experience && _cv.experience.length ?
            SEC("Professional Experience",c,"underline",{sz:7.5})+
            EXP({hSz:12,ptSz:10,hColor:"#111",ptColor:"#555",bulletColor:c,mb:15})+"</div>":"")+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">'+
        '<div>'+(_cv.education && _cv.education.length ? SEC("Education",c,"underline",{sz:7.5})+EDU({hSz:12,ptSz:10})+"</div>":"")+'</div>'+
        '<div>'+(_cv.skills && _cv.skills.length ? SEC("Skills",c,"underline",{sz:7.5})+SKILL_GROUPS(c)+"</div>":"")+
        ((_cv.certifications&&_cv.certifications.length)||(_cv.languages&&_cv.languages.length) ? SEC("Additional",c,"underline",{sz:7.5})+EXTRA()+"</div>":"")+'</div>'+
        '</div></div>'+TIPS()+'</div>';
}

// ══════════════════════════════════════════════════════════════════════
// QUICK EDIT
// ══════════════════════════════════════════════════════════════════════
function initQuickEdit() {
    function dQ(fn, ms) { var t; return function() { clearTimeout(t); t = setTimeout(fn, ms); }; }
    ["fullName","jobTitle","email","phone","location","summary"].forEach(function(f) {
        var el = document.getElementById("qe-"+f); if (!el) return;
        el.addEventListener("input", (function(field, elem) {
            return dQ(function() {
                if (!_cv) return;
                if (field==="fullName") _cv.fullName = elem.value;
                if (field==="jobTitle") _cv.jobTitle = elem.value;
                if (field==="email")    _cv.email    = elem.value;
                if (field==="phone")    _cv.phone    = elem.value;
                if (field==="location") _cv.location = elem.value;
                if (field==="summary")  _cv.professionalSummary = elem.value;
                renderPreview();
            }, 280);
        })(f, el));
    });
}

function populateQuickEdit() {
    if (!_cv) return;
    var m = {
        "qe-fullName": _cv.fullName, "qe-jobTitle": _cv.jobTitle, "qe-email": _cv.email,
        "qe-phone": _cv.phone, "qe-location": _cv.location, "qe-summary": _cv.professionalSummary
    };
    Object.keys(m).forEach(function(id) { var el = document.getElementById(id); if (el) el.value = m[id]||""; });
}

// ══════════════════════════════════════════════════════════════════════
// DOWNLOAD + SAVE
// ══════════════════════════════════════════════════════════════════════
function doDownload(url, body, filename) {
    return fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) })
        .then(function(r) { if (!r.ok) throw new Error("Download failed ("+r.status+"). Check server logs."); return r.blob(); })
        .then(function(blob) {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        })
        .catch(function(e) { alert(e.message); });
}

function getRenderedHtml() {
    var a = document.getElementById("cvPreviewArea");
    return a ? a.innerHTML : "";
}

function setDlBusy(btnId, busy, label) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = busy;
    btn.innerHTML = busy ? "&#9203; " + (label || "...") : btn._origLabel || btn.innerHTML;
    if (!busy && btn._origLabel) btn.innerHTML = btn._origLabel;
}

// ── Shared: capture a preview element to canvas (html2canvas) ──────────
function exportCapture(sourceId, callback) {
    var source = document.getElementById(sourceId);
    if (!source) { alert("Preview not found."); return; }
    if (typeof html2canvas === "undefined") {
        alert("Export library not loaded — please refresh the page and try again.");
        return;
    }
    var ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(function() {
        html2canvas(source, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
            onclone: function(clonedDoc) {
                clonedDoc.querySelectorAll(
                    ".cv-ai-tips, .cl-ai-tips, .cv-tb-handle"
                ).forEach(function(el) { el.style.display = "none"; });
                var hint = clonedDoc.getElementById("clEditHint");
                if (hint) hint.style.display = "none";
            }
        }).then(callback).catch(function(e) {
            console.error("Export error:", e);
            alert("Export failed. Please try again.");
        });
    });
}

// ── Helper: set button busy/idle state ────────────────────────────────
function setBusy(btnId, busy) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = busy;
    if (busy) { btn._orig = btn.innerHTML; btn.innerHTML = "&#9203; Exporting&#8230;"; }
    else if (btn._orig) { btn.innerHTML = btn._orig; }
}

// ── PDF: canvas → jsPDF (no print dialog) ─────────────────────────────
function exportAsPdf(sourceId, filename, btnId) {
    setBusy(btnId, true);
    exportCapture(sourceId, function(canvas) {
        try {
            var jsPDF = (window.jspdf || {}).jsPDF;
            if (!jsPDF) { alert("PDF library not loaded — please refresh."); setBusy(btnId, false); return; }
            var pdf     = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            var pageW   = pdf.internal.pageSize.getWidth();
            var pageH   = pdf.internal.pageSize.getHeight();
            var imgData = canvas.toDataURL("image/jpeg", 0.95);
            var imgW    = pageW;
            var imgH    = (canvas.height * pageW) / canvas.width;
            var y       = 0;

            pdf.addImage(imgData, "JPEG", 0, y, imgW, imgH);
            var remaining = imgH - pageH;
            while (remaining > 0.5) {
                y -= pageH;
                pdf.addPage();
                pdf.addImage(imgData, "JPEG", 0, y, imgW, imgH);
                remaining -= pageH;
            }
            pdf.save(filename);
        } catch(e) {
            alert("PDF error: " + e.message);
        }
        setBusy(btnId, false);
    });
}

// ── PNG: canvas → direct download ────────────────────────────────────
function exportAsPng(sourceId, filename, btnId) {
    setBusy(btnId, true);
    exportCapture(sourceId, function(canvas) {
        var a = document.createElement("a");
        a.download = filename;
        a.href = canvas.toDataURL("image/png");
        a.click();
        setBusy(btnId, false);
    });
}

function dlPdf() {
    if (!_cv) { alert("No CV data. Please go back and generate your CV first."); return; }
    var n = (_cv.fullName || "CV").replace(/\s+/g, "_");
    exportAsPdf("cvPreviewArea", n + "_CV.pdf", "dlPdfBtn");
}

function dlPng() {
    if (!_cv) { alert("No CV data. Please go back and generate your CV first."); return; }
    var n = (_cv.fullName || "CV").replace(/\s+/g, "_");
    exportAsPng("cvPreviewArea", n + "_CV.png", "dlPngBtn");
}

// ── Build a proper DOCX from structured CV data ───────────────────────
function buildCVDocx(cv, photo, accentColor) {
    var hex = ((accentColor || "#1a1a2e").replace("#", "") || "1a1a2e").toUpperCase();

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
        if (o.font)  x += '<w:rFonts w:ascii="' + o.font + '" w:hAnsi="' + o.font + '"/>';
        if (o.ls)    x += '<w:spacing w:val="' + o.ls + '"/>';
        return "<w:rPr>" + x + "</w:rPr>";
    }
    function r(text, o) {
        if (text == null) return "";
        return "<w:r>" + rpr(o || {}) + '<w:t xml:space="preserve">' + xe(text) + "</w:t></w:r>";
    }
    function ppr(o) {
        o = o || {};
        var x = "";
        if (o.jc)  x += '<w:jc w:val="' + o.jc + '"/>';
        if (o.sa !== undefined || o.sb !== undefined)
            x += '<w:spacing w:after="' + (o.sa || 0) + '" w:before="' + (o.sb || 0) + '"/>';
        if (o.ind) x += '<w:ind w:left="' + o.ind + '"/>';
        if (o.bdr) x += '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="' + o.bdr + '"/></w:pBdr>';
        return "<w:pPr>" + x + "</w:pPr>";
    }
    function p(runs, o) { return "<w:p>" + ppr(o) + runs + "</w:p>"; }
    function empty()    { return p("", { sa: 80 }); }
    function hr(color)  { return p("", { bdr: color || "CCCCCC", sa: 100, sb: 80 }); }
    function section(title) {
        return p(r(title.toUpperCase(), { b: true, size: 8.5, color: hex, ls: 300 }), { sa: 80, sb: 240 }) + hr(hex);
    }

    var body = "";

    // Profile photo (1 inch circle, centered)
    if (photo) {
        body += '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr><w:r><w:rPr/>' +
            '<w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">' +
            '<wp:extent cx="914400" cy="914400"/><wp:effectExtent l="0" t="0" r="0" b="0"/>' +
            '<wp:docPr id="1" name="Photo"/>' +
            '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
            '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
            '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
            '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
            '<pic:nvPicPr><pic:cNvPr id="0" name="Photo"/><pic:cNvPicPr/></pic:nvPicPr>' +
            '<pic:blipFill><a:blip r:embed="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>' +
            '<a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
            '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm>' +
            '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom></pic:spPr>' +
            '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    }

    // Name
    body += p(r(cv.fullName || "", { b: true, size: 24, font: "Georgia" }), { jc: "center", sa: 60 });

    // Job title
    if (cv.jobTitle)
        body += p(r(cv.jobTitle, { i: true, size: 12, color: "555555" }), { jc: "center", sa: 60 });

    // Contact line
    var contacts = [cv.email, cv.phone, cv.location, cv.linkedIn].filter(Boolean).join("  ·  ");
    if (contacts)
        body += p(r(contacts, { size: 9, color: "888888" }), { jc: "center", sa: 200 });

    body += hr();

    // Summary
    if (cv.professionalSummary)
        body += p(r(cv.professionalSummary, { i: true, size: 10.5, color: "333333" }), { jc: "center", sa: 240 }) + hr();

    // Experience
    if (cv.experience && cv.experience.length) {
        body += section("Experience");
        cv.experience.forEach(function(exp) {
            body += p(r(exp.heading || "", { b: true, size: 11 }), { sa: 60, sb: 140 });
            (exp.points || []).forEach(function(pt) {
                body += p(r("– " + pt, { size: 10, color: "333333" }), { ind: "360", sa: 40 });
            });
        });
        body += empty();
    }

    // Education
    if (cv.education && cv.education.length) {
        body += section("Education");
        cv.education.forEach(function(edu) {
            body += p(r(edu.heading || "", { b: true, size: 11 }), { sa: 60, sb: 140 });
            (edu.points || []).forEach(function(pt) {
                body += p(r(pt, { size: 10, color: "555555" }), { sa: 40 });
            });
        });
        body += empty();
    }

    // Skills
    var groups = cv.skillGroups && cv.skillGroups.length;
    if (groups || (cv.skills && cv.skills.length)) {
        body += section("Skills");
        if (groups) {
            cv.skillGroups.filter(function(g) { return g.skills && g.skills.length; }).forEach(function(g) {
                body += "<w:p><w:pPr><w:spacing w:after=\"60\"/></w:pPr>" +
                    r(g.category + ": ", { b: true, size: 10, color: hex }) +
                    r(g.skills.join(", "), { size: 10, color: "333333" }) + "</w:p>";
            });
        } else {
            body += p(r(cv.skills.join(", "), { size: 10 }), { sa: 80 });
        }
        body += empty();
    }

    // Certifications
    if (cv.certifications && cv.certifications.length) {
        body += section("Certifications");
        cv.certifications.forEach(function(c) { body += p(r("✓ " + c, { size: 10 }), { sa: 60 }); });
        body += empty();
    }

    // Languages
    if (cv.languages && cv.languages.length) {
        body += section("Languages");
        body += p(r(cv.languages.join("  ·  "), { size: 10 }), { sa: 80 });
    }

    body += '<w:sectPr>' +
        '<w:pgSz w:w="11906" w:h="16838"/>' +
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>' +
        '</w:sectPr>';

    var NS = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
        'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable=""';

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document ' + NS + '><w:body>' + body + '</w:body></w:document>';
}

function dlDocx() {
    if (!_cv) { alert("No CV data. Please go back and generate your CV first."); return; }

    setBusy("dlDocxBtn", true);

    var payload = {
        cv:          _cv,
        templateId:  _selectedTmpl  || "nexus",
        accentColor: _accentColor   || "#1a1a2e",
        photoBase64: _photo         || null
    };

    fetch("/api/download/cv/docx", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
    })
    .then(function(res) {
        if (!res.ok) {
            return res.json().then(function(e) { throw new Error(e.message || "DOCX generation failed."); });
        }
        return res.blob();
    })
    .then(function(blob) {
        var name = (_cv.fullName || "CV").replace(/\s+/g, "_");
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name + "_CV.docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    })
    .catch(function(e) {
        alert("DOCX export failed: " + (e.message || "Unknown error"));
    })
    .finally(function() {
        setBusy("dlDocxBtn", false);
    });
}

function saveCV() {
    if (!_cv) return;
    var btn = document.getElementById("saveBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = "&#9203; Saving..."; }
    var saveBody = {
        userId:       "",
        cvTitle:      (_cv.fullName || _cv.jobTitle || "My CV"),
        templateId:   _selectedTmpl,
        accentColor:  _accentColor,
        cvDataJson:   JSON.stringify(_cv),
        formDataJson: "{}",
        status:       "complete"
    };
    // Only include id and photoBase64 when they have values —
    // JSON.stringify omits undefined, so the C# property default kicks in.
    if (_cvRecordId) saveBody.id = _cvRecordId;
    if (_photo)      saveBody.photoBase64 = _photo;

    fetch("/api/cv-storage/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveBody)
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(r) {
        if (!r.ok) {
            if (btn) { btn.disabled = false; btn.innerHTML = "&#128190; Save"; }
            alert("Save failed: " + (r.data.message || "Server error"));
            return;
        }
        if (r.data && r.data.id) _cvRecordId = r.data.id;
        if (btn) btn.innerHTML = "&#10003; Saved!";
        setTimeout(function() { if (btn) { btn.disabled = false; btn.innerHTML = "&#128190; Save"; } }, 2000);
    })
    .catch(function() {
        if (btn) { btn.disabled = false; btn.innerHTML = "&#128190; Save"; }
        alert("Save failed. Please try again.");
    });
}

// ══════════════════════════════════════════════════════════════════════
// LOAD
// ══════════════════════════════════════════════════════════════════════
function loadCVData() {
    try {
        var s = sessionStorage.getItem("craftiq_cv");
        if (s) {
            _cv = JSON.parse(s); _photo = sessionStorage.getItem("craftiq_photo")||null;
            populateQuickEdit(); buildTemplateGrid(); updateColorUI(); renderPreview(); return;
        }
    } catch(e) {}
    if (_cvRecordId && _cvRecordId !== "") {
        fetch("/api/cv-storage/"+_cvRecordId)
            .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
            .then(function(rec) {
                if (rec.cvDataJson) { try { _cv = JSON.parse(rec.cvDataJson); } catch(e) {} }
                if (rec.photoBase64) _photo = rec.photoBase64;
                if (rec.templateId)  _selectedTmpl = getTmpl(rec.templateId).id;
                if (rec.accentColor) _accentColor  = rec.accentColor;
                if (_cv) { populateQuickEdit(); buildTemplateGrid(); updateColorUI(); renderPreview(); }
                else loadFromAutosave();
            }).catch(loadFromAutosave);
    } else { loadFromAutosave(); }
}

function loadFromAutosave() {
    fetch("/api/cv-storage/autosave")
        .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function(d) {
            if (d && d.cvDataJson) { try { _cv = JSON.parse(d.cvDataJson); } catch(e) {} }
            if (d && d.photoBase64) _photo = d.photoBase64;
            if (_cv) { populateQuickEdit(); buildTemplateGrid(); updateColorUI(); renderPreview(); }
            else showNoCVMsg();
        }).catch(showNoCVMsg);
}

function showNoCVMsg() {
    var a = document.getElementById("cvPreviewArea"); if (!a) return;
    a.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:520px;gap:14px;text-align:center;">'+
        '<div style="font-size:3.5rem;">&#128196;</div>'+
        '<div style="font-family:var(--serif);font-weight:700;font-size:1.1rem;color:var(--dark);">No CV found</div>'+
        '<div style="font-size:.85rem;color:var(--muted);max-width:280px;line-height:1.65;">Go back to CV Builder, fill in your details and click &#8220;Get My CV&#8221;.</div>'+
        '<a href="/Home/CVBuilder" style="margin-top:4px;padding:.65rem 1.4rem;background:var(--green);color:#fff;border-radius:9px;font-size:.85rem;font-weight:600;text-decoration:none;display:inline-block;">&#8592; Back to CV Builder</a></div>';
}

// ══════════════════════════════════════════════════════════════════════
// DRAGGABLE TEXT BOXES
// ══════════════════════════════════════════════════════════════════════
function _makeDraggable(el, handle) {
    var sx, sy, sl, st;
    handle.addEventListener("mousedown", function(e) {
        if (e.target.classList.contains("cv-tb-del")) return;
        e.preventDefault();
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(el.style.left)||0; st = parseInt(el.style.top)||0;
        function onMove(ev) {
            el.style.left = (sl + ev.clientX - sx) + "px";
            el.style.top  = (st + ev.clientY - sy) + "px";
        }
        function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup",  onUp);
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup",  onUp);
    });
}

function addTextBox() {
    var area = document.getElementById("cvPreviewArea");
    if (!area) return;
    area.style.position = "relative";

    var box = document.createElement("div");
    box.className = "cv-textbox";
    box.style.cssText = "position:absolute;left:80px;top:80px;min-width:160px;min-height:44px;"+
        "border:1.5px dashed #aaa;border-radius:4px;padding:2px;"+
        "background:rgba(255,255,255,.96);z-index:200;box-shadow:0 2px 8px rgba(0,0,0,.08);";

    var handle = document.createElement("div");
    handle.className = "cv-tb-handle";
    handle.style.cssText = "cursor:move;height:18px;background:#f0ede8;border-bottom:1px solid #e0dbd2;"+
        "border-radius:3px 3px 0 0;padding:0 7px;display:flex;align-items:center;"+
        "justify-content:space-between;font-size:8.5px;color:#999;user-select:none;";
    handle.innerHTML = '&#8943; Text Box '+
        '<span class="cv-tb-del" title="Delete" style="cursor:pointer;color:#c33;font-weight:700;'+
        'font-size:10px;padding:0 2px;">&#10005;</span>';

    var content = document.createElement("div");
    content.contentEditable = "true";
    content.style.cssText = "outline:none;min-height:28px;padding:6px 8px;font-size:11px;"+
        "font-family:Arial,sans-serif;color:#222;line-height:1.6;";
    content.textContent = "Type here…";
    content.addEventListener("focus", function() {
        if (content.textContent === "Type here…") content.textContent = "";
        box.style.borderColor = "#888"; box.style.borderStyle = "solid";
    });
    content.addEventListener("blur", function() {
        if (!content.textContent.trim()) content.textContent = "Type here…";
        box.style.borderColor = "#aaa"; box.style.borderStyle = "dashed";
    });
    handle.querySelector(".cv-tb-del").addEventListener("click", function(e) {
        e.stopPropagation(); box.parentNode && box.parentNode.removeChild(box);
    });

    box.appendChild(handle);
    box.appendChild(content);
    area.appendChild(box);
    _makeDraggable(box, handle);
    content.focus();
}

// ── Workspace switching ────────────────────────────────────────
var _activeWorkspace = "cv";

function switchWorkspace(type) {
    if (_activeWorkspace === type) return;
    _activeWorkspace = type;

    var cvContent  = document.getElementById("cvSidebarContent");
    var clContent  = document.getElementById("clSidebarContent");
    var cvPreview  = document.getElementById("previewAreaWrap");
    var clPreview  = document.getElementById("clPreviewWrap");
    var cvBar      = document.getElementById("cvActionBar");
    var clBar      = document.getElementById("clActionBar");
    var wsTitle    = document.getElementById("wsTitle");
    var wsSub      = document.getElementById("wsSubtitle");
    var badge      = document.getElementById("activeTmplName");

    if (type === "cl") {
        if (cvContent) cvContent.style.display = "none";
        if (clContent) { clContent.style.display = "flex"; clContent.style.flexDirection = "column"; }
        if (cvPreview) cvPreview.style.display = "none";
        if (clPreview) clPreview.style.display = "block";
        if (cvBar)     cvBar.style.display     = "none";
        if (clBar)     clBar.style.display      = "flex";
        if (wsTitle)   wsTitle.textContent      = "Cover Letter";
        if (wsSub)     wsSub.textContent        = "Generate · Edit inline · Export";
        if (badge)     badge.style.display      = "none";

        // Init CL workspace (once)
        if (typeof initCLWorkspace === "function") initCLWorkspace();

        // Update CIC subtitle
        var cicSub = document.getElementById("cicSubtitle");
        if (cicSub) cicSub.textContent = "Review your CV · Analyze your cover letter · Prepare for interviews";
    } else {
        if (cvContent) cvContent.style.display = "flex";
        if (clContent) clContent.style.display = "none";
        if (cvPreview) cvPreview.style.display = "block";
        if (clPreview) clPreview.style.display = "none";
        if (cvBar)     cvBar.style.display     = "flex";
        if (clBar)     clBar.style.display     = "none";
        if (wsTitle)   wsTitle.textContent     = "CV Builder";
        if (wsSub)     wsSub.textContent       = "Select · Colour · Edit inline · Download";
        if (badge)     badge.style.display     = "";
    }

    // Update switcher button states
    document.querySelectorAll(".ws-btn").forEach(function(btn) {
        btn.classList.toggle("active", btn.dataset.ws === type);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    buildTemplateGrid(); initColorPicker(); initToolbar(); initQuickEdit(); loadCVData();
});
