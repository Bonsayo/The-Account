import { ServiceRunner } from './service';
import { logger } from './logger';
import { config } from './config';
import { startHealthServer, setHealthy } from './health';
import { ensureProxy } from './proxy';
import { shutdown as shutdownExtractor } from './extractor';

async function main() {
  logger.info('=============================================');
  logger.info('  MelBet NBA Cyber Basketball Scraper');
  logger.info('=============================================');
  logger.info(`Poll interval: ${config.pollInterval}ms`);
  logger.info(`API base: ${config.baseUrl}`);
  logger.info(`Count: ${config.count}`);
  logger.info(`Convex: ${config.convexUrl ? 'configured' : 'NOT configured'}`);

  if (config.proxyUrl) {
    logger.info(`Proxy: configured (${config.proxyUrl})`);
  } else {
    logger.info('Proxy: auto-discover (no PROXY_URL set)');
  }

  logger.info('=============================================');

  // Start health server immediately for platform health checks
  startHealthServer();
  setHealthy(true);

  // Proxy discovery in background — don't block startup
  ensureProxy().then(() => {
    logger.info('Proxy initialization complete');
  }).catch((e) => {
    logger.warn(`Proxy initialization error: ${e instanceof Error ? e.message : e}`);
  });

  const runner = new ServiceRunner();

  async function shutdown() {
    logger.info('Shutting down...');
    runner.stop();
    await shutdownExtractor();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  runner.start().catch((error) => {
    logger.error('Fatal error starting runner', error);
    process.exit(1);
  });
}

main();
