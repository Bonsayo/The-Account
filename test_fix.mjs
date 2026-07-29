import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function test() {
  const res = await fetch('https://mel-bet.et/service-api/LiveFeed/Get1x2_VZip?count=500', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://mel-bet.et/' },
  });
  const data = await res.json();
  const nbaTeams = ['Atlanta Hawks','Boston Celtics','Brooklyn Nets','Charlotte Hornets','Chicago Bulls','Cleveland Cavaliers','Dallas Mavericks','Denver Nuggets','Detroit Pistons','Golden State Warriors','Houston Rockets','Indiana Pacers','LA Clippers','Los Angeles Lakers','Memphis Grizzlies','Miami Heat','Milwaukee Bucks','Minnesota Timberwolves','New Orleans Pelicans','New York Knicks','Oklahoma City Thunder','Orlando Magic','Philadelphia 76ers','Phoenix Suns','Portland Trail Blazers','Sacramento Kings','San Antonio Spurs','Toronto Raptors','Utah Jazz','Washington Wizards'];
  const nbaMatches = (data.Value || []).filter(m => nbaTeams.some(t => (m.O1||'').includes(t) || (m.O2||'').includes(t)));
  console.log('Total matches: ' + (data.Value?.length || 0));
  console.log('NBA matches: ' + nbaMatches.length);
  for (const m of nbaMatches) {
    console.log('  ' + m.O1 + ' vs ' + m.O2 + ' | Q' + m.SC?.CP + ' | ' + m.SC?.FS?.S1 + '-' + m.SC?.FS?.S2 + ' | finished=' + m.F);
  }
}
test().catch(e => console.error(e));
