const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const res = await fetch('https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' }
  });
  const text = await res.text();
  
  // Find all SportsEvent schema blocks
  const parts = text.split('"@type":"SportsEvent"');
  console.log('SportsEvent entries:', parts.length - 1);
  
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].slice(0, 600);
    const nameMatch = block.match(/"name":"([^"]+)"/);
    const urlMatch = block.match(/"url":"([^"]+)"/);
    const dateMatch = block.match(/"startDate":"([^"]+)"/);
    const id = urlMatch ? urlMatch[1].split('/').pop().split('?')[0] : 'unknown';
    console.log('');
    console.log('Game ' + i + ':');
    console.log('  Name:', nameMatch ? nameMatch[1] : 'N/A');
    console.log('  Start:', dateMatch ? dateMatch[1] : 'N/A');
    console.log('  URL ID:', id);
    
    // Try getting game details
    try {
      const g = await fetch('https://mel-bet.et/service-api/LiveFeed/GetGameZip?id=' + id, {
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://mel-bet.et/' }
      });
      const gt = await g.text();
      console.log('  GameZip:', gt.slice(0, 300));
    } catch(e) {
      console.log('  GameZip error:', e.message);
    }
  }
}
main().catch(console.error);
