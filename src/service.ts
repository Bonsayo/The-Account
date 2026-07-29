import { pollApi } from './extractor';
import { logger } from './logger';
import { config } from './config';
import { startHealthServer, setHealthy, stopHealthServer } from './health';
import { checkProxyHealth } from './proxy';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ServiceRunner {
  private isRunning = false;
  private consecutiveErrors = 0;

  public async start() {
    this.isRunning = true;
    logger.info(`Starting MelBet polling every ${config.pollInterval}ms`);

    while (this.isRunning) {
      try {
        await pollApi();
        await checkProxyHealth();
        this.consecutiveErrors = 0;
        setHealthy(true);
      } catch (error) {
        this.consecutiveErrors++;
        logger.error(`Poll error (${this.consecutiveErrors})`, error);
        const backoff = Math.min(1000 * Math.pow(2, this.consecutiveErrors), 60000);
        await sleep(backoff);
        continue;
      }
      await sleep(config.pollInterval);
    }
  }

  public stop() {
    this.isRunning = false;
    setHealthy(false);
    stopHealthServer();
  }
}
