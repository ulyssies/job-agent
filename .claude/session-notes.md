# Session Notes

Maintained by the context-manager agent. Do not edit manually — use `/session-end` to write entries.

---

## 2026-04-15 — Banner box alignment fix

### Built / Changed
- Fixed wide-emoji alignment bug in `main.js` banner boxes — `🤖` and `✅` each occupy 2 terminal columns, but padding was written treating them as 1, making the box walls uneven
- Corrected line 12: 8 left + 9 right padding around `🤖 Job Agent Starting` = 38 interior cols ✓
- Corrected line 63: 11 left + 12 right padding around `✅ Run Complete` = 38 interior cols ✓
- Reviewed uncommitted changes since last commit (`14d5dcb`): Portland added to `TARGET_CITIES`, DevOps titles removed from `JOB_TITLES`, auto-generated `data/jobs.json` and `index.html` updated — nothing notable enough to commit

### Decisions Made
- Uncommitted config and data changes left as-is; user confirmed nothing worth committing this session

### Known Issues
- None introduced this session

### Next Steps
- No specific next steps defined; continue with AI scoring or resume tailoring improvements per current priorities

---

## 2026-04-12 — Claude Code setup + template scaffolding

### Built / Changed
- Copied `claude-template` into project root — added `CLAUDE.md` and `.claude/` directory
- `.claude/` includes: agents (`code-reviewer`, `debugger`, `context-manager`, `docs-writer`), commands (`/session-end`, `/pre-commit`), skill (`frontend-design`)
- Filled in `CLAUDE.md` with accurate project details (stack, structure, conventions, known issues)

### Decisions Made
- Using Claude Code as the primary dev environment for this project going forward
- `CLAUDE.md` is the source of truth; session notes maintained via `/session-end`

### Known Issues
- None introduced this session

### Next Steps
- Commit `.claude/` and updated `CLAUDE.md`
- Run `/session-end` at the end of future sessions to keep notes current

---

## 2026-04-01 — Tailored resume PDFs + improved email report

### Built / Changed
- Added `src/tailorResumes.js` — generates light-touch, ATS-optimized LaTeX resumes for top job matches using Claude AI
- Updated `src/emailSummary.js` — attaches compiled PDFs to the daily email report
- Updated `config.js` — added `TOP_TAILORED_RESUMES` (top 10) and `RESUME_LATEX_PATH` config constants
- Updated `main.js` — wired `tailorResumesForTopJobs` into the 6-step pipeline as Step 5
- Updated `.env.example` — documented `RESUME_LATEX_PATH`, `TEX_BIN`, and `SKIP_TAILORED_PDF_COMPILE`
- Committed `data/jobs.json` and regenerated `index.html` for GitHub Pages

### Decisions Made
- `pdflatex` compile is optional — if it fails or is skipped via `SKIP_TAILORED_PDF_COMPILE=1`, the agent still sends the email without PDF attachments
- LaTeX resume path defaults to `./resume.tex`, overridable via env
- Tailored resumes go to `output/` directory (gitignored)

### Known Issues
- `pdflatex` must be on PATH or set via `TEX_BIN`; silently skips PDF compile if missing

### Next Steps
- Monitor email delivery and PDF attachment quality across runs
- Consider caching tailored resumes to avoid regenerating for repeated top matches

---

## 2026-03-15 — Dashboard run selector

### Built / Changed
- Added run selector dropdown to `index.html` dashboard — lets user browse historical runs
- Updated `src/dashboard.js` — generates dropdown from run history, re-renders job table on selection
- Added run selector label and polished styling
- Added Portland, OR to `TARGET_CITIES` in `config.js`
- Updated `src/jobSearch.js` — minor fetch improvements

### Decisions Made
- Dashboard is a single static `index.html` — no backend, hosted via GitHub Pages
- Run history sourced from `data/jobs.json` which is committed to the repo

### Known Issues
- Dashboard regenerated on every `node main.js` run — manual edits to `index.html` will be overwritten

### Next Steps
- Add salary range display to dashboard
- Improve mobile layout

---

## 2026-03-14 — Initial commit

### Built / Changed
- Initial project scaffolding: `main.js`, `config.js`, `src/` pipeline modules
- Multi-source job fetching (Adzuna, The Muse, Jobicy)
- AI resume parsing (`src/parseResume.js`)
- AI job scoring 0–100% with salary estimation (`src/scoreJobs.js`)
- Deduplication within and across runs (`src/database.js`)
- HTML dashboard generation (`src/dashboard.js`)
- Daily email report via Nodemailer (`src/emailSummary.js`)
- GitHub Pages dashboard at `index.html`

### Decisions Made
- Node.js ESM (`type: "module"`) throughout — no CommonJS
- All config (cities, titles, thresholds) centralized in `config.js`
- `data/jobs.json` committed to repo for run history persistence and GitHub Pages

### Known Issues
- `EXCLUDED_KEYWORDS` filters by title string match only — doesn't catch all seniority variants

### Next Steps
- Add tailored resume generation for top matches
