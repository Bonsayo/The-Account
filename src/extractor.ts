import { config, isNBACyberTeam } from './config';
import { logger } from './logger';
import { parseMelbetResponse, normalizeMelbetEvent, NormalizedMatch } from './parser';
import { dbManager, QuarterSnapshot } from './db';
import { fetchWithBrowser, fetchHtmlWithBrowser, closeBrowser, getSessionCookie, getSessionUserAgent, isSessionValid, refreshSession } from './browser';

// ── Persisted state ──────────────────────────────────────────────────
let completedMatches = new Set<string>();

// Known NBA game IDs, persisted to Convex discoveredGames table
let knownNBAGameIds = new Set<number>();
let knownGamesLoaded = false;

// Debounce: last-written score per (matchId, quarter) to avoid redundant Convex calls
const lastWrittenQuarter = new Map<string, string>(); // key -> "homeScore-awayScore"

// ── Config ───────────────────────────────────────────────────────────
const LEAGUE_LIVE_URL = 'https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league';
const LEAGUE_LINE_URL = 'https://mel-bet.et/en/line/basketball/2935701-nba-2k26-cyber-league';
// ── Helpers ──────────────────────────────────────────────────────────

/** Build headers including Cloudflare session cookie from Playwright */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': '*/*',
    'User-Agent': getSessionUserAgent(),
    'Referer': 'https://mel-bet.et/',
  };
  const cookie = getSessionCookie();
  if (cookie) headers['Cookie'] = cookie;
  return headers;
}

/** Try raw fetch first (with Cloudflare cookie), fall back to Playwright browser fetch on failure */
async function smartFetch(url: string, timeout = 20000): Promise<{ ok: boolean; status: number; text: string }> {
  const headers = buildHeaders();

  // If session cookie is expired, refresh Playwright first
  if (!isSessionValid()) {
    logger.info('Cloudflare session expired, refreshing...');
    await refreshSession();
    // Refresh the headers with new cookie
    Object.assign(headers, buildHeaders());
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);
    const text = await res.text();

    // Cloudflare often returns 200 with an HTML challenge page instead of 4xx
    const isChallenge = text.includes('cf-browser-verify') || text.includes('challenge') || text.includes('__cf_chl');
    if (res.ok && !isChallenge) return { ok: true, status: res.status, text };

    // Cloudflare challenge or 4xx — try browser fallback
    logger.warn(`raw fetch ${res.status} for ${url.slice(0, 80)}${isChallenge ? ' (Cloudflare challenge)' : ''}`);
    const browserResult = await fetchWithBrowser(url, { timeout });
    if (browserResult?.ok) {
      await refreshSession();
      return browserResult;
    }
    return { ok: false, status: res.status, text: '' };
  } catch (e: any) {
    // Network error — try browser fallback (only once per fetch)
    if (e?.name === 'AbortError' || e?.message === 'The user aborted a request.') {
      return { ok: false, status: 0, text: '' };
    }
    logger.warn(`raw fetch failed for ${url.slice(0, 80)}: ${e instanceof Error ? e.message : e}`);
    const browserResult = await fetchWithBrowser(url, { timeout });
    if (browserResult?.ok) {
      await refreshSession();
      return browserResult;
    }
    return browserResult || { ok: false, status: 0, text: '' };
  }
}

async function smartFetchJson(url: string, timeout = 20000): Promise<any> {
  const res = await smartFetch(url, timeout);
  if (!res.ok) return null;
  try { return JSON.parse(res.text); } catch { return null; }
}

// ── Load / save known games from Convex ─────────────────────────────

async function loadKnownGamesFromConvex(): Promise<void> {
  if (knownGamesLoaded) return;
  knownGamesLoaded = true; // prevent repeated attempts
  if (!config.convexUrl) return;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${config.convexUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.convexKey ? { Authorization: `Convex ${config.convexKey}` } : {}),
      },
      body: JSON.stringify({ path: 'discoveredGames:list', args: {} }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data?.value && Array.isArray(data.value)) {
        for (const g of data.value) {
          if (g.eventId && !g.finished) knownNBAGameIds.add(g.eventId);
        }
      }
      logger.info(`Loaded ${knownNBAGameIds.size} known games from Convex`);
    } else {
      logger.warn(`Convex query returned ${res.status}`);
    }
  } catch (e) {
    logger.warn(`Failed to load known games: ${e instanceof Error ? e.message : e}`);
  }
}

