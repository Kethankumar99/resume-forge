import { get, set, showToast, log, clearAll } from "../core/store.js";

export function renderSettings(content) {
  const s = get("settings", { theme: "dark", groqKey: "" });

  content.innerHTML = `
    <div class="section-head">
      <h1>Settings</h1>
      <span class="hint">local only</span>
    </div>

    <div class="card">
      <div class="card-head"><h3>Groq API</h3></div>
      <div class="field">
        <label>API key</label>
        <input class="input input-mono" id="key" type="password" placeholder="gsk_..." value="${escape(s.groqKey)}" />
        <div class="help">
          Free key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>.
          Stored locally. Model: <span class="mono">openai/gpt-oss-120b</span>.
        </div>
      </div>
      <div class="row">
        <button class="btn btn-primary" id="save-key">Save key</button>
        <button class="btn btn-secondary" id="test-key">Test connection</button>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Theme</h3></div>
      <div class="seg" id="theme-seg">
        <button data-t="dark" class="${s.theme === "dark" ? "active" : ""}">Dark</button>
        <button data-t="light" class="${s.theme === "light" ? "active" : ""}">Light</button>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Danger zone</h3></div>
      <button class="btn btn-danger" id="clear-data">Clear all local data</button>
      <div class="help mt-2">Removes profile, JD draft, API key, template choice.</div>
    </div>

    <div class="label mb-2 mt-4">Log</div>
    <div class="log" id="log-panel"></div>
  `;

  const keyInput = content.querySelector("#key");

  content.querySelector("#save-key").onclick = () => {
    set("settings", { ...s, groqKey: keyInput.value.trim() });
    showToast("API key saved", "success");
    log("groq key saved", "ok");
  };

  content.querySelector("#test-key").onclick = async () => {
    const key = keyInput.value.trim();
    if (!key) return showToast("Enter a key first", "warn");
    showToast("Testing…", "info", 2000);
    log("groq test started", "dim");

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: "Say hi in one word." }],
          max_tokens: 10
        })
      });

      const rawText = await res.text();
      console.log("[GROQ TEST] status:", res.status);
      console.log("[GROQ TEST] body:", rawText);

      if (res.ok) {
        showToast("Groq connected ✓", "success");
        log("groq test ok", "ok");
      } else if (res.status === 401) {
        showToast("Invalid key", "error");
        log(`groq test 401: ${rawText.slice(0, 200)}`, "err");
      } else if (res.status === 404) {
        showToast("404 — model not found", "error", 5000);
        log(`groq test 404: ${rawText.slice(0, 300)}`, "err");
      } else if (res.status === 429) {
        showToast("Rate limited — wait 60s", "warn", 5000);
        log(`groq test 429`, "warn");
      } else {
        showToast(`Groq ${res.status}: ${rawText.slice(0, 120)}`, "error", 5000);
        log(`groq test ${res.status}: ${rawText.slice(0, 300)}`, "err");
      }
    } catch (err) {
      console.error("[GROQ TEST] network error:", err);
      showToast("Network error — check connection", "error");
      log("groq test network error", "err");
    }
  };

  content.querySelectorAll("#theme-seg button").forEach(b => {
    b.onclick = () => {
      content.querySelectorAll("#theme-seg button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const theme = b.dataset.t;
      set("settings", { ...s, theme });
      document.documentElement.setAttribute("data-theme", theme);
      log(`theme → ${theme}`, "dim");
    };
  });

  content.querySelector("#clear-data").onclick = () => {
    if (!confirm("Clear ALL local data (profile, key, drafts)?")) return;
    clearAll();
    showToast("All data cleared", "success");
    setTimeout(() => location.reload(), 600);
  };
}

function escape(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}