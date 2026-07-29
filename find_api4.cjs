const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const res = await fetch('https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' }
  });
  const html = await res.text();

  // Extract __RCP fully
  const rcpMatch = html.match(/window\.__RCP\s*=\s*({[^;]+})/);
  if (rcpMatch) {
    try {
      const rcp = JSON.parse(rcpMatch[1]);
      // Find all service-api URLs
      const rcpStr = JSON.stringify(rcp);
      const apiUrls = rcpStr.match(/https?[^"'\s]*service-api[^"'\s]*/g) || [];
      const unique = [...new Set(apiUrls)];
      unique.forEach(u => console.log('API URL:', u.slice(0, 150)));
      
      // Also search for GetGame or Get1x2 patterns
      const gameEndpoints = rcpStr.match(/Get\w+Zip/g) || [];
      console.log('\nGame endpoints:', [...new Set(gameEndpoints)]);
      
      // Find all URL patterns
      const urlPatterns = rcpStr.match(/["'][^"']*service-api[^"']*["']/g) || [];
      console.log('\nFull API paths:');
      [...new Set(urlPatterns)].slice(0, 10).forEach(u => console.log(' ', u.slice(0, 150)));
    } catch(e) {
      console.log('RCP parse error:', e.message);
    }
  } else {
    console.log('No RCP found');
  }
}
main().catch(console.error);
