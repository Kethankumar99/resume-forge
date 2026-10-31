/* ============================================================
   store.js — localStorage, toast, log, debounce, profile
   Single source of truth. No hardcoded user data.
   ============================================================ */

const PREFIX = "rf.";

/* ---------- localStorage helpers ---------- */
export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key);
}

export function clearAll() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

/* ---------- debounce ---------- */
export function debounce(fn, ms = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ---------- toast ---------- */
export function showToast(message, type = "info", ms = 3000) {
  const wrap = document.getElementById("toast-wrap");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 180);
  }, ms);
}

/* ---------- log ---------- */
const logBuffer = [];

export function log(message, kind = "") {
  const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
  logBuffer.push({ time, message, kind });
  if (logBuffer.length > 200) logBuffer.shift();
  renderLog();
}

function renderLog() {
  const el = document.getElementById("log-panel");
  if (!el) return;
  if (logBuffer.length === 0) {
    el.innerHTML = `<div class="line"><span class="m dim empty">waiting for actions…</span></div>`;
    return;
  }
  el.innerHTML = logBuffer
    .map(l => `<div class="line"><span class="t">${l.time}</span><span class="m ${l.kind}">${escapeHtml(l.message)}</span></div>`)
    .join("");
  el.scrollTop = el.scrollHeight;
}

export function clearLog() {
  logBuffer.length = 0;
  renderLog();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ============================================================
   PROFILE — single source of truth
   ============================================================ */

export const EMPTY_PROFILE = {
  name: "",
  title: "",
  years: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  certifications: []
};

let _profile = null;

export function loadProfile() {
  if (_profile) return _profile;
  const stored = get("profile", {});
  _profile = { ...EMPTY_PROFILE, ...stored };
  return _profile;
}

export function getProfile() {
  return loadProfile();
}

export const saveProfile = debounce((profile) => {
  _profile = profile;
  set("profile", profile);
  showSavePill();
}, 400);

export function saveProfileNow(profile) {
  _profile = profile;
  set("profile", profile);
  showSavePill();
}

function showSavePill() {
  const pill = document.getElementById("save-pill");
  if (!pill) return;
  pill.textContent = "saved";
  pill.classList.add("show");
  setTimeout(() => pill.classList.remove("show"), 1200);
}

export function clearProfile() {
  _profile = { ...EMPTY_PROFILE };
  set("profile", _profile);
}

export function computeCompleteness(profile = loadProfile()) {
  const totalProjects = (profile.experience || []).reduce(
    (n, e) => n + (e.projects?.length || 0), 0
  );
  const fields = [
    profile.name,
    profile.title || profile.headline,
    profile.email || profile.phone,
    profile.summary,
    profile.skills.length > 0,
    totalProjects > 0,
    profile.experience.length > 0,
    profile.education.length > 0 || profile.certifications.length > 0
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/* ---------- settings ---------- */
export function loadSettings() {
  return get("settings", { theme: "dark", groqKey: "" });
}
export function saveSettings(s) { set("settings", s); }

/* ---------- misc ---------- */
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}