async function saveGameToConvex(match: NormalizedMatch): Promise<void> {
  if (!config.convexUrl) return;
  try {
    await fetch(`${config.convexUrl}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.convexKey ? { Authorization: `Convex ${config.convexKey}` } : {}),
      },
      body: JSON.stringify({
        path: 'discoveredGames:upsert',
        args: {
          eventId: match.eventId,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          startTime: match.startTime,
          finished: match.finished,
        },
      }),
    });
  } catch { /* non-critical */ }
}

async function markGameFinishedOnConvex(eventId: number): Promise<void> {
  if (!config.convexUrl) return;
  try {
    await fetch(`${config.convexUrl}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.convexKey ? { Authorization: `Convex ${config.convexKey}` } : {}),
      },
      body: JSON.stringify({ path: 'discoveredGames:markFinished', args: { eventId } }),
    });
  } catch { /* non-critical */ }
}

// ── Fetch feeds ──────────────────────────────────────────────────────

async function fetchFeed(feed: 'LiveFeed' | 'LineFeed'): Promise<{ matches: NormalizedMatch[]; rawCount: number; maxId: number }> {
  const url = `${config.baseUrl}/${feed}/Get1x2_VZip?count=${config.count}&lng=${config.lng}&mode=4`;
  const res = await smartFetch(url, 20000);
  if (!res.ok) {
    if (res.status) logger.warn(`${feed} returned ${res.status}`);
    return { matches: [], rawCount: 0, maxId: 0 };
  }
  const result = parseMelbetResponse(res.text);
  return { matches: result.matches, rawCount: result.rawCount, maxId: result.maxId ?? 0 };
}

/** Extract game IDs from a league page's JSON-LD structured data */
function extractGameIdsFromHtml(html: string): { eventId: number; homeTeam: string; awayTeam: string; startTime: number }[] {
  const results: { eventId: number; homeTeam: string; awayTeam: string; startTime: number }[] = [];
  const parts = html.split('"@type":"SportsEvent"');
  for (let i = 1; i < parts.length; i++) {
    const urlMatch = parts[i].match(/"url":"[^"]*\/(\d+)-/);
    const nameMatch = parts[i].match(/"name":"([^"]+)"\s*,\s*"startDate":"([^"]+)"/);
    const startDate = parts[i].match(/"startDate":"([^"]+)"/);
    if (urlMatch) {
      const eventId = parseInt(urlMatch[1], 10);
      const name = nameMatch ? nameMatch[1] : '';
      const date = startDate ? startDate[1] : '';
      const [homeTeam, awayTeam] = name.split(' - ');
      const startTime = date ? new Date(date).getTime() : 0;
      results.push({ eventId, homeTeam: homeTeam || '', awayTeam: awayTeam || '', startTime });
    }
  }
  return results;
}

let liveResultMaxId = 0; // updated by pollApi, used by fetchNBACyberLeagueGames

// Alert state: tracks consecutive failed discovery cycles
let discoveryFailCycles = 0;
const DISCOVERY_FAIL_ALERT_THRESHOLD = 20; // ~4 minutes of 0 new games with schedule known

/** Probe alternative MelBet API endpoints to find NBA game IDs (the SPA internal API) */
async function discoverGameIdsViaApi(): Promise<number[]> {
  const candidates = [
    `${config.baseUrl}/LiveFeed/Get1x2_VZip?count=1000&lng=en&mode=4&sportId=1`,
    `${config.baseUrl}/Sport/1/LiveFeed/Get1x2_VZip?count=1000&lng=en&mode=4`,
    `${config.baseUrl}/LiveFeed/Get1x2_VZip?count=1000&lng=en&mode=4&leagueId=2935701`,
    `${config.baseUrl}/LineFeed/Get1x2_VZip?count=1000&lng=en&mode=4&leagueId=2935701`,
    `${config.baseUrl}/Events/GetEvents?leagueId=2935701&lng=en`,
    `${config.baseUrl}/LiveFeed/GetLeagueGames?leagueId=2935701`,
    `${config.baseUrl}/LineFeed/GetLeagueGames?leagueId=2935701`,
  ];

  const foundIds = new Set<number>();
  for (const url of candidates) {
    const res = await smartFetch(url, 10000);
    if (!res.ok || res.text.length < 20) continue;
    try {
      const json = JSON.parse(res.text);
      const events = Array.isArray(json.Value) ? json.Value : (Array.isArray(json) ? json : []);
      for (const ev of events) {
        const id = ev.I || ev.id || ev.eventId;
        if (id && (isNBACyberTeam(ev.O1 || ev.homeTeam || '') || isNBACyberTeam(ev.O2 || ev.awayTeam || ''))) {
          foundIds.add(id);
        }
      }
    } catch { /* not a valid endpoint or response format */ }
    if (foundIds.size > 0) break; // found games, stop probing
  }
  return [...foundIds];
}

