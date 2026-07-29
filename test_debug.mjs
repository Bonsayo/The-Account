import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function test() {
  const res = await fetch('https://mel-bet.et/service-api/LiveFeed/Get1x2_VZip?count=500', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://mel-bet.et/' },
  });
  const data = await res.json();
  console.log('Total matches: ' + (data.Value?.length || 0));
  for (const m of (data.Value || [])) {
    console.log('  [' + m.I + '] ' + m.SN + ': ' + m.O1 + ' vs ' + m.O2);
    console.log('    League: ' + (m.LE || m.L));
    console.log('    LI(champs): ' + m.LI);
  }
}
test().catch(e => console.error(e));
