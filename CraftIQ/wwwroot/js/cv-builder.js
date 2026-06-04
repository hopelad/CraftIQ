// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
var _photo = null;
var _cv = null;
var _expN = 1;
var _eduN = 1;
var _skills = [];
var _certifications = [];
var _languages = [];
var _autoSaveTimer = null;
var _lastSaved = null;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function esc(t) {
    return String(t || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function val(id) {
    var e = document.getElementById(id);
    return e ? e.value.trim() : "";
}
function setVal(id, v) {
    var e = document.getElementById(id);
    if (e) e.value = v || "";
}

// ─────────────────────────────────────────────
// GENERIC TAG INPUT
// ─────────────────────────────────────────────
function initTagInput(wrapId, inputId, arr, hiddenId) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;

    wrap.addEventListener("click", function () { input.focus(); });

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            var text = input.value.trim().replace(/,$/, "");
            if (text && !arr.includes(text)) {
                arr.push(text);
                renderTags(wrapId, inputId, arr, hiddenId);
            }
            input.value = "";
        } else if (e.key === "Backspace" && input.value === "" && arr.length) {
            arr.pop();
            renderTags(wrapId, inputId, arr, hiddenId);
        }
    });
}

function renderTags(wrapId, inputId, arr, hiddenId) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;

    wrap.querySelectorAll(".tag").forEach(function (t) { t.remove(); });

    arr.forEach(function (s, idx) {
        var tag = document.createElement("span");
        tag.className = "tag";
        tag.innerHTML = esc(s) +
            '<button class="tag-remove" type="button" ' +
            'onclick="removeTag(\'' + wrapId + '\',\'' +
            inputId + '\',' + idx + ',\'' + hiddenId + '\')">&times;</button>';
        wrap.insertBefore(tag, input);
    });

    var hidden = document.getElementById(hiddenId);
    if (hidden) hidden.value = arr.join(", ");
}

function removeTag(wrapId, inputId, idx, hiddenId) {
    if (wrapId === "skillsWrap") {
        _skills.splice(idx, 1);
        renderTags(wrapId, inputId, _skills, hiddenId);
    }
    if (wrapId === "certsWrap") {
        _certifications.splice(idx, 1);
        renderTags(wrapId, inputId, _certifications, hiddenId);
    }
    if (wrapId === "langsWrap") {
        _languages.splice(idx, 1);
        renderTags(wrapId, inputId, _languages, hiddenId);
    }
}

function setTagArray(wrapId, inputId, arr, targetArr, hiddenId) {
    targetArr.length = 0;
    arr.forEach(function (s) {
        if (s && !targetArr.includes(s)) targetArr.push(s);
    });
    renderTags(wrapId, inputId, targetArr, hiddenId);
}

function toArray(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    return v.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
}

// ─────────────────────────────────────────────
// EXPERIENCE BLOCKS
// ─────────────────────────────────────────────
function expHtml(n) {
    return '<div class="repeat-head">' +
        '<span class="repeat-title">&#128188; Experience #' + n + '</span>' +
        (n > 1 ? '<button type="button" class="btn-remove" ' +
            'onclick="removeBlock(\'exp-' + n + '\')">&#10005; Remove</button>' : '') +
        '</div>' +
        '<div class="fr">' +
        fgInput("Job Title", "exp-job-" + n, "e.g. Software Engineer", false) +
        fgInput("Company Name", "exp-co-" + n, "e.g. Google", false) +
        '</div>' +
        '<div class="fr">' +
        fgInput("Location", "exp-loc-" + n, "e.g. Seattle, USA", false) +
        fgInput("Start Date", "exp-start-" + n, "e.g. Jan 2022", false) +
        '</div>' +
        '<div class="fr">' +
        fgInput("End Date", "exp-end-" + n, "e.g. Dec 2024 or Present", false) +
        '</div>' +
        '<div class="fg" style="margin-bottom:.5rem;">' +
        '<label>Key Responsibilities ' +
        '<small style="font-weight:400;color:var(--muted);">(3–5 bullet points)</small>' +
        '<button type="button" class="btn-improve-bullet" onclick="openBulletImprover(' + n + ')" title="Improve with AI">&#10024; Improve with AI</button>' +
        '</label>' +
        '<textarea id="exp-resp-' + n + '" rows="4" ' +
        'placeholder="Built REST APIs serving 50k+ daily users&#10;' +
        'Reduced latency by 40% through optimization&#10;' +
        'Led a team of 4 engineers to ship on schedule"></textarea>' +
        '<div id="bullet-improve-hint-' + n + '" style="font-size:.68rem;color:var(--muted);margin-top:3px;font-family:var(--mono);display:none;">After generation, click &#10024; Improve with AI to enhance these bullets.</div>' +
        '</div>';
}

