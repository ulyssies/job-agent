```markdown
# Job Match Agent 🤖

A personal AI-powered job matching agent built with Node.js and Claude AI. 
Built as an active job search tool while looking for my next role in data 
engineering and software development.

## What it does
- Searches multiple job boards (Adzuna, The Muse, Jobicy) across 6 target 
  cities daily
- Uses Claude AI to score each listing 0-100% against my resume
- Estimates salary ranges using AI when job boards don't list them
- Deduplicates results across runs so you only see fresh listings
- Generates a persistent dark-mode dashboard tabbed by city with sortable 
  columns, search filtering, and 30-day run history
- Sends a daily HTML email summary with top matches per city including 
  match %, salary estimate, and one-line reason

## Built with
- Node.js (ES Modules)
- Anthropic Claude API (claude-sonnet-4-20250514) — resume parsing, 
  job scoring, salary estimation
- Adzuna Jobs API — primary job board source
- The Muse API — curated tech/creative listings
- Jobicy API — remote job listings
- Nodemailer + Gmail — daily email delivery
- Vanilla HTML/CSS/JS — dashboard with no frameworks

## Project Structure
```
job-agent/
├── config.js          # Target cities and job titles
├── main.js            # Master orchestrator
├── resume.txt         # Resume (gitignored)
├── src/
│   ├── parseResume.js    # AI resume parsing
│   ├── jobSearch.js      # Multi-source job fetching
│   ├── scoreJobs.js      # AI scoring + salary estimation
│   ├── database.js       # Persistent run history (30 days)
│   ├── dashboard.js      # HTML dashboard generation
│   └── emailSummary.js   # Daily email report
└── data/
    └── jobs.json      # Auto-generated run history (gitignored)
```

## Setup
```bash
npm install
cp .env.example .env
# Fill in your API keys in .env
# Paste your resume into resume.txt
node main.js
```

## Automating daily runs
**Mac/Linux:**
```bash
crontab -e
0 7 * * * cd /path/to/job-agent && node main.js
```
**Windows:** Use Task Scheduler to run `node main.js` daily.

## Cost
Approximately $0.80-1.00 per run using Claude Sonnet 4 API pricing.

## Live Dashboard
View the latest job matches: [Live Dashboard](https://ulyssies.github.io/job-agent/)
