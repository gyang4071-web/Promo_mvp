// POST /api/upload-url — проверяет файл и выдаёт одноразовую ссылку для загрузки прямо в хранилище.
// Сам файл через сервер не проходит, поэтому нет лимитов на размер тела функции.
import { FILE_RULES } from '../public/js/config/brief.js';
import { fileExtension } from '../public/js/core/validate.js';
import { json, fail, readJson, sameOrigin, clientIp, sha256, UUID_RE, readConfig } from './http.js';
import { countRecent, createUploadUrl, logUpload } from './supabase.js';

function safeBaseName(name, ext) {
  const base = name
    .slice(0, name.length - ext.length - 1)
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 60);
  return base || 'file';
}

export async function handleUploadUrl(request, env = process.env) {
  if (request.method !== 'POST') return fail(405, 'method_not_allowed');
  if (!sameOrigin(request, env)) return fail(403, 'forbidden');

  const cfg = readConfig(env);
  if (!cfg.storageReady) return fail(503, 'not_configured');

  const { data, error } = await readJson(request, 4096);
  if (error) return fail(400, 'bad_request');

  const submissionId = String(data.submissionId || '');
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const size = Number(data.size);
  const ext = fileExtension(name);

  if (!UUID_RE.test(submissionId) || !name || name.length > 200) return fail(400, 'bad_request');
  if (!FILE_RULES.types[ext]) return fail(400, 'bad_type');
  if (!Number.isFinite(size) || size <= 0 || size > FILE_RULES.maxSize) return fail(400, 'bad_size');

  try {
    const ipHash = await sha256(`${cfg.salt}:${clientIp(request)}`);
    const since = new Date(Date.now() - 3600_000).toISOString();
    if ((await countRecent(cfg, 'brief_uploads', ipHash, since)) >= cfg.maxUploadsPerHour) {
      return fail(429, 'rate_limited');
    }

    const rand = [...crypto.getRandomValues(new Uint8Array(6))].map((b) => b.toString(16).padStart(2, '0')).join('');
    const path = `${submissionId}/${rand}-${safeBaseName(name, ext)}.${ext}`;
    const uploadUrl = await createUploadUrl(cfg, path);
    await logUpload(cfg, { ip_hash: ipHash, submission_id: submissionId, path, size });

    return json(200, { ok: true, path, uploadUrl, contentType: FILE_RULES.types[ext] });
  } catch (e) {
    console.error('[brief] Ошибка подготовки загрузки', e.message);
    return fail(502, 'storage_failed');
  }
}
