/* ============================================================
   template.js — single professional resume template (IIT standard)
   Company → Projects → Responsibilities → Explanation → Tech
   ============================================================ */

export function buildResumeHtml(profile, ai) {
  const esc = (s = "") =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const name = esc(profile.name || "");
  const headline = esc(profile.headline || profile.title || "");
  const contacts = [profile.email, profile.phone, profile.location, profile.linkedin]
    .filter(Boolean).map(esc);

  const summary = esc(ai?.sum || profile.summary || "");

  const skillGroups = Array.isArray(ai?.sk) && ai.sk.length
    ? ai.sk.map(esc)
    : [profile.skills.join(", ")].filter(Boolean);

  const experience = Array.isArray(ai?.ex) && ai.ex.length
    ? ai.ex
    : (profile.experience || []);

  const education = Array.isArray(ai?.ed) && ai.ed.length
    ? ai.ed.map(esc)
    : (profile.education || []).map(e =>
        [e.degree, e.institution, e.year].filter(Boolean).join(", ")
      ).filter(Boolean);

  const certs = Array.isArray(ai?.ce) && ai.ce.length
    ? ai.ce.map(esc)
    : (profile.certifications || []).map(c =>
        [c.name, c.year].filter(Boolean).join(" — ")
      ).filter(Boolean);

  const bulletList = (arr = []) =>
    arr.filter(Boolean).map(b => `<li>${esc(b)}</li>`).join("");

  const expHtml = experience.map(e => {
    const company = e.company || e.co || "";
    const designation = e.designation || e.d || e.t || "";
    const timeline = e.timeline || e.tl || e.dates || e.d || "";
    const projects = e.projects || e.pr || [];

    return `
      <div class="exp">
        <div class="exp-head">
          <div class="exp-left">
            <span class="title">${esc(designation)}</span>
            <span class="company">${esc(company)}</span>
          </div>
          ${timeline ? `<div class="dates">${esc(timeline)}</div>` : ""}
        </div>
        ${projects.map(p => `
          <div class="proj-block">
            <div class="proj-title-row">
              <strong>${esc(p.name || p.n || "")}</strong>
              ${p.client || p.cl ? `<span class="proj-client">· Client: ${esc(p.client || p.cl)}</span>` : ""}
              ${p.teamSize || p.ts ? `<span class="proj-client">· Team: ${esc(p.teamSize || p.ts)}</span>` : ""}
            </div>
            ${p.responsibilities || p.r ? `<ul>${bulletList(p.responsibilities || p.r)}</ul>` : ""}
            ${p.explanation || p.ex ? `<p class="explanation">${esc(p.explanation || p.ex)}</p>` : ""}
            ${p.tech ? `<div class="tech-line"><strong>Tech:</strong> ${esc(p.tech)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }).join("");

  return wrap(`
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: 794px;
        min-height: 1123px;
        font-family: "Georgia", "Times New Roman", serif;
        color: #1a1a1a;
        background: #ffffff;
        line-height: 1.45;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      .page {
        width: 794px;
        min-height: 1123px;
        padding: 54px 54px;
      }
      .header { text-align: center; margin-bottom: 12px; }
      h1 {
        font-size: 24pt;
        font-weight: 700;
        letter-spacing: 0.3px;
        color: #0f0f0f;
      }
      .subtitle {
        font-size: 11pt;
        color: #333;
        font-style: italic;
        margin-top: 3px;
      }
      .contact {
        font-size: 9.5pt;
        color: #444;
        margin-top: 8px;
      }
      .contact span::after { content: "  ·  "; color: #999; }
      .contact span:last-child::after { content: ""; }

      h3 {
        font-size: 10.5pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #1a1a1a;
        border-bottom: 1.5px solid #1a1a1a;
        padding-bottom: 4px;
        margin: 18px 0 8px;
        break-after: avoid;
        page-break-after: avoid;
      }
      h3:first-of-type { margin-top: 12px; }

      p {
        font-size: 10pt;
        color: #2a2a2a;
        text-align: justify;
      }

      ul {
        list-style: none;
        padding-left: 0;
        margin: 4px 0;
      }
      li {
        font-size: 10pt;
        color: #2a2a2a;
        padding-left: 16px;
        position: relative;
        margin-bottom: 3px;
        text-align: justify;
        line-height: 1.4;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      li::before {
        content: "";
        position: absolute;
        left: 4px;
        top: 8px;
        width: 3.5px;
        height: 3.5px;
        background: #1a1a1a;
        border-radius: 50%;
      }

      .exp {
        margin-bottom: 14px;
        /* Smart splitting enabled: allows filling empty space on previous page */
      }
      .exp:last-child { margin-bottom: 0; }
      .exp-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 3px;
        break-after: avoid;
        page-break-after: avoid;
      }
      .exp-left { display: flex; flex-direction: column; }
      .title { font-size: 10.5pt; font-weight: 700; color: #0f0f0f; }
      .company {
        font-size: 10pt;
        color: #444;
        font-style: italic;
        margin-top: 1px;
      }
      .dates {
        font-size: 9pt;
        color: #666;
        white-space: nowrap;
        font-family: "Georgia", serif;
        font-style: italic;
      }

      .proj-block {
        margin-left: 4px;
        margin-top: 8px;
        padding-left: 12px;
        border-left: 2px solid #d0d0d0;
        /* Smart splitting enabled */
      }
      .proj-title-row {
        font-size: 10pt;
        margin-bottom: 3px;
        color: #0f0f0f;
        break-after: avoid;
        page-break-after: avoid;
      }
      .proj-title-row strong { font-weight: 700; }
      .proj-client {
        font-size: 8.5pt;
        color: #666;
        font-style: italic;
        margin-left: 4px;
      }
      .explanation {
        font-size: 9.5pt;
        color: #333;
        font-style: italic;
        margin: 4px 0;
        padding: 4px 0 4px 8px;
        border-left: 2px solid #e5e5e5;
        text-align: justify;
        line-height: 1.4;
      }
      .tech-line {
        font-size: 8.5pt;
        color: #555;
        margin-top: 4px;
        font-family: "Georgia", serif;
      }
      .tech-line strong { font-weight: 700; }

      .skill-line {
        font-size: 10pt;
        color: #2a2a2a;
        margin-bottom: 3px;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .skill-line strong { font-weight: 700; }
    </style>
    <div class="page">
      <div class="header">
        <h1>${name}</h1>
        ${headline ? `<div class="subtitle">${headline}</div>` : ""}
        ${contacts.length ? `<div class="contact">${contacts.map(c => `<span>${c}</span>`).join("")}</div>` : ""}
      </div>

      ${summary ? `<h3>Professional Summary</h3><p>${summary}</p>` : ""}

      ${skillGroups.length ? `
        <h3>Technical Skills</h3>
        ${skillGroups.map(g => `<div class="skill-line">${formatSkillGroup(g)}</div>`).join("")}
      ` : ""}

      ${experience.length ? `<h3>Professional Experience</h3>${expHtml}` : ""}

      ${education.length ? `<h3>Education</h3><ul>${education.map(e => `<li>${e}</li>`).join("")}</ul>` : ""}

      ${certs.length ? `<h3>Certifications</h3><ul>${certs.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
    </div>
  `);
}

function formatSkillGroup(group) {
  const esc = (s = "") =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const idx = group.indexOf(":");
  if (idx === -1) return esc(group);
  const label = group.slice(0, idx).trim();
  const rest = group.slice(idx + 1).trim();
  return `<strong>${esc(label)}:</strong> ${esc(rest)}`;
}

function wrap(inner) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  </head><body>${inner}</body></html>`;
}