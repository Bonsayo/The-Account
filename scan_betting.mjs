import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function main() {
  const url = 'https://v3.traincdn.com/sys-static/sys-betting-app-static/Desktop/Melbet/entry-78291c7741.js';
  const res = await fetch(url, {
    headers: {'Accept':'*/*','User-Agent':'Mozilla/5.0','Referer':'https://mel-bet.et/'},
  });
  const js = await res.text();
  console.log('Betting app JS length:', js.length);

  // Search for API endpoints
  const apiRegex = /service-api[^"')s,;]*/g;
  let apis = new Set();
  let m;
  while ((m = apiRegex.exec(js)) !== null) apis.add(m[0]);
  console.log('\nservice-api endpoints:');
  apis.forEach(a => console.log('  ' + a));

  // Search for VZip, Get1x2, LiveFeed etc
  const getRegex = /Get\w*[VZ]ip|Get1x2|LiveFeed|GetGame|GetEvent|GetScore|GetMatch/g;
  let gets = new Set();
  while ((m = getRegex.exec(js)) !== null) gets.add(m[0]);
  console.log('\nGet* APIs:', [...gets].join(', '));

  // WebSocket
  const wsRegex = /wss?:\/\/[^"']+/g;
  let ws = new Set();
  while ((m = wsRegex.exec(js)) !== null) ws.add(m[0]);
  console.log('WebSocket:', [...ws].join(', ') || 'none');

  // Find dynamically loaded chunks with "live" or "feed" in name
  const chunkRegex = /import\("\.\/([^"]*live[^"]*)"\)|import\("\.\/([^"]*feed[^"]*)"\)/gi;
  let chunks = new Set();
  while ((m = chunkRegex.exec(js)) !== null) {
    if (m[1]) chunks.add(m[1]);
    if (m[2]) chunks.add(m[2]);
  }
  console.log('\nLive/feed chunks:', [...chunks].join(', '));

  // Find champs/2935701 and related constants  
  const champsRegex = /2935701|champs|champId/g;
  let champs = new Set();
  while ((m = champsRegex.exec(js)) !== null) champs.add(m[0]);
  console.log('\nChamps refs:', [...champs].join(', '));
  
  console.log('\n--- also check for any football/basketball IDs ---');
  const numRegex = /\b(2935701|2889157)\b/g;
  let nums = new Set();
  while ((m = numRegex.exec(js)) !== null) nums.add(m[0]);
  console.log('Known IDs:', [...nums].join(', '));
}
main().catch(e => console.error(e));
