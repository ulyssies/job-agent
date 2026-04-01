<div align="center">

# 🤖 Job Match Agent

**AI-powered job matching that searches, scores, and delivers results to your inbox daily.**

[![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)](.)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Claude](https://img.shields.io/badge/Claude_AI-191919?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Adzuna](https://img.shields.io/badge/Adzuna_API-f59e0b?style=for-the-badge)](https://developer.adzuna.com)

> **Personal tool:** Built as an active job search tool while looking for my next role in software and data engineering. Not a SaaS product — clone it, configure it for your own search, and run it yourself.

</div>

---

## How it works

The agent reads your resume, searches multiple job boards across your target cities, scores every listing against your profile using Claude AI, estimates salaries when none are listed, and delivers a ranked report to your inbox every morning.

```
Resume → Job fetch → AI scoring + salary estimation → Dashboard + Email report
```

---

## Features

| Feature | Description |
|---|---|
| 📄 **Resume parsing** | Claude AI extracts your skills, titles, and experience automatically |
| 🌐 **Multi-source search** | Pulls from Adzuna, The Muse, and Jobicy across 6 target cities |
| 🧠 **AI scoring** | Every listing scored 0–100% match with a one-line reason |
| 💰 **Salary estimation** | Claude estimates salary ranges when job boards don't list them |
| 🔁 **Deduplication** | De-dupes within a run and filters out jobs seen in prior runs |
| 🧾 **Tailored resumes (LaTeX)** | Generates light-touch, ATS-optimized, one-page LaTeX variants for your top matches |
| 📎 **PDF attachments** | Compiles tailored `.tex` to PDF via `pdflatex` and attaches PDFs to the email (when available) |
| 🖥️ **Live dashboard** | Dark-mode UI tabbed by city, sortable columns, search, and a run selector to view past runs |
| 📧 **Daily email** | HTML email with “best of run”, city/remote sections, salary, source, and apply links |

---

## Project Structure

```
.
├── config.js                  # Target cities and job titles
├── main.js                    # Master orchestrator
├── resume.txt                 # Your resume (gitignored)
├── resume.tex                 # Your master LaTeX resume (used for tailoring)
├── .env.example
├── src/
│   ├── parseResume.js         # AI resume parsing
│   ├── jobSearch.js           # Multi-source job fetching
│   ├── scoreJobs.js           # AI scoring + salary estimation
│   ├── database.js            # Persistent run history (30 days)
│   ├── dashboard.js           # HTML dashboard generation
│   ├── emailSummary.js        # Daily email report (PDF attachments)
│   └── tailorResumes.js        # Tailored LaTeX resume generator + PDF compile
└── data/
    └── jobs.json              # Auto-generated run history (committed)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)
- An [Adzuna API key](https://developer.adzuna.com) (free)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords)
- (Optional, for PDF attachments) A LaTeX toolchain that provides `pdflatex` (BasicTeX/MacTeX on macOS)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Add your keys to .env (see Environment Variables below)
```

### 3. Add your resume

```bash
# Paste your resume as plain text into resume.txt
```

### 3b. (Optional) Add your LaTeX resume for tailoring + PDFs

Place your master resume at:

- `./resume.tex` (project root)

This enables tailored `.tex` and PDF attachments for top matches.

### 4. Set your target cities and job titles

```bash
# Edit config.js to set your TARGET_CITIES and JOB_TITLES
```

### 5. Run the agent

```bash
node main.js
```

---

## Environment Variables

Add these to `.env`. **Never commit this file** — it's already in `.gitignore`.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Powers resume parsing, job scoring, and salary estimation |
| `ADZUNA_APP_ID` | **Yes** | Adzuna API app ID (free tier: 250 req/day) |
| `ADZUNA_APP_KEY` | **Yes** | Adzuna API app key |
| `EMAIL_USER` | **Yes** | Gmail address the agent sends from |
| `EMAIL_APP_PASSWORD` | **Yes** | Gmail app password (not your regular password) |
| `EMAIL_RECIPIENT` | **Yes** | Where the daily report gets delivered |
| `RESUME_LATEX_PATH` | No | Path to your master LaTeX resume (defaults to `./resume.tex`) |
| `TEX_BIN` | No | TeX binary directory if `pdflatex` isn’t on PATH when Node runs (e.g. `/Library/TeX/texbin`) |
| `SKIP_TAILORED_PDF_COMPILE` | No | Set `1`/`true` to generate tailored `.tex` but skip `pdflatex` and PDF attachments |

---

## API Reference

| Source | Covers | Key Required |
|---|---|---|
| Adzuna | Major job boards, 16+ countries | Yes (free) |
| The Muse | Curated tech and creative roles | No |
| Jobicy | Remote-first job listings | No |

---

## Automating Daily Runs

**Mac/Linux:**
```bash
crontab -e
# Runs every day at 7am
0 7 * * * cd /path/to/job-agent && node main.js
```

**Windows:** Use Task Scheduler to run `node main.js` daily.

---

## Cost

Powered by the Anthropic Claude Sonnet API — billed separately from Claude Pro.

| Frequency | Estimated Cost |
|---|---|
| Per run (~225 jobs scored) | ~$0.80 – $1.00 |
| 3x per week | ~$2.40 / week |
| Monthly (3x/week) | ~$9.60 / month |

---

## Live Dashboard

View the latest job matches: [Live Dashboard](https://ulyssies.github.io/job-agent/)

---

## Acknowledgments

- [Anthropic Claude](https://anthropic.com/) — resume parsing, job scoring, salary estimation
- [Adzuna](https://developer.adzuna.com/) — primary job board API
- [The Muse](https://www.themuse.com/developers/api/v2) — curated job listings
- [Jobicy](https://jobicy.com/jobs-rss-feed) — remote job listings
- [Nodemailer](https://nodemailer.com/) — email delivery

---

<div align="center">
<sub>Personal job search tool · Built with Node.js and Claude AI · Not production-ready</sub>
</div>