/** Lightweight targeted scan: check a small window of IDs near a known maxId */
let scanCursorForDiscovery = 0;

async function scanForNewGames(referenceMaxId: number): Promise<number[]> {
  // Scan 2000 IDs above and below the reference maxId, 100 at a time
  if (scanCursorForDiscovery === 0) {
    scanCursorForDiscovery = referenceMaxId + 2000;
  }

  const idsToCheck: number[] = [];
  const start = Math.max(1, scanCursorForDiscovery - 2000);
  for (let i = scanCursorForDiscovery; i > start; i--) {
    idsToCheck.push(i);
  }
  scanCursorForDiscovery = start;

  const results = await Promise.allSettled(idsToCheck.map(id => fetchGameById(id)));
  const found: number[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      found.push(r.value.eventId);
    }
  }
  return found;
}

async function fetchNBACyberLeagueGames(): Promise<NormalizedMatch[]> {
  // Try raw fetch for the league page (works from some IPs, may get stripped HTML)
  let html: string | null = null;
  const rawRes = await smartFetch(LEAGUE_LIVE_URL, 15000);
  if (rawRes.ok && rawRes.text.length > 10000) html = rawRes.text;

  // Fall back to Playwright if raw fetch got stripped
  if (!html) {
    const browserHtml = await fetchHtmlWithBrowser(LEAGUE_LIVE_URL);
    if (browserHtml && browserHtml.length > 10000) html = browserHtml;
  }

  let ids: { eventId: number; homeTeam: string; awayTeam: string; startTime: number }[] = [];

  if (html) {
    ids = extractGameIdsFromHtml(html);
    logger.info(`League page: ${ids.length} games found via JSON-LD`);
  }

  // Also try pre-match page
  if (ids.length === 0) {
    let lineHtml: string | null = null;
    const lineRes = await smartFetch(LEAGUE_LINE_URL, 15000);
    if (lineRes.ok && lineRes.text.length > 10000) lineHtml = lineRes.text;
    if (!lineHtml) lineHtml = await fetchHtmlWithBrowser(LEAGUE_LINE_URL);
    if (lineHtml && lineHtml.length > 10000) {
      const lineIds = extractGameIdsFromHtml(lineHtml);
      if (lineIds.length > 0) {
        ids = lineIds;
        logger.info(`Line page: ${ids.length} games found via JSON-LD`);
      }
    }
  }

  // Fall back to known IDs from Convex
  if (ids.length === 0 && knownNBAGameIds.size > 0) {
    for (const id of knownNBAGameIds) {
      ids.push({ eventId: id, homeTeam: '', awayTeam: '', startTime: 0 });
    }
    logger.info(`Using ${ids.length} known game IDs from Convex`);
  }

  // If still empty, try alternative API endpoints + small targeted scan
  if (ids.length === 0) {
    const discovered = await discoverGameIdsViaApi();
    if (discovered.length > 0) {
      ids = discovered.map(id => ({ eventId: id, homeTeam: '', awayTeam: '', startTime: 0 }));
      logger.info(`Found ${ids.length} game IDs via alternative API`);
      discoveryFailCycles = 0;
    } else {
      discoveryFailCycles++;
      if (discoveryFailCycles >= DISCOVERY_FAIL_ALERT_THRESHOLD) {
        logger.error(`ALERT: discoverGameIdsViaApi returned 0 for ${discoveryFailCycles} consecutive cycles — API endpoints may have changed! Manual check needed.`);
        discoveryFailCycles = 0; // reset to avoid spam
      }
    }

    // Last resort: lightweight scan near maxFeedId
    if (ids.length === 0 && liveResultMaxId > 0) {
      const scanned = await scanForNewGames(liveResultMaxId);
      if (scanned.length > 0) {
        ids = scanned.map(id => ({ eventId: id, homeTeam: '', awayTeam: '', startTime: 0 }));
        logger.info(`Lightweight scan found ${ids.length} game IDs near ID ${liveResultMaxId}`);
      }
    }
  } else {
    discoveryFailCycles = 0;
  }

  if (ids.length === 0) return [];

  const results = await Promise.allSettled(
    ids.map(item => fetchGameById(item.eventId))
  );

  const matches: NormalizedMatch[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      matches.push(r.value);
      if (!knownNBAGameIds.has(r.value.eventId)) {
        knownNBAGameIds.add(r.value.eventId);
        saveGameToConvex(r.value).catch(() => {});
      }
    }
  }
  return matches;
}

