import { extractSkills }        from "./src/parseResume.js";
import { fetchAllJobs }          from "./src/jobSearch.js";
import { scoreJobs }             from "./src/scoreJobs.js";
import { loadDatabase, saveRun } from "./src/database.js";
import { generateDashboard }     from "./src/dashboard.js";
import { sendEmailSummary }      from "./src/emailSummary.js";

async function runAgent() {
  const startTime = Date.now();
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║        🤖 Job Agent Starting         ║");
  console.log(`║  ${new Date().toLocaleString().padEnd(36)}║`);
  console.log("╚══════════════════════════════════════╝\n");

  // 1. Parse resume
  console.log("📄 Step 1/5 — Parsing resume...");
  const profile = await extractSkills();
  console.log(`  ✅ Profile extracted: ${profile.skills?.slice(0, 4).join(", ")}...\n`);

  // 2. Fetch jobs
  console.log("🌐 Step 2/5 — Fetching jobs from all sources...");
  const jobs = await fetchAllJobs();
  console.log(`  ✅ ${jobs.length} unique listings found\n`);

  if (jobs.length === 0) {
    console.log("⚠️  No jobs found — check your API keys in .env");
    process.exit(1);
  }

  // 3. Score jobs
  console.log("🧠 Step 3/5 — Scoring matches with AI...");
  const scores = await scoreJobs(jobs);
  console.log(`  ✅ ${scores.length} jobs scored\n`);

  // 4. Merge scores with job data
  const results = scores
    .map((s) => ({ ...s, job: jobs[s.globalIndex] }))
    .filter((r) => r.job);

  // 5. Save to database
  console.log("💾 Step 4/5 — Saving to database...");
  const db  = loadDatabase();
  const run = saveRun(db, results);
  console.log(`  ✅ Run saved (${db.runs.length} total runs stored)\n`);

  // 6. Generate dashboard & email
  console.log("🖥️  Step 5/5 — Generating dashboard & sending email...");
  generateDashboard(db);
  await sendEmailSummary(run);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const matches  = results.filter((r) => r.matchPercent >= 60).length;
  const entryFit = results.filter((r) => r.entryLevelFit === true).length;
  const excellent = results.filter((r) => r.matchPercent >= 85).length;

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║           ✅ Run Complete            ║");
  console.log(`║  Scanned:    ${String(jobs.length).padEnd(24)}║`);
  console.log(`║  Matches:    ${String(matches).padEnd(24)}║`);
  console.log(`║  Entry Fit:  ${String(entryFit).padEnd(24)}║`);
  console.log(`║  Excellent:  ${String(excellent).padEnd(24)}║`);
  console.log(`║  Time:       ${String(elapsed + "s").padEnd(24)}║`);
  console.log("╚══════════════════════════════════════╝\n");
}

runAgent().catch((err) => {
  console.error("\n❌ Agent failed:", err.message);
  process.exit(1);
});
