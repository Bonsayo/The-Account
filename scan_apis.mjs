import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const BASE = 'https://mel-bet.et';

async function tryAPI(path, label) {
  try {
    const url = `${BASE}${path}`;
    const res = await fetch(url, {
      headers: {
        'Host': 'mel-bet.et',
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://mel-bet.et/en/live/basketball/2935701-nba-2k26-cyber-league',
      },
    });
    const text = await res.text();
    const hasSuccess = text.includes('"Success"');
    const hasNBA = /Atlanta|Lakers|Golden State|Celtics|Bulls|Warriors/i.test(text);
    const preview = text.substring(0, 300).replace(/\n/g, ' ');
    console.log(`[${res.status}] ${label}`);
    console.log(`  Success=${hasSuccess} NBA=${hasNBA} Len=${text.length}`);
    if (text.length < 500) console.log(`  ${preview}`);
    console.log('');
    return { status: res.status, text, hasNBA, hasSuccess };
  } catch(e) {
    console.log(`[ERR] ${label}: ${e.message}\n`);
    return null;
  }
}

async function main() {
  // 1. LiveFeed Get1x2_VZip variants
  await tryAPI('/service-api/LiveFeed/Get1x2_VZip?count=500', 'LiveFeed Get1x2_VZip (no params)');
  await tryAPI('/service-api/LiveFeed/Get1x2_VZip?count=500&sport=4', 'LiveFeed Get1x2_VZip sport=4 (basketball?)');
  await tryAPI('/service-api/LiveFeed/Get1x2_VZip?count=500&sport=7', 'LiveFeed Get1x2_VZip sport=7');
  
  // 2. LineFeed Get1x2_VZip (prematch)
  await tryAPI('/service-api/LineFeed/Get1x2_VZip?count=500', 'LineFeed Get1x2_VZip (no params)');
  
  // 3. GetChampZip for champs=2935701
  await tryAPI('/service-api/LiveFeed/GetChampZip?champs=2935701', 'LiveFeed GetChampZip champs=2935701');
  await tryAPI('/service-api/LineFeed/GetChampZip?champs=2935701', 'LineFeed GetChampZip champs=2935701');
  
  // 4. GetChamp
  await tryAPI('/service-api/LiveFeed/GetChamp?champs=2935701', 'LiveFeed GetChamp champs=2935701');
  await tryAPI('/service-api/LineFeed/GetChamp?champs=2935701', 'LineFeed GetChamp champs=2935701');
  
  // 5. GetGame for known game ID
  await tryAPI('/service-api/LiveFeed/GetGame?id=733673410', 'LiveFeed GetGame id=733673410');
  await tryAPI('/service-api/LiveFeed/GetGameZip?id=733673410', 'LiveFeed GetGameZip id=733673410');
  await tryAPI('/service-api/LineFeed/GetGame?id=733673410', 'LineFeed GetGame id=733673410');
  
  // 6. GetSport
  await tryAPI('/service-api/LiveFeed/GetSport', 'LiveFeed GetSport');
  await tryAPI('/service-api/LineFeed/GetSport', 'LineFeed GetSport');
  
  // 7. GetTopGame / TopGame
  await tryAPI('/service-api/LiveFeed/GetTopGame?champs=2935701', 'LiveFeed GetTopGame champs=2935701');
  await tryAPI('/service-api/LineFeed/GetTopGame?champs=2935701', 'LineFeed GetTopGame champs=2935701');
  
  // 8. Web_SearchZip
  await tryAPI('/service-api/LiveFeed/Web_SearchZip?champs=2935701', 'LiveFeed Web_SearchZip champs=2935701');
  
  // 9. GlobalChamp1x2
  await tryAPI('/service-api/LiveFeed/GlobalChamp1x2?champs=2935701', 'LiveFeed GlobalChamp1x2 champs=2935701');
  
  // 10. Try without host header, different referer
  console.log('=== Without custom Host header ===');
  const res = await fetch('https://mel-bet.et/service-api/LiveFeed/Get1x2_VZip?count=500', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://mel-bet.et/',
    },
  });
  const text = await res.text();
  console.log(`[${res.status}] No custom Host header, Len=${text.length}`);
  if (text.length < 500) console.log(`  ${text.substring(0, 300)}`);
}
main().catch(e => console.error(e));