function eduHtml(n) {
    return '<div class="repeat-head">' +
        '<span class="repeat-title">&#127979; Education #' + n + '</span>' +
        (n > 1 ? '<button type="button" class="btn-remove" ' +
            'onclick="removeBlock(\'edu-' + n + '\')">&#10005; Remove</button>' : '') +
        '</div>' +
        '<div class="fr">' +
        fgInput("Degree / Qualification *", "edu-degree-" + n,
            "e.g. BSc Computer Engineering", true) +
        fgInput("Institution *", "edu-school-" + n,
            "e.g. University of London", true) +
        '</div>' +
        '<div class="fr">' +
        fgInput("Location", "edu-loc-" + n, "e.g. London, UK", false) +
        fgInput("Graduation Year *", "edu-year-" + n,
            "e.g. 2025 or Expected 2026", true) +
        '</div>';
}

function fgInput(label, id, ph, req) {
    return '<div class="fg">' +
        '<label>' + label + (req ? ' <span class="req">*</span>' : '') + '</label>' +
        '<input type="text" id="' + id + '" placeholder="' + ph + '" />' +
        '</div>';
}

function addExp() {
    _expN++;
    var c = document.getElementById("expContainer");
    var d = document.createElement("div");
    d.id = "exp-" + _expN;
    d.className = "repeat-block";
    d.innerHTML = expHtml(_expN);
    c.appendChild(d);
}

function addEdu() {
    _eduN++;
    var c = document.getElementById("eduContainer");
    var d = document.createElement("div");
    d.id = "edu-" + _eduN;
    d.className = "repeat-block";
    d.innerHTML = eduHtml(_eduN);
    c.appendChild(d);
}

function removeBlock(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
}

// ─────────────────────────────────────────────
// COLLECT FORM DATA
// ─────────────────────────────────────────────
function collect() {
    var d = {
        fullName: val("fullName"),
        jobTitle: val("jobTitle"),
        email: val("email"),
        phone: val("phone"),
        location: val("location"),
        linkedin: val("linkedin"),
        summary: val("summary"),
        skills: _skills.join(", "),
        certifications: _certifications.join(", "),
        languages: _languages.join(", "),
        jobRequirements: val("jobRequirements"),
        experience: [],
        education: []
    };

    document.querySelectorAll("#expContainer > div[id^='exp-']").forEach(function (b) {
        var n = b.id.replace("exp-", "");
        var job = val("exp-job-" + n);
        var co = val("exp-co-" + n);
        var resp = val("exp-resp-" + n);
        if (job || co || resp) {
            d.experience.push({
                jobTitle: job,
                company: co,
                location: val("exp-loc-" + n),
                startDate: val("exp-start-" + n),
                endDate: val("exp-end-" + n),
                responsibilities: resp
            });
        }
    });

    document.querySelectorAll("#eduContainer > div[id^='edu-']").forEach(function (b) {
        var n = b.id.replace("edu-", "");
        var deg = val("edu-degree-" + n);
        var sch = val("edu-school-" + n);
        if (!deg && !sch) return;
        d.education.push({
            degree: deg,
            institution: sch,
            location: val("edu-loc-" + n),
            graduationYear: val("edu-year-" + n)
        });
    });

    return d;
}

