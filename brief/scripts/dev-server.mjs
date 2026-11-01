// Локальный сервер: npm run dev → http://localhost:8787
// Отдаёт public/ и вызывает те же обработчики /api/*, что работают на Netlify и Vercel.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleSubmit } from '../server/submit.js';
import { handleUploadUrl } from '../server/upload-url.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');

// Простое чтение .env без зависимостей.
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

const routes = { '/api/submit': handleSubmit, '/api/upload-url': handleUploadUrl };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    const handler = routes[url.pathname];
    if (handler) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      });
      const response = await handler(request, process.env);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }

    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (path.endsWith('/')) path += 'index.html';
    let file = join(publicDir, path);
    if (!file.startsWith(publicDir) || !existsSync(file) || (await stat(file)).isDirectory()) {
      file = join(publicDir, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch (e) {
    console.error(e);
    res.writeHead(500).end('Server error');
  }
});

const port = Number(process.env.PORT || 8787);
server.listen(port, () => console.log(`Бриф: http://localhost:${port}`));
