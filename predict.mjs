import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONVEX_URL = "https://youthful-coyote-883.convex.cloud";
const CONVEX_KEY = "prod:youthful-coyote-883|eyJ2MiI6IjdiNjA4ZjM3NWE0MTRmNjRhMzUxZTQ4YTQzZGEwMDBkIn0=";

function cleanTeam(name) {
  return (name || "").replace(/\s*\(cyber\)/g, "").trim() || name;
}

async function fetchTable(table, limit = 300) {
  const results = [];
  let cursor = null;
  let isDone = false;
  while (!isDone && results.length < limit) {
    const remaining = limit - results.length;
    const r = await fetch(CONVEX_URL + "/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Convex-Client": "npm-1.42.1",
        Authorization: "Convex " + CONVEX_KEY,
      },
      body: JSON.stringify({
        path: "_system/cli/tableData",
        format: "convex_encoded_json",
        args: { table, order: "desc", paginationOpts: { cursor, numItems: remaining } },
      }),
    });
    const text = await r.text();
    const parsed = JSON.parse(text);
    const page = parsed.value?.page ?? [];
    results.push(...page);
    isDone = parsed.value?.isDone ?? true;
    cursor = parsed.value?.continueCursor ?? null;
  }
  return results;
}

function toDateStr(ts) {
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function toTimeStr(ts) {
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toISOString().slice(11, 16);
}

const [homeTeam, awayTeam] = process.argv.slice(2);
if (!homeTeam || !awayTeam) {
  console.error("Usage: node predict.mjs <homeTeam> <awayTeam>");
  console.error("Example: node predict.mjs 'Golden State Warriors' 'Houston Rockets'");
  process.exit(1);
}

const h = homeTeam.toLowerCase().replace(/\s+/g, "");
const a = awayTeam.toLowerCase().replace(/\s+/g, "");

const matches = await fetchTable("matches", 300);

const h2h = [];

for (const m of matches) {
  const mHome = cleanTeam(m.homeTeam || "").toLowerCase().replace(/\s+/g, "");
  const mAway = cleanTeam(m.awayTeam || "").toLowerCase().replace(/\s+/g, "");

  const isMatchup =
    (mHome === h && mAway === a) ||
    (mHome === a && mAway === h) ||
    (mHome.includes(h) && mAway.includes(a)) ||
    (mHome.includes(a) && mAway.includes(h));

  if (!isMatchup) continue;
  if (!m.periodScores || m.periodScores.length < 4) continue;

  const ps = m.periodScores.sort((a, b) => a.period - b.period);
  const isSwapped = mHome === a && mAway === h;

  const team1Idx = isSwapped ? 1 : 0;
  const team2Idx = isSwapped ? 0 : 1;

  const team1 = isSwapped ? cleanTeam(m.awayTeam) : cleanTeam(m.homeTeam);
  const team2 = isSwapped ? cleanTeam(m.homeTeam) : cleanTeam(m.awayTeam);

  h2h.push({
    date: toDateStr(m.startTime),
    time: toTimeStr(m.startTime),
    team1,
    team2,
    q1: { t1: ps[0][["homeScore", "awayScore"][team1Idx]], t2: ps[0][["homeScore", "awayScore"][team2Idx]] },
    q2: { t1: ps[1][["homeScore", "awayScore"][team1Idx]], t2: ps[1][["homeScore", "awayScore"][team2Idx]] },
    q3: { t1: ps[2][["homeScore", "awayScore"][team1Idx]], t2: ps[2][["homeScore", "awayScore"][team2Idx]] },
    q4: { t1: ps[3][["homeScore", "awayScore"][team1Idx]], t2: ps[3][["homeScore", "awayScore"][team2Idx]] },
    total1: (isSwapped ? m.awayScore : m.homeScore) ?? 0,
    total2: (isSwapped ? m.homeScore : m.awayScore) ?? 0,
    winner: (isSwapped ? m.awayScore : m.homeScore) > (isSwapped ? m.homeScore : m.awayScore) ? team1 : team2,
  });
}

if (h2h.length === 0) {
  console.log(`\nNo H2H history found between "${homeTeam}" and "${awayTeam}".`);
  console.log("Available team names may differ. Check the dashboard for exact names.");
  process.exit(0);
}

console.log(`\n${'='.repeat(62)}`);
console.log(`  PREDICTIONS: ${h2h[0].team1} vs ${h2h[0].team2}`);
console.log(`  (${h2h.length} historical matchups found)`);
console.log(`${'='.repeat(62)}\n`);

console.log("HISTORICAL MATCHUPS:");
console.log("-".repeat(62));
for (const g of h2h) {
  const q1 = g.q1.t1 + g.q1.t2;
  const q2 = g.q2.t1 + g.q2.t2;
  const q3 = g.q3.t1 + g.q3.t2;
  const q4 = g.q4.t1 + g.q4.t2;
  console.log(
    `${g.date} @${g.time} | Q1:${q1} Q2:${q2} Q3:${q3} Q4:${q4} | ` +
    `HT:${q1+q2} FT:${q1+q2+q3+q4} | ${g.team1} ${g.total1}-${g.total2} ${g.team2}`
  );
}

// Compute averages per quarter (total points)
const q1s = h2h.map(g => g.q1.t1 + g.q1.t2);
const q2s = h2h.map(g => g.q2.t1 + g.q2.t2);
const q3s = h2h.map(g => g.q3.t1 + g.q3.t2);
const q4s = h2h.map(g => g.q4.t1 + g.q4.t2);
const hts = h2h.map(g => g.q1.t1 + g.q1.t2 + g.q2.t1 + g.q2.t2);
const fts = h2h.map(g => g.q1.t1 + g.q1.t2 + g.q2.t1 + g.q2.t2 + g.q3.t1 + g.q3.t2 + g.q4.t1 + g.q4.t2);
const mar = h2h.map(g => Math.abs(g.total1 - g.total2));

function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function std(arr) {
  const m = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

const avgQ1 = avg(q1s);
const avgQ2 = avg(q2s);
const avgQ3 = avg(q3s);
const avgQ4 = avg(q4s);
const dropQ1Q2 = avgQ1 - avgQ2;

const avg1Q1 = avg(h2h.map(g => g.q1.t1));
const avg1Q2 = avg(h2h.map(g => g.q2.t1));
const avg1Q3 = avg(h2h.map(g => g.q3.t1));
const avg1Q4 = avg(h2h.map(g => g.q4.t1));
const avg2Q1 = avg(h2h.map(g => g.q1.t2));
const avg2Q2 = avg(h2h.map(g => g.q2.t2));
const avg2Q3 = avg(h2h.map(g => g.q3.t2));
const avg2Q4 = avg(h2h.map(g => g.q4.t2));

const recent = h2h.slice(-3);

console.log(`\nAVERAGES PER QUARTER (total points):`);
console.log("-".repeat(62));
console.log(`  Q1 avg: ${avgQ1.toFixed(1)}  (σ ${std(q1s).toFixed(1)})`);
console.log(`  Q2 avg: ${avgQ2.toFixed(1)}  (σ ${std(q2s).toFixed(1)})`);
console.log(`  Q3 avg: ${avgQ3.toFixed(1)}  (σ ${std(q3s).toFixed(1)})`);
console.log(`  Q4 avg: ${avgQ4.toFixed(1)}  (σ ${std(q4s).toFixed(1)})`);
console.log(`  Q1→Q2 drop-off: ${dropQ1Q2.toFixed(1)}`);
console.log(`  Halftime avg: ${avg(hts).toFixed(1)}`);
console.log(`  Final total avg: ${avg(fts).toFixed(1)}`);

console.log(`\nAVERAGES BY TEAM:`);
console.log("-".repeat(62));
console.log(`  ${h2h[0].team1}:  Q1=${avg1Q1.toFixed(1)} Q2=${avg1Q2.toFixed(1)} Q3=${avg1Q3.toFixed(1)} Q4=${avg1Q4.toFixed(1)}`);

console.log(`  ${h2h[0].team2}:  Q1=${avg2Q1.toFixed(1)} Q2=${avg2Q2.toFixed(1)} Q3=${avg2Q3.toFixed(1)} Q4=${avg2Q4.toFixed(1)}`);

console.log(`\nLAST ${recent.length} TREND:`);
console.log("-".repeat(62));
const t1w = recent.filter(g => g.winner === g.team1).length;
const t2w = recent.length - t1w;
for (const g of recent) {
  const q1 = g.q1.t1 + g.q1.t2;
  const q2 = g.q2.t1 + g.q2.t2;
  const q3 = g.q3.t1 + g.q3.t2;
  const q4 = g.q4.t1 + g.q4.t2;
  console.log(`  ${g.date} | Q1:${q1} Q2:${q2} Q3:${q3} Q4:${q4} | ${g.winner} wins`);
}
console.log(`  ${h2h[0].team1} wins: ${t1w}, ${h2h[0].team2} wins: ${t2w}`);

// Generate predictions
console.log(`\n${'='.repeat(62)}`);
console.log("  PREDICTION FOR NEXT GAME:");
console.log(`${'='.repeat(62)}`);

// Predict total points per quarter using averages weighted slightly toward recent trend
const recQ1 = avg(recent.map(g => g.q1.t1 + g.q1.t2));
const recQ2 = avg(recent.map(g => g.q2.t1 + g.q2.t2));
const recQ3 = avg(recent.map(g => g.q3.t1 + g.q3.t2));
const recQ4 = avg(recent.map(g => g.q4.t1 + g.q4.t2));

// Weight: 60% overall avg, 40% recent trend
const w = 0.6;
const predQ1 = avgQ1 * w + recQ1 * (1 - w);
const predQ2 = avgQ2 * w + recQ2 * (1 - w);
const predQ3 = avgQ3 * w + recQ3 * (1 - w);
const predQ4 = avgQ4 * w + recQ4 * (1 - w);

const predHT = predQ1 + predQ2;
const predFT = predQ1 + predQ2 + predQ3 + predQ4;

// Predict team split based on historical average distribution
const t1Pct = avg(h2h.map(g => g.total1 / (g.total1 + g.total2)));
const t2Pct = 1 - t1Pct;

console.log(`  Matchup: ${h2h[0].team1} vs ${h2h[0].team2}`);
console.log(`  Based on ${h2h.length} historical H2H games\n`);
console.log(`  Q1 Total: ${predQ1.toFixed(0)}  (projected: ${h2h[0].team1}=${(predQ1 * t1Pct).toFixed(0)}, ${h2h[0].team2}=${(predQ1 * t2Pct).toFixed(0)})`);
console.log(`  Q2 Total: ${predQ2.toFixed(0)}  (projected: ${h2h[0].team1}=${(predQ2 * t1Pct).toFixed(0)}, ${h2h[0].team2}=${(predQ2 * t2Pct).toFixed(0)})`);
console.log(`  Q3 Total: ${predQ3.toFixed(0)}  (projected: ${h2h[0].team1}=${(predQ3 * t1Pct).toFixed(0)}, ${h2h[0].team2}=${(predQ3 * t2Pct).toFixed(0)})`);
console.log(`  Q4 Total: ${predQ4.toFixed(0)}  (projected: ${h2h[0].team1}=${(predQ4 * t1Pct).toFixed(0)}, ${h2h[0].team2}=${(predQ4 * t2Pct).toFixed(0)})`);
console.log(`  Halftime Total: ${predHT.toFixed(0)}`);
console.log(`  Final Total: ${predFT.toFixed(0)}`);

const predWinner = t1w > t2w ? h2h[0].team1 : h2h[0].team2;
const conf = Math.max(t1w, t2w) / recent.length * 100;
console.log(`  Predicted Winner: ${predWinner} (${conf.toFixed(0)}% confidence over last ${recent.length})`);
console.log(`  Drop-off Q1→Q2: ${dropQ1Q2.toFixed(1)} pts`);
