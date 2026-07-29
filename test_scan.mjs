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
  console.log('Status:', res.status);
  console.log('HTML length:', html.length);
  console.log('Has Golden State:', html.includes('Golden State'));
  console.log('Has NBA 2K26:', html.includes('NBA 2K26') || html.includes('nba-2k26'));
  console.log('Has 733673410:', html.includes('733673410'));

  // Find script sources
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*>/g;
  let m;
  let scripts = [];
  while ((m = scriptRegex.exec(html)) !== null) scripts.push(m[1]);
  console.log('\nScript sources (' + scripts.length + '):');
  scripts.slice(0, 20).forEach(s => console.log('  ' + s));

  // Look for ALL strings containing "service-api" or "/api/"
  const apiRegex = /[^a-zA-Z]([a-zA-Z0-9\/._-]*service-api[^"'<>\s]*)/g;
  let apis = [];
  while ((m = apiRegex.exec(html)) !== null) apis.push(m[1]);
  console.log('\nservice-api references:', apis.slice(0, 20));
}
main().catch(e => console.error('Error:', e.message));

