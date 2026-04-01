import Anthropic from "@anthropic-ai/sdk";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { MIN_MATCH_PERCENT, TOP_TAILORED_RESUMES, RESUME_LATEX_PATH } from "../config.js";

dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A–Z, 0–9, underscores — for NAME_COMPANY_RESUME.tex */
function fileNamePart(s, max = 48) {
  const t = String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, max);
  return t || "UNKNOWN";
}

function deriveCandidateName(profile, latexSource) {
  const n = profile?.name?.trim();
  if (n) return n;
  const fromCmd =
    latexSource.match(/\\name\[[^\]]*\]\{([^}]+)\}/)?.[1] ||
    latexSource.match(/\\name\{([^}]+)\}/)?.[1] ||
    latexSource.match(/\\textbf\{([A-Za-z][^}]{1,80})\}/)?.[1];
  return fromCmd?.trim() || "Candidate";
}

function stripCodeFence(text) {
  let t = text.trim();
  t = t.replace(/^```(?:latex|tex)?\s*/i, "").replace(/\s*```\s*$/i, "");
  return t.trim();
}

/** Run pdflatex twice in the .tex directory; returns absolute path to PDF or null. */
function compileTexToPdf(texPath) {
  const resolved = path.resolve(texPath);
  const dir = path.dirname(resolved);
  const base = path.basename(resolved);
  const bins = [
    process.env.TEX_BIN,
    "/Library/TeX/texbin",
    "/usr/local/texlive/2026basic/bin/universal-darwin",
    "/usr/local/texlive/2025basic/bin/universal-darwin",
  ].filter(Boolean);
  const existingBins = bins.filter((b) => fs.existsSync(b));
  const pathPrefix = existingBins.join(path.delimiter);
  const env = {
    ...process.env,
    PATH: pathPrefix ? `${pathPrefix}${path.delimiter}${process.env.PATH || ""}` : process.env.PATH,
  };
  const args = ["-interaction=nonstopmode", "-halt-on-error", base];
  for (let p = 0; p < 2; p++) {
    const r = spawnSync("pdflatex", args, {
      cwd: dir,
      env,
      encoding: "utf-8",
      maxBuffer: 12 * 1024 * 1024,
    });
    if (r.error?.code === "ENOENT") {
      console.error(
        "  ⚠️  pdflatex not found — install BasicTeX / MacTeX or set TEX_BIN to your TeX bin directory."
      );
      return null;
    }
  }
  const pdfAbs = resolved.replace(/\.tex$/i, ".pdf");
  return fs.existsSync(pdfAbs) ? pdfAbs : null;
}

/**
 * Writes tailored .tex files as NAME_COMPANY_RESUME.tex under output/tailored/<runId>/,
 * then runs pdflatex to produce PDFs for email attachments.
 * @returns {Array<{ fileName: string, company: string, title: string, pdfPath: string | null }>}
 */
