export const TARGET_CITIES = [
  { city: "Atlanta",  state: "GA", adzunaRegion: "us" },
  { city: "Austin",   state: "TX", adzunaRegion: "us" },
  { city: "Seattle",  state: "WA", adzunaRegion: "us" },
  { city: "Denver",   state: "CO", adzunaRegion: "us" },
  { city: "Chicago",  state: "IL", adzunaRegion: "us" },
  { city: "New York",   state: "NY", adzunaRegion: "us" },
];

export const JOB_TITLES = [
  "Data Engineer",
  "Software Engineer",
  "Full Stack Developer",
  "Data Analyst",
  "Support Engineer",
  "Support Analyst",
  "DevOps Engineer",
  "DevOps Analyst",
  "DevOps Manager",
];

export const MIN_MATCH_PERCENT = 60;
export const TOP_N_EMAIL = 10;

/** Master résumé in LaTeX; override with env RESUME_LATEX_PATH */
export const RESUME_LATEX_PATH = "./resume.tex";

/** How many highest-scoring matches (≥ MIN_MATCH_PERCENT) get a tailored .tex per run */
export const TOP_TAILORED_RESUMES = 10;

export const EXCLUDED_KEYWORDS = [
  "Senior",
  "Sr.",
  "Lead",
  "Principal",
  "Staff",
  "Manager",
  "Director",
  "Head of",
  "VP",
  "10+ years",
  "9+ years",
  "8+ years",
  "7+ years",
  "6+ years",
  "5+ years",
  "4+ years",
  "3+ years",
];
