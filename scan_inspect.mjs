import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  // Fetch LiveFeed Get1x2_VZip WITHOUT country
  const res = await fetch('https://mel-bet.et/service-api/LiveFeed/Get1x2_VZip?count=500', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://mel-bet.et/',
    },
  });
  const text = await res.text();
  console.log('Status:', res.status, 'Length:', text.length);
  
  // Count NBA teams
  const nbaTeams = [
    'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
    'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets',
    'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
    'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat',
    'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans',
    'New York Knicks', 'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers',
    'Phoenix Suns', 'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs',
    'Toronto Raptors', 'Utah Jazz', 'Washington Wizards'
  ];
  for (const team of nbaTeams) {
    const count = (text.match(new RegExp(team.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    if (count > 0) console.log(`  ${team}: ${count}`);
  }
  
  // Show the JSON structure (first 3000 chars)
  console.log('\n--- First 3000 chars ---');
  console.log(text.substring(0, 3000));
  
  // Also fetch game ZIP for one specific game
  console.log('\n\n=== GetGameZip id=733673410 ===');
  const res2 = await fetch('https://mel-bet.et/service-api/LiveFeed/GetGameZip?id=733673410', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://mel-bet.et/' },
  });
  const text2 = await res2.text();
  console.log('Status:', res2.status, 'Length:', text2.length);
  console.log(text2.substring(0, 2000));
}
main().catch(e => console.error(e));
