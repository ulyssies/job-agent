export const TARGET_CITIES = [
  { city: "Atlanta",  state: "GA", adzunaRegion: "us" },
  { city: "Austin",   state: "TX", adzunaRegion: "us" },
  { city: "Seattle",  state: "WA", adzunaRegion: "us" },
  { city: "Denver",   state: "CO", adzunaRegion: "us" },
  { city: "Boulder",  state: "CO", adzunaRegion: "us" },
  { city: "Chicago",  state: "IL", adzunaRegion: "us" },
  { city: "Portland", state: "OR", adzunaRegion: "us" },
  { city: "New York", state: "NY", adzunaRegion: "us" },
  { city: "Raleigh",  state: "NC", adzunaRegion: "us" },
  { city: "Charlotte", state: "NC", adzunaRegion: "us" },
  { city: "Houston",  state: "TX", adzunaRegion: "us" },
  { city: "Dallas",   state: "TX", adzunaRegion: "us" },
  { city: "San Antonio", state: "TX", adzunaRegion: "us" },
];

export const DA_JOB_TITLES = [
  "Data Analyst",
  "Data Engineer",
  "Junior Data Analyst",
  "Associate Data Analyst",
  "Analytics Engineer",
  "Business Intelligence Analyst",
  "AI Analyst",
];

export const SWE_JOB_TITLES = [
  "Software Engineer",
  "Full Stack Developer",
  "Associate Software Engineer",
  "AI Engineer",
  "Associate AI Engineer",
  "Automation Engineer",
  "Backend Developer",
  "Application Developer",
];

export const JOB_TITLES = [...DA_JOB_TITLES, ...SWE_JOB_TITLES];

const DA_KEYWORDS = [
  "data analyst", "data engineer", "analytics engineer",
  "business intelligence", "bi analyst", "ai analyst",
];

/** Returns 'da' or 'swe' based on the actual job title from the listing. */
export function getJobTrack(title) {
  const lower = title.toLowerCase();
  return DA_KEYWORDS.some((kw) => lower.includes(kw)) ? "da" : "swe";
}

export const MIN_MATCH_PERCENT = 60;
export const TOP_N_EMAIL = 10;

/** Filter out listings older than this many days. Jobs with no date are kept. */
export const MAX_JOB_AGE_DAYS = 14;

export const RESUME_DA_PATH  = "./da_resume.tex";
export const RESUME_SWE_PATH = "./swe_resume.tex";

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
  "C++",
  "Kubernetes",
  "PhD",
  "MBA",
  "Clearance",
  "sponsorship",
  "Top Secret",
  "Secret",
  "Confidential",
  "TS/SCI",
];
