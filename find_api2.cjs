const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const res = await fetch('https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' }
  });
  const html = await res.text();

  // Find the main JS bundle that loads the betting app
  const scripts = html.match(/<script[^>]*src="[^"]+"[^>]*>/g) || [];
  for (const s of scripts) {
    const m = s.match(/src="([^"]+)"/);
    if (m && (m[1].includes('.js') && !m[1].includes('polyfill') && !m[1].includes('.css'))) {
      console.log(m[1].slice(0, 100));
    }
  }

  // Search for service-api in the HTML
  const apiRefs = html.match(/["'][^"']*service-api[^"']*["']/g) || [];
  const unique = [...new Set(apiRefs)];
  unique.forEach(u => console.log('API:', u.slice(0, 120)));
  
  // Find the app config that contains the API URL
  const rcp = html.match(/window\.__RCP\s*=\s*({[^;]+})/);
  if (rcp) console.log('RCP found, length:', rcp[1].length);
  
  // Find the app state with data
  const hostState = html.match(/window\.__V3_HOST_APP__\s*=\s*\([^)]+\)\s*\([^)]+\)/);
  if (hostState) console.log('Host app state found, length:', hostState[0].length);
}
main().catch(console.error);
