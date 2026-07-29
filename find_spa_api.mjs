import { chromium } from 'playwright';

const LEAGUE_LIVE = 'https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league';
const LEAGUE_LINE = 'https://mel-bet.et/en/line/basketball/2935701-nba-2k26-cyber-league';
const MELBET = 'https://mel-bet.et';

async function findApi(url, label) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const requests = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('service-api') || url.includes('api') || url.includes('GetGameZip') || url.includes('Get1x2') || url.includes('Events')) {
      requests.push({ url, method: req.method(), type: req.resourceType() });
    }
  });

  const responses = [];
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('service-api') || url.includes('api') || url.includes('GetGameZip') || url.includes('Get1x2') || url.includes('Events')) {
      try {
        const text = await resp.text();
        responses.push({ url, status: resp.status(), contentType: resp.headers()['content-type'], length: text.length, preview: text.slice(0, 300) });
      } catch {}
    }
  });

  // First go to main page to establish session
  await page.goto(MELBET, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log(`\n=== ${label}: ${url} ===`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  console.log('\nAPI Requests captured:');
  for (const r of requests) {
    console.log(`  ${r.method} ${r.url.slice(0, 150)} (${r.type})`);
  }

  console.log('\nAPI Responses captured:');
  for (const r of responses) {
    console.log(`  ${r.status} ${r.url.slice(0, 120)} (${r.contentType || '?'}, ${r.length} bytes)`);
    if (r.length > 10 && r.length < 100000) {
      console.log(`    Preview: ${r.preview}`);
    }
  }

  await browser.close();
  return { requests, responses };
}

// Run for both live and line pages
const results = await Promise.all([
  findApi(LEAGUE_LIVE, 'LIVE'),
  findApi(LEAGUE_LINE, 'LINE'),
]);

// Find any GameZip or event-related endpoints
const allApiUrls = new Set();
for (const r of results) {
  for (const resp of r.responses) {
    if (resp.status === 200 && resp.length > 50) {
      allApiUrls.add(resp.url.replace(/\?.*$/, ''));
    }
  }
}

console.log('\n=== All unique API endpoints ===');
for (const u of allApiUrls) {
  console.log(`  ${u}`);
}