async function fetchGameById(id: number): Promise<NormalizedMatch | null> {
  const url = `${config.baseUrl}/LiveFeed/GetGameZip?id=${id}`;
  const res = await smartFetch(url, 8000);
  if (!res.ok || res.text.length < 10) return null;
  try {
    const json = JSON.parse(res.text);
    if (!json.Value) return null;
    return normalizeMelbetEvent(json.Value);
  } catch {
    return null;
  }
}

// ── Handle match ─────────────────────────────────────────────────────

function quarterKey(matchId: string, quarter: number): string {
  return `${matchId}|${quarter}`;
}

async function handleMatch(match: NormalizedMatch): Promise<void> {
  const { matchId, periodScores, finished } = match;
  if (completedMatches.has(matchId)) return;
  if (periodScores.length === 0) return;

  let hasNewData = false;

  for (let i = 0; i < periodScores.length; i++) {
    const ps = periodScores[i];
    const key = quarterKey(matchId, i + 1);
    const scoreStr = `${ps.homeScore}-${ps.awayScore}`;

    // Debounce: skip if score hasn't changed
    if (lastWrittenQuarter.get(key) === scoreStr) continue;

    const snapshot: QuarterSnapshot = {
      matchId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      quarter: i + 1,
      homeScore: ps.homeScore,
      awayScore: ps.awayScore,
      status: finished && i === periodScores.length - 1 ? 3 : 1,
      timestamp: match.timestamp,
      hasAllQuarters: match.hasAllQuarters,
    };
    const ok = await dbManager.transitionQuarter(snapshot);
    if (ok) {
      lastWrittenQuarter.set(key, scoreStr);
      hasNewData = true;
      logger.info(`${match.homeTeam} vs ${match.awayTeam} — Q${i + 1} [${scoreStr}]`);
    }
  }

  // Upsert match summary once per cycle
  if (hasNewData) {
    await dbManager.pushMatch(match);
  }

  if (finished && match.hasAllQuarters) {
    completedMatches.add(matchId);
    knownNBAGameIds.delete(match.eventId);
    markGameFinishedOnConvex(match.eventId).catch(() => {});
    logger.info(`${match.homeTeam} vs ${match.awayTeam} — FINAL (${match.homeScore}-${match.awayScore})`);
  }
}

// ── Main poll entry point ────────────────────────────────────────────

let consecutiveFailedFeeds = 0;
const MAX_FAILED_FEEDS = 5;

export async function pollApi(): Promise<void> {
  // Load known games from Convex on first run
  if (!knownGamesLoaded) await loadKnownGamesFromConvex();

  const [liveResult, lineResult, leagueGames] = await Promise.all([
    fetchFeed('LiveFeed'),
    fetchFeed('LineFeed'),
    fetchNBACyberLeagueGames().catch(e => {
      logger.warn(`League fetch error: ${e instanceof Error ? e.message : e}`);
      return [] as NormalizedMatch[];
    }),
  ]);

  // Expose maxId for the lightweight scanner in fetchNBACyberLeagueGames
  liveResultMaxId = liveResult.maxId;

  // Check if all feeds failed
  const allFailed = liveResult.rawCount === 0 && lineResult.rawCount === 0 && leagueGames.length === 0;
  if (allFailed) {
    consecutiveFailedFeeds++;
    if (consecutiveFailedFeeds >= MAX_FAILED_FEEDS) {
      consecutiveFailedFeeds = 0;
      throw new Error('All feeds failed — backing off');
    }
  } else {
    consecutiveFailedFeeds = 0;
  }

  // Combine and deduplicate
  const allMatches = [...liveResult.matches, ...lineResult.matches, ...leagueGames];
  const identityBest = new Map<string, NormalizedMatch>();
  for (const match of allMatches) {
    const key = match.homeTeam + '|' + match.awayTeam + '|' + match.startTime;
    const existing = identityBest.get(key);
    if (!existing || match.periodScores.length > existing.periodScores.length) {
      identityBest.set(key, match);
    }
  }

  for (const match of identityBest.values()) {
    await handleMatch(match);
  }

  const totalRaw = liveResult.rawCount + lineResult.rawCount;
  if (allMatches.length === 0) {
    logger.info(`0 NBA matches (raw events: ${liveResult.rawCount} live + ${lineResult.rawCount} line, ${leagueGames.length} from league page)`);
  } else {
    logger.info(`${allMatches.length} NBA matches from ${totalRaw} raw events + ${leagueGames.length} league games (live=${liveResult.matches.length} line=${lineResult.matches.length})`);
  }
}

export async function shutdown(): Promise<void> {
  await closeBrowser();
}