export async function tailorResumesForTopJobs(results, run, profile = {}) {
  const written = [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("  ⚠️  ANTHROPIC_API_KEY missing — skipping tailored resumes.");
    return written;
  }

  const latexPath = process.env.RESUME_LATEX_PATH || RESUME_LATEX_PATH;
  if (!fs.existsSync(latexPath)) {
    console.log(
      `  ⚠️  LaTeX resume not found at "${latexPath}" — skipping tailored resumes (set RESUME_LATEX_PATH or add resume.tex).`
    );
    return written;
  }

  let latexSource;
  try {
    latexSource = fs.readFileSync(latexPath, "utf-8");
  } catch (e) {
    console.error(`  ⚠️  Could not read LaTeX resume: ${e.message}`);
    return written;
  }

  const candidateName = deriveCandidateName(profile, latexSource);
  const namePart = fileNamePart(candidateName.replace(/\s+/g, "_"), 40);

  const ranked = [...results]
    .filter((r) => r.matchPercent >= MIN_MATCH_PERCENT && r.job)
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, TOP_TAILORED_RESUMES);

  if (!ranked.length) {
    console.log("  ⚠️  No matches above threshold — skipping tailored resumes.");
    return written;
  }

  const outDir = path.join("output", "tailored", String(run.id));
  fs.mkdirSync(outDir, { recursive: true });

  const nameCollision = new Map();

  console.log(
    `  ✏️  Light-touch LaTeX tailoring for top ${ranked.length} match(es) → ${outDir}/`
  );

  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    const j = r.job;
    const coPart = fileNamePart(j.company, 36);
    const collisionKey = `${namePart}_${coPart}`;
    const n = (nameCollision.get(collisionKey) || 0) + 1;
    nameCollision.set(collisionKey, n);
    const dup = n > 1 ? `_${n}` : "";
    const fileBase = `${namePart}_${coPart}_RESUME${dup}`;
    const outFile = path.join(outDir, `${fileBase}.tex`);

    const jobContext = `Title: ${j.title}
Company: ${j.company}
Location: ${j.location}
Source: ${j.source}
Match score: ${r.matchPercent}% (${r.matchCategory})
Fit summary: ${r.reason}

Job description (for ATS keyword alignment only where truthful):
${j.description}`;

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: `You are an expert LaTeX résumé editor focused on minimal, ATS-friendly tweaks.

MASTER RÉSUMÉ (LaTeX):

${latexSource}

TARGET JOB:
${jobContext}

GOALS (strict priority):
1. **Keep the core résumé almost unchanged.** Same employers, roles, dates, degrees, and section order as in the master file. Do not remove major roles or rewrite everything.
2. **Professional summary / profile / objective** — this is the main place to tailor: rewrite 2–4 sentences so they speak directly to this role and company, using clear, factual language from the master (no invented achievements).
3. **ATS optimization (light touch):** Where bullets already support it, naturally weave in a few exact or close keywords from the job description (tools, domains, methods) only when they accurately describe existing work. Do not keyword-stuff. Prefer standard section titles recruiters expect (Experience, Education, Skills, etc.) if the master already uses them; do not rename sections in a gimmicky way.
4. **Bullet edits — minimal:** Prefer light rephrasing or reordering existing bullets (most relevant first). Only trim or merge bullets if needed for length. Never invent projects, metrics, or technologies.
5. **One page:** The final document must be compilable to **a single U.S. letter–sized page** (or equivalent). If the master is already one page, stay within that density: tighten wording only as needed; remove the *least* relevant bullet(s) if you must; do not add new sections or large blocks of text. Do not introduce large vertical space or new packages that blow up pagination.

OUTPUT:
- Return ONLY the full LaTeX from \\documentclass through \\end{document}.
- No markdown, no commentary.`,
          },
        ],
      });

      const raw = response.content[0].text;
      const tex = stripCodeFence(raw);
      if (!tex.includes("\\documentclass") || !tex.includes("\\end{document}")) {
        console.error(`  ⚠️  Tailored output for ${fileBase} looks invalid — skipping write.`);
        continue;
      }
      fs.writeFileSync(outFile, tex, "utf-8");
      console.log(`  ✅ Wrote ${path.relative(process.cwd(), outFile)}`);

      let pdfPath = null;
      if (process.env.SKIP_TAILORED_PDF_COMPILE === "1" || process.env.SKIP_TAILORED_PDF_COMPILE === "true") {
        console.log(`  ⏭️  SKIP_TAILORED_PDF_COMPILE set — not building PDF for ${fileBase}.`);
      } else {
        pdfPath = compileTexToPdf(outFile);
        if (pdfPath) {
          console.log(`  ✅ PDF  ${path.relative(process.cwd(), pdfPath)}`);
        } else {
          console.error(`  ⚠️  PDF compile failed for ${fileBase} — check .log in ${outDir}`);
        }
      }

      written.push({
        fileName: `${fileBase}.tex`,
        company: j.company,
        title: j.title,
        pdfPath,
      });
    } catch (e) {
      console.error(`  ⚠️  Tailoring failed for ${j.title} @ ${j.company}: ${e.message}`);
    }

    if (i + 1 < ranked.length) await sleep(400);
  }

  return written;
}
