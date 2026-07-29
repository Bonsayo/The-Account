const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const res = await fetch('https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' }
  });
  const html = await res.text();

  // Find betting app URL in the RCP
  const rcpMatch = html.match(/betting.*?app.*?["']([^"']+)["']/i);
  if (rcpMatch) console.log('Betting app path:', rcpMatch[1]);
  
  // Find __RCP content for betting app
  const start = html.indexOf('BettingLayoutAppConfigDesktop');
  if (start > -1) {
    const snippet = html.slice(start, start + 500);
    console.log('Betting config:', snippet.slice(0, 300));
  }
  
  // Look for the JS bundle that handles the basketball page
  const bundleMatch = html.match(/BettingContent[\s\S]{0,300}?\.js/g);
  if (bundleMatch) {
    bundleMatch.forEach(b => {
      const jsMatch = b.match(/https?[^"'\s]+\.js/);
      if (jsMatch) console.log('Bundle:', jsMatch[0]);
    });
  }
  
  // Search for any .js paths near the word "basketball" or "2935701"
  const jsRefs = html.match(/(?:src|href)="([^"]+\.js[^"]*)"/g) || [];
  const unique = [...new Set(jsRefs)];
  unique.forEach(u => {
    const m = u.match(/"(https?[^"]+)"/);
    if (m) console.log('JS ref:', m[1].slice(0, 120));
  });
}
main().catch(console.error);
