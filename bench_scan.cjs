const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const base = 'https://mel-bet.et/service-api/LiveFeed/GetGameZip';
  const opts = { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://mel-bet.et/' } };

  // Test sequential scanning with concurrency limit
  const concurrency = 5;
  const total = 30;
  const results = [];
  const start = Date.now();
  const startId = 733700000;

  for (let batch = 0; batch < total; batch += concurrency) {
    const end = Math.min(batch + concurrency, total);
    const batchResults = await Promise.all(
      Array.from({ length: end - batch }, (_, i) => 
        fetch(base + '?id=' + (startId + batch + i), opts)
          .then(r => r.text())
          .catch(() => null)
      )
    );
    results.push(...batchResults);
  }

  const elapsed = Date.now() - start;
  const found = results.filter(r => r && r.includes('(cyber)')).length;
  console.log('Scanned', total, 'IDs in', elapsed, 'ms (concurrency:', concurrency + ')');
  console.log('Avg:', (elapsed / total).toFixed(1), 'ms per ID');
  console.log('Cyber games found:', found);

  // Test with concurrency 10
  const start2 = Date.now();
  const results2 = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      fetch(base + '?id=' + (startId + total + i), opts)
        .then(r => r.text())
        .catch(() => null)
    )
  );
  const elapsed2 = Date.now() - start2;
  const found2 = results2.filter(r => r && r.includes('(cyber)')).length;
  console.log('\nBurst 30 IDs in', elapsed2, 'ms (concurrency: 30)');
  console.log('Avg:', (elapsed2 / 30).toFixed(1), 'ms per ID');
  console.log('Cyber games found:', found2);
}
main().catch(console.error);
