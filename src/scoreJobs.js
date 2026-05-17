import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import { RESUME_DA_PATH, RESUME_SWE_PATH, getJobTrack } from "../config.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SCORING_INSTRUCTIONS = `The candidate has approximately 1 year of total professional experience. Score each job on TWO dimensions combined into matchPercent:
  1. Skill alignment — how well the resume's skills, tools, and domain match the job requirements
  2. Seniority fit — whether the role's experience requirements are realistic for ~1 YOE

matchPercent must reflect BOTH. A strong skill match at an unrealistic seniority level (e.g. "3+ years required", "mid-level", "experienced") should score 60-72%, not 85%+. Only roles that are genuinely entry-level AND a good skill match should reach 85%+.

For each job return ONLY a valid JSON array. No markdown, no explanation. Each object must have:
- "index": number (0-based index within this batch)
- "matchPercent": number 0-100 — combined skill + seniority fit as described above
- "matchCategory": one of "Excellent" (85-100), "Strong" (70-84), "Good" (55-69), "Fair" (40-54), "Low" (below 40)
- "missingSkills": array of 2-3 skill strings the candidate lacks
- "reason": single sentence explaining the match, noting any seniority gap if present
- "estimatedSalary": string (e.g. "$85,000 - $110,000"), or the real salary from the listing when provided. If listing salary exists, use that exact value.
- "entryLevelFit": boolean — true only if this role is realistically attainable for a candidate with ~1 year of total experience, based on the job description's explicit years-of-experience requirements and seniority signals

JSON array:`;

async function scoreGroup(jobs, originalIndices, resume, label) {
  const batchSize = 10;
  const allScores = [];

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchIndices = originalIndices.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(jobs.length / batchSize);
    console.log(`  🧠 [${label}] Scoring batch ${batchNum}/${totalBatches}...`);

    const jobList = batch
      .map(
        (j, idx) =>
          `JOB ${idx}:\nTitle: ${j.title}\nCompany: ${j.company}\nLocation: ${j.location}\nDescription: ${j.description}` +
          (j.salary ? `\nSalary (from listing): ${j.salary}` : "")
      )
      .join("\n\n---\n\n");

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a career coach. Compare this resume against each job listing and score the fit.\n\nRESUME:\n${resume}`,
                cache_control: { type: "ephemeral" },
              },
              {
                type: "text",
                text: `JOBS TO EVALUATE:\n${jobList}\n\n${SCORING_INSTRUCTIONS}`,
              },
            ],
          },
        ],
      });

      const text = response.content[0].text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);

      parsed.forEach((score) => {
        allScores.push({
          ...score,
          globalIndex: batchIndices[score.index],
        });
      });
    } catch (e) {
      console.error(`  ⚠️  Scoring error on [${label}] batch ${batchNum}: ${e.message}`);
    }

    if (i + batchSize < jobs.length) await sleep(300);
  }

  return allScores;
}

export async function scoreJobs(jobs) {
  const daResume  = fs.readFileSync(RESUME_DA_PATH,  "utf-8");
  const sweResume = fs.readFileSync(RESUME_SWE_PATH, "utf-8");

  const daGroup  = { jobs: [], indices: [] };
  const sweGroup = { jobs: [], indices: [] };

  jobs.forEach((job, i) => {
    const group = getJobTrack(job.title) === "da" ? daGroup : sweGroup;
    group.jobs.push(job);
    group.indices.push(i);
  });

  console.log(`  📊 ${daGroup.jobs.length} DA jobs, ${sweGroup.jobs.length} SWE jobs`);

  const daScores  = daGroup.jobs.length  > 0 ? await scoreGroup(daGroup.jobs,  daGroup.indices,  daResume,  "DA")  : [];
  const sweScores = sweGroup.jobs.length > 0 ? await scoreGroup(sweGroup.jobs, sweGroup.indices, sweResume, "SWE") : [];

  return [...daScores, ...sweScores];
}