// ─────────────────────────────────────────────
// FILL FORM FROM DATA
// ─────────────────────────────────────────────
function fillForm(d) {
    if (!d) return;
    setVal("fullName", d.fullName);
    setVal("jobTitle", d.jobTitle);
    setVal("email", d.email);
    setVal("phone", d.phone);
    setVal("location", d.location);
    setVal("linkedin", d.linkedin);
    setVal("summary", d.summary);
    setVal("jobRequirements", d.jobRequirements);

    setTagArray("skillsWrap", "skillsInput",
        toArray(d.skills), _skills, "skillsHidden");
    setTagArray("certsWrap", "certsInput",
        toArray(d.certifications), _certifications, "certsHidden");
    setTagArray("langsWrap", "langsInput",
        toArray(d.languages), _languages, "langsHidden");

    var expC = document.getElementById("expContainer");
    expC.innerHTML = "";
    _expN = 0;
    var exps = d.experience || [];
    if (exps.length === 0) exps = [{}];
    exps.forEach(function (e) {
        _expN++;
        var b = document.createElement("div");
        b.id = "exp-" + _expN;
        b.className = "repeat-block";
        b.innerHTML = expHtml(_expN);
        expC.appendChild(b);
        setVal("exp-job-" + _expN, e.jobTitle);
        setVal("exp-co-" + _expN, e.company);
        setVal("exp-loc-" + _expN, e.location);
        setVal("exp-start-" + _expN, e.startDate);
        setVal("exp-end-" + _expN, e.endDate);
        setVal("exp-resp-" + _expN, e.responsibilities);
    });

    var eduC = document.getElementById("eduContainer");
    eduC.innerHTML = "";
    _eduN = 0;
    var edus = d.education || [];
    if (edus.length === 0) edus = [{}];
    edus.forEach(function (e) {
        _eduN++;
        var b = document.createElement("div");
        b.id = "edu-" + _eduN;
        b.className = "repeat-block";
        b.innerHTML = eduHtml(_eduN);
        eduC.appendChild(b);
        setVal("edu-degree-" + _eduN, e.degree);
        setVal("edu-school-" + _eduN, e.institution);
        setVal("edu-loc-" + _eduN, e.location);
        setVal("edu-year-" + _eduN, e.graduationYear);
    });
}

// ─────────────────────────────────────────────
// VALIDATE
// ─────────────────────────────────────────────
function validate(d) {
    var e = [];
    if (!d.fullName) e.push("Full Name");
    if (!d.jobTitle) e.push("Target Job Title");
    if (!d.email) e.push("Email Address");
    if (!d.phone) e.push("Phone Number");
    if (!d.location) e.push("Location");
    if (!d.summary) e.push("Professional Summary");
    if (!d.skills) e.push("Skills (at least one)");
    if (!d.education.length) e.push("At least one Education entry");

    d.education.forEach(function (x, i) {
        if (!x.degree) e.push("Education #" + (i + 1) + ": Degree");
        if (!x.institution) e.push("Education #" + (i + 1) + ": Institution");
        if (!x.graduationYear) e.push("Education #" + (i + 1) + ": Graduation Year");
    });

    d.experience.forEach(function (x, i) {
        if (x.jobTitle || x.company || x.responsibilities) {
            if (!x.jobTitle) e.push("Experience #" + (i + 1) + ": Job Title");
            if (!x.company) e.push("Experience #" + (i + 1) + ": Company");
            if (!x.responsibilities) e.push("Experience #" + (i + 1) + ": Responsibilities");
        }
    });

    return e;
}

