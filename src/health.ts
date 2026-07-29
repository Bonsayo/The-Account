import http from 'http';
import { logger } from './logger';

let healthy = true;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'text/plain' });
    res.end(healthy ? 'OK' : 'Starting');
  } else {
    res.writeHead(200);
    res.end('');
  }
});

export function startHealthServer(port = parseInt(process.env.PORT || '8080', 10)) {
  healthy = false;
  server.listen(port, () => {
    logger.info(`Health server listening on :${port}`);
  });
}

export function setHealthy(v: boolean) { healthy = v; }

export function stopHealthServer() {
  healthy = false;
  server.close();
}
