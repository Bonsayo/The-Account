const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  // Check various page types to see which are geo-blocked
  const urls = [
    { name: 'game page', url: 'https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league/733742909-denver-nuggets-cyber-cleveland-cavaliers-cyber' },
    { name: 'league page', url: 'https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league' },
    { name: 'basketball live', url: 'https://mel-bet.et/en/live/basketball' },
    { name: 'live all', url: 'https://mel-bet.et/en/live' },
    { name: 'home', url: 'https://mel-bet.et/en' },
  ];
  
  for (const {name, url} of urls) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' }
    });
    const text = await res.text();
    const hasNuggets = text.toLowerCase().includes('nuggets');
    const hasNBACyber = text.toLowerCase().includes('2k26') || text.toLowerCase().includes('nba') && text.toLowerCase().includes('cyber');
    const hasLeagueNav = text.includes('2935701');
    console.log(`${res.status} ${text.length.toString().padStart(7)} ${name.padEnd(20)} nuggets=${+hasNuggets} nba=${+hasNBACyber} league=${+hasLeagueNav}`);
  }
}
main().catch(console.error);
