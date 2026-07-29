import dns from 'dns';
import fs from 'fs';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const url = 'https://v3.traincdn.com/sys-static/sys-v3-host-app-static/Desktop/Melbet/entry-1ed365d74a.js';
  const res = await fetch(url, {headers:{'Accept':'*/*','User-Agent':'Mozilla/5.0','Referer':'https://mel-bet.et/'}});
  const js = await res.text();
  
  // Save for analysis
  fs.writeFileSync('entry.js', js);
  console.log('Saved entry.js (' + js.length + ' bytes)');
  
  // Broader search for any service-api URLs (including concatenated)
  const allRefs = js.match(/service-api[^"')\s,;]*/g);
  let unique = new Set(allRefs);
  console.log('\nAll service-api references (' + unique.size + '):');
  unique.forEach(r => console.log('  ' + r));

  // Search for champs/2935701 references
  const champsRefs = js.match(/[^a-zA-Z](champs|championship|leagueId|sportId|2935701)[^a-zA-Z]/g);
  let champsUnique = new Set(champsRefs);
  console.log('\nChamps/championship references:');
  champsUnique.forEach(r => console.log('  ' + r.trim()));

  // Search for any URL containing 'live' or 'feed'
  const liveFeed = js.match(/["'][^"']*(?:live|feed|score|event|match|period|quarter)[^"']*["']/gi);
  let liveUnique = new Set(liveFeed);
  console.log('\nLive/feed/score references:');
  liveUnique.forEach(r => console.log('  ' + r));
}
main().catch(e => console.error('Error:', e.message));