// ─────────────────────────────────────────────
// RENDER CV PREVIEW
// ─────────────────────────────────────────────
function renderPreview(cv) {
    _cv = cv;
    var color = "#1a1a2e";
    var h = '<div style="font-family:Arial,sans-serif;font-size:10px;">';

    h += '<div style="margin-bottom:12px;">';
    if (_photo) {
        h += '<img src="' + _photo + '" style="width:68px;height:68px;border-radius:50%;' +
            'object-fit:cover;float:right;border:2px solid #e2d9cc;" />';
    }
    h += '<div style="font-size:20px;font-weight:800;color:' + color +
        ';line-height:1.1;">' + esc(cv.fullName) + '</div>';
    h += '<div style="font-size:10.5px;color:#555;margin:3px 0;">' +
        esc(cv.jobTitle) + '</div>';
    h += '<div style="font-size:8.5px;color:#888;">' +
        [cv.email, cv.phone, cv.location, cv.linkedIn]
            .filter(Boolean).map(esc).join("   ·   ") + '</div>';
    h += '<div style="clear:both;"></div></div>';
    h += '<div style="height:2px;background:' + color + ';margin-bottom:12px;"></div>';

    function sec(title) {
        return '<div style="margin-bottom:10px;">' +
            '<div style="font-size:7.5px;font-weight:700;text-transform:uppercase;' +
            'letter-spacing:1.5px;color:' + color + ';border-bottom:1.5px solid ' +
            color + ';padding-bottom:3px;margin-bottom:6px;">' + title + '</div>';
    }

    if (cv.professionalSummary) {
        h += sec("Professional Summary");
        h += '<div style="font-size:9.5px;color:#333;line-height:1.7;">' +
            esc(cv.professionalSummary) + '</div></div>';
    }

    if (cv.experience && cv.experience.length) {
        h += sec("Experience");
        cv.experience.forEach(function (e) {
            h += '<div style="margin-bottom:7px;">';
            h += '<div style="font-size:9.5px;font-weight:700;color:#111;">' +
                esc(e.heading) + '</div>';
            (e.points || []).forEach(function (p) {
                h += '<div style="font-size:9px;color:#444;padding-left:10px;' +
                    'line-height:1.5;">&#8211; ' + esc(p) + '</div>';
            });
            h += '</div>';
        });
        h += '</div>';
    }

    if (cv.education && cv.education.length) {
        h += sec("Education");
        cv.education.forEach(function (e) {
            h += '<div style="margin-bottom:6px;">';
            h += '<div style="font-size:9.5px;font-weight:700;color:#111;">' +
                esc(e.heading) + '</div>';
            (e.points || []).forEach(function (p) {
                h += '<div style="font-size:9px;color:#444;padding-left:10px;">' +
                    '&#8211; ' + esc(p) + '</div>';
            });
            h += '</div>';
        });
        h += '</div>';
    }

    if (cv.skills && cv.skills.length) {
        h += sec("Skills");
        h += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
        cv.skills.forEach(function (s) {
            h += '<span style="font-size:8px;padding:2px 7px;border-radius:3px;' +
                'background:#f0f0f0;border:1px solid #ddd;">' + esc(s) + '</span>';
        });
        h += '</div></div>';
    }

    if (cv.certifications && cv.certifications.length) {
        h += sec("Certifications");
        cv.certifications.forEach(function (c) {
            h += '<div style="font-size:9px;color:#444;padding-left:8px;">' +
                '&#8211; ' + esc(c) + '</div>';
        });
        h += '</div>';
    }

    if (cv.languages && cv.languages.length) {
        h += sec("Languages");
        h += '<div style="font-size:9px;color:#444;">' +
            cv.languages.map(esc).join("   ·   ") + '</div></div>';
    }

    if (cv.tips && cv.tips.length) {
        h += '<div style="margin-top:14px;padding:10px;background:#fefce8;' +
            'border:1px solid #fde68a;border-radius:6px;">';
        h += '<div style="font-size:7px;font-weight:700;text-transform:uppercase;' +
            'letter-spacing:1px;color:#b45309;margin-bottom:5px;">&#128161; AI Tips</div>';
        cv.tips.forEach(function (t) {
            h += '<div style="font-size:8.5px;color:#92400e;margin-bottom:3px;">• ' +
                esc(t) + '</div>';
        });
        h += '</div>';
    }

    h += '</div>';
    document.getElementById("cvPreview").innerHTML = h;
    document.getElementById("previewStatus").textContent = "Generated ✓";

    var nextBtn = document.getElementById("nextBtn");
    if (nextBtn) nextBtn.classList.add("visible");

    autoSaveCV();
}

// ─────────────────────────────────────────────
// AUTO-SAVE
// ─────────────────────────────────────────────
function autoSaveCV() {
    var d = collect();

    // Save to sessionStorage immediately (reliable)
    try {
        sessionStorage.setItem("craftiq_form", JSON.stringify(d));
        sessionStorage.setItem("craftiq_cv", _cv ? JSON.stringify(_cv) : "");
        sessionStorage.setItem("craftiq_photo", _photo || "");
    } catch (e) { }

    // Also save to database
    fetch("/api/cv-storage/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cvRecordId: (typeof _cvRecordId !== "undefined" ? _cvRecordId : null) || null,
            formDataJson: JSON.stringify(d),
            photoBase64: _photo,
            cvDataJson: _cv ? JSON.stringify(_cv) : null
        })
    }).then(function (r) {
        if (r.ok) { _lastSaved = new Date(); updateAutoSaveBadge(); }
    }).catch(function () { });
}

