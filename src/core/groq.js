/* ============================================================
   groq.js — Groq API client
   Model: openai/gpt-oss-120b (confirmed on user's account)
   Handles: retry, rate-limit, token usage, JSON fallback
   ============================================================ */

import { log } from "./store.js";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

/**
 * Call Groq. Returns { raw, usage, status }.
 * If response_format=json_object fails validation, retries without it.
 */
export async function callGroq({ apiKey, system, user, maxTokens = 4000 }) {
  if (!apiKey) {
    const e = new Error("Groq API key missing — add it in Settings.");
    e.status = 401;
    throw e;
  }

  const buildBody = (useJson) => ({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.0, // Set to 0 for deterministic, 100% consistent keyword extraction & responses
    max_tokens: maxTokens,
    ...(useJson ? { response_format: { type: "json_object" } } : {})
  });

  const attempt = async (useJson, retryCount = 0) => {
    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildBody(useJson))
      });
    } catch {
      const e = new Error("Network error — check your connection.");
      e.status = 0;
      throw e;
    }

    if (res.ok) {
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content || "";
      const usage = {
        in: data?.usage?.prompt_tokens ?? 0,
        out: data?.usage?.completion_tokens ?? 0
      };
      return { raw, usage, status: 200 };
    }

    if (res.status === 429) {
      const e = new Error("Rate limited — wait and retry.");
      e.status = 429;
      throw e;
    }

    if (res.status === 401 || res.status === 403) {
      const e = new Error("Invalid Groq API key. Check Settings.");
      e.status = res.status;
      throw e;
    }

    if (res.status === 404) {
      const text = await res.text();
      const e = new Error(`Model not found — ${MODEL}. Check console.groq.com/docs/models.`);
      e.status = 404;
      e.body = text;
      throw e;
    }

    // JSON validation failed with response_format — retry WITHOUT it
    if (res.status === 400 && useJson) {
      const text = await res.text();
      if (text.includes("json_validate_failed") || text.includes("Failed to validate JSON")) {
        log("json validate failed · retrying without response_format", "warn");
        return attempt(false, retryCount);
      }
      const e = new Error(`Groq 400: ${text.slice(0, 200)}`);
      e.status = 400;
      throw e;
    }

    if (res.status >= 500 && retryCount < 2) {
      log(`groq ${res.status} · retrying`, "warn");
      await new Promise(r => setTimeout(r, retryCount === 0 ? 2000 : 4000));
      return attempt(useJson, retryCount + 1);
    }

    const text = await res.text();
    const e = new Error(`Groq ${res.status}: ${text.slice(0, 200)}`);
    e.status = res.status;
    throw e;
  };

  const result = await attempt(true);
  log(`groq 200 · ${result.usage.in} in / ${result.usage.out} out`, "ok");
  return result;
}