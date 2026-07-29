import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = join(__dirname, ".env");
const envVars = {};
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  }
}
function existsSync(p) { try { readFileSync(p); return true; } catch { return false; } }

const CONVEX_URL = envVars.CONVEX_URL || "https://youthful-coyote-883.convex.cloud";
const CONVEX_KEY = envVars.CONVEX_KEY || "prod:youthful-coyote-883|eyJ2MiI6IjdiNjA4ZjM3NWE0MTRmNjRhMzUxZTQ4YTQzZGEwMDBkIn0=";
const PROXY_BASE = "https://melbet-proxy.bonsamisgana.workers.dev";
const POLL_INTERVAL = parseInt(envVars.POLL_INTERVAL || "15000");

const NBA_TEAMS = new Set([
  "Atlanta Hawks","Boston Celtics","Brooklyn Nets","Charlotte Hornets","Chicago Bulls",
  "Cleveland Cavaliers","Dallas Mavericks","Denver Nuggets","Detroit Pistons","Golden State Warriors",
  "Houston Rockets","Indiana Pacers","LA Clippers","Los Angeles Lakers","Memphis Grizzlies","Miami Heat",
  "Milwaukee Bucks","Minnesota Timberwolves","New Orleans Pelicans","New York Knicks",
  "Oklahoma City Thunder","Orlando Magic","Philadelphia 76ers","Phoenix Suns","Portland Trail Blazers",
  "Sacramento Kings","San Antonio Spurs","Toronto Raptors","Utah Jazz","Washington Wizards",
]);

function cleanTeam(name) {
  return (name || "").replace(/\s*\(cyber\)/g, "").trim();
}
function isCyberNBA(name) {
  return NBA_TEAMS.has(cleanTeam(name));
}

async function callMutation(name, args, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Convex ${CONVEX_KEY}`,
        },
        body: JSON.stringify({ path: name, args }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return true;
      const err = await res.text().catch(() => "unknown");
      console.log(`[WARN] ${name} HTTP ${res.status}: ${err.slice(0, 100)}`);
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * attempt));
    } catch (e) {
      console.log(`[WARN] ${name} attempt ${attempt}: ${e.message}`);
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return false;
}

async function scrape() {
  const feeds = ["LiveFeed", "LineFeed"];
  for (const feed of feeds) {
    const url = `${PROXY_BASE}/service-api/${feed}/Get1x2_VZip?count=1000&lng=en&mode=4`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) { console.log(`[WARN] ${feed}: HTTP ${res.status}`); continue; }
      const json = await res.json();
      const events = json.Value || [];
      console.log(`${feed}: ${events.length} events`);

      for (const event of events) {
        if (event.SN !== "Basketball") continue;
        const home = event.O1 || "";
        const away = event.O2 || "";
        if (!home.includes("(cyber)") && !away.includes("(cyber)")) continue;
        if (!isCyberNBA(home) || !isCyberNBA(away)) continue;

        const matchId = String(event.I);
        const homeTeam = cleanTeam(home);
        const awayTeam = cleanTeam(away);
        const finished = event.F === true || event.F === 1;
        const startTime = event.S || 0;
        const sc = event.SC || {};
        const ps = (sc.PS || []).sort((a, b) => a.Key - b.Key);
        const fs = sc.FS || {};
        const cp = sc.CP || 0;

        // Build periodScores array — derive Q4 from total if missing
        const periodScores = ps.map(p => ({
          period: p.Key,
          homeScore: p.Value?.S1 || 0,
          awayScore: p.Value?.S2 || 0,
          label: p.Value?.NF || `Quarter ${p.Key}`,
        }));

        // Compute totals from PS
        let psHome = 0, psAway = 0;
        for (const p of periodScores) { psHome += p.homeScore; psAway += p.awayScore; }

        const hasFS = fs.S1 !== undefined && fs.S2 !== undefined;
        const totalHome = hasFS ? fs.S1 : psHome;
        const totalAway = hasFS ? fs.S2 : psAway;

        // If FS exists but Q4 isn't in PS, derive Q4
        if (hasFS && periodScores.length === 3 && cp >= 4) {
          const q4Home = Math.max(0, fs.S1 - psHome);
          const q4Away = Math.max(0, fs.S2 - psAway);
          periodScores.push({
            period: 4,
            homeScore: q4Home,
            awayScore: q4Away,
            label: "Quarter 4",
          });
        }

        const hasAllQuarters = finished || periodScores.length >= 4;
        const now = Math.floor(Date.now() / 1000);

        // Save match record
        await callMutation("upsertMatch", {
          matchId, homeTeam, awayTeam,
          homeScore: totalHome,
          awayScore: totalAway,
          periodScores,
          finished, startTime,
          sportName: "NBA Cyber Basketball",
          league: event.L || "NBA 2K26. Cyber League",
          timestamp: now,
          hasAllQuarters,
        });

        // Save each quarter
        for (const p of periodScores) {
          const q = p.period;
          // A period is finished if: game is finished, OR current period has moved past this quarter
          const periodFinished = finished || cp > q;

          await callMutation("transitionQuarter", {
            matchId, homeTeam, awayTeam,
            quarter: q,
            homeScore: p.homeScore,
            awayScore: p.awayScore,
            status: periodFinished ? 3 : 2,
            timestamp: now,
            hasAllQuarters: periodFinished || finished,
          });

          // persistQuarterEnd only for truly finished periods
          if (periodFinished && q === 4) {
            // Calculate aggregate totals from all 4 quarters
            const q1 = periodScores.find(p => p.period === 1);
            const q2 = periodScores.find(p => p.period === 2);
            const q3 = periodScores.find(p => p.period === 3);
            const q4 = periodScores.find(p => p.period === 4);
            const aggHome = (q1?.homeScore || 0) + (q2?.homeScore || 0) + (q3?.homeScore || 0) + (q4?.homeScore || 0);
            const aggAway = (q1?.awayScore || 0) + (q2?.awayScore || 0) + (q3?.awayScore || 0) + (q4?.awayScore || 0);

            await callMutation("persistQuarterEnd", {
              matchId, homeTeam, awayTeam,
              quarter: 4,
              homeScore: aggHome,
              awayScore: aggAway,
              status: 3,
              timestamp: now,
              hasAllQuarters: true,
            });
          }
        }

        if (finished) {
          console.log(`[DONE] ${homeTeam} ${totalHome}-${totalAway} ${awayTeam} (${periodScores.length} quarters)`);
        }
      }
    } catch (e) {
      console.log(`[ERROR] ${feed}: ${e.message}`);
    }
  }
}

console.log(`Scraper running every ${POLL_INTERVAL / 1000}s...`);
await scrape();
setInterval(scrape, POLL_INTERVAL);
