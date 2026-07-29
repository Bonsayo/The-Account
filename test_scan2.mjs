import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const url = 'https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league/733673410-golden-state-warriors-cyber-los-angeles-lakers-cyber';
  const res = await fetch(url, {
    headers: {
      'Host': 'mel-bet.et',
      'Accept': 'text/html,*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  const html = await res.text();

  // Find all <script> content (inline and src)
  const scriptContent = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
  console.log('Script blocks:', scriptContent ? scriptContent.length : 0);
  if (scriptContent) {
    for (let i = 0; i < scriptContent.length; i++) {
      const s = scriptContent[i];
      const trimmed = s.substring(0, 300);
      if (s.includes('service-api') || s.includes('wss://') || s.includes('WebSocket') || s.includes('api')) {
        console.log('  Script ' + i + ':', trimmed);
      } else if (s.includes('src=') && s.length < 200) {
        console.log('  Script ' + i + ' (external):', trimmed);
      }
    }
  }

  // Find WebSocket URLs
  const wsMatches = html.match(/wss?:\/\/[^"'<\s]+/g);
  console.log('\nWebSocket URLs:', wsMatches ? wsMatches.slice(0, 10) : 'none');

  // Find all JSON-like data
  const jsonMatches = html.match(/\{"[^"]+"[^}]+}/g);
  console.log('\nJSON data blocks:', jsonMatches ? jsonMatches.slice(0, 5).map(j => j.substring(0, 200)) : 'none');

  // Search for API endpoints
  const apiEndpoints = html.match(/\/[a-zA-Z]+\/[a-zA-Z]+(?:Zip|Feed|Get)[a-zA-Z]*/g);
  console.log('\nAPI endpoints:', apiEndpoints ? [...new Set(apiEndpoints)].slice(0, 20) : 'none');

  // Look for "app" or "main" JS files
  const allJsRefs = html.match(/["']([^"']+\.js[^"']*)["']/g);
  console.log('\nAll JS refs:', allJsRefs ? allJsRefs.slice(0, 15) : 'none');

  // Search for inline script with config/state
  const stateBlocks = html.match(/window\[[^\]]+\]\s*=\s*\{[^}]+/g);
  if (stateBlocks) console.log('\nState blocks:', stateBlocks.slice(0, 5).map(s => s.substring(0, 200)));
}
main().catch(e => console.error('Error:', e.message));
