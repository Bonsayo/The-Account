const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const res = await fetch('https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' }
  });
  const html = await res.text();

  // Manual parsing: find the RCP between window.__RCP = and the next script
  const startTag = 'window.__RCP=';
  const idx = html.indexOf(startTag);
  if (idx > -1) {
    let depth = 0;
    let started = false;
    let json = '';
    for (let i = idx + startTag.length; i < html.length; i++) {
      const ch = html[i];
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') { depth--; }
      if (started) json += ch;
      if (started && depth === 0) break;
    }
    // Search for service-api in the JSON
    const apis = json.match(/https?:\\\/\\\/[^"']*service-api[^"']*/g) || [];
    const unique = [...new Set(apis)];
    console.log('API URLs found:', unique.length);
    unique.forEach(u => console.log(' ', u.replace(/\\\//g, '/').slice(0, 160)));

    // Search for GetChamp, GetGame, GetEvents patterns
    const endpoints = json.match(/Get\w+Zip/g) || [];
    console.log('\nEndpoints:', [...new Set(endpoints)]);
    
    // Search for basketball-specific config
    const bbIdx = json.indexOf('basketball');
    if (bbIdx > -1) {
      const ctx = json.slice(Math.max(0, bbIdx - 100), Math.min(json.length, bbIdx + 200));
      console.log('\nBasketball context:', ctx.replace(/\\\//g, '/').replace(/\\"/g, '"'));
    }
  }
}
main().catch(console.error);
