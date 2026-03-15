import fs from "fs";

const DB_PATH = "./data/jobs.json";
const MAX_RUNS = 30;

export function loadDatabase() {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ runs: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { runs: [] };
  }
}

export function getSeenJobs() {
  const db = loadDatabase();
  const seen = new Set();
  for (const run of db.runs || []) {
    for (const r of run.results || []) {
      const key = `${r.title}-${r.company}`.toLowerCase().replace(/\s+/g, "");
      seen.add(key);
    }
  }
  return seen;
}

export function saveRun(db, results) {
  const run = {
    id: Date.now(),
    date: new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    timestamp: new Date().toISOString(),
    totalScanned: results.length,
    results: results.map((r) => ({
      matchPercent:     r.matchPercent,
      matchCategory:    r.matchCategory,
      reason:           r.reason,
      missingSkills:    r.missingSkills || [],
      estimatedSalary:  r.estimatedSalary ?? null,
      title:            r.job.title,
      company:          r.job.company,
      location:         r.job.location,
      targetCity:       r.job.targetCity,
      source:           r.job.source,
      applyLink:        r.job.applyLink,
      postedAt:        r.job.postedAt,
    })),
  };

  db.runs.unshift(run);
  if (db.runs.length > MAX_RUNS) db.runs = db.runs.slice(0, MAX_RUNS);
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  return run;
}
