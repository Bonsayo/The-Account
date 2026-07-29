import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function t() {
  const r = await fetch('https://v3.traincdn.com/sys-static/sys-betting-app-static/Desktop/Melbet/entry-78291c7741.js', {
    headers: {'Accept':'*/*','User-Agent':'Mozilla/5.0','Referer':'https://mel-bet.et/'},
  });
  const js = await r.text();

  const lookups = {
    Io: 'count', '$e': 'champs', pe: 'lng', yo: 'mode',
    ot: 'coefViewId', Te: 'partner', Bt: 'sports',
    nt: 'groupId', Ot: 'cyberFlag'
  };

  for (const [varName, desc] of Object.entries(lookups)) {
    // Find variable declarations with literals
    const re1 = new RegExp('(?:var|let|const)\\s+' + varName + '\\s*=\\s*(-?\\d+|\"[^\"]*\"|true|false|null|undefined)', 'g');
    let m1; let vals = new Set();
    while ((m1 = re1.exec(js)) !== null) vals.add(m1[1]);
    if (vals.size) console.log(varName + ' (' + desc + ') = ' + [...vals].join(', '));
  }

  // Also look for where the API call is actually invoked (search for execute or similar patterns near Get1x2_VZip)
  const callPattern = /Get1x2_VZip[^}]+?execute/g;
  let calls = js.match(callPattern);
  if (calls) {
    console.log('\nSample Get1x2_VZip call:');
    console.log(calls[0].substring(0, 500));
  }
}
t().catch(e => console.error(e));
