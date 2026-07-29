import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const PROXY_BASE = "https://melbet-proxy.bonsamisgana.workers.dev";
const LIVEFEED_URL = `${PROXY_BASE}/service-api/LiveFeed/Get1x2_VZip?count=1000&lng=en&mode=4`;
const GAMEGET_URL = (id: number) => `${PROXY_BASE}/service-api/LiveFeed/GetGameZip?id=${id}&lng=en`;

const NBA_TEAMS = new Set([
  "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets",
  "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets",
  "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers",
  "LA Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat",
  "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans",
  "New York Knicks", "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers",
  "Phoenix Suns", "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs",
  "Toronto Raptors", "Utah Jazz", "Washington Wizards",
]);

const HEADERS = { "User-Agent": "Mozilla/5.0" };

function isNBACyber(name: string): boolean {
  const base = name.replace(/\s*\(cyber\)$/, "");
  return NBA_TEAMS.has(base);
}

async function fetchJson(url: string, timeoutMs = 20000): Promise<any> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: HEADERS, signal: c.signal });
    clearTimeout(t);
    if (!r.ok) {
      const body = await r.text();
      console.log(`HTTP ${r.status} for ${url}: ${body.slice(0, 200)}`);
      return null;
    }
    return await r.json();
  } catch (e) {
    clearTimeout(t);
    console.log(`Fetch error for ${url}: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

export const scrape = action({
  args: {},
  handler: async (ctx) => {
    console.log(`Fetching LiveFeed from proxy...`);
    const feed = await fetchJson(LIVEFEED_URL, 30000);
    if (!feed?.Success) {
      console.log(`LiveFeed failed: ${feed?.Error ?? "no response"}`);
      return;
    }

    const events: any[] = feed.Value ?? [];
    console.log(`Total events: ${events.length}`);

    const cyberNBA = events.filter((e: any) => {
      if (e.SN !== "Basketball") return false;
      const home = e.O1 ?? "";
      const away = e.O2 ?? "";
      if (!home.includes("(cyber)") && !away.includes("(cyber)")) return false;
      return isNBACyber(home) || isNBACyber(away);
    });

    console.log(`NBA cyber games: ${cyberNBA.length}`);

    for (const event of cyberNBA) {
      const matchId = String(event.I);
      const homeTeam = event.O1 ?? "Unknown";
      const awayTeam = event.O2 ?? "Unknown";
      const finished = event.F === true || event.F === 1;
      const startTime = event.S ?? 0;
      const now = Math.floor(Date.now() / 1000);
      const sc = event.SC ?? {};
      const ps = sc.PS ?? [];

      const homeScore = sc.FS?.S1 ?? (ps.length > 0 ? (ps[ps.length - 1]?.Value?.S1 ?? 0) : 0);
      const awayScore = sc.FS?.S2 ?? (ps.length > 0 ? (ps[ps.length - 1]?.Value?.S2 ?? 0) : 0);

      const periodScores = ps.map((p: any) => ({
        period: p.Key,
        homeScore: p.Value?.S1 ?? 0,
        awayScore: p.Value?.S2 ?? 0,
        label: p.Value?.NF ?? `Quarter ${p.Key}`,
      }));

      const hasAllQuarters = finished || (sc.CP >= 4 && ps.length >= 4);

      await ctx.runMutation(internal.upsertMatch.upsertMatch, {
        matchId,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        periodScores,
        finished,
        startTime,
        sportName: "NBA Cyber Basketball",
        league: event.L ?? "NBA 2K26. Cyber League",
        timestamp: now,
        hasAllQuarters,
      });

      for (const p of ps) {
        const q = p.Key;
        const qHome = p.Value?.S1 ?? 0;
        const qAway = p.Value?.S2 ?? 0;

        const periodFinished = finished || sc.CP > q;

        await ctx.runMutation(internal.transitionQuarter.transitionQuarter, {
          matchId,
          homeTeam,
          awayTeam,
          quarter: q,
          homeScore: qHome,
          awayScore: qAway,
          status: periodFinished ? 3 : 2,
          timestamp: now,
          hasAllQuarters,
        });

        if (periodFinished) {
          await ctx.runMutation(internal.persistQuarterEnd.persistQuarterEnd, {
            matchId,
            homeTeam,
            awayTeam,
            quarter: q,
            homeScore: qHome,
            awayScore: qAway,
            status: 3,
            timestamp: now,
            hasAllQuarters,
          });
        }
      }

      // If current period is 4 or higher, ensure Q4 data exists in the quarters table
      // (the PS array may only contain completed periods, missing the live Q4 period)
      if (sc.CP >= 4) {
        // Check if Q4 exists in the PS array
        const hasQ4 = ps.some((p: any) => p.Key === 4);
        if (!hasQ4) {
          // Q4 is live but not yet in PS array; write the current running totals minus Q1-Q3
          const q1 = ps.find((p: any) => p.Key === 1);
          const q2 = ps.find((p: any) => p.Key === 2);
          const q3 = ps.find((p: any) => p.Key === 3);
          const q1Home = q1?.Value?.S1 ?? 0;
          const q1Away = q1?.Value?.S2 ?? 0;
          const q2Home = q2?.Value?.S1 ?? 0;
          const q2Away = q2?.Value?.S2 ?? 0;
          const q3Home = q3?.Value?.S1 ?? 0;
          const q3Away = q3?.Value?.S2 ?? 0;
          const totalHome = sc.FS?.S1 ?? homeScore;
          const totalAway = sc.FS?.S2 ?? awayScore;
          const q4Home = totalHome - q1Home - q2Home - q3Home;
          const q4Away = totalAway - q1Away - q2Away - q3Away;

          const q4Finished = finished || (sc.CP > 4);

          await ctx.runMutation(internal.transitionQuarter.transitionQuarter, {
            matchId,
            homeTeam,
            awayTeam,
            quarter: 4,
            homeScore: Math.max(0, q4Home),
            awayScore: Math.max(0, q4Away),
            status: q4Finished ? 3 : 2,
            timestamp: now,
            hasAllQuarters: q4Finished || finished,
          });

          if (q4Finished) {
            await ctx.runMutation(internal.persistQuarterEnd.persistQuarterEnd, {
              matchId,
              homeTeam,
              awayTeam,
              quarter: 4,
              homeScore: Math.max(0, q4Home),
              awayScore: Math.max(0, q4Away),
              status: 3,
              timestamp: now,
              hasAllQuarters: true,
            });
          }
        }
      }
    }

    console.log(`Processed ${cyberNBA.length} cyber NBA games`);
  },
});