// POST /api/submit — принимает бриф, сохраняет в базу, отправляет письмо команде Prodigi.
// Клиент видит успех только если письмо действительно ушло.
import { sanitizeBrief } from '../public/js/core/validate.js';
import { BRIEF_VERSION } from '../public/js/config/brief.js';
import { LOCALES } from '../public/js/config/locales/index.js';
import { json, fail, readJson, sameOrigin, clientIp, sha256, UUID_RE, readConfig } from './http.js';
import { getBrief, countRecent, upsertBrief, patchBrief, listFolder, signedDownloadUrl } from './supabase.js';
import { sendEmail } from './resend.js';
import { buildEmail } from './email.js';

const MAX_BODY = 256 * 1024;

export async function handleSubmit(request, env = process.env) {
  if (request.method !== 'POST') return fail(405, 'method_not_allowed');
  if (!sameOrigin(request, env)) return fail(403, 'forbidden');

  const cfg = readConfig(env);
  if (!cfg.storageReady || !cfg.emailReady) {
    console.error('[brief] Отправка не настроена: проверьте переменные окружения', {
      storage: cfg.storageReady,
      email: cfg.emailReady,
    });
    return fail(503, 'not_configured');
  }

  const { data, error } = await readJson(request, MAX_BODY);
  if (error) return fail(error === 'too_large' ? 413 : 400, 'bad_request');

  const id = String(data.submissionId || '');
  if (!UUID_RE.test(id)) return fail(400, 'bad_request');

  // Антиспам: скрытое поле заполняют только боты.
  if (typeof data.hp === 'string' && data.hp.trim()) return fail(400, 'rejected');
  const startedAt = Number(data.startedAt);
  if (!startedAt || Date.now() - startedAt < cfg.minFillSeconds * 1000) return fail(400, 'too_fast');

  const { clean, errors, valid } = sanitizeBrief(data.answers);
  if (!valid) {
    const details = Object.fromEntries(Object.entries(errors).map(([s, f]) => [s, Object.keys(f)]));
    return fail(422, 'validation', details);
  }
  const locale = LOCALES[data.locale] ? data.locale : 'ru';
  clean.materialFiles = clean.materialFiles.filter((f) => f.path.startsWith(`${id}/`) && !f.path.includes('..'));

  const ipHash = await sha256(`${cfg.salt}:${clientIp(request)}`);
  const createdAt = new Date();

  try {
    const existing = await getBrief(cfg, id);
    if (existing && existing.email_status === 'sent') return json(200, { ok: true, id });

    if (!existing) {
      const since = new Date(Date.now() - 3600_000).toISOString();
      if ((await countRecent(cfg, cfg.table, ipHash, since)) >= cfg.maxPerHour) return fail(429, 'rate_limited');
    }

    // Файлы: берём только те, что реально лежат в папке этого брифа, с настоящим размером.
    if (clean.materialFiles.length) {
      const stored = await listFolder(cfg, id);
      const byPath = new Map((stored || []).map((o) => [`${id}/${o.name}`, o]));
      clean.materialFiles = clean.materialFiles
        .filter((f) => byPath.has(f.path))
        .map((f) => ({ ...f, size: Number(byPath.get(f.path).metadata?.size) || f.size }));
    }

    await upsertBrief(cfg, {
      id,
      brand: clean.company,
      contact_name: clean.name,
      contact_email: clean.email,
      locale,
      brief_version: BRIEF_VERSION,
      answers: clean,
      files: clean.materialFiles,
      ip_hash: ipHash,
      user_agent: (request.headers.get('user-agent') || '').slice(0, 300),
      email_status: 'pending',
      email_error: null,
    });
  } catch (e) {
    console.error('[brief] Ошибка базы данных', e.message);
    return fail(502, 'storage_failed');
  }

  const fileLinks = {};
  for (const f of clean.materialFiles) {
    try {
      fileLinks[f.path] = await signedDownloadUrl(cfg, f.path, cfg.linkDays * 86400);
    } catch (e) {
      console.error('[brief] Не удалось создать ссылку на файл', f.path, e.message);
    }
  }

  const email = buildEmail({ id, answers: clean, fileLinks, createdAt, linkDays: cfg.linkDays });
  try {
    const emailId = await sendEmail(cfg, { ...email, replyTo: clean.email });
    await patchBrief(cfg, id, {
      email_status: 'sent',
      email_id: emailId,
      emailed_at: new Date().toISOString(),
    }).catch((e) => console.error('[brief] Письмо ушло, но статус не обновлён', e.message));
  } catch (e) {
    console.error('[brief] Ошибка отправки письма', e.message);
    await patchBrief(cfg, id, { email_status: 'failed', email_error: e.message.slice(0, 500) }).catch(() => {});
    return fail(502, 'email_failed');
  }

  return json(200, { ok: true, id });
}
