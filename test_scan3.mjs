import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const url = 'https://v3.traincdn.com/sys-static/sys-v3-host-app-static/Desktop/Melbet/entry-1ed365d74a.js';
  const res = await fetch(url, {headers:{'Accept':'*/*','User-Agent':'Mozilla/5.0','Referer':'https://mel-bet.et/'}});
  const js = await res.text();
  console.log('JS length:', js.length);

  // Find all unique API paths
  const apiRegex = /["']([^"']*(?:service-api|LiveFeed|GetGame|GetEvent|GetScore|Get1x2|VZip)[^"']*)["']/g;
  let apis = new Set();
  let m;
  while ((m = apiRegex.exec(js)) !== null) apis.add(m[1]);
  console.log('\nAPI references:');
  apis.forEach(a => console.log('  ' + a));

  // Find WebSocket URLs
  const wsRegex = /["'](wss?:\/\/[^"']+)["']/g;
  let ws = new Set();
  while ((m = wsRegex.exec(js)) !== null) ws.add(m[1]);
  console.log('\nWebSocket URLs:');
  ws.forEach(w => console.log('  ' + w));

  // Find all Get-prefixed paths
  const getRegex = /["'](\/[^"']*Get\w+[^"']*)["']/g;
  let gets = new Set();
  while ((m = getRegex.exec(js)) !== null) gets.add(m[1]);
  console.log('\nGet-prefixed paths:');
  gets.forEach(g => console.log('  ' + g));
}
main().catch(e => console.error('Error:', e.message));
