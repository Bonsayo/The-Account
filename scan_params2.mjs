import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function t() {
  const r = await fetch('https://v3.traincdn.com/sys-static/sys-betting-app-static/Desktop/Melbet/entry-78291c7741.js', {
    headers: {'Accept':'*/*','User-Agent':'Mozilla/5.0','Referer':'https://mel-bet.et/'},
  });
  const js = await r.text();

  // Find ALL assignments to $e (champs) that aren't just the declaration in expectedParams
  // $e is likely a reactive ref or store value
  const assignments = js.match(/\$e\s*=\s*[^;]+/g);
  if (assignments) {
    console.log('$e (champs) assignments:');
    assignments.forEach(a => {
      // Skip if it's just the expectedParams declaration
      if (!a.includes('expectedParams') && !a.includes(':')) {
        console.log('  ' + a.substring(0, 150));
      }
    });
  }
  
  // Find Te (partner) assignments  
  const teAssign = js.match(/Te\s*=\s*[^;]+/g);
  if (teAssign) {
    console.log('\nTe (partner) assignments:');
    teAssign.forEach(a => console.log('  ' + a.substring(0, 150)));
  }
  
  // Find yo (mode) assignments
  const yoAssign = js.match(/yo\s*=\s*[^;]+/g);
  if (yoAssign) {
    console.log('\nyo (mode) assignments:');
    yoAssign.forEach(a => console.log('  ' + a.substring(0, 150)));
  }
  
  // Find Bt (sports) assignments
  const btAssign = js.match(/Bt\s*=\s*[^;]+/g);
  if (btAssign) {
    console.log('\nBt (sports) assignments:');
    btAssign.forEach(a => console.log('  ' + a.substring(0, 150)));
  }
  
  // Find Ot (cyberFlag) assignments  
  const otAssign = js.match(/Ot\s*=\s*[^;]+/g);
  if (otAssign) {
    console.log('\nOt (cyberFlag) assignments:');
    otAssign.forEach(a => console.log('  ' + a.substring(0, 150)));
  }
  
  // Look for main-live-feed or main-line-feed actual usage patterns
  const liveFeedCalls = js.match(/main-live-feed[^;]+/g);
  if (liveFeedCalls) {
    console.log('\nmain-live-feed calls:');
    liveFeedCalls.slice(0, 5).forEach(c => console.log('  ' + c.substring(0, 300)));
  }
}
t().catch(e => console.error(e));
