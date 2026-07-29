import { config } from './config';
import { logger } from './logger';
import { parseMelbetResponse } from './parser';
import { dbManager } from './db';

async function main() {
  logger.info('Cron scrape started');

  const feeds = ['LiveFeed', 'LineFeed'];
  const seen = new Set<string>();
  let totalMatches = 0;
  let errors = 0;

  for (const feed of feeds) {
    const url = `${config.baseUrl}/${feed}/Get1x2_VZip?count=${config.count}&lng=${config.lng}&mode=4`;
    try {
      const res = await fetch(url, {
        headers: {
          'Host': 'mel-bet.et',
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://mel-bet.et/',
        },
      });
      if (!res.ok) {
        logger.warn(`Cron: ${feed} returned ${res.status}`);
        errors++;
        continue;
      }
      const { matches } = parseMelbetResponse(await res.text());
      for (const match of matches) {
        if (seen.has(match.matchId)) continue;
        seen.add(match.matchId);
        await dbManager.pushMatch(match);
        totalMatches++;
      }
    } catch (e) {
      logger.error(`Cron: ${feed} failed`, e);
      errors++;
    }
  }

  logger.info(`Cron: fetched ${totalMatches} NBA matches from ${feeds.length} feeds (${errors} errors)`);
  logger.info('Cron scrape completed');
  process.exit(errors === feeds.length ? 1 : 0);
}

main();
