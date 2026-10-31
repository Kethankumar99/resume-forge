import { buildAnalysisPrompt, buildTailorPrompt, parseAIJson } from "../core/prompt.js";
import { log, get, set, showToast, getProfile } from "../core/store.js";
import { callGroq } from "../core/groq.js";
import { exportResumePdf } from "../core/pdf.js";

let state = {
  step: "analyze", // 'analyze' | 'results'
  analysis: null,   // { matched: [], missing: [] }
  ai: null,         // tailored resume json
  matchPercent: 0,
  company: "",
  usage: { in: 0, out: 0 }
};

export function renderJob(content, rail) {
  const draft = get("jdDraft", { company: "", jd: "" });
  const settings = get("settings", { groqKey: "", theme: "dark" });

  content.innerHTML = `
    <div class="section-head">
      <h1>Tailor Resume</h1>
      <span class="hint">analyze JD · select skills · generate</span>
    </div>

    <div class="card">
      <div class="card-head"><h3>Job Description</h3></div>
      <div class="field">
        <label>Company name *</label>
        <input class="input" id="company-input" placeholder="e.g. Infosys" value="${escape(draft.company)}" />
      </div>
      <div class="field">
        <label>Job description *</label>
        <textarea class="textarea" id="jd-input" placeholder="Paste the full JD here..." style="min-height:180px">${escape(draft.jd)}</textarea>
        <div class="row-between mt-2">
          <div class="help" id="jd-stats">0 chars</div>
          <div class="row">
            <button class="btn btn-ghost btn-sm" id="paste-btn">Paste</button>
            <button class="btn btn-ghost btn-sm" id="clear-jd">Clear</button>
          </div>
        </div>
      </div>
      <div class="row-between mt-3">
        <div class="help">Step 1: Analyze keywords & choose what to add.</div>
        <button class="btn btn-primary" id="analyze-btn">Analyze JD →</button>
      </div>
    </div>

    <div id="analysis-area"></div>
    <div id="result-area"></div>
  `;

  const companyInput = content.querySelector("#company-input");
  const jdInput = content.querySelector("#jd-input");
  const stats = content.querySelector("#jd-stats");

  const persist = () => set("jdDraft", { company: companyInput.value, jd: jdInput.value });
  const updateStats = () => {
    stats.textContent = `${jdInput.value.length} chars`;
    renderRail(rail, jdInput.value);
  };

  companyInput.addEventListener("input", persist);
  jdInput.addEventListener("input", () => { persist(); updateStats(); });

  content.querySelector("#paste-btn").onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { jdInput.value = text; persist(); updateStats(); showToast("JD pasted", "success"); }
    } catch { showToast("Clipboard denied", "warn"); }
  };

  content.querySelector("#clear-jd").onclick = () => { jdInput.value = ""; persist(); updateStats(); };

  content.querySelector("#analyze-btn").onclick = () => {
    runAnalyze(content, rail, companyInput.value.trim(), jdInput.value.trim(), settings);
  };

  updateStats();

  if (state.step === "results" && state.ai) {
    renderAnalysisArea(content.querySelector("#analysis-area"));
    renderResultArea(content.querySelector("#result-area"), rail);
  } else if (state.analysis) {
    renderAnalysisArea(content.querySelector("#analysis-area"));
  }
}

async function runAnalyze(content, rail, company, jd, settings) {
  if (!company) return showToast("Company name required", "warn");
  if (!jd || jd.length < 100) return showToast("JD too short (min 100 chars)", "warn");
  if (!settings.groqKey) return showToast("Groq key missing — go to Settings", "warn");

  const btn = content.querySelector("#analyze-btn");
  btn.disabled = true;
  btn.classList.add("loading");
  log(`analyzing JD for ${company}...`, "dim");

  try {
    const prompt = buildAnalysisPrompt(getProfile(), jd);
    const res = await callGroq({ apiKey: settings.groqKey, system: prompt.system, user: prompt.user });
    state.usage = res.usage;
    
    const rawAnalysis = parseAIJson(res.raw);
    
    // Programmatic Deduplication & Normalization to lock absolute consistency
    const cleanList = (arr) => [...new Set((arr || []).map(k => String(k).trim()).filter(Boolean))];
    
    state.analysis = {
      matched: cleanList(rawAnalysis.matched),
      missing: cleanList(rawAnalysis.missing)
    };

    state.company = company;
    state.step = "analyze";

    btn.disabled = false;
    btn.classList.remove("loading");
    renderAnalysisArea(content.querySelector("#analysis-area"));
    showToast("JD analyzed successfully", "success");
  } catch (err) {
    btn.disabled = false;
    btn.classList.remove("loading");
    showToast(err.message, "error", 4000);
    log(err.message, "err");
  }
}

