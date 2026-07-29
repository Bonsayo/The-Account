import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function test() {
  // Try LineFeed (prematch) too
  const res = await fetch('https://mel-bet.et/service-api/LineFeed/Get1x2_VZip?count=500', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://mel-bet.et/' },
  });
  const data = await res.json();
  console.log('LineFeed total: ' + (data.Value?.length || 0));
  for (const m of (data.Value || [])) {
    console.log('  [' + m.I + '] ' + (m.SN || '?') + ': ' + m.O1 + ' vs ' + m.O2);
    console.log('    League: ' + (m.LE || m.L));
  }
  
  // Check if there's a sport parameter that works for basketball
  console.log('\n--- Trying LineFeed GetSport ---');
  const res2 = await fetch('https://mel-bet.et/service-api/LineFeed/GetSport', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://mel-bet.et/' },
  });
  const data2 = await res2.text();
  console.log('Status: ' + res2.status + ' Len: ' + data2.length);
  if (data2.length < 500) console.log(data2.substring(0, 300));
  
  // Try GetChampZip
  console.log('\n--- Trying LineFeed GetChampZip with champs=2935701 ---');
  const res3 = await fetch('https://mel-bet.et/service-api/LineFeed/GetChampZip?champs=2935701', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://mel-bet.et/' },
  });
  const data3 = await res3.text();
  console.log('Status: ' + res3.status + ' Len: ' + data3.length);
  console.log(data3.substring(0, 500));
}
test().catch(e => console.error(e));
