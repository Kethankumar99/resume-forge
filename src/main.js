import { renderProfile } from "./views/profile.js";
import { renderJob } from "./views/job.js";
import { renderResult } from "./views/result.js";
import { renderSettings } from "./views/settings.js";
import { loadSettings, showToast, log } from "./core/store.js";

const NAV = [
  { id: "profile", num: "01", label: "Profile", render: renderProfile },
  { id: "job",     num: "02", label: "Tailor",  render: renderJob },
  { id: "settings",num: "03", label: "Settings",render: renderSettings }
];

const state = { view: "profile" };

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <aside class="sidebar">
      <div>
        <div class="wordmark">resume<span>/</span>forge</div>
        <div class="wordmark-sub">local · groq</div>
      </div>
      <nav class="nav" id="nav"></nav>
      <div style="margin-top:auto;font-family:var(--rf-font-mono);font-size:10px;color:var(--rf-text-muted);padding:0 var(--rf-sp-2);">
        ⌘K palette
      </div>
    </aside>
    <main class="main">
      <div class="main-content" id="main-content"></div>
      <aside class="rail" id="rail"></aside>
    </main>
    <div class="toast-wrap" id="toast-wrap"></div>
  `;

  const nav = document.getElementById("nav");
  NAV.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "nav-item" + (state.view === item.id ? " active" : "");
    btn.innerHTML = `<span class="num">${item.num}</span><span>${item.label}</span>`;
    btn.onclick = () => { state.view = item.id; render(); };
    nav.appendChild(btn);
  });

  const current = NAV.find(n => n.id === state.view);
  const content = document.getElementById("main-content");
  const rail = document.getElementById("rail");
  content.innerHTML = "";
  rail.innerHTML = "";
  current.render(content, rail, render);
}

window.__render = render;
window.__navigate = (view) => { state.view = view; render(); };

const settings = loadSettings();
applyTheme(settings.theme || "dark");
render();

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    showToast("Command palette — coming in phase 8", "info");
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    if (state.view === "job") {
      e.preventDefault();
      const btn = document.getElementById("generate-btn");
      if (btn && !btn.disabled) btn.click();
    }
  }
});

log("app ready", "ok");