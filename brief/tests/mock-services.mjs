// Заглушка Supabase и Resend для тестов: повторяет нужные части их REST API.
// Используется только в тестах; в работе сервер обращается к настоящим сервисам.
import http from 'node:http';

export function startMock() {
  const state = { briefs: new Map(), uploads: [], files: new Map(), emails: [], failEmail: false };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://mock');
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': 'content-range',
    };
    const send = (status, data, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...cors, ...headers });
      res.end(data === undefined ? '' : JSON.stringify(data));
    };
    if (req.method === 'OPTIONS') return send(204);

    const p = url.pathname;
    const authed = req.headers.authorization === 'Bearer service-key' || req.headers.authorization === 'Bearer re_test';

    if (p === '/emails' && req.method === 'POST') {
      if (!authed) return send(401, { message: 'bad key' });
      if (state.failEmail) return send(500, { message: 'mock failure' });
      const email = JSON.parse(body);
      state.emails.push(email);
      return send(200, { id: `email_${state.emails.length}` });
    }

    // Загрузка по подписанной ссылке не требует ключа — только токен.
    if (p.startsWith('/storage/v1/object/upload/sign/') && req.method === 'PUT') {
      const key = decodeURIComponent(p.replace('/storage/v1/object/upload/sign/brief-files/', ''));
      if (url.searchParams.get('token') !== `tok-${key}`) return send(400, { error: 'bad token' });
      state.files.set(key, { size: body.length, type: req.headers['content-type'] });
      return send(200, { Key: key });
    }

    if (!authed) return send(401, { message: 'no key' });

    if (p === '/rest/v1/briefs' && req.method === 'GET') {
      const id = url.searchParams.get('id').replace('eq.', '');
      const row = state.briefs.get(id);
      return send(200, row ? [{ id: row.id, email_status: row.email_status }] : []);
    }
    if (p.startsWith('/rest/v1/') && req.method === 'HEAD') {
      const table = p.split('/').pop();
      const ip = url.searchParams.get('ip_hash').replace('eq.', '');
      const rows = table === 'briefs' ? [...state.briefs.values()] : state.uploads;
      const n = rows.filter((r) => r.ip_hash === ip).length;
      res.writeHead(200, { 'content-range': `0-0/${n}`, ...cors });
      return res.end();
    }
    if (p === '/rest/v1/briefs' && req.method === 'POST') {
      const row = JSON.parse(body);
      state.briefs.set(row.id, { ...(state.briefs.get(row.id) || {}), ...row });
      return send(201);
    }
    if (p === '/rest/v1/briefs' && req.method === 'PATCH') {
      const id = url.searchParams.get('id').replace('eq.', '');
      Object.assign(state.briefs.get(id), JSON.parse(body));
      return send(204);
    }
    if (p === '/rest/v1/brief_uploads' && req.method === 'POST') {
      state.uploads.push(JSON.parse(body));
      return send(201);
    }
    if (p.startsWith('/storage/v1/object/upload/sign/') && req.method === 'POST') {
      const key = decodeURIComponent(p.replace('/storage/v1/object/upload/sign/brief-files/', ''));
      return send(200, { url: `/object/upload/sign/brief-files/${key}?token=tok-${key}` });
    }
    if (p === '/storage/v1/object/list/brief-files' && req.method === 'POST') {
      const { prefix } = JSON.parse(body);
      const items = [...state.files.entries()]
        .filter(([k]) => k.startsWith(`${prefix}/`))
        .map(([k, v]) => ({ name: k.slice(prefix.length + 1), metadata: { size: v.size, mimetype: v.type } }));
      return send(200, items);
    }
    if (p.startsWith('/storage/v1/object/sign/') && req.method === 'POST') {
      const key = p.replace('/storage/v1/object/sign/', '');
      return send(200, { signedURL: `/object/sign/${key}?token=dl` });
    }
    send(404, { error: 'not found', path: p });
  });

  return new Promise((resolve) =>
    server.listen(0, () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      resolve({
        state,
        base,
        env: {
          SUPABASE_URL: base,
          SUPABASE_SERVICE_ROLE_KEY: 'service-key',
          RESEND_API_KEY: 're_test',
          RESEND_API_URL: base,
          BRIEF_EMAIL_TO: 'team@prodigi.test',
          BRIEF_EMAIL_FROM: 'Prodigi Brief <brief@prodigi.test>',
          MIN_FILL_SECONDS: '20',
        },
        close: () => new Promise((r) => server.close(r)),
      });
    }),
  );
}
