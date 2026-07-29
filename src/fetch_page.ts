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
  console.log('Status:', res.status, 'HTML length:', html.length);

  const scriptSrc = html.match(/src="([^"]+\.js[^"]*)"/g);
  console.log('\nScripts:');
  if (scriptSrc) scriptSrc.slice(0, 15).forEach(s => console.log(' ', s));

  const apiRefs = html.match(/["']([^"']*service-api[^"']*)["']/g);
  console.log('\nAPI references:');
  if (apiRefs) apiRefs.slice(0, 20).forEach(r => console.log(' ', r));

  const wsRefs = html.match(/wss?:\/\/[^"']+/g);
  console.log('\nWebSocket references:', wsRefs ? wsRefs.slice(0, 5) : 'none');

  const matchIdCount = (html.match(/733673410/g) || []).length;
  console.log('\nMatch ID 733673410 appears:', matchIdCount, 'times');

  const nbaRefs = html.match(/2935701/g);
  console.log('Champs 2935701 appears:', nbaRefs ? nbaRefs.length : 0);

  const feedPaths = html.match(/["'](\/[^"']*(?:live|feed|Get)[^"']*)["']/gi);
  console.log('\nLive/feed paths:');
  if (feedPaths) feedPaths.slice(0, 20).forEach(p => console.log(' ', p));
}

main().catch(e => console.error('Error:', e.message));