function updateAutoSaveBadge() {
    var badge = document.getElementById("autosaveBadge");
    if (!badge || !_lastSaved) return;
    var mins = Math.round((new Date() - _lastSaved) / 60000);
    var text = mins < 1 ? "just now" :
        mins + " min" + (mins > 1 ? "s" : "") + " ago";
    badge.textContent = "✓ Auto-saved " + text;
    badge.className = "autosave-badge saved";
}

function startAutoSave() {
    clearInterval(_autoSaveTimer);
    _autoSaveTimer = setInterval(autoSaveCV, 30000);
    document.addEventListener("input", debounce(autoSaveCV, 3000));
}

function debounce(fn, ms) {
    var timer;
    return function () { clearTimeout(timer); timer = setTimeout(fn, ms); };
}

// ─────────────────────────────────────────────
// NAVIGATE TO TEMPLATES
// ─────────────────────────────────────────────
function goToTemplates() {
    if (!_cv) {
        alert("Please generate your CV first by clicking 'Get My CV'.");
        return;
    }

    var d = collect();

    // Save everything to sessionStorage
    try {
        sessionStorage.setItem("craftiq_cv", JSON.stringify(_cv));
        sessionStorage.setItem("craftiq_photo", _photo || "");
        sessionStorage.setItem("craftiq_form", JSON.stringify(d));
    } catch (e) { }

    var record = {
        id: (typeof _cvRecordId !== "undefined" && _cvRecordId) ? _cvRecordId : null,
        userId: "",
        cvTitle: d.jobTitle || _cv.jobTitle || "My CV",
        templateId: "nexus",
        accentColor: "#1a1a2e",
        cvDataJson: JSON.stringify(_cv),
        formDataJson: JSON.stringify(d),
        photoBase64: _photo,
        status: "draft"
    };

    var btn = document.getElementById("nextBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = "&#9203; Saving..."; }

    fetch("/api/cv-storage/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var id = (data && data.id) ? data.id : "";
            window.location.href = "/Home/CVTemplates?id=" + id;
        })
        .catch(function () {
            window.location.href = "/Home/CVTemplates";
        })
        .finally(function () {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = "Choose a Template &#8594;";
            }
        });
}

// ─────────────────────────────────────────────
// LOAD AUTO-SAVE — checks sessionStorage FIRST
// ─────────────────────────────────────────────
function loadAutoSave() {
    // If coming back from templates, sessionStorage has the CV — restore form too
    try {
        var cvStr = sessionStorage.getItem("craftiq_cv");
        if (cvStr && !_cv) {
            _cv = JSON.parse(cvStr);
            var photo = sessionStorage.getItem("craftiq_photo");
            if (photo) {
                _photo = photo;
                var prev = document.getElementById("photoPreview");
                var icon = document.getElementById("photoIcon");
                var rmBtn = document.getElementById("removePhotoBtn");
                if (prev) { prev.src = _photo; prev.style.display = "block"; }
                if (icon) icon.style.display = "none";
                if (rmBtn) rmBtn.style.display = "inline-flex";
            }
        }
    } catch (e) { }

    var recordId = (typeof _cvRecordId !== "undefined") ? _cvRecordId : "";
    var url = "/api/cv-storage/autosave" + (recordId ? "/" + recordId : "");
   

    fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data || !data.formDataJson) return;
            try {
                var form = JSON.parse(data.formDataJson);
                fillForm(form);
                if (data.photoBase64 && data.photoBase64 !== "") {
                    _photo = data.photoBase64;
                    var prev = document.getElementById("photoPreview");
                    var icon = document.getElementById("photoIcon");
                    var rmBtn = document.getElementById("removePhotoBtn");
                    if (prev) { prev.src = _photo; prev.style.display = "block"; }
                    if (icon) icon.style.display = "none";
                    if (rmBtn) rmBtn.style.display = "inline-flex";
                }
                if (data.cvDataJson) {
                    try {
                        var cv = JSON.parse(data.cvDataJson);
                        if (cv) renderPreview(cv);
                    } catch (e) { }
                }
                var badge = document.getElementById("autosaveBadge");
                if (badge) {
                    badge.textContent = "↩ Restored from auto-save";
                    badge.className = "autosave-badge saved";
                }
            } catch (e) { }
        })
        .catch(function () { });
}

