import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function extractSkills() {
  const resume = fs.readFileSync("./resume.txt", "utf-8");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Extract the following from this resume and return ONLY valid JSON, no markdown or explanation:
{
  "name": "candidate full name",
  "skills": ["top 15 technical skills"],
  "jobTitles": ["most relevant job titles to target"],
  "yearsExperience": "estimated years of experience as a number",
  "industries": ["relevant industries"],
  "summary": "2 sentence professional summary"
}

Resume:
${resume}`,
      },
    ],
  });

  try {
    const text = response.content[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse resume profile:", e.message);
    return {
      skills: ["Python", "SQL", "Data Engineering"],
      jobTitles: ["Software Engineer", "Data Engineer"],
      yearsExperience: 1,
      industries: ["Technology"],
      summary: "Software professional seeking new opportunities.",
    };
  }
}
