import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function scoreJobs(jobs) {
  const resume = fs.readFileSync("./resume.txt", "utf-8");
  const batchSize = 10;
  const allScores = [];

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(jobs.length / batchSize);
    console.log(`  🧠 Scoring batch ${batchNum}/${totalBatches}...`);

    const jobList = batch
      .map(
        (j, idx) =>
          `JOB ${idx}:\nTitle: ${j.title}\nCompany: ${j.company}\nLocation: ${j.location}\nDescription: ${j.description}` +
          (j.salary ? `\nSalary (from listing): ${j.salary}` : "")
      )
      .join("\n\n---\n\n");

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `You are a career coach. Compare this resume against each job listing and score the fit.

RESUME:
${resume}

JOBS TO EVALUATE:
${jobList}

For each job, also provide an "estimatedSalary" range based on job title, location, seniority level, and required skills. Use a string like "$85,000 - $110,000". If the job listing already provided a real salary (see "Salary (from listing)" in the job context above), use that exact value for estimatedSalary instead of estimating.

Return ONLY a valid JSON array. No markdown, no explanation. Each object must have:
- "index": number (0-based index within this batch)
- "matchPercent": number 0-100
- "matchCategory": one of "Excellent" (85-100), "Strong" (70-84), "Good" (55-69), "Fair" (40-54), "Low" (below 40)
- "missingSkills": array of 2-3 skill strings the candidate lacks
- "reason": single sentence explaining the match
- "estimatedSalary": string (e.g. "$85,000 - $110,000"), or the real salary from the listing when provided

JSON array:`,
          },
        ],
      });

      const text = response.content[0].text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);

      parsed.forEach((score) => {
        allScores.push({
          ...score,
          globalIndex: i + score.index,
        });
      });
    } catch (e) {
      console.error(`  ⚠️  Scoring error on batch ${batchNum}: ${e.message}`);
    }

    if (i + batchSize < jobs.length) await sleep(300);
  }

  return allScores;
}
