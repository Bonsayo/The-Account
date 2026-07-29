const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const res = await fetch('https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' }
  });
  const html = await res.text();

  // Find all script src references
  const scripts = html.match(/<script[^>]*src="([^"]+)"[^>]*>/g);
  if (scripts) {
    for (const s of scripts) {
      const srcMatch = s.match(/src="([^"]+)"/);
      if (srcMatch) {
        const url = srcMatch[1];
        if (url.includes('betting') || url.includes('LiveFeed') || url.includes('service')) {
          console.log('Script:', url);
        }
      }
    }
  }

  // Find API endpoint patterns in the HTML
  const apiMatches = html.match(/\/service-api\/[a-zA-Z\/]+/g);
  if (apiMatches) {
    const unique = [...new Set(apiMatches)];
    unique.forEach(u => console.log('API ref:', u));
  }
  
  // Look for inline API config
  const configMatch = html.match(/apiUrl[\s]*:[\s]*['"][^'"]+['"]/);
  if (configMatch) console.log('API URL config:', configMatch[0]);
  
  // Find Nuxt page data - look for the game data JSON
  const ldParts = html.split('"@type":"SportsEvent"');
  console.log('\nSportsEvent entries:', ldParts.length - 1);
  
  // Extract all game IDs (last numeric segment before dash in URL)
  for (let i = 1; i < ldParts.length; i++) {
    const allIds = [...ldParts[i].matchAll(/\/(\d+)-/g)];
    const gameId = allIds.length > 1 ? allIds[allIds.length - 1][1] : (allIds.length === 1 ? allIds[0][1] : null);
    if (gameId) {
      const nameMatch = ldParts[i].match(/"name":"([^"]+)"/);
      console.log('  Game ID:', gameId, '|', nameMatch ? nameMatch[1] : '?');
    }
  }
}
main().catch(console.error);
