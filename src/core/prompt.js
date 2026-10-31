/* ============================================================
   prompt.js — JD Analysis, Match Score Calculation & Selective Injection
   ============================================================ */

import { log } from "./store.js";

/**
 * Build compact CANDIDATE payload with Company -> Projects nested structure.
 */
export function buildCandidate(profile) {
  if (!profile || !profile.name || !profile.name.trim()) {
    throw new Error("Name is required — add it in the Profile tab first.");
  }

  const c = {};
  if (profile.name) c.n = profile.name;
  if (profile.title) c.t = profile.title;
  if (profile.headline) c.hl = profile.headline;
  if (profile.years) c.y = profile.years;

  const contacts = [];
  if (profile.email) contacts.push(profile.email);
  if (profile.phone) contacts.push(profile.phone);
  if (profile.location) contacts.push(profile.location);
  if (profile.linkedin) contacts.push(profile.linkedin);
  if (contacts.length) c.c = contacts.join(" | ");

  if (profile.summary) c.sum = profile.summary;
  if (profile.skills && profile.skills.length) c.sk = profile.skills;

  if (profile.experience && profile.experience.length) {
    c.ex = profile.experience.map(e => {
      const o = {};
      if (e.company) o.co = e.company;
      if (e.designation) o.d = e.designation;
      if (e.timeline) o.tl = e.timeline;
      if (e.projects && e.projects.length) {
        o.pr = e.projects.map(p => {
          const po = {};
          if (p.name) po.n = p.name;
          if (p.client) po.cl = p.client;
          if (p.teamSize) po.ts = p.teamSize;
          if (p.tech) po.tech = p.tech;
          if (p.responsibilities && p.responsibilities.length) po.r = p.responsibilities.filter(Boolean);
          if (p.explanation) po.ex = p.explanation;
          return po;
        });
      }
      return o;
    });
  }

  if (profile.projects && profile.projects.length) {
    c.pr = profile.projects.map(p => {
      const o = {};
      if (p.name) o.n = p.name;
      if (p.role) o.r = p.role;
      if (p.tech) o.tech = p.tech;
      if (p.bullets && p.bullets.length) o.b = p.bullets.filter(Boolean);
      return o;
    });
  }

  if (profile.education && profile.education.length) {
    c.ed = profile.education
      .map(e => [e.degree, e.institution, e.year].filter(Boolean).join(", "))
      .filter(Boolean);
  }

  if (profile.certifications && profile.certifications.length) {
    c.ce = profile.certifications
      .map(x => [x.name, x.year].filter(Boolean).join(" — "))
      .filter(Boolean);
  }

  return c;
}

/**
 * Step 1: Analyze JD, calculate initial match score (p), and extract matched & missing keywords.
 */
export function buildAnalysisPrompt(profile, rawJD) {
  const candidate = buildCandidate(profile);
  const fullJD = rawJD.slice(0, 10000);

  const system =
    "You are a strict, deterministic ATS resume analyst. " +
    "Analyze the job description against the candidate profile. " +
    "1. Extract exact technical keywords, frameworks, tools, and databases. " +
    "2. Classify them into 'matched' (present/implied in profile) and 'missing' (not found in profile). " +
    "3. Calculate a realistic initial match percentage (p from 0 to 100) based on how well the candidate currently fits the JD. " +
    "Return ONLY valid JSON.";

  const user = `CANDIDATE=${JSON.stringify(candidate)}

JOB_DESCRIPTION:
${fullJD}

Return ONLY this JSON format:
{
  "p": <integer match percentage 0-100>,
  "matched": ["keyword1", "keyword2"],
  "missing": ["keyword3", "keyword4"]
}`;

  return { system, user, fullJD };
}

/**
 * Step 2: Tailor resume using candidate profile + selected missing skills, forcing match percentage to be >= 90%.
 */
export function buildTailorPrompt(profile, rawJD, selectedMissing) {
  const candidate = buildCandidate(profile);
  const fullJD = rawJD.slice(0, 10000);

  const system =
    "You are an elite senior technical recruiter and ATS resume optimization expert. " +
    "Rewrite the candidate's resume by weaving in the matched keywords and ALL the approved selected missing skills. " +
    "CRITICAL RULE: Once these missing skills and matched skills are fully integrated into the summary, experience bullets, and tech stacks, the resulting profile match score 'p' MUST be evaluated above 90 (integer between 90 and 99). " +
    "Maintain the strict Company -> Projects experience structure. " +
    "Return ONLY valid JSON.";

  const user = `CANDIDATE=${JSON.stringify(candidate)}
APPROVED_EXTRA_SKILLS_TO_ADD=${JSON.stringify(selectedMissing)}

JOB_DESCRIPTION:
${fullJD}

TASKS:
1. Rewrite professional summary, skill groups, and nested work experiences/projects to naturally include all matched skills and the approved extra skills.
2. Keep the exact company hierarchy: company (co), designation (d), timeline (tl), and projects array (pr).
3. Each project must have name (n), client (cl), teamSize (ts), responsibilities (r), explanation (ex), and tech stack at the END (tech).
4. Set match percentage p to be >= 90 (since approved missing skills are now integrated).

Return ONLY this JSON:
{
  "p": <integer match percent >= 90>,
  "sum": "rewritten senior summary",
  "sk": ["Group 1: skill1, skill2...", "Group 2: skill3, skill4..."],
  "ex": [
    {
      "co": "company name",
      "d": "designation",
      "tl": "timeline",
      "pr": [
        {
          "n": "project name",
          "cl": "client",
          "ts": "team size",
          "r": ["deep technical responsibility bullet"],
          "ex": "detailed project explanation",
          "tech": "Tech, Stack, Here"
        }
      ]
    }
  ],
  "pr": [
    {
      "n": "standalone project", 
      "r": "role", 
      "tech": "tech stack", 
      "b": ["bullet"]
    }
  ],
  "ed": ["education strings"],
  "ce": ["certification strings"]
}`;

  return { system, user, fullJD };
}

/**
 * Parse Groq JSON response safely.
 */
export function parseAIJson(raw) {
  let s = String(raw || "").trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i === -1 || j === -1) throw new Error("No JSON object found in response");
  return JSON.parse(s.slice(i, j + 1));
}