// ─────────────────────────────────────────────
// CV FILE UPLOAD + EXTRACTION
// ─────────────────────────────────────────────
function initCVUpload() {
    var btn = document.getElementById("uploadCVBtn");
    var input = document.getElementById("cvFileInput");
    if (!btn || !input) return;

    input.accept = ".pdf,.docx,.png,.jpg,.jpeg,.webp";
    btn.addEventListener("click", function () { input.click(); });

    input.addEventListener("change", function () {
        var file = input.files[0];
        if (!file) return;

        var status = document.getElementById("uploadStatus");
        var ext = file.name.split(".").pop().toLowerCase();
        var validExts = ["pdf", "docx", "png", "jpg", "jpeg", "webp"];

        if (!validExts.includes(ext)) {
            if (status) status.innerHTML =
                "<span style='color:var(--red);'>&#10007; Unsupported file type</span>";
            return;
        }

        btn.classList.add("has-file");
        var shortName = file.name.length > 25
            ? file.name.substring(0, 25) + "..." : file.name;
        btn.innerHTML = "&#128196; " + shortName;

        if (status) status.innerHTML =
            "<span style='color:var(--accent);'>&#9203; Extracting CV data...</span>";

        var formData = new FormData();
        formData.append("file", file);

        fetch("/api/cv/extract", { method: "POST", body: formData })
            .then(function (r) {
                return r.json().then(function (data) {
                    return { ok: r.ok, data: data };
                });
            })
            .then(function (result) {
                if (!result.ok) {
                    if (status) status.innerHTML =
                        "<span style='color:var(--red);'>&#10007; " +
                        (result.data.message || "Extraction failed") + "</span>";
                    return;
                }
                if (result.data && result.data.formData) {
                    fillForm(result.data.formData);
                    if (status) status.innerHTML =
                        "<span style='color:var(--green);'>&#10003; CV extracted — review below</span>";
                } else {
                    if (status) status.innerHTML =
                        "<span style='color:var(--red);'>&#10007; Could not extract — fill manually</span>";
                }
            })
            .catch(function (err) {
                if (status) status.innerHTML =
                    "<span style='color:var(--red);'>&#10007; Error: " + err.message + "</span>";
            });
    });
}

