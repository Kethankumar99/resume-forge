# 🚀 Resume Forge

> **Local-First ATS Resume Tailoring & Optimization Platform**

Resume Forge is an advanced AI-powered resume tailoring application that helps job seekers customize their resumes for any Job Description (JD) while maintaining complete honesty and ATS compatibility.

Simply paste a Job Description, analyze the required skills, review suggested improvements, and generate a professionally optimized resume with a **90%+ ATS match score**—all while keeping your data completely private.

Unlike cloud-based resume builders, Resume Forge stores your profile locally in your browser. No accounts, no databases, and no tracking.

---

# ✨ Features

## 🎯 Intelligent Job Description Analysis

- Analyze Job Descriptions up to **10,000 characters**
- Detect technical skills, tools, frameworks, certifications, and keywords
- Compare JD requirements against your actual profile
- Display:
  - Matched Skills
  - Missing Skills
  - Match Percentage
  - Improvement Suggestions

Powered by **Groq (openai/gpt-oss-120b)** for fast and accurate analysis.

---

## 🧠 AI Resume Tailoring

Resume Forge intelligently rewrites your resume without inventing fake experience.

It can:

- Rewrite project descriptions
- Improve work experience bullet points
- Optimize technical summaries
- Prioritize relevant skills
- Increase ATS keyword coverage
- Maintain professional formatting

Every generated resume is tailored specifically for the selected company and role.

---

## ✅ Selective Skill Injection

Instead of automatically adding every missing keyword,

Resume Forge lets you review them first.

You can:

- Accept relevant skills
- Reject unwanted suggestions
- Keep your resume honest
- Maintain complete control

Only approved skills are considered during resume generation.

---

## 📈 ATS Match Optimization

The application continuously evaluates the resume against the Job Description.

Goal:

- 90%+ ATS Match
- Better keyword density
- Improved recruiter visibility
- ATS-safe formatting

---

## 📄 Professional PDF Export

Generate pixel-perfect resumes using the browser's native print engine.

Features include:

- Perfect A4 sizing
- Equal page margins
- Smart multi-page splitting
- No text cutoff
- ATS-searchable text
- Print-ready formatting

---

## 🏷 Automatic File Naming

Downloaded resumes are automatically named using:

```

CompanyName\_CandidateName\_Resume.pdf

```

Example:

```

Google\_JohnDoe\_Resume.pdf

```

---

## 🌙 Modern User Interface

Resume Forge provides a clean and distraction-free experience.

Features:

- Dark Mode
- Light Mode
- Responsive Layout
- Georgia Typography
- JetBrains Mono Code Font
- Minimal Corporate Design

---

## 🔒 Privacy First

Your data belongs to you.

Resume Forge:

- Stores everything locally
- Uses browser localStorage
- Has no backend server
- Has no user accounts
- Has no telemetry
- Never uploads your profile except when analyzing a Job Description through the configured Groq API

---

# ⚙️ Technology Stack

| Category | Technology |
|-----------|------------|
| Frontend | HTML5 |
| Styling | CSS3 |
| Programming | Vanilla JavaScript (ES Modules) |
| AI Engine | Groq API (openai/gpt-oss-120b) |
| Storage | Browser LocalStorage |
| PDF Engine | Native Browser Print |
| Build Tool | Vite |

---

# 📦 Prerequisites

Before running the project, ensure you have:

- Node.js 18+
- npm
- A free Groq API Key

Get your API key here:

https://console.groq.com/keys

---

# 🚀 Installation

Clone the repository

```bash
git clone https://(https://github.com/Kethankumar99/resume-forge)
```

Navigate into the project

```bash
cd resume-forge
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Open your browser

```
http://localhost:5173
```

---

# 🔑 First-Time Setup

## Step 1 — Configure AI

Open

```
Settings
```

Paste your Groq API Key.

Click

```
Save & Test Connection
```

Expected status:

```
Groq Connected ✓
```

---

## Step 2 — Build Your Profile

Navigate to

```
Profile
```

Fill in your information.

Only **Name** is mandatory.

Everything else is optional.

### Work Experience

For each company add:

- Company Name
- Designation
- Timeline

---

### Projects

Each company can contain multiple projects.

Each project supports:

- Project Name
- Client
- Team Size
- Responsibilities
- Detailed Explanation
- Technologies Used

---

### Technical Skills

Add skills such as:

- Languages
- Frameworks
- Databases
- Cloud
- DevOps
- Tools

---

### Education

Add:

- Degree
- Institution
- Graduation Year

---

### Certifications

Store professional certifications for automatic inclusion.

---

# 🎯 Tailoring a Resume

Navigate to

```
Tailor Resume
```

Enter:

- Company Name
- Job Description

Click

```
Analyze JD
```

Resume Forge will:

- Extract keywords
- Compare your experience
- Calculate ATS Match
- Display matched skills
- Display missing skills

Review the suggestions.

Approve only the skills you genuinely possess.

Finally click

```
Tailor Resume
```

Download your optimized resume.

---

# 🧩 How Resume Forge Works

```text
Paste Job Description
        │
        ▼
Extract Keywords using Groq
        │
        ▼
Compare Against Your Profile
        │
        ▼
Show Match %
        │
        ▼
Display Missing Skills
        │
        ▼
User Reviews Suggestions
        │
        ▼
Generate Optimized Resume
        │
        ▼
Create ATS-Friendly PDF
```

---

# 🎯 ATS Optimization Strategy

Resume Forge improves ATS compatibility by:

- Matching technical keywords
- Improving resume structure
- Enhancing bullet points
- Optimizing project descriptions
- Highlighting relevant technologies
- Maintaining semantic consistency
- Preserving truthful experience

The system never sacrifices readability for keyword stuffing.

---

# 🔍 Honesty Policy

Resume Forge never fabricates experience.

If a Job Description requires technologies you have never used,

they are marked as:

```
Missing Skills
```

instead of being automatically inserted.

The final decision always remains with you.

This ensures every generated resume remains truthful, ethical, and interview-ready.

---

# 💾 Local Storage

Your profile is automatically saved in your browser.

Stored data includes:

- Personal Information
- Work Experience
- Projects
- Skills
- Education
- Certifications
- Theme Preference
- API Configuration

No manual save is required.

---

# 📁 Project Structure

```text
resume-forge/
│
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── styles/
│   └── assets/
│
├── package.json
├── vite.config.js
├── README.md
└── LICENSE
```

---

# 🤝 Contributing

Contributions are welcome.

You can help by:

- Reporting bugs
- Suggesting new features
- Improving documentation
- Optimizing UI
- Enhancing ATS algorithms

Please create an issue before submitting major changes.

---

# 📜 License

This project is licensed under the **MIT License**.

See the **LICENSE** file for more details.

---

# ❤️ Acknowledgements

Built using:

- Groq API
- GPT-OSS-120B
- Vite
- HTML5
- CSS3
- JavaScript (ES Modules)

Special thanks to the open-source community for enabling fast, privacy-focused developer tools.

---

## ⭐ Support

If Resume Forge helped you land interviews or improve your resume, consider giving the repository a **⭐ Star** on GitHub.

It helps the project reach more developers and job seekers.
