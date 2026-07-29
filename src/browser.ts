import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { logger } from './logger';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
let initPromise: Promise<void> | null = null;
let ready = false;

// Extracted Cloudflare session — reused across raw fetch calls
let cachedCookie = '';
let cachedUserAgent = '';
let sessionExpiresAt = 0;
let browserSessionsCreated = 0;

// Refresh mutex + backoff to prevent concurrent refreshes
let refreshPromise: Promise<boolean> | null = null;
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN_MS = 30_000; // don't retry refresh more than once per 30s

const MELBET_URL = 'https://mel-bet.et';

async function initBrowser(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      });
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        locale: 'en',
        viewport: { width: 1920, height: 1080 },
      });
      page = await context.newPage();
      cachedUserAgent = await page.evaluate(() => navigator.userAgent);

      // Navigate to MelBet main page once to establish Cloudflare session
      await page.goto(MELBET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      await extractSession();
      browserSessionsCreated++;
      ready = true;
      logger.info(`Playwright session ready (browser #${browserSessionsCreated}) — cf_clearance cookie: ${cachedCookie ? '✓' : '✗'}`);
    } catch (e) {
      await cleanup();
      logger.warn(`Playwright init failed: ${e instanceof Error ? e.message : e}`);
    }
  })();
  return initPromise;
}

/** Extract Cloudflare session cookie from the current browser context */
async function extractSession(): Promise<void> {
  if (!context) return;
  try {
    const cookies = await context.cookies();
    const cf = cookies.find(c => c.name === 'cf_clearance' || c.name.startsWith('__cf'));
    if (cf) {
      cachedCookie = `${cf.name}=${cf.value}`;
      const expires = (cf.expires || 0) * 1000;
      sessionExpiresAt = expires > Date.now() ? expires : Date.now() + 30 * 60 * 1000;
    } else {
      // No cf_clearance cookie, but Playwright might still work without it.
      // Set a long expiry so we don't keep refreshing for nothing.
      sessionExpiresAt = Date.now() + 60 * 60 * 1000;
    }
  } catch { /* ignore */ }
}

async function cleanup(): Promise<void> {
  if (page) { await page.close().catch(() => {}); page = null; }
  if (context) { await context.close().catch(() => {}); context = null; }
  if (browser) { await browser.close().catch(() => {}); browser = null; }
  initPromise = null;
  ready = false;
}

async function ensureBrowser(): Promise<boolean> {
  if (ready && page) return true;
  await initBrowser();
  return ready && !!page;
}

/** Get cached Cloudflare cookie — used by raw fetch to bypass Cloudflare */
export function getSessionCookie(): string {
  return cachedCookie;
}

/** Get cached user-agent — used by raw fetch to match the Playwright session */
export function getSessionUserAgent(): string {
  return cachedUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
}

/** Check if the Playwright browser session is still alive */
export function isSessionValid(): boolean {
  // If Playwright managed to load mel-bet.et even once, the session is valid.
  // cf_clearance cookie is optional — Cloudflare may not challenge Playwright at all.
  return ready || browserSessionsCreated > 0;
}

/** Refresh the Playwright session — uses a mutex to prevent concurrent refreshes + cooldown */
export async function refreshSession(): Promise<boolean> {
  // Cooldown: don't retry too frequently
  const sinceLast = Date.now() - lastRefreshAttempt;
  if (sinceLast < REFRESH_COOLDOWN_MS) {
    return isSessionValid() || cachedCookie !== '';
  }

  // Mutex: only one refresh at a time
  if (refreshPromise) return refreshPromise;

  lastRefreshAttempt = Date.now();
  refreshPromise = (async () => {
    logger.info('Refreshing Playwright Cloudflare session...');
    await cleanup().catch(() => {});
    cachedCookie = '';
    sessionExpiresAt = 0;
    ready = false;
    initPromise = null;
    const ok = await ensureBrowser();
    logger.info(`Session refresh: ${ok ? 'OK' : 'FAILED'} (browser #${browserSessionsCreated})`);
    refreshPromise = null;
    return ok;
  })();

  return refreshPromise;
}

/** Make a fetch call inside the Playwright browser (heavy — use sparingly) */
export async function fetchWithBrowser(url: string, options?: { timeout?: number }): Promise<{ ok: boolean; status: number; text: string } | null> {
  const available = await ensureBrowser();
  if (!available || !page) return null;

  try {
    const result = await page.evaluate(async (args: { url: string; timeout: number }) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), args.timeout);
      try {
        const res = await fetch(args.url, {
          headers: {
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal,
        });
        clearTimeout(timer);
        const text = await res.text();
        return { ok: res.ok, status: res.status, text };
      } catch {
        clearTimeout(timer);
        return { ok: false, status: 0, text: '' };
      }
    }, { url, timeout: options?.timeout ?? 15000 });

    return result;
  } catch (e) {
    logger.warn(`Browser fetch error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

/** Fetch a page's full HTML using Playwright (heavy — use sparingly) */
export async function fetchHtmlWithBrowser(url: string): Promise<string | null> {
  const available = await ensureBrowser();
  if (!available || !page) return null;

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    return await page.content();
  } catch (e) {
    logger.warn(`Browser HTML fetch error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

export async function closeBrowser(): Promise<void> {
  await cleanup();
}