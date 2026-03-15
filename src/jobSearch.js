import axios from "axios";
import { TARGET_CITIES, JOB_TITLES } from "../config.js";
import { getSeenJobs } from "./database.js";
import dotenv from "dotenv";
dotenv.config();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Jobicy (remote jobs, no API key) ─────────────────────────────────────────
async function fetchJobicy(title) {
  try {
    const res = await axios.get("https://jobicy.com/api/v2/remote-jobs", {
      params: { count: 20, tag: title },
      timeout: 10000,
    });
    return (res.data.jobs || []).map((j) => ({
      source: "Jobicy",
      title: j.jobTitle || "Unknown Title",
      company: j.companyName || "Unknown Company",
      location: j.jobGeo || "Remote",
      description: (j.jobExcerpt || (j.jobDescription || "").replace(/<[^>]+>/g, "")).slice(0, 250),
      applyLink: j.url || "#",
      postedAt: j.pubDate || null,
      salary: null,
    }));
  } catch (e) {
    console.error(`  ⚠️  Jobicy error [${title}]: ${e.message}`);
    return [];
  }
}

// ── Adzuna ────────────────────────────────────────────────────────────────────
async function fetchAdzuna(title, city, region = "us") {
  try {
    const params = {
      app_id: process.env.ADZUNA_APP_ID,
      app_key: process.env.ADZUNA_APP_KEY,
      what: title,
      results_per_page: 10,
      "content-type": "application/json",
    };
    if (city !== "Remote") params.where = city;

    const res = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/${region}/search/1`,
      { params, timeout: 10000 }
    );
    return (res.data.results || []).map((j) => {
      let salary = null;
      const min = j.salary_min;
      const max = j.salary_max;
      if (min != null && max != null) {
        salary = `$${Number(min).toLocaleString()} - $${Number(max).toLocaleString()}`;
      } else if (min != null) {
        salary = `$${Number(min).toLocaleString()}+`;
      } else if (max != null) {
        salary = `$${Number(max).toLocaleString()}+`;
      }
      return {
        source: "Adzuna",
        title: j.title || "Unknown Title",
        company: j.company?.display_name || "Unknown Company",
        location: j.location?.display_name || "Unknown",
        description: (j.description || "").slice(0, 250),
        applyLink: j.redirect_url || "#",
        postedAt: j.created || null,
        salary,
      };
    });
  } catch (e) {
    console.error(`  ⚠️  Adzuna error [${title} / ${city}]: ${e.message}`);
    return [];
  }
}

// ── The Muse (no key required) ────────────────────────────────────────────────
async function fetchTheMuse(title) {
  try {
    const res = await axios.get("https://www.themuse.com/api/public/jobs", {
      params: { page: 0, descending: true, level: "Entry Level" },
      timeout: 10000,
    });
    const jobs = (res.data.results || []).filter((j) =>
      j.name?.toLowerCase().includes(title.toLowerCase().split(" ")[0])
    );
    return jobs.slice(0, 8).map((j) => ({
      source: "The Muse",
      title: j.name || "Unknown Title",
      company: j.company?.name || "Unknown Company",
      location: j.locations?.map((l) => l.name).join(", ") || "Remote",
      description: (j.contents || "").replace(/<[^>]+>/g, "").slice(0, 250),
      applyLink: j.refs?.landing_page || "#",
      postedAt: j.publication_date || null,
      salary: null,
    }));
  } catch (e) {
    console.error(`  ⚠️  The Muse error [${title}]: ${e.message}`);
    return [];
  }
}

// ── Master fetcher ────────────────────────────────────────────────────────────
export async function fetchAllJobs() {
  const seenJobs = getSeenJobs();
  const allJobs = [];
  const seen = new Set();

  const addJobs = (jobs, targetCity) => {
    for (const job of jobs) {
      const key = `${job.title}-${job.company}`.toLowerCase().replace(/\s+/g, "");
      if (!seen.has(key)) {
        seen.add(key);
        allJobs.push({ ...job, targetCity });
      }
    }
  };

  for (const { city, adzunaRegion } of TARGET_CITIES) {
    for (const title of JOB_TITLES) {
      console.log(`  🔍 ${title} in ${city}...`);

      const [jobicyJobs, adzunaJobs] = await Promise.all([
        fetchJobicy(title),
        fetchAdzuna(title, city, adzunaRegion),
      ]);

      addJobs(jobicyJobs, city);
      addJobs(adzunaJobs, city);

      await sleep(500);
    }
  }

  // Fetch The Muse once per title (not city-specific)
  for (const title of JOB_TITLES) {
    const museJobs = await fetchTheMuse(title);
    addJobs(museJobs, "Various");
    await sleep(300);
  }

  const key = (j) => `${j.title}-${j.company}`.toLowerCase().replace(/\s+/g, "");
  const filtered = allJobs.filter((j) => !seenJobs.has(key(j)));
  const filteredOut = allJobs.length - filtered.length;
  if (filteredOut > 0) {
    console.log(`  📋 ${filteredOut} jobs filtered out as already seen.`);
  }
  return filtered;
}
