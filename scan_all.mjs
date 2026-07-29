import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const res = await fetch('https://mel-bet.et/service-api/LiveFeed/Get1x2_VZip?count=500', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://mel-bet.et/',
    },
  });
  const data = await res.json();
  
  if (!data.Success || !data.Value) {
    console.log('API returned no data');
    console.log(JSON.stringify(data).substring(0, 500));
    return;
  }
  
  console.log('Total matches:', data.Value.length);
  
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
  
  let nbaCount = 0;
  for (const match of data.Value) {
    const home = match.O1 || '';
    const away = match.O2 || '';
    const isNBA = nbaTeams.some(t => home.includes(t) || away.includes(t));
    
    if (isNBA) {
      nbaCount++;
      console.log(`\n--- NBA Match #${nbaCount} (ID: ${match.I}) ---`);
      console.log(`  ${match.O1} vs ${match.O2}`);
      console.log(`  League: ${match.LE} (ID: ${match.LI})`);
      console.log(`  Sport: ${match.SN} (ID: ${match.SI})`);
      console.log(`  Status: finished=${match.F} started=${new Date(match.S * 1000).toISOString()}`);
      console.log(`  Period: CP=${match.SC?.CP} CPS=${match.SC?.CPS}`);
      console.log(`  Final Score: ${match.SC?.FS?.S1} - ${match.SC?.FS?.S2}`);
      if (match.SC?.PS) {
        for (const p of match.SC.PS) {
          console.log(`    ${p.Key}: ${p.Value?.S1}-${p.Value?.S2} (${p.Value?.NF})`);
        }
      }
    }
  }
  
  console.log(`\n\nTotal NBA matches: ${nbaCount} / ${data.Value.length}`);
}
main().catch(e => console.error(e));
