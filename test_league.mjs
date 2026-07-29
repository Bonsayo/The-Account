const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' };

  // Step 1: Fetch league page
  const res = await fetch('https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league', { headers });
  const html = await res.text();
  console.log('Page fetched, length:', html.length);

  // Step 2: Extract game IDs from JSON-LD
  const parts = html.split('"@type":"SportsEvent"');
  console.log('SportsEvent entries:', parts.length - 1);

  for (let i = 1; i < parts.length; i++) {
    const urlMatch = parts[i].match(/"url":"[^"]*\/(\d+)-/);
    if (urlMatch) {
      const id = urlMatch[1];
      const nameMatch = parts[i].match(/"name":"([^"]+)"/);
      console.log('');
      console.log('Game ID:', id, '|', nameMatch ? nameMatch[1] : '?');

      // Step 3: Get game details via GetGameZip
      const g = await fetch('https://mel-bet.et/service-api/LiveFeed/GetGameZip?id=' + id, { headers });
      const gt = await g.text();
      const val = JSON.parse(gt).Value;
      if (val) {
        console.log('  Teams:', val.O1, 'vs', val.O2);
        console.log('  SC:', JSON.stringify(val.SC));
        console.log('  F:', val.F);
      } else {
        console.log('  GetGameZip: null');
      }
    }
  }
}
main().catch(console.error);
