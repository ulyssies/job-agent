import nodemailer from "nodemailer";
import { TARGET_CITIES, TOP_N_EMAIL, MIN_MATCH_PERCENT } from "../config.js";
import dotenv from "dotenv";
dotenv.config();

function matchColor(pct) {
  if (pct >= 85) return "#22c55e";
  if (pct >= 70) return "#3b82f6";
  if (pct >= 55) return "#f59e0b";
  return "#f97316";
}

function statPill(num, label, color = "#a78bfa") {
  return `<div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:12px 20px;text-align:center;display:inline-block;min-width:100px">
    <div style="font-size:22px;font-weight:700;color:${color}">${num}</div>
    <div style="font-size:11px;color:#64748b;margin-top:2px">${label}</div>
  </div>`;
}

export async function sendEmailSummary(run) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log("  ⚠️  Email credentials not set — skipping email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const allMatches = run.results.filter((r) => r.matchPercent >= MIN_MATCH_PERCENT);
  const excellent  = allMatches.filter((r) => r.matchPercent >= 85).length;

  const citySections = TARGET_CITIES.map(({ city }) => {
    const cityJobs = allMatches
      .filter((r) => r.targetCity === city)
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, TOP_N_EMAIL);

    if (!cityJobs.length) return "";

    const rows = cityJobs
      .map(
        (r) => `
      <tr>
        <td style="padding:8px 12px;font-weight:700;color:${matchColor(r.matchPercent)};white-space:nowrap">${r.matchPercent}%</td>
        <td style="padding:8px 12px"><a href="${r.applyLink}" style="color:#818cf8;text-decoration:none;font-weight:500">${r.title}</a></td>
        <td style="padding:8px 12px;color:#94a3b8">${r.company}</td>
        <td style="padding:8px 12px;color:#64748b;font-size:12px">${r.reason}</td>
      </tr>`
      )
      .join("");

    return `
      <h3 style="color:#a78bfa;margin:28px 0 8px;font-size:15px;font-family:system-ui,sans-serif">📍 ${city}</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#111827;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#1e293b">
            <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">MATCH</th>
            <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">ROLE</th>
            <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">COMPANY</th>
            <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">WHY IT FITS</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }).join("");

  const html = `
<div style="background:#0a0f1e;padding:32px;font-family:system-ui,sans-serif;color:#e2e8f0;max-width:820px;margin:0 auto">
  <h1 style="color:#a78bfa;margin:0 0 4px;font-size:20px">🤖 Daily Job Report</h1>
  <p style="color:#64748b;margin:0 0 24px;font-size:13px">${run.date}</p>

  <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap">
    ${statPill(run.totalScanned, "Scanned")}
    ${statPill(allMatches.length, "Matches")}
    ${statPill(excellent, "Excellent Fits", "#22c55e")}
  </div>

  ${citySections || '<p style="color:#64748b">No matches above threshold today.</p>'}

  <p style="margin-top:32px;color:#334155;font-size:12px;text-align:center;font-family:system-ui,sans-serif">
    Open dashboard.html for full results, history, and filtering.
  </p>
</div>`;

  await transporter.sendMail({
    from: `Job Agent 🤖 <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_RECIPIENT,
    subject: `🤖 Job Report — ${run.date} | ${excellent} Excellent Fits | ${allMatches.length} Total Matches`,
    html,
  });

  console.log(`  ✅ Email sent → ${process.env.EMAIL_RECIPIENT}`);
}
