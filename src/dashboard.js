import fs from "fs";
import { TARGET_CITIES, MIN_MATCH_PERCENT } from "../config.js";

const CATEGORY_COLORS = {
  Excellent: "#22c55e",
  Strong:    "#3b82f6",
  Good:      "#f59e0b",
  Fair:      "#f97316",
  Low:       "#ef4444",
};

function entryBadge(fit) {
  if (fit === true)  return `<span style="color:#22c55e;font-size:12px;font-weight:600">✓ Entry</span>`;
  if (fit === false) return `<span style="color:#f87171;font-size:11px">Stretch</span>`;
  return `<span style="color:#475569;font-size:11px">—</span>`;
}

export function generateDashboard(db) {
  const latestRun = db.runs[0];
  if (!latestRun) {
    console.log("  ⚠️  No runs in database yet, skipping dashboard.");
    return;
  }

  const allMatches = latestRun.results.filter((r) => r.matchPercent >= MIN_MATCH_PERCENT);
  const cities = ["All", ...TARGET_CITIES.map((c) => c.city), "Remote", "Various"];

  const runSelectorOptions = db.runs
    .map((run, i) => `<option value="${i}">${run.date} — ${run.totalScanned} jobs scanned</option>`)
    .join("");

  const tabButtons = cities
    .map((city, i) => `<button class="tab-btn${i === 0 ? " active" : ""}" onclick="switchTab('${city}')">${city}</button>`)
    .join("");

  const tableRows = [...allMatches]
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .map((r) => {
      const color = CATEGORY_COLORS[r.matchCategory] || "#94a3b8";
      return `
        <tr data-city="${r.targetCity}" data-entry="${r.entryLevelFit}">
          <td><span style="color:${color};font-weight:700">${r.matchPercent}%</span></td>
          <td><span class="badge" style="background:${color}22;color:${color}">${r.matchCategory}</span></td>
          <td>${entryBadge(r.entryLevelFit)}</td>
          <td><a href="${r.applyLink}" target="_blank" class="job-link">${r.title}</a></td>
          <td>${r.company}</td>
          <td>${r.location}</td>
          <td><span class="salary-cell">${r.estimatedSalary ?? "—"}</span></td>
          <td><span class="source-tag">${r.source}</span></td>
          <td class="reason-cell">${r.reason}</td>
          <td class="missing-cell">${(r.missingSkills || []).join(", ") || "—"}</td>
        </tr>`;
    })
    .join("");

  const historyRows = db.runs
    .map((run) => {
      const excellent  = run.results.filter((r) => r.matchPercent >= 85).length;
      const matches    = run.results.filter((r) => r.matchPercent >= MIN_MATCH_PERCENT).length;
      const entryFit   = run.results.filter((r) => r.entryLevelFit === true).length;
      const top        = run.results[0];
      return `
        <tr>
          <td>${run.date}</td>
          <td>${run.totalScanned}</td>
          <td style="color:#22c55e">${excellent}</td>
          <td>${matches}</td>
          <td style="color:#22c55e">${entryFit || "—"}</td>
          <td>${top ? `${top.matchPercent}% — ${top.title} @ ${top.company}` : "—"}</td>
        </tr>`;
    })
    .join("");

  const excellent  = allMatches.filter((r) => r.matchPercent >= 85).length;
  const strong     = allMatches.filter((r) => r.matchPercent >= 70 && r.matchPercent < 85).length;
  const entryFit   = allMatches.filter((r) => r.entryLevelFit === true).length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Job Match Dashboard</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0a0f1e;color:#e2e8f0;min-height:100vh}
  .header{background:linear-gradient(135deg,#1e1b4b,#0a0f1e);padding:24px 32px;border-bottom:1px solid #1e293b}
  .header h1{font-size:22px;font-weight:700;color:#a78bfa}
  .header p{color:#64748b;font-size:13px;margin-top:4px}
  .stats{display:flex;gap:12px;padding:20px 32px;flex-wrap:wrap}
  .stat-card{background:#111827;border:1px solid #1e293b;border-radius:10px;padding:14px 22px;flex:1;min-width:120px}
  .stat-card .num{font-size:26px;font-weight:700;color:#a78bfa}
  .stat-card .lbl{font-size:11px;color:#64748b;margin-top:2px}
  .controls{display:flex;gap:10px;padding:0 32px 16px;align-items:center;flex-wrap:wrap}
  .tab-btn{padding:6px 16px;border-radius:20px;border:1px solid #334155;background:transparent;color:#94a3b8;cursor:pointer;font-size:13px;transition:all .15s}
  .tab-btn:hover{border-color:#a78bfa;color:#a78bfa}
  .tab-btn.active{background:#a78bfa;border-color:#a78bfa;color:#0a0f1e;font-weight:600}
  .filter-btn{padding:6px 16px;border-radius:20px;border:1px solid #334155;background:transparent;color:#94a3b8;cursor:pointer;font-size:13px;transition:all .15s}
  .filter-btn:hover{border-color:#22c55e;color:#22c55e}
  .filter-btn.active{background:#22c55e;border-color:#22c55e;color:#0a0f1e;font-weight:600}
  .controls-row{display:flex;gap:10px;padding:0 32px 8px;align-items:center;flex-wrap:wrap}
  .controls-divider{width:1px;height:20px;background:#1e293b;margin:0 4px}
  .run-selector-wrap{display:flex;align-items:center;gap:6px}
  .run-selector-wrap label{color:#64748b;font-size:12px;font-weight:500}
  #run-selector{background:#111827;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer;min-width:220px}
  #run-selector:focus{outline:none;border-color:#a78bfa}
  .search-box{margin-left:auto;padding:7px 14px;border-radius:8px;border:1px solid #334155;background:#111827;color:#e2e8f0;font-size:13px;width:220px}
  .search-box:focus{outline:none;border-color:#a78bfa}
  .section{padding:0 32px 32px}
  .section-title{font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#111827;padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;position:sticky;top:0;cursor:pointer}
  th:hover{color:#a78bfa}
  td{padding:9px 12px;border-bottom:1px solid #0f172a;vertical-align:top}
  tr:hover td{background:#111827}
  .job-link{color:#818cf8;text-decoration:none;font-weight:500}
  .job-link:hover{color:#a78bfa;text-decoration:underline}
  .badge{padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
  .source-tag{background:#1e293b;color:#94a3b8;padding:2px 8px;border-radius:6px;font-size:11px}
  .reason-cell{max-width:240px;color:#94a3b8;font-size:12px}
  .missing-cell{max-width:160px;color:#f87171;font-size:11px}
  .salary-cell{color:#22c55e;font-weight:600;font-size:12px}
  .empty{text-align:center;padding:60px;color:#334155}
</style>
</head>
<body>
<div class="header">
  <h1>🤖 Job Match Dashboard</h1>
  <p>Last updated: ${latestRun.date} · ${latestRun.totalScanned} jobs scanned</p>
</div>
<div class="stats">
  <div class="stat-card" id="stat-card-matches"><div class="num">${allMatches.length}</div><div class="lbl">Matches Today</div></div>
  <div class="stat-card" id="stat-card-entry"><div class="num" style="color:#22c55e">${entryFit}</div><div class="lbl">Entry Level Fit</div></div>
  <div class="stat-card" id="stat-card-excellent"><div class="num" style="color:#a78bfa">${excellent}</div><div class="lbl">Excellent Fits</div></div>
  <div class="stat-card" id="stat-card-strong"><div class="num" style="color:#3b82f6">${strong}</div><div class="lbl">Strong Fits</div></div>
  <div class="stat-card"><div class="num">${db.runs.length}</div><div class="lbl">Days Tracked</div></div>
  <div class="stat-card" id="stat-card-scanned"><div class="num">${latestRun.totalScanned}</div><div class="lbl">Jobs Scanned</div></div>
</div>
<div class="controls">
  <div class="run-selector-wrap">
    <label for="run-selector">Run:</label>
    <select id="run-selector" onchange="switchRun(parseInt(this.value,10))">
      ${runSelectorOptions}
    </select>
  </div>
  <div class="controls-divider"></div>
  <button class="filter-btn" id="entry-filter-btn" onclick="toggleEntryFilter()">Entry Level Only</button>
  <div class="controls-divider"></div>
  ${tabButtons}
  <input class="search-box" type="text" placeholder="Search title, company..." oninput="filterTable(this.value)">
</div>
<div class="section">
  <div class="section-title">Today's Matches</div>
  <div style="overflow-x:auto">
    <table id="jobs-table">
      <thead><tr>
        <th onclick="sortTable(0)">Match %</th>
        <th onclick="sortTable(1)">Category</th>
        <th>Level</th>
        <th onclick="sortTable(3)">Job Title</th>
        <th onclick="sortTable(4)">Company</th>
        <th onclick="sortTable(5)">Location</th>
        <th onclick="sortTable(6)">Salary</th>
        <th>Source</th>
        <th>Why It Fits</th>
        <th>Missing Skills</th>
      </tr></thead>
      <tbody id="jobs-body">${tableRows || '<tr><td colspan="10" class="empty">No matches found above threshold.</td></tr>'}</tbody>
    </table>
  </div>
</div>
<div class="section">
  <div class="section-title">Run History (last ${db.runs.length} days)</div>
  <div style="overflow-x:auto">
    <table>
      <thead><tr>
        <th>Date</th><th>Scanned</th><th>Excellent</th><th>Total Matches</th><th>Entry Fit</th><th>Top Pick</th>
      </tr></thead>
      <tbody>${historyRows}</tbody>
    </table>
  </div>
</div>
<script>
  const ALL_RUNS = ${JSON.stringify(db.runs).replace(/<\/script>/gi, "<\\/script>")};
  const MIN_MATCH_PERCENT = ${MIN_MATCH_PERCENT};
  const CATEGORY_COLORS = ${JSON.stringify(CATEGORY_COLORS)};

  let activeCity="All", searchTerm="", entryOnly=false;

  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

  function entryBadgeHtml(fit){
    if(fit===true)  return "<span style=\\"color:#22c55e;font-size:12px;font-weight:600\\">\\u2713 Entry</span>";
    if(fit===false) return "<span style=\\"color:#f87171;font-size:11px\\">Stretch</span>";
    return "<span style=\\"color:#475569;font-size:11px\\">\\u2014</span>";
  }

  function buildRow(r){
    const color=CATEGORY_COLORS[r.matchCategory]||"#94a3b8";
    const sal=r.estimatedSalary!=null?esc(r.estimatedSalary):"\\u2014";
    const missing=esc((r.missingSkills||[]).join(", "))||"\\u2014";
    return "<tr data-city=\\""+esc(r.targetCity)+"\\" data-entry=\\""+r.entryLevelFit+"\\">"
      +"<td><span style=\\"color:"+color+";font-weight:700\\">"+r.matchPercent+"%</span></td>"
      +"<td><span class=\\"badge\\" style=\\"background:"+color+"22;color:"+color+"\\">"+esc(r.matchCategory)+"</span></td>"
      +"<td>"+entryBadgeHtml(r.entryLevelFit)+"</td>"
      +"<td><a href=\\""+esc(r.applyLink||"#")+"\\" target=\\"_blank\\" class=\\"job-link\\">"+esc(r.title)+"</a></td>"
      +"<td>"+esc(r.company)+"</td>"
      +"<td>"+esc(r.location)+"</td>"
      +"<td><span class=\\"salary-cell\\">"+sal+"</span></td>"
      +"<td><span class=\\"source-tag\\">"+esc(r.source)+"</span></td>"
      +"<td class=\\"reason-cell\\">"+esc(r.reason)+"</td>"
      +"<td class=\\"missing-cell\\">"+missing+"</td>"
      +"</tr>";
  }

  function switchRun(index){
    const run=ALL_RUNS[index];
    if(!run)return;
    const allMatches=run.results.filter(r=>r.matchPercent>=MIN_MATCH_PERCENT);
    const excellent=allMatches.filter(r=>r.matchPercent>=85).length;
    const strong=allMatches.filter(r=>r.matchPercent>=70&&r.matchPercent<85).length;
    const entryFit=allMatches.filter(r=>r.entryLevelFit===true).length;
    const rowsHtml=[...allMatches].sort((a,b)=>b.matchPercent-a.matchPercent).map(buildRow).join("");
    document.getElementById("jobs-body").innerHTML=rowsHtml||"<tr><td colspan=\\"10\\" class=\\"empty\\">No matches found above threshold.</td></tr>";
    document.querySelector("#stat-card-matches .num").textContent=allMatches.length;
    document.querySelector("#stat-card-entry .num").textContent=entryFit;
    document.querySelector("#stat-card-excellent .num").textContent=excellent;
    document.querySelector("#stat-card-strong .num").textContent=strong;
    document.querySelector("#stat-card-scanned .num").textContent=run.totalScanned;
    applyFilters();
  }

  function toggleEntryFilter(){
    entryOnly=!entryOnly;
    document.getElementById("entry-filter-btn").classList.toggle("active",entryOnly);
    applyFilters();
  }

  function switchTab(city){
    activeCity=city;
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active",b.textContent===city));
    applyFilters();
  }

  function filterTable(val){searchTerm=val.toLowerCase();applyFilters();}

  function applyFilters(){
    document.querySelectorAll("#jobs-body tr").forEach(row=>{
      const cityMatch=activeCity==="All"||row.dataset.city===activeCity;
      const searchMatch=!searchTerm||row.textContent.toLowerCase().includes(searchTerm);
      const entryMatch=!entryOnly||row.dataset.entry==="true";
      row.style.display=cityMatch&&searchMatch&&entryMatch?"":"none";
    });
  }

  let sortDir={};
  function sortTable(col){
    const tbody=document.getElementById("jobs-body");
    const rows=Array.from(tbody.querySelectorAll("tr"));
    sortDir[col]=!sortDir[col];
    rows.sort((a,b)=>{
      const A=a.cells[col]?.textContent.trim()||"";
      const B=b.cells[col]?.textContent.trim()||"";
      const nA=parseFloat(A),nB=parseFloat(B);
      if(!isNaN(nA)&&!isNaN(nB))return sortDir[col]?nB-nA:nA-nB;
      return sortDir[col]?B.localeCompare(A):A.localeCompare(B);
    });
    rows.forEach(r=>tbody.appendChild(r));
  }
</script>
</body>
</html>`;

  fs.writeFileSync("./index.html", html);
  console.log("  ✅ Dashboard written → index.html");
}
