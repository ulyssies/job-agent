import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { TARGET_CITIES, TOP_N_EMAIL, MIN_MATCH_PERCENT } from "../config.js";
import dotenv from "dotenv";
dotenv.config();

const CATEGORY_COLORS = {
  Excellent: "#22c55e",
  Strong: "#3b82f6",
  Good: "#f59e0b",
  Fair: "#f97316",
  Low: "#ef4444",
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
      const sal = r.estimatedSalary
        ? `<span style="color:#22c55e;font-weight:600;white-space:nowrap">${escapeHtml(r.estimatedSalary)}</span>`
        : `<span style="color:#475569">—</span>`;
      const meta = [escapeHtml(r.company), escapeHtml(r.location), escapeHtml(r.source)]
        .filter(Boolean)
        .join(" · ");
      const href = escapeHtml(r.applyLink || "#");
      return `
      <tr>
        <td style="padding:10px 12px;font-weight:700;color:${pctColor};white-space:nowrap;vertical-align:top">${r.matchPercent}%</td>
        <td style="padding:10px 12px;vertical-align:top"><span style="color:${catColor};font-weight:600;font-size:12px">${escapeHtml(r.matchCategory || "—")}</span></td>
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
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#111827;border-radius:8px;overflow:hidden;margin-top:4px">
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

function section(emoji, title, jobs, limit = TOP_N_EMAIL) {
  const slice = [...jobs].sort((a, b) => b.matchPercent - a.matchPercent).slice(0, limit);
  if (!slice.length) return "";
  return `
      <h3 style="color:#a78bfa;margin:28px 0 8px;font-size:15px;font-family:system-ui,sans-serif">${emoji} ${title}</h3>
      ${tableBlock(jobTableRows(slice))}`;
}

function tailoredResumesBlock(run, tailoredResumes) {
  if (!tailoredResumes?.length) return "";
  const folder = `output/tailored/${run.id}`;
  const pdfCount = tailoredResumes.filter((t) => t.pdfPath && fs.existsSync(t.pdfPath)).length;
  const rows = tailoredResumes
    .map(
      (t) => {
        const hasPdf = t.pdfPath && fs.existsSync(t.pdfPath);
        const pdfCell = hasPdf
          ? `<span style="color:#22c55e;font-size:12px;font-weight:600">Attached</span>`
          : `<span style="color:#64748b;font-size:11px">—</span>`;
        return `
    <tr>
      <td style="padding:8px 12px;color:#22c55e;font-family:ui-monospace,monospace;font-size:12px;font-weight:600">${escapeHtml(t.fileName)}</td>
      <td style="padding:8px 12px;color:#94a3b8;font-size:12px">${escapeHtml(t.title)} @ ${escapeHtml(t.company)}</td>
      <td style="padding:8px 12px">${pdfCell}</td>
    </tr>`;
      }
    )
    .join("");
  return `
      <div style="margin-top:28px;padding:18px 20px;background:#111827;border:1px solid #1e293b;border-radius:10px">
        <h3 style="color:#a78bfa;margin:0 0 8px;font-size:14px;font-family:system-ui,sans-serif">📎 Tailored résumés</h3>
        <p style="color:#64748b;margin:0 0 12px;font-size:12px;line-height:1.45;font-family:system-ui,sans-serif">
          <strong style="color:#94a3b8">${pdfCount}</strong> PDF(s) are attached to this email (<strong style="color:#94a3b8">NAME_COMPANY_RESUME.pdf</strong>). Source <code style="background:#0f172a;padding:2px 6px;border-radius:4px;color:#cbd5e1">.tex</code> files live in:
          <code style="background:#0f172a;padding:2px 6px;border-radius:4px;color:#cbd5e1">${escapeHtml(folder)}</code>
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <thead>
            <tr style="background:#1e293b">
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">FILENAME</th>
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">ROLE</th>
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;font-family:system-ui,sans-serif">PDF</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
}

export async function sendEmailSummary(run, tailoredResumes = []) {
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
  const excellent = allMatches.filter((r) => r.matchPercent >= 85).length;

  const spotlight = [...allMatches].sort((a, b) => b.matchPercent - a.matchPercent).slice(0, Math.min(10, TOP_N_EMAIL));
  const spotlightBlock =
    spotlight.length > 0
      ? `
      <div style="background:linear-gradient(135deg,#1e1b4b22,#0f172a);border:1px solid #312e81;border-radius:12px;padding:20px 22px;margin-bottom:8px">
        <h2 style="color:#c4b5fd;margin:0 0 6px;font-size:16px;font-family:system-ui,sans-serif">⭐ Best matches this run</h2>
        <p style="color:#64748b;margin:0 0 14px;font-size:12px;font-family:system-ui,sans-serif">Highest scores across all cities and sources — start here.</p>
        ${tableBlock(jobTableRows(spotlight))}
      </div>`
      : "";

  const cityBlocks = TARGET_CITIES.map(({ city }) =>
    section("📍", city, allMatches.filter((r) => r.targetCity === city))
  ).join("");

  const remoteBlock = section("🌐", "Remote (e.g. Jobicy)", allMatches.filter((r) => r.targetCity === "Remote"));
  const variousBlock = section("📰", "Nationwide & curated (e.g. The Muse)", allMatches.filter((r) => r.targetCity === "Various"));

  const bodyContent = [spotlightBlock, cityBlocks, remoteBlock, variousBlock].filter(Boolean).join("")
    || '<p style="color:#64748b">No matches above threshold today.</p>';

  const pdfAttachments = tailoredResumes
    .filter((t) => t.pdfPath && fs.existsSync(t.pdfPath))
    .map((t) => ({
      filename: path.basename(t.pdfPath),
      path: path.resolve(t.pdfPath),
    }));

  const html = `
<div style="background:#0a0f1e;padding:32px;font-family:system-ui,sans-serif;color:#e2e8f0;max-width:860px;margin:0 auto">
  <h1 style="color:#a78bfa;margin:0 0 4px;font-size:20px">🤖 Daily Job Report</h1>
  <p style="color:#64748b;margin:0 0 24px;font-size:13px">${run.date}</p>

  <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap">
    ${statPill(run.totalScanned, "Scanned")}
    ${statPill(allMatches.length, "Matches")}
    ${statPill(excellent, "Excellent Fits", "#22c55e")}
  </div>

  ${bodyContent}

  ${tailoredResumesBlock(run, tailoredResumes)}

  <p style="margin-top:32px;color:#334155;font-size:12px;text-align:center;font-family:system-ui,sans-serif">
    Open <strong style="color:#475569">index.html</strong> (your dashboard) for full results, run history, and filters.
  </p>
</div>`;

  await transporter.sendMail({
    from: `Job Agent 🤖 <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_RECIPIENT,
    subject: `🤖 Job Report — ${run.date} | ${excellent} Excellent | ${allMatches.length} Matches`,
    html,
    attachments: pdfAttachments.length ? pdfAttachments : undefined,
  });

  console.log(
    `  ✅ Email sent → ${process.env.EMAIL_RECIPIENT}${pdfAttachments.length ? ` (${pdfAttachments.length} PDF attach.)` : ""}`
  );
}
