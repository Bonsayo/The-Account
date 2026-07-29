import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function t() {
  const r = await fetch('https://mel-bet.et/service-api/LiveFeed/Get1x2_VZip?count=500&lng=en&cyberFlag=1', {
    headers: {'User-Agent':'Mozilla/5.0','Referer':'https://mel-bet.et/'},
  });
  const data = await r.json();
  const events = data.Value || [];
  console.log('Total cyber events: ' + events.length);
  
  const nbaTeams = ['Atlanta Hawks','Boston Celtics','Brooklyn Nets','Charlotte Hornets','Chicago Bulls','Cleveland Cavaliers','Dallas Mavericks','Denver Nuggets','Detroit Pistons','Golden State Warriors','Houston Rockets','Indiana Pacers','LA Clippers','Los Angeles Lakers','Memphis Grizzlies','Miami Heat','Milwaukee Bucks','Minnesota Timberwolves','New Orleans Pelicans','New York Knicks','Oklahoma City Thunder','Orlando Magic','Philadelphia 76ers','Phoenix Suns','Portland Trail Blazers','Sacramento Kings','San Antonio Spurs','Toronto Raptors','Utah Jazz','Washington Wizards'];
  
  let nbaCyberCount = 0;
  for (const m of events) {
    const home = m.O1 || '';
    const away = m.O2 || '';
    const isNBACyber = home.includes('(cyber)') && away.includes('(cyber)') && nbaTeams.some(t => home.includes(t) || away.includes(t));
    if (isNBACyber) {
      nbaCyberCount++;
      console.log('\nNBA Cyber #' + nbaCyberCount + ' [ID=' + m.I + ']');
      console.log('  ' + home + ' vs ' + away);
      console.log('  League: ' + (m.LE || m.L) + ' (LI=' + m.LI + ')');
      console.log('  Sport: ' + m.SN + ' (SI=' + m.SI + ')');
      console.log('  Start: ' + (m.S ? new Date(m.S * 1000).toISOString() : '?'));
      console.log('  CP=' + m.SC?.CP + ' Finished=' + m.F);
      console.log('  Score: ' + m.SC?.FS?.S1 + '-' + m.SC?.FS?.S2);
    }
  }
  
  console.log('\nTotal NBA cyber: ' + nbaCyberCount + ' / ' + events.length);
  
  // Show all sport types
  const sports = new Set(events.map(m => m.SN || '?'));
  console.log('\nSports: ' + [...sports].join(', '));
}
t().catch(e => console.error(e));
