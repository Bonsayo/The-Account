import { isNBACyberTeam } from './config';
import { logger } from './logger';

export interface MelBetEvent {
  I: number;
  O1: string;
  O2: string;
  O1E?: string;
  O2E?: string;
  SC?: {
    FS?: { S1: number; S2: number };
    PS?: { Key: number; Value: { S1: number; S2: number; NF?: string } }[];
    CP?: number;
    CPS?: string;
  };
  F?: boolean;
  S?: number;
  SS?: number;
  SN?: string;
  SE?: string;
  L?: string;
  LE?: string;
  CID?: number;
}

export interface PeriodScore {
  period: number;
  homeScore: number;
  awayScore: number;
  label: string;
}

export interface NormalizedMatch {
  matchId: string;
  eventId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  periodScores: PeriodScore[];
  currentPeriod: number;
  finished: boolean;
  startTime: number;
  sportName: string;
  league: string;
  timestamp: number;
  hasAllQuarters: boolean;
}

function generateMatchId(eventId: number): string {
  return String(eventId);
}

export function normalizeMelbetEvent(event: MelBetEvent): NormalizedMatch | null {
  try {
    const homeTeam = event.O1 || '';
    const awayTeam = event.O2 || '';
    if (!homeTeam || !awayTeam) return null;

    const homeIsNBA = isNBACyberTeam(homeTeam);
    const awayIsNBA = isNBACyberTeam(awayTeam);
    if (!homeIsNBA || !awayIsNBA) {
      if (homeTeam.toLowerCase().includes('(cyber)') || awayTeam.toLowerCase().includes('(cyber)')) {
        logger.info(`Filtered out cyber event #${event.I}: "${homeTeam}" vs "${awayTeam}" (L="${event.L}")`);
      }
      return null;
    }

    const periodScores: PeriodScore[] = [];
    if (event.SC?.PS) {
      for (const ps of event.SC.PS) {
        periodScores.push({
          period: ps.Key,
          homeScore: ps.Value?.S1 ?? 0,
          awayScore: ps.Value?.S2 ?? 0,
          label: ps.Value?.NF || '',
        });
      }
    }

    let totalHome = 0;
    let totalAway = 0;
    for (const ps of periodScores) {
      totalHome += ps.homeScore;
      totalAway += ps.awayScore;
    }
    const hasFS = event.SC?.FS?.S1 !== undefined && event.SC?.FS?.S2 !== undefined;

    const currentPeriod = event.SC?.CP ?? periodScores.length;

    // If we have a final score (FS) but no Q4 in PS, derive Q4 from total - Q1/Q2/Q3
    if (hasFS && periodScores.length === 3 && currentPeriod >= 4) {
      const q4Home = Math.max(0, event.SC!.FS!.S1 - totalHome);
      const q4Away = Math.max(0, event.SC!.FS!.S2 - totalAway);
      periodScores.push({
        period: 4,
        homeScore: q4Home,
        awayScore: q4Away,
        label: 'Quarter 4',
      });
      totalHome = event.SC!.FS!.S1;
      totalAway = event.SC!.FS!.S2;
    }

    const hasAllQuarters = periodScores.length >= 4;

    return {
      matchId: generateMatchId(event.I),
      eventId: event.I,
      homeTeam,
      awayTeam,
      homeScore: totalHome,
      awayScore: totalAway,
      periodScores,
      currentPeriod,
      finished: event.F ?? false,
      startTime: event.S ?? 0,
      sportName: event.SN || '',
      league: event.L || '',
      timestamp: Date.now(),
      hasAllQuarters,
    };
  } catch (error) {
    logger.error('Error normalizing MelBet event', error);
    return null;
  }
}

export function parseMelbetResponse(body: string): { matches: NormalizedMatch[]; rawCount: number; maxId: number } {
  try {
    const json = JSON.parse(body);
    if (json.Error) {
      logger.warn('MelBet API returned error', json.Error);
      return { matches: [], rawCount: 0, maxId: 0 };
    }
    const events: MelBetEvent[] = json.Value || [];
    const matches: NormalizedMatch[] = [];
    let maxId = 0;
    for (const event of events) {
      if (event.I > maxId) maxId = event.I;
      const match = normalizeMelbetEvent(event);
      if (match) matches.push(match);
    }
    return { matches, rawCount: events.length, maxId };
  } catch (e) {
    logger.warn('Failed to parse MelBet response. Length: ' + body.length);
    return { matches: [], rawCount: 0, maxId: 0 };
  }
}
