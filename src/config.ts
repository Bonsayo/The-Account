import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '208.67.222.222']);

dotenv.config();

export const NBA_TEAMS = [
  'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
  'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets',
  'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
  'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat',
  'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans',
  'New York Knicks', 'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers',
  'Phoenix Suns', 'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs',
  'Toronto Raptors', 'Utah Jazz', 'Washington Wizards',
];

export function isNBACyberTeam(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('(cyber)') && NBA_TEAMS.some(team => lower.includes(team.toLowerCase()));
}

export const config = {
  pollInterval: parseInt(process.env.POLL_INTERVAL || '5000', 10),
  convexUrl: process.env.CONVEX_URL || '',
  convexKey: process.env.CONVEX_KEY || '',
  baseUrl: process.env.API_BASE || 'https://mel-bet.et/service-api',
  count: parseInt(process.env.COUNT || '1000', 10),
  lng: process.env.LNG || 'en',
  proxyUrl: process.env.PROXY_URL || '',
};
