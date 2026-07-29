import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function t() {
  // Test with partner=1 like the frontend sends
  const urls = [
    'https://mel-bet.et/service-api/LiveFeed/Get1x2_VZip?count=500&lng=en&partner=1',
    'https://mel-bet.et/service-api/LiveFeed/Get1x2_VZip?count=500&lng=en',
    'https://mel-bet.et/service-api/LineFeed/Get1x2_VZip?count=500&lng=en&partner=1',
  ];
  
  for (const url of urls) {
    const r = await fetch(url, {
      headers: {'User-Agent':'Mozilla/5.0','Referer':'https://mel-bet.et/'},
    });
    const text = await r.text();
    let count = 0, nbaCount = 0;
    try {
      const data = JSON.parse(text);
      if (data.Value) count = data.Value.length;
      const nbaTeams = ['Atlanta Hawks','Boston Celtics','Brooklyn Nets','Charlotte Hornets','Chicago Bulls','Cleveland Cavaliers','Dallas Mavericks','Denver Nuggets','Detroit Pistons','Golden State Warriors','Houston Rockets','Indiana Pacers','LA Clippers','Los Angeles Lakers','Memphis Grizzlies','Miami Heat','Milwaukee Bucks','Minnesota Timberwolves','New Orleans Pelicans','New York Knicks','Oklahoma City Thunder','Orlando Magic','Philadelphia 76ers','Phoenix Suns','Portland Trail Blazers','Sacramento Kings','San Antonio Spurs','Toronto Raptors','Utah Jazz','Washington Wizards'];
      for (const m of data.Value || []) {
        const h = m.O1 || '', a = m.O2 || '';
        if (h.includes('(cyber)') && a.includes('(cyber)') && nbaTeams.some(t => h.includes(t) || a.includes(t))) nbaCount++;
      }
    } catch(e) {}
    console.log('[' + r.status + '] ' + url.split('?')[1]);
    console.log('  Events: ' + count + ' | NBA cyber: ' + nbaCount);
    if (text.length < 300) console.log('  ' + text.substring(0, 200));
    
    // List all event names if any
    if (count > 0) {
      try {
        const data = JSON.parse(text);
        for (const m of data.Value || []) {
          console.log('  - ' + (m.SN||'?') + ': ' + (m.O1||'') + ' vs ' + (m.O2||''));
        }
      } catch(e) {}
    }
    console.log('');
  }
}
t().catch(e => console.error(e));
