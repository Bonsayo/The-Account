const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const base = 'https://mel-bet.et/service-api/LiveFeed/GetGameZip';
  const opts = { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://mel-bet.et/' } };

  const variants = [
    '?id=733742909',
    '?id=733742909&lng=en',
    '?id=733742909&lng=ru',
    '?GameId=733742909',
    '?gameId=733742909',
    '?I=733742909',
    '?eId=733742909',
    '?id=733733022',
    '?id=733733022&lng=en',
  ];

  for (const v of variants) {
    try {
      const res = await fetch(base + v, opts);
      const text = await res.text();
      const hasValue = text.includes('"Value":{');
      const isNull = text.includes('"Value":null');
      const hasCyber = text.includes('(cyber)');
      console.log(res.status, 'Value=' + hasValue + ' null=' + isNull + ' cyber=' + hasCyber, v);
    } catch(e) {
      console.log('ERR', v, e.message);
    }
  }
}
main().catch(console.error);
