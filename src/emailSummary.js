import nodemailer from "nodemailer";
import { TARGET_CITIES, MIN_MATCH_PERCENT } from "../config.js";
import dotenv from "dotenv";
dotenv.config();

const CATEGORY_COLORS = {
  Excellent: "#22c55e",
  Strong:    "#3b82f6",
  Good:      "#f59e0b",
  Fair:      "#f97316",
  Low:       "#ef4444",
};

function matchColor(pct) {
  if (pct >= 85) return "#22c55e";
  if (pct >= 70) return "#3b82f6";
  if (pct >= 55) return "#f59e0b";
  return "#f97316";
}

function escapeHtml(s) {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statPill(num, label, color = "#a78bfa") {
  return `<div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:12px 20px;text-align:center;display:inline-block;min-width:100px">
    <div style="font-size:22px;font-weight:700;color:${color}">${num}</div>
    <div style="font-size:11px;color:#64748b;margin-top:2px">${label}</div>
  </div>`;
}

function jobTableRows(jobs) {
  return jobs
    .map((r) => {
      const pctColor = matchColor(r.matchPercent);
      const catColor = CATEGORY_COLORS[r.matchCategory] || pctColor;
      const entryTag = r.entryLevelFit === true
        ? `<span style="color:#22c55e;font-size:10px;font-weight:600;margin-left:6px">✓ Entry</span>`
        : r.entryLevelFit === false
          ? `<span style="color:#f87171;font-size:10px;margin-left:6px">Stretch</span>`
          : "";
      const sal = r.estimatedSalary
        ? `<span style="color:#22c55e;font-weight:600;white-space:nowrap">${escapeHtml(r.estimatedSalary)}</span>`
        : `<span style="color:#475569">—</span>`;
      const meta = [escapeHtml(r.company), escapeHtml(r.location), escapeHtml(r.source)]
        .filter(Boolean).join(" · ");
      const href = escapeHtml(r.applyLink || "#");
      return `
      <tr>
        <td style="padding:10px 12px;font-weight:700;color:${pctColor};white-space:nowrap;vertical-align:top">${r.matchPercent}%</td>
        <td style="padding:10px 12px;vertical-align:top;white-space:nowrap">
          <span style="color:${catColor};font-weight:600;font-size:12px">${escapeHtml(r.matchCategory || "—")}</span>${entryTag}
        </td>
        <td style="padding:10px 12px;vertical-align:top">
          <a href="${href}" style="color:#818cf8;text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(r.title)}</a>
          <div style="font-size:11px;color:#64748b;margin-top:4px;line-height:1.4">${meta}</div>
        </td>
        <td style="padding:10px 12px;vertical-align:top;font-size:13px">${sal}</td>
        <td style="padding:10px 12px;color:#94a3b8;font-size:12px;line-height:1.45;vertical-align:top">${escapeHtml(r.reason)}</td>
      </tr>`;
    })
    .join("");
}

function tableBlock(rows) {
  if (!rows.trim()) return "";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#111827;border-radius:8px;overflow:hidden;margin-top:8px">
      <thead>
        <tr style="background:#1e293b">
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">MATCH</th>
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">TIER</th>
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">ROLE</th>
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">SALARY</th>
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">WHY IT FITS</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/** Entry level jobs sorted by %, all cities combined — the primary section. */
function entryLevelSection(jobs) {
  const sorted = [...jobs]
    .filter((r) => r.entryLevelFit === true)
    .sort((a, b) => b.matchPercent - a.matchPercent);
  if (!sorted.length) return "";
  return `
    <div style="margin-bottom:16px">
      <h2 style="color:#22c55e;margin:0 0 4px;font-size:16px;font-family:system-ui,sans-serif">✓ Entry Level Fits <span style="color:#475569;font-size:13px;font-weight:400">(${sorted.length})</span></h2>
      <p style="color:#64748b;margin:0 0 8px;font-size:12px;font-family:system-ui,sans-serif">All entry-level matches across every city, sorted by score — start here.</p>
      ${tableBlock(jobTableRows(sorted))}
    </div>`;
}

/** Collapsible city section — entry level jobs first, then stretch, both sorted by %. */
function citySection(emoji, label, jobs) {
  if (!jobs.length) return "";
  const entry   = [...jobs].filter((r) => r.entryLevelFit === true) .sort((a, b) => b.matchPercent - a.matchPercent);
  const stretch = [...jobs].filter((r) => r.entryLevelFit !== true) .sort((a, b) => b.matchPercent - a.matchPercent);
  const sorted  = [...entry, ...stretch];
  const entryCount = entry.length;
  const summaryRight = entryCount > 0
    ? `<span style="color:#22c55e;font-size:12px;margin-left:8px">${entryCount} entry</span>`
    : "";
  return `
    <details style="margin-bottom:6px">
      <summary style="cursor:pointer;list-style:none;padding:10px 14px;background:#111827;border:1px solid #1e293b;border-radius:8px;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:14px;font-weight:600;color:#e2e8f0">${emoji} ${escapeHtml(label)}</span>
        <span style="font-size:12px;color:#64748b">${sorted.length} match${sorted.length !== 1 ? "es" : ""}${summaryRight} ▸</span>
      </summary>
      ${tableBlock(jobTableRows(sorted))}
    </details>`;
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
  const entryFit   = allMatches.filter((r) => r.entryLevelFit === true).length;

  const cityBlocks = TARGET_CITIES.map(({ city }) =>
    citySection("📍", city, allMatches.filter((r) => r.targetCity === city))
  ).join("");

  const remoteBlock  = citySection("🌐", "Remote (Jobicy)",               allMatches.filter((r) => r.targetCity === "Remote"));
  const variousBlock = citySection("📰", "Nationwide & curated (The Muse)", allMatches.filter((r) => r.targetCity === "Various"));

  const bodyContent = entryLevelSection(allMatches)
    + `<h3 style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin:28px 0 10px;font-family:system-ui,sans-serif">By City</h3>`
    + [cityBlocks, remoteBlock, variousBlock].filter(Boolean).join("")
    || '<p style="color:#64748b">No matches above threshold today.</p>';

  const html = `
<div style="background:#0a0f1e;padding:32px;font-family:system-ui,sans-serif;color:#e2e8f0;max-width:860px;margin:0 auto">
  <h1 style="color:#a78bfa;margin:0 0 4px;font-size:20px">🤖 Daily Job Report</h1>
  <p style="color:#64748b;margin:0 0 24px;font-size:13px">${run.date}</p>

  <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap">
    ${statPill(run.totalScanned, "Scanned")}
    ${statPill(allMatches.length, "Matches")}
    ${statPill(entryFit, "Entry Level Fits", "#22c55e")}
    ${statPill(excellent, "Excellent Fits", "#a78bfa")}
  </div>

  ${bodyContent}

  <p style="margin-top:32px;color:#334155;font-size:12px;text-align:center;font-family:system-ui,sans-serif">
    Open the <strong style="color:#475569">dashboard</strong> for filters, run history, and DA/SWE track view.
  </p>
</div>`;

  await transporter.sendMail({
    from: `Job Agent 🤖 <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_RECIPIENT,
    subject: `🤖 Job Report — ${run.date} | ${entryFit} Entry Fit | ${excellent} Excellent | ${allMatches.length} Matches`,
    html,
  });

  console.log(`  ✅ Email sent → ${process.env.EMAIL_RECIPIENT}`);
}
