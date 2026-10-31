import {
  loadProfile,
  saveProfile,
  saveProfileNow,
  clearProfile,
  computeCompleteness,
  log
} from "../core/store.js";

let profile = loadProfile();

// Migration: if old data has top-level projects, move into first experience
if (profile.projects && profile.projects.length && profile.experience && profile.experience.length) {
  if (!profile.experience[0].projects) {
    profile.experience[0].projects = profile.projects;
  }
}
delete profile.projects;

export function renderProfile(content, rail, rerender) {
  content.innerHTML = `
    <div class="section-head">
      <h1>Profile</h1>
      <span class="hint">autosave on · * = required</span>
    </div>

    <div class="card">
      <div class="card-head"><h3>Identity</h3></div>
      <div class="field">
        <label>Full name *</label>
        <input class="input" data-k="name" placeholder="Your full name" />
        <div class="help">Required. Everything else is optional.</div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Title <span class="muted">(optional)</span></label>
          <input class="input" data-k="title" placeholder="e.g. Java Full Stack Developer" />
        </div>
        <div class="field">
          <label>Years of experience <span class="muted">(optional)</span></label>
          <input class="input" data-k="years" placeholder="e.g. 3" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Headline / Objective</h3></div>
      <div class="field">
        <label>Professional headline <span class="muted">(optional)</span></label>
        <input class="input" data-k="headline" placeholder="e.g. Backend engineer focused on fintech infrastructure" />
      </div>
      <div class="field">
        <label>Objective / summary <span class="muted">(optional)</span></label>
        <textarea class="textarea" data-k="summary" placeholder="2–4 lines describing your focus, strengths, and what you're looking for."></textarea>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Contact</h3></div>
      <div class="field-row">
        <div class="field">
          <label>Email <span class="muted">(optional)</span></label>
          <input class="input" data-k="email" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label>Phone <span class="muted">(optional)</span></label>
          <input class="input" data-k="phone" placeholder="+91 ..." />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Location <span class="muted">(optional)</span></label>
          <input class="input" data-k="location" placeholder="City, Country" />
        </div>
        <div class="field">
          <label>LinkedIn <span class="muted">(optional)</span></label>
          <input class="input" data-k="linkedin" placeholder="linkedin.com/in/..." />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Skills <span class="muted">(optional)</span></h3>
        <span class="mono text-xs muted" id="skills-count">0</span>
      </div>
      <div class="field">
        <label>Add a skill (press Enter)</label>
        <input class="input" id="skill-input" placeholder="e.g. Spring Boot" />
      </div>
      <div class="chip-group" id="skills-chips"></div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Experience <span class="muted">(optional)</span></h3>
        <button class="btn btn-secondary btn-sm" id="add-exp">+ Add company</button>
      </div>
      <div id="exp-list" class="stack"></div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Education <span class="muted">(optional)</span></h3>
        <button class="btn btn-secondary btn-sm" id="add-edu">+ Add education</button>
      </div>
      <div id="edu-list" class="stack"></div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Certifications <span class="muted">(optional)</span></h3>
        <button class="btn btn-secondary btn-sm" id="add-cert">+ Add certification</button>
      </div>
      <div id="cert-list" class="stack"></div>
    </div>

    <div class="row mt-4">
      <button class="btn btn-primary" id="save-now">Save now</button>
      <button class="btn btn-ghost" id="clear-profile">Clear all</button>
    </div>
  `;

  renderRail(rail);

  content.querySelectorAll("[data-k]").forEach(el => {
    el.value = profile[el.dataset.k] || "";
    el.addEventListener("input", () => {
      profile[el.dataset.k] = el.value;
      saveProfile(profile);
      if (el.dataset.k === "summary" || el.dataset.k === "name" || el.dataset.k === "headline") {
        renderRail(rail);
      }
    });
  });

  const skillInput = content.querySelector("#skill-input");
  skillInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && skillInput.value.trim()) {
      e.preventDefault();
      const v = skillInput.value.trim();
      if (!profile.skills.includes(v)) {
        profile.skills.push(v);
        saveProfile(profile);
        renderSkills();
        renderRail(rail);
      }
      skillInput.value = "";
    }
  });
  renderSkills();
  renderExperience();
  renderEducation();
  renderCertifications();

  content.querySelector("#add-exp").onclick = () => {
    profile.experience.push({
      company: "",
      designation: "",
      timeline: "",
      projects: [{
        name: "",
        client: "",
        teamSize: "",
        responsibilities: [""],
        explanation: ""
      }]
    });
    saveProfile(profile);
    renderExperience();
    renderRail(rail);
  };
  content.querySelector("#add-edu").onclick = () => {
    profile.education.push({ degree: "", institution: "", year: "" });
    saveProfile(profile);
    renderEducation();
  };
  content.querySelector("#add-cert").onclick = () => {
    profile.certifications.push({ name: "", year: "" });
    saveProfile(profile);
    renderCertifications();
  };

  content.querySelector("#save-now").onclick = () => {
    saveProfileNow(profile);
    log("profile saved manually", "ok");
  };
  content.querySelector("#clear-profile").onclick = () => {
    if (!confirm("Clear all profile data?")) return;
    clearProfile();
    profile = loadProfile();
    log("profile cleared", "warn");
    rerender();
  };

  function renderSkills() {
    const wrap = content.querySelector("#skills-chips");
    const count = content.querySelector("#skills-count");
    count.textContent = profile.skills.length + " skills";
    if (profile.skills.length === 0) {
      wrap.innerHTML = `<div class="empty" style="padding:16px;width:100%"><div class="empty-title">No skills yet</div><div>Type a skill above and press Enter</div></div>`;
      return;
    }
    wrap.innerHTML = profile.skills
      .map((s, i) => `<span class="chip">${escape(s)}<span class="x" data-i="${i}">×</span></span>`)
      .join("");
    wrap.querySelectorAll(".x").forEach(x => {
      x.onclick = () => {
        profile.skills.splice(Number(x.dataset.i), 1);
        saveProfile(profile);
        renderSkills();
        renderRail(rail);
      };
    });
  }

  function renderExperience() {
    const list = content.querySelector("#exp-list");
    if (profile.experience.length === 0) {
      list.innerHTML = `<div class="empty"><div class="empty-title">No experience yet</div><div>Add your first company</div></div>`;
      return;
    }
    list.innerHTML = profile.experience.map((e, i) => `
      <div class="card" style="background:var(--rf-surface-2)">
        <div class="card-head">
          <span class="label">Company ${i + 1}</span>
          <button class="btn btn-ghost btn-sm" data-rm-exp="${i}">Remove</button>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Company name</label>
            <input class="input" data-e="${i}" data-f="company" value="${escape(e.company)}" />
          </div>
          <div class="field">
            <label>Designation</label>
            <input class="input" data-e="${i}" data-f="designation" value="${escape(e.designation)}" />
          </div>
        </div>
        <div class="field">
          <label>Timeline</label>
          <input class="input" data-e="${i}" data-f="timeline" value="${escape(e.timeline)}" placeholder="Aug 2023 – Present" />
        </div>

        <div class="row-between mt-3">
          <span class="label">Projects under this company</span>
          <button class="btn btn-secondary btn-sm" data-add-proj="${i}">+ Add project</button>
        </div>
        <div class="stack mt-2" id="proj-list-${i}">
          ${(e.projects || []).map((p, j) => renderProjectCard(i, j, p)).join("")}
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-rm-exp]").forEach(b => {
      b.onclick = () => {
        if (!confirm("Remove this company and all its projects?")) return;
        profile.experience.splice(Number(b.dataset.rmExp), 1);
        saveProfile(profile);
        renderExperience();
        renderRail(rail);
      };
    });

    list.querySelectorAll("[data-e]").forEach(el => {
      el.addEventListener("input", () => {
        const i = Number(el.dataset.e);
        profile.experience[i][el.dataset.f] = el.value;
        saveProfile(profile);
      });
    });

    list.querySelectorAll("[data-add-proj]").forEach(b => {
      b.onclick = () => {
        const i = Number(b.dataset.addProj);
        if (!profile.experience[i].projects) profile.experience[i].projects = [];
        profile.experience[i].projects.push({
          name: "", client: "", teamSize: "", responsibilities: [""], explanation: ""
        });
        saveProfile(profile);
        renderExperience();
      };
    });

    // Project field listeners
    list.querySelectorAll("[data-p]").forEach(el => {
      el.addEventListener("input", () => {
        const [i, j, f] = el.dataset.p.split("-").map(x => x);
        const expIdx = Number(i);
        const projIdx = Number(j);
        if (f === "responsibilities") {
          profile.experience[expIdx].projects[projIdx].responsibilities = el.value.split("\n").filter(Boolean);
        } else {
          profile.experience[expIdx].projects[projIdx][f] = el.value;
        }
        saveProfile(profile);
      });
    });

    list.querySelectorAll("[data-rm-proj]").forEach(b => {
      b.onclick = () => {
        const [i, j] = b.dataset.rmProj.split("-").map(Number);
        profile.experience[i].projects.splice(j, 1);
        saveProfile(profile);
        renderExperience();
      };
    });
  }

  function renderProjectCard(expIdx, projIdx, p) {
    return `
      <div class="card" style="background:var(--rf-surface);border:1px solid var(--rf-border)">
        <div class="card-head">
          <span class="mono text-xs">Project ${projIdx + 1}</span>
          <button class="btn btn-ghost btn-sm" data-rm-proj="${expIdx}-${projIdx}">Remove</button>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Project name</label>
            <input class="input" data-p="${expIdx}-${projIdx}-name" value="${escape(p.name)}" />
          </div>
          <div class="field">
            <label>Client (optional)</label>
            <input class="input" data-p="${expIdx}-${projIdx}-client" value="${escape(p.client)}" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Team size (optional)</label>
            <input class="input" data-p="${expIdx}-${projIdx}-teamSize" value="${escape(p.teamSize)}" placeholder="e.g. 6" />
          </div>
          <div class="field">
            <label>Tech stack (comma separated)</label>
            <input class="input" data-p="${expIdx}-${projIdx}-tech" value="${escape(p.tech || "")}" placeholder="Java 17, Spring Boot, Oracle SQL" />
          </div>
        </div>
        <div class="field">
          <label>Responsibilities (day-to-day, one per line)</label>
          <textarea class="textarea" data-p="${expIdx}-${projIdx}-responsibilities" placeholder="Handled X daily&#10;Fixed Y errors&#10;Maintained Z uptime">${escape((p.responsibilities || []).join("\n"))}</textarea>
        </div>
        <div class="field">
          <label>In-depth explanation (what + how + impact)</label>
          <textarea class="textarea" data-p="${expIdx}-${projIdx}-explanation" placeholder="Built X engine that processed Y transactions; reduced Z latency by 35% using C pattern.">${escape(p.explanation || "")}</textarea>
        </div>
      </div>
    `;
  }

  function renderEducation() {
    const list = content.querySelector("#edu-list");
    if (profile.education.length === 0) {
      list.innerHTML = `<div class="empty"><div class="empty-title">No education yet</div><div>Add your degree</div></div>`;
      return;
    }
    list.innerHTML = profile.education.map((ed, i) => `
      <div class="card" style="background:var(--rf-surface-2)">
        <div class="card-head">
          <span class="label">Education ${i + 1}</span>
          <button class="btn btn-ghost btn-sm" data-rm-edu="${i}">Remove</button>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Degree</label>
            <input class="input" data-ed="${i}" data-f="degree" value="${escape(ed.degree)}" />
          </div>
          <div class="field">
            <label>Year</label>
            <input class="input" data-ed="${i}" data-f="year" value="${escape(ed.year)}" />
          </div>
        </div>
        <div class="field">
          <label>Institution</label>
          <input class="input" data-ed="${i}" data-f="institution" value="${escape(ed.institution)}" />
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-rm-edu]").forEach(b => {
      b.onclick = () => {
        profile.education.splice(Number(b.dataset.rmEdu), 1);
        saveProfile(profile);
        renderEducation();
      };
    });
    list.querySelectorAll("[data-ed]").forEach(el => {
      el.addEventListener("input", () => {
        const i = Number(el.dataset.ed);
        profile.education[i][el.dataset.f] = el.value;
        saveProfile(profile);
      });
    });
  }

  function renderCertifications() {
    const list = content.querySelector("#cert-list");
    if (profile.certifications.length === 0) {
      list.innerHTML = `<div class="empty"><div class="empty-title">No certifications yet</div><div>Add a certification</div></div>`;
      return;
    }
    list.innerHTML = profile.certifications.map((c, i) => `
      <div class="card" style="background:var(--rf-surface-2)">
        <div class="card-head">
          <span class="label">Certification ${i + 1}</span>
          <button class="btn btn-ghost btn-sm" data-rm-cert="${i}">Remove</button>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Name</label>
            <input class="input" data-c="${i}" data-f="name" value="${escape(c.name)}" />
          </div>
          <div class="field">
            <label>Year</label>
            <input class="input" data-c="${i}" data-f="year" value="${escape(c.year)}" />
          </div>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-rm-cert]").forEach(b => {
      b.onclick = () => {
        profile.certifications.splice(Number(b.dataset.rmCert), 1);
        saveProfile(profile);
        renderCertifications();
      };
    });
    list.querySelectorAll("[data-c]").forEach(el => {
      el.addEventListener("input", () => {
        const i = Number(el.dataset.c);
        profile.certifications[i][el.dataset.f] = el.value;
        saveProfile(profile);
      });
    });
  }

  function escape(s = "") {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

function renderRail(rail) {
  const pct = computeCompleteness(profile);
  const hasName = !!profile.name && profile.name.trim().length > 0;
  rail.innerHTML = `
    <div class="label mb-3">Profile</div>
    <div class="ring-wrap mb-4">
      <div class="ring" style="--p: ${pct}"><span>${pct}%</span></div>
      <div>
        <div class="text-sm">Completeness</div>
        <div class="mono text-xs muted">autosave on</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="label mb-2">Required</div>
    <div class="text-sm" style="${hasName ? "" : "color: var(--rf-warn)"}">
      ${hasName ? "✓ name set" : "⚠ add your name to generate"}
    </div>
    <div class="divider"></div>
    <div class="label mb-2">Snapshot</div>
    <div class="text-sm dim mono">
      skills: ${profile.skills.length}<br>
      companies: ${profile.experience.length}<br>
      projects: ${(profile.experience || []).reduce((n, e) => n + (e.projects?.length || 0), 0)}<br>
      education: ${profile.education.length}<br>
      certifications: ${profile.certifications.length}
    </div>
  `;
}