function renderAnalysisArea(area) {
  if (!area || !state.analysis) {
    area.innerHTML = "";
    return;
  }
  const { matched = [], missing = [] } = state.analysis;

  area.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Keyword Analysis</h3></div>
      
      <div class="label mb-2">Matched Skills (Already in Profile)</div>
      <div class="chip-group mb-4">
        ${matched.length ? matched.map(k => `<span class="chip chip-matched">${escape(k)}</span>`).join("") : `<span class="muted text-sm">None</span>`}
      </div>

      <div class="label mb-2">Missing Skills (Select which ones to add to resume)</div>
      <div class="stack-2 mb-4" id="missing-checkboxes">
        ${missing.length ? missing.map((k) => `
          <label class="row" style="cursor:pointer;gap:10px;">
            <input type="checkbox" class="missing-chk" value="${escape(k)}" checked style="width:16px;height:16px;" />
            <span class="text-sm mono">${escape(k)}</span>
          </label>
        `).join("") : `<span class="muted text-sm">No missing skills found — great match!</span>`}
      </div>

      <div class="row-between">
        <div class="help">Uncheck any missing skills you do NOT want added to your resume.</div>
        <button class="btn btn-primary" id="generate-final-btn">Tailor Resume with Selected Skills →</button>
      </div>
    </div>
  `;

  area.querySelector("#generate-final-btn").onclick = () => {
    const chkBoxes = area.querySelectorAll(".missing-chk:checked");
    const selectedMissing = Array.from(chkBoxes).map(cb => cb.value);
    runTailorFinal(area.parentElement, selectedMissing);
  };
}

async function runTailorFinal(content, selectedMissing) {
  const settings = get("settings", { groqKey: "" });
  const jdInput = content.querySelector("#jd-input");
  const jd = jdInput ? jdInput.value.trim() : "";

  const btn = content.querySelector("#generate-final-btn");
  if (btn) { btn.disabled = true; btn.classList.add("loading"); }
  log("tailoring resume with selected skills...", "dim");

  try {
    const prompt = buildTailorPrompt(getProfile(), jd, selectedMissing);
    const res = await callGroq({ apiKey: settings.groqKey, system: prompt.system, user: prompt.user });
    
    state.usage = {
      in: state.usage.in + res.usage.in,
      out: state.usage.out + res.usage.out
    };

    const ai = parseAIJson(res.raw);
    state.ai = ai;
    state.matchPercent = typeof ai.p === "number" ? ai.p : 92;
    state.step = "results";

    if (btn) { btn.disabled = false; btn.classList.remove("loading"); }
    renderResultArea(content.querySelector("#result-area"), content.querySelector("#rail") || document.createElement("div"));
    showToast("Resume tailored successfully!", "success");
  } catch (err) {
    if (btn) { btn.disabled = false; btn.classList.remove("loading"); }
    showToast(err.message, "error", 4000);
    log(err.message, "err");
  }
}

function renderResultArea(area, rail) {
  if (!area || !state.ai) return;
  const { ai, matchPercent, usage, company } = state;

  area.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h3>Match Status</h3>
        <span class="badge good"><span class="dot"></span>${matchPercent}% Match Score</span>
      </div>
      <div class="text-sm dim">Resume tailored successfully using your matched skills and approved selections.</div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Export & Actions</h3></div>
      <div class="row">
        <button class="btn btn-primary" id="dl-btn">Download PDF</button>
        <button class="btn btn-secondary" id="copy-btn">Copy JSON</button>
        <button class="btn btn-ghost" id="reset-btn">Analyze Again</button>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Preview</h3></div>
      <div style="background:#fff;border:1px solid var(--rf-border);border-radius:6px;overflow:hidden;">
        <iframe id="preview-frame" style="width:100%;height:640px;border:none;background:#fff"></iframe>
      </div>
    </div>
  `;

  import("../core/template.js").then(({ buildResumeHtml }) => {
    const frame = area.querySelector("#preview-frame");
    if (frame) frame.srcdoc = buildResumeHtml(getProfile(), ai);
  });

  area.querySelector("#dl-btn").onclick = async () => {
    try {
      const { filename } = await exportResumePdf(getProfile(), ai, company);
      showToast(`Saved ${filename}`, "success", 4000);
    } catch (err) { showToast("PDF failed: " + err.message, "error", 4000); }
  };

  area.querySelector("#copy-btn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(ai, null, 2));
      showToast("JSON copied", "success");
    } catch { showToast("Clipboard blocked", "warn"); }
  };

  area.querySelector("#reset-btn").onclick = () => {
    state.step = "analyze";
    state.ai = null;
    renderJob(area.parentElement.parentElement, rail);
  };
}

function renderRail(rail, jd) {
  if (!rail) return;
  if (!jd || jd.length < 50) {
    rail.innerHTML = `<div class="label mb-3">JD status</div><div class="empty"><div class="empty-title">No JD yet</div><div>Paste a JD to see stats</div></div>`;
    return;
  }
  rail.innerHTML = `
    <div class="label mb-3">Run info</div>
    <div class="stack-2 text-sm">
      <div class="dim">Company</div>
      <div class="mono">${escape(state.company || "Not set")}</div>
    </div>
    <div class="divider"></div>
    <div class="label mb-2">Tokens</div>
    <div class="mono text-sm">${state.usage.in} in · ${state.usage.out} out</div>
  `;
}

function escape(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}