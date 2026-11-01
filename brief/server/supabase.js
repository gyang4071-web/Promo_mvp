// Обращения к Supabase через REST, без SDK. Ключ service_role используется только здесь, на сервере.

export class ServiceError extends Error {
  constructor(service, status, body) {
    super(`${service} ${status}: ${String(body).slice(0, 300)}`);
    this.service = service;
    this.status = status;
  }
}

function headers(cfg, extra = {}) {
  return {
    apikey: cfg.supabaseKey,
    Authorization: `Bearer ${cfg.supabaseKey}`,
    ...extra,
  };
}

async function call(cfg, path, init) {
  const res = await fetch(`${cfg.supabaseUrl}${path}`, init);
  const text = await res.text();
  if (!res.ok) throw new ServiceError('supabase', res.status, text);
  return text ? JSON.parse(text) : null;
}

const q = encodeURIComponent;

// ---------- база данных ----------
export function getBrief(cfg, id) {
  return call(cfg, `/rest/v1/${cfg.table}?id=eq.${q(id)}&select=id,email_status`, {
    headers: headers(cfg),
  }).then((rows) => (rows && rows[0]) || null);
}

export async function countRecent(cfg, table, ipHash, sinceIso) {
  const res = await fetch(
    `${cfg.supabaseUrl}/rest/v1/${table}?ip_hash=eq.${q(ipHash)}&created_at=gte.${q(sinceIso)}&select=id`,
    { method: 'HEAD', headers: headers(cfg, { Prefer: 'count=exact', Range: '0-0' }) },
  );
  if (!res.ok && res.status !== 206) throw new ServiceError('supabase', res.status, 'count failed');
  const range = res.headers.get('content-range') || '';
  return Number(range.split('/')[1]) || 0;
}

export function upsertBrief(cfg, row) {
  return call(cfg, `/rest/v1/${cfg.table}?on_conflict=id`, {
    method: 'POST',
    headers: headers(cfg, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(row),
  });
}

export function patchBrief(cfg, id, patch) {
  return call(cfg, `/rest/v1/${cfg.table}?id=eq.${q(id)}`, {
    method: 'PATCH',
    headers: headers(cfg, { 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify(patch),
  });
}

export function logUpload(cfg, row) {
  return call(cfg, `/rest/v1/brief_uploads`, {
    method: 'POST',
    headers: headers(cfg, { 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  });
}

// ---------- хранилище файлов ----------
const encPath = (path) => path.split('/').map(q).join('/');

export async function createUploadUrl(cfg, path) {
  const data = await call(cfg, `/storage/v1/object/upload/sign/${q(cfg.bucket)}/${encPath(path)}`, {
    method: 'POST',
    headers: headers(cfg, { 'Content-Type': 'application/json' }),
    body: '{}',
  });
  if (!data || !data.url) throw new ServiceError('supabase', 500, 'no upload url');
  return `${cfg.supabaseUrl}/storage/v1${data.url}`;
}

export function listFolder(cfg, prefix) {
  return call(cfg, `/storage/v1/object/list/${q(cfg.bucket)}`, {
    method: 'POST',
    headers: headers(cfg, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefix, limit: 100, offset: 0 }),
  });
}

export async function signedDownloadUrl(cfg, path, seconds) {
  const data = await call(cfg, `/storage/v1/object/sign/${q(cfg.bucket)}/${encPath(path)}`, {
    method: 'POST',
    headers: headers(cfg, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ expiresIn: seconds }),
  });
  const rel = data && (data.signedURL || data.signedUrl);
  if (!rel) throw new ServiceError('supabase', 500, 'no signed url');
  return `${cfg.supabaseUrl}/storage/v1${rel}`;
}
