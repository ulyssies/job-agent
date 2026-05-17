<div align="center">

# 🤖 Job Match Agent

**AI-powered job matching that searches, scores, and delivers results to your inbox daily.**

[![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)](.)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Claude](https://img.shields.io/badge/Claude_AI-191919?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Adzuna](https://img.shields.io/badge/Adzuna_API-f59e0b?style=for-the-badge)](https://developer.adzuna.com)

> **Personal tool:** Built during an active job search targeting Data Analyst and Software Engineer roles. Not a SaaS product — clone it, configure it for your own search, and run it yourself.

</div>

---

## How it works

The agent reads your resume, searches multiple job boards across your target cities, scores every listing against your profile using Claude AI, and delivers a ranked report to your inbox.

```
Resume → Job fetch → AI scoring → Dashboard + Email report
```

Scoring accounts for **both** skill alignment and seniority fit — a strong skill match at an unrealistic experience level is scored lower, so the results you see are actually reachable.

---

## Features

| Feature | Description |
|---|---|
| 📄 **Dual resume support** | Separate DA and SWE resumes — DA jobs scored against your DA resume, SWE jobs against your SWE resume |
| 🌐 **Multi-source search** | Pulls from Adzuna, The Muse, and Jobicy across your target cities |
| 🧠 **AI scoring** | Every listing scored 0–100% on skill match AND seniority fit combined |
| 🎯 **Entry level filter** | Each job flagged as "Entry" or "Stretch" based on its actual experience requirements |
| 💰 **Salary estimation** | Claude estimates salary ranges when job boards don't list them |
| 🔁 **Deduplication** | De-dupes within a run and filters out jobs seen in prior runs |
| 🖥️ **Live dashboard** | Dark-mode UI with city tabs, entry-level filter, sortable columns, search, and run history |
| 📧 **Daily email** | Full ranked results grouped by city — no cap, everything above your threshold |

---

## Pipeline (5 steps)

```
1. Parse resume       → extract skills + profile from your DA resume
2. Fetch jobs         → Adzuna (per city), Jobicy (remote), The Muse (curated)
3. Score jobs         → DA jobs vs DA resume, SWE jobs vs SWE resume
4. Save to database   → 30-day rolling run history
5. Dashboard + email  → generate index.html, send ranked report
```

---

## Project Structure

```
.
├── config.js                  # Target cities, job titles, score threshold
├── main.js                    # Master orchestrator (5-step pipeline)
├── da_resume.tex              # Your DA resume (gitignored)
├── swe_resume.tex             # Your SWE resume (gitignored)
├── .env                       # API keys and email config (gitignored)
├── .env.example               # Template for .env
├── src/
│   ├── parseResume.js         # AI resume parsing → skills/profile object
│   ├── jobSearch.js           # Multi-source job fetching + deduplication
│   ├── scoreJobs.js           # AI scoring — dual resume, entryLevelFit, salary
│   ├── database.js            # Persistent run history (30-day window)
│   ├── dashboard.js           # HTML dashboard generation
│   └── emailSummary.js        # Daily email report
└── data/
    └── jobs.json              # Auto-generated run history (committed for GitHub Pages)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)
- An [Adzuna API key](https://developer.adzuna.com) (free)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your keys
```

### 3. Add your resumes

Place your resumes at:
- `./da_resume.tex` — for Data Analyst / Data Engineer / BI roles
- `./swe_resume.tex` — for Software Engineer / Backend / Full Stack roles

Both are gitignored. The agent automatically routes each job to the correct resume based on the job title.

### 4. Configure your search

Edit `config.js`:
- `TARGET_CITIES` — cities to search
- `DA_JOB_TITLES` / `SWE_JOB_TITLES` — job titles to search per track
- `MIN_MATCH_PERCENT` — minimum score to include in results (default: 60)
- `EXCLUDED_KEYWORDS` — title keywords that filter out over-qualified roles

### 5. Run

```bash
node main.js
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Powers resume parsing and job scoring |
| `ADZUNA_APP_ID` | **Yes** | Adzuna API app ID (free tier: 250 req/day) |
| `ADZUNA_APP_KEY` | **Yes** | Adzuna API app key |
| `EMAIL_USER` | **Yes** | Gmail address the agent sends from |
| `EMAIL_APP_PASSWORD` | **Yes** | Gmail app password (not your regular password) |
| `EMAIL_RECIPIENT` | **Yes** | Where the daily report gets delivered |

---

## Job Sources

| Source | Covers | Key Required |
|---|---|---|
| Adzuna | Major job boards across target cities | Yes (free) |
| The Muse | Curated tech and creative roles, nationwide | No |
| Jobicy | Remote-first listings | No |

---

## Scoring

Each job is scored 0–100% on two combined dimensions:

- **Skill alignment** — how well the resume's skills, tools, and domain match the job
- **Seniority fit** — whether the role's experience requirements are realistic for ~1 YOE

Jobs are also flagged as `entryLevelFit: true/false`. In the dashboard, these show as **✓ Entry** or **Stretch** in the Level column. The **Entry Level Only** filter shows just the reachable ones.

---

## Automating Daily Runs

**Mac/Linux (cron):**
```bash
crontab -e
# Every day at 7am
0 7 * * * cd /path/to/job-agent && node main.js
```

---

## Cost

Uses Claude Sonnet 4.6 with prompt caching — the resume is cached across all scoring batches so you only pay to send it once per run.

| Frequency | Estimated Cost |
|---|---|
| Per run (~200 jobs scored) | ~$0.30 – $0.50 |
| Daily | ~$9 – $15 / month |

---

## Live Dashboard

[Live Dashboard](https://ulyssies.github.io/job-agent/)

---

## Acknowledgments

- [Anthropic Claude](https://anthropic.com/) — resume parsing, scoring, salary estimation
- [Adzuna](https://developer.adzuna.com/) — primary job board API
- [The Muse](https://www.themuse.com/developers/api/v2) — curated listings
- [Jobicy](https://jobicy.com/jobs-rss-feed) — remote listings
- [Nodemailer](https://nodemailer.com/) — email delivery

---

<div align="center">
<sub>Personal job search tool · Built with Node.js and Claude AI</sub>
</div>
