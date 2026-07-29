import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function t() {
  const endpoints = [
    '/service-api/LiveFeed/GetChampZip?champId=2935701&lng=en',
    '/service-api/LineFeed/GetChampZip?champId=2935701&lng=en',
    '/service-api/LiveFeed/GetChampZip?champId=2935701&lng=en&sportId=3',
    '/service-api/LiveFeed/GetChampsZip?sportId=3&lng=en',
    '/service-api/LineFeed/GetChampsZip?sportId=3&lng=en',
    '/service-api/LiveFeed/Get1x2_VZip?count=500&lng=en&mode=0',
    '/service-api/LiveFeed/Get1x2_VZip?count=500&lng=en&cyberFlag=1',
    '/service-api/LiveFeed/Get1x2_VZip?count=500&lng=en&sports=3',
    '/service-api/LineFeed/GetGameZip?gameId=733673410&lng=en',
  ];
  for (const ep of endpoints) {
    try {
      const url = 'https://mel-bet.et' + ep;
      const r = await fetch(url, {
        headers: {'User-Agent':'Mozilla/5.0','Referer':'https://mel-bet.et/'},
      });
      const text = await r.text();
      const hasValue = text.includes('"Value"') && !text.includes('"Value":null') && !text.includes('"Value":[]');
      console.log('[' + r.status + '][' + text.length + '][val=' + hasValue + '] ' + ep);
      if (text.length < 400) console.log('  ' + text.substring(0, 250));
    } catch(e) {
      console.log('[ERR] ' + ep + ': ' + e.message);
    }
  }
}
t().catch(e => console.error(e));
