import { config } from './config';
import { logger } from './logger';
import { NormalizedMatch } from './parser';

export interface QuarterSnapshot {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  quarter: number;
  homeScore: number;
  awayScore: number;
  status: number;
  timestamp: number;
  hasAllQuarters: boolean;
}

export class ConvexAdapter {
  private url: string;
  private key: string;

  constructor() {
    this.url = config.convexUrl;
    this.key = config.convexKey;
  }

  private async callMutation(name: string, args: Record<string, any>, retries = 2): Promise<boolean> {
    if (!this.url) {
      logger.warn(`Convex not configured — skipping "${name}" (CONVEX_URL is empty)`);
      return false;
    }
    const endpoint = `${this.url}/api/mutation`;
    const start = Date.now();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.key ? { Authorization: `Convex ${this.key}` } : {}),
          },
          body: JSON.stringify({ path: name, args }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const elapsed = Date.now() - start;
        if (res.ok) {
          const body = await res.text();
          logger.info(`Convex "${name}" OK (${elapsed}ms) — ${body.length > 100 ? body.slice(0, 100) + '...' : body}`);
          return true;
        }

        const errBody = await res.text().catch(() => 'unknown');
        logger.warn(`Convex "${name}" attempt ${attempt}/${retries} — HTTP ${res.status}: ${errBody.slice(0, 200)}`);

        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      } catch (e: any) {
        const elapsed = Date.now() - start;
        if (attempt < retries) {
          logger.warn(`Convex "${name}" attempt ${attempt}/${retries} failed (${elapsed}ms): ${e.message || e}`);
          await new Promise(r => setTimeout(r, 500 * attempt));
        } else {
          logger.warn(`Convex "${name}" failed after ${retries} attempts (${elapsed}ms): ${e.message || e}`);
        }
      }
    }
    return false;
  }

  async transitionQuarter(snapshot: QuarterSnapshot): Promise<boolean> {
    return this.callMutation('transitionQuarter', snapshot);
  }

  async persistQuarterEnd(snapshot: QuarterSnapshot): Promise<boolean> {
    return this.callMutation('persistQuarterEnd', snapshot);
  }

  async pushMatch(match: NormalizedMatch): Promise<boolean> {
    return this.callMutation('upsertMatch', {
      matchId: match.matchId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      periodScores: match.periodScores,
      finished: match.finished,
      startTime: match.startTime,
      sportName: match.sportName,
      league: match.league,
      timestamp: match.timestamp,
      hasAllQuarters: match.hasAllQuarters,
    });
  }
}

export const dbManager = new ConvexAdapter();