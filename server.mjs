import { createServer } from "http";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONVEX_URL = "https://youthful-coyote-883.convex.cloud";
const CONVEX_KEY = "prod:youthful-coyote-883|eyJ2MiI6IjdiNjA4ZjM3NWE0MTRmNjRhMzUxZTQ4YTQzZGEwMDBkIn0=";
const PORT = 3007;

function cleanTeam(name) {
  return (name || "").replace(/\s*\(cyber\)/g, "").trim() || name;
}

function normalize(m) {
  let homeTeam = m.homeTeam;
  let awayTeam = m.awayTeam;
  if ((!homeTeam || !awayTeam) && m.matchName) {
    const parts = m.matchName.split(/\s+vs\s+/);
    homeTeam = parts[0] || homeTeam;
    awayTeam = parts[1] || awayTeam;
  }

  const hasNewFormat = m.homeScore != null;
  const startTime = m.startTime ?? m.startedAt ?? 0;
  const startTimeMs = startTime > 1e12 ? startTime : startTime * 1000;

  return {
    _id: m._id,
    matchId: m.matchId,
    homeTeam: cleanTeam(homeTeam) || "Home",
    awayTeam: cleanTeam(awayTeam) || "Away",
    homeScore: hasNewFormat ? m.homeScore : (m.finalHomeScore ?? 0),
    awayScore: hasNewFormat ? m.awayScore : (m.finalAwayScore ?? 0),
    periodScores: m.periodScores || [],
    finished: m.finished ?? (m.finalHomeScore != null) ?? false,
    startTime: startTimeMs,
    _creationTime: m._creationTime,
  };
}

async function fetchTable(table, limit = 60) {
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
        args: {
          table,
          order: "desc",
          paginationOpts: { cursor, numItems: remaining },
        },
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

createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/api/matches" && req.method === "GET") {
    try {
      const [matches, quarters] = await Promise.all([
        fetchTable("matches", 50),
        fetchTable("quarters", 200),
      ]);

      const qByMatch = {};
      for (const q of quarters) {
        if (!qByMatch[q.matchId]) qByMatch[q.matchId] = [];
        qByMatch[q.matchId].push(q);
      }

      const data = matches.map((m) => {
        const n = normalize(m);
        n.quarters = (qByMatch[m.matchId] || []).sort((a, b) => a.quarter - b.quarter);
        return n;
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
      return;
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  if (req.url === "/api/ai" && req.method === "GET") {
    try {
      const [matches, quarters] = await Promise.all([
        fetchTable("matches", 50),
        fetchTable("quarters", 200),
      ]);

      const qByMatch = {};
      for (const q of quarters) {
        if (!qByMatch[q.matchId]) qByMatch[q.matchId] = [];
        qByMatch[q.matchId].push(q);
      }

      const games = matches.map((m) => {
        const qs = (qByMatch[m.matchId] || []).sort((a, b) => a.quarter - b.quarter);
        return {
          gameId: m.matchId,
          homeTeam: cleanTeam(m.homeTeam || (m.matchName || "").split(/\s+vs\s+/)[0]) || "Home",
          awayTeam: cleanTeam(m.awayTeam || (m.matchName || "").split(/\s+vs\s+/)[1]) || "Away",
          finalScore: {
            home: m.homeScore ?? m.finalHomeScore ?? 0,
            away: m.awayScore ?? m.finalAwayScore ?? 0,
          },
          status: m.finished ? "finished" : "live",
          startTime: m.startTime > 1e12 ? new Date(m.startTime).toISOString() : new Date(m.startTime * 1000).toISOString(),
          quarters: qs.map((q) => ({
            quarter: q.quarter,
            score: { home: q.homeScore, away: q.awayScore },
            complete: q.status === 3,
          })),
        };
      });

      const body = {
        sport: "NBA Cyber Basketball",
        totalGames: games.length,
        lastUpdated: new Date().toISOString(),
        games,
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body, null, 2));
      return;
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // Serve dashboard.html
  const filePath = req.url === "/" || req.url === "/dashboard" || req.url === "/dashboard.html"
    ? join(__dirname, "dashboard.html")
    : null;

  if (filePath) {
    try {
      const content = readFileSync(filePath, "utf-8");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(content);
      return;
    } catch { /* fall through */ }
  }

  res.writeHead(404);
  res.end("Not found");
}).listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
