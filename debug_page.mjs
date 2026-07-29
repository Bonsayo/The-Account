import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const res = await fetch('https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://mel-bet.et/' }
  });
  const text = await res.text();

  // Look for any JSON-like data with team names
  const lower = text.toLowerCase();
  const teams = ['nuggets', 'cavaliers', 'rockets', 'warriors', 'lakers', 'celtics'];
  for (const t of teams) {
    const idx = lower.indexOf(t);
    if (idx !== -1) {
      const snippet = text.slice(Math.max(0, idx - 100), idx + 100);
      console.log('Found "' + t + '" in page:');
      console.log('  ...' + snippet.replace(/\n/g, ' ').trim() + '...');
      console.log('');
    }
  }

  // Find all API URLs in JS bundles
  const apiUrls = text.match(/https?:\/\/[^"'\s]+service-api[^"'\s]+/g);
  if (apiUrls) {
    console.log('API URLs found in page:');
    apiUrls.forEach(u => console.log('  ' + u));
  }

  // Check page structure
  console.log('Page length:', text.length);
  console.log('Has "champId":', text.includes('champId') || text.includes('ChampId'));
  console.log('Has "2935701":', text.includes('2935701'));
}
main().catch(console.error);