// ─────────────────────────────────────────────
// PROFILE PHOTO UPLOAD
// ─────────────────────────────────────────────
function initPhotoUpload() {
    var changeBtn = document.getElementById("changePhotoBtn");
    var removeBtn = document.getElementById("removePhotoBtn");
    var input = document.getElementById("photoFileInput");
    var preview = document.getElementById("photoPreview");
    var icon = document.getElementById("photoIcon");

    function openPicker() { if (input) input.click(); }
    if (changeBtn) changeBtn.addEventListener("click", openPicker);

    if (input) {
        input.accept = "image/*";
        input.addEventListener("change", function () {
            var file = input.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                alert("Photo must be under 5MB.");
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                _photo = e.target.result;
                if (preview) { preview.src = _photo; preview.style.display = "block"; }
                if (icon) icon.style.display = "none";
                if (removeBtn) removeBtn.style.display = "inline-flex";
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener("click", function () {
            _photo = null;
            if (preview) { preview.style.display = "none"; preview.src = ""; }
            if (icon) icon.style.display = "flex";
            if (input) input.value = "";
            if (removeBtn) removeBtn.style.display = "none";
        });
    }
}

// ─────────────────────────────────────────────
// GENERATE CV
// ─────────────────────────────────────────────
function initGenerate() {
    var btn = document.getElementById("generateBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
        var d = collect();
        var errs = validate(d);

        if (errs.length) {
            document.getElementById("cvPreview").innerHTML =
                '<div style="padding:1.2rem;background:#fef2f2;border:1px solid #fecaca;' +
                'border-radius:8px;font-size:.8rem;color:#dc2626;line-height:1.7;">' +
                '<strong>&#9888; Please fill in:</strong><br><br>• ' +
                errs.join("<br>• ") + '</div>';
            document.getElementById("cvPreview").scrollIntoView({ behavior: "smooth" });
            return;
        }

        btn.disabled = true;
        btn.innerHTML = "&#9203; Generating your CV...";
        document.getElementById("previewStatus").textContent = "Working...";
        document.getElementById("cvPreview").innerHTML =
            '<div style="display:flex;flex-direction:column;align-items:center;' +
            'justify-content:center;min-height:460px;gap:14px;text-align:center;">' +
            '<div style="font-size:3rem;">&#129302;</div>' +
            '<div style="font-family:serif;font-size:1rem;font-weight:700;color:#2c2416;">' +
            'AI is crafting your CV...</div>' +
            '<div style="font-size:.8rem;color:#c8b89a;font-family:monospace;">' +
            'This takes 10–20 seconds</div></div>';

        var reqExtra = d.jobRequirements
            ? "\n\nJob requirements to tailor to:\n" + d.jobRequirements : "";

        var body = {
            fullName: d.fullName,
            jobTitle: d.jobTitle,
            email: d.email,
            phone: d.phone,
            location: d.location,
            linkedin: d.linkedin,
            summary: d.summary + reqExtra,
            skills: d.skills,
            certifications: d.certifications,
            languages: d.languages,
            jobRequirements: d.jobRequirements,
            experience: d.experience.map(function (e) {
                return {
                    jobTitle: e.jobTitle,
                    company: e.company,
                    location: e.location,
                    startDate: e.startDate,
                    endDate: e.endDate,
                    responsibilities: e.responsibilities
                };
            }),
            education: d.education.map(function (e) {
                return {
                    degree: e.degree,
                    institution: e.institution,
                    location: e.location,
                    graduationYear: e.graduationYear
                };
            })
        };

        fetch("/api/cv/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })
            .then(function (r) {
                return r.text().then(function (t) { return { s: r.status, t: t }; });
            })
            .then(function (r) {
                if (!r.t || r.t.trim() === "") {
                    showErr("Server returned empty response. Check your API key.");
                    return;
                }
                var data;
                try { data = JSON.parse(r.t); }
                catch (e) { showErr("Parse error: " + r.t.substring(0, 200)); return; }
                if (r.s !== 200) {
                    showErr("Error " + r.s + ": " + (data.message || r.t));
                    return;
                }
                renderPreview(data);
            })
            .catch(function (e) { showErr("Network error: " + e.message); })
            .finally(function () {
                btn.disabled = false;
                btn.innerHTML = "&#10024; Get My CV";
            });
    });
}

function showErr(msg) {
    document.getElementById("cvPreview").innerHTML =
        '<div style="padding:1.2rem;background:#fef2f2;border:1px solid #fecaca;' +
        'border-radius:8px;font-size:.8rem;color:#dc2626;line-height:1.7;">' +
        '<strong>&#9888; Error</strong><br><br>' + esc(msg) + '</div>';
    document.getElementById("previewStatus").textContent = "Error";
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
// ── Open AI Studio bullet improver pre-filled with this exp block ──
function openBulletImprover(n) {
    var textarea  = document.getElementById("exp-resp-" + n);
    var jobTitle  = document.getElementById("exp-job-" + n);
    var company   = document.getElementById("exp-co-"  + n);
    var bulletVal = textarea ? textarea.value.split("\n")[0] : "";

    // Open studio on writing tab and pre-fill the bullet improver
    if (typeof openStudio === "function") openStudio("writing");

    setTimeout(function () {
        var bulletInput = document.getElementById("bulletInput");
        if (bulletInput && bulletVal) bulletInput.value = bulletVal;
        var bjt = document.getElementById("bulletJobTitle");
        if (bjt && jobTitle) bjt.value = jobTitle.value;
        var bco = document.getElementById("bulletCompany");
        if (bco && company) bco.value = company.value;
    }, 150);
}

document.addEventListener("DOMContentLoaded", function () {
    var e1 = document.getElementById("exp-1");
    if (e1) { e1.className = "repeat-block"; e1.innerHTML = expHtml(1); }
    var d1 = document.getElementById("edu-1");
    if (d1) { d1.className = "repeat-block"; d1.innerHTML = eduHtml(1); }

    initTagInput("skillsWrap", "skillsInput", _skills, "skillsHidden");
    initTagInput("certsWrap", "certsInput", _certifications, "certsHidden");
    initTagInput("langsWrap", "langsInput", _languages, "langsHidden");

    initCVUpload();
    initPhotoUpload();
    initGenerate();
    startAutoSave();
    loadAutoSave();

    setInterval(updateAutoSaveBadge, 60000);
    window.addEventListener("beforeunload", autoSaveCV);
});