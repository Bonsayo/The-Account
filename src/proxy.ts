import { setGlobalDispatcher, ProxyAgent } from 'undici';
import { config } from './config';
import { logger } from './logger';

let currentProxyUrl = '';
let proxyPool: { host: string; port: number }[] = [];
let proxyIndex = 0;
let lastRefresh = 0;
let lastTestTime = 0;
let consecutiveFailures = 0;

const REFRESH_INTERVAL = 5 * 60 * 1000;
const TEST_INTERVAL = 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 3;
const PROXY_TEST_TIMEOUT = 10000;
const MELBET_URL = 'https://mel-bet.et/service-api/LiveFeed/GetGameZip?id=1';

const PROXY_SOURCES = [
  'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text&timeout=10000&protocol=http',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
];

function parseProxyLine(line: string): { host: string; port: number } | null {
  line = line.trim();
  if (!line || line.startsWith('#')) return null;
  let rest = line;
  if (line.startsWith('http://')) rest = line.slice(7);
  else if (line.startsWith('https://')) rest = line.slice(8);
  else if (line.startsWith('socks4://') || line.startsWith('socks5://')) return null;
  const parts = rest.split(':');
  if (parts.length !== 2) return null;
  const port = parseInt(parts[1], 10);
  if (isNaN(port) || port <= 0 || port > 65535) return null;
  return { host: parts[0], port };
}

async function fetchProxyList(source: string): Promise<{ host: string; port: number }[]> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(source, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const text = await res.text();
    return text.split('\n').map(parseProxyLine).filter((p): p is { host: string; port: number } => p !== null);
  } catch {
    return [];
  }
}

async function refreshProxyPool(): Promise<void> {
  const all: { host: string; port: number }[] = [];
  for (const source of PROXY_SOURCES) {
    const proxies = await fetchProxyList(source);
    all.push(...proxies);
    if (proxies.length > 0) {
      logger.info(`Proxy source: ${source.split('/')[2]} → ${proxies.length} proxies`);
    }
  }
  const seen = new Set<string>();
  proxyPool = all.filter(p => {
    const key = `${p.host}:${p.port}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  proxyIndex = 0;
  lastRefresh = Date.now();
  logger.info(`Proxy pool: ${proxyPool.length} unique proxies`);
}

async function testProxy(host: string, port: number): Promise<boolean> {
  const url = `http://${host}:${port}`;
  try {
    const agent = new ProxyAgent(url);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), PROXY_TEST_TIMEOUT);
    const res = await fetch(MELBET_URL, {
      dispatcher: agent,
      signal: controller.signal,
      headers: {
        'Host': 'mel-bet.et',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
    });
    clearTimeout(t);
    agent.close();
    return res.ok || res.status === 403 || res.status === 429;
  } catch {
    return false;
  }
}

async function findWorkingProxy(): Promise<string | null> {
  if (Date.now() - lastRefresh > REFRESH_INTERVAL || proxyPool.length === 0) {
    await refreshProxyPool();
  }
  if (proxyPool.length === 0) return null;

  const tested = new Set<string>();
  const maxTests = Math.min(100, proxyPool.length);
  const startIndex = proxyIndex;

  while (tested.size < maxTests) {
    const proxy = proxyPool[proxyIndex];
    const key = `${proxy.host}:${proxy.port}`;
    proxyIndex = (proxyIndex + 1) % proxyPool.length;

    if (tested.has(key)) continue;
    tested.add(key);

    const ok = await testProxy(proxy.host, proxy.port);
    if (ok) {
      currentProxyUrl = `http://${key}`;
      logger.info(`✓ Working proxy: ${currentProxyUrl}`);
      return currentProxyUrl;
    }
  }
  return null;
}

async function testCurrentProxy(): Promise<boolean> {
  if (!currentProxyUrl) return false;
  try {
    const agent = new ProxyAgent(currentProxyUrl);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), PROXY_TEST_TIMEOUT);
    const res = await fetch(MELBET_URL, {
      dispatcher: agent,
      signal: controller.signal,
      headers: {
        'Host': 'mel-bet.et',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
    });
    clearTimeout(t);
    agent.close();
    return res.ok || res.status === 403 || res.status === 429;
  } catch {
    return false;
  }
}

async function setProxy(url: string): Promise<void> {
  try {
    setGlobalDispatcher(new ProxyAgent(url));
    currentProxyUrl = url;
    consecutiveFailures = 0;
    logger.info(`Proxy active: ${url}`);
  } catch (e) {
    logger.warn(`Failed to set proxy ${url}: ${e instanceof Error ? e.message : e}`);
  }
}

export async function ensureProxy(): Promise<void> {
  if (config.proxyUrl) {
    await setProxy(config.proxyUrl);
    return;
  }
  const url = await findWorkingProxy();
  if (url) {
    await setProxy(url);
  } else {
    logger.warn('No working proxy found - running without proxy');
  }
}

export async function checkProxyHealth(): Promise<void> {
  const now = Date.now();
  if (now - lastTestTime < TEST_INTERVAL) return;
  lastTestTime = now;

  if (!currentProxyUrl) {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      logger.warn('No proxy available, retrying discovery...');
      consecutiveFailures = 0;
      await ensureProxy();
    } else {
      consecutiveFailures++;
    }
    return;
  }

  const ok = await testCurrentProxy();
  if (ok) {
    consecutiveFailures = 0;
    return;
  }

  consecutiveFailures++;
  logger.warn(`Proxy health check FAILED (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${currentProxyUrl}`);

  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    logger.warn('Proxy failed, searching for replacement...');
    currentProxyUrl = '';
    const url = await findWorkingProxy();
    if (url) {
      await setProxy(url);
    } else {
      logger.warn('No replacement proxy found');
    }
    consecutiveFailures = 0;
  }
}

export function getProxyUrl(): string {
  return currentProxyUrl;
}
