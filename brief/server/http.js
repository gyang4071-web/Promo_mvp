// Общие помощники для серверных функций (Netlify, Vercel и локальный сервер).

export function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export const fail = (status, error, details) => json(status, { ok: false, error, ...(details ? { details } : {}) });

export async function readJson(request, maxBytes) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maxBytes) return { error: 'too_large' };
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) return { error: 'too_large' };
  try {
    const data = JSON.parse(text);
    return data && typeof data === 'object' && !Array.isArray(data) ? { data } : { error: 'bad_json' };
  } catch {
    return { error: 'bad_json' };
  }
}

// Запросы только со своего сайта: защищает от отправки форм с чужих страниц.
export function sameOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // не браузерный запрос — защищают остальные проверки
  const allowed = new Set(
    String(env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (host && new URL(origin).host === host) return true;
  } catch {
    return false;
  }
  return allowed.has(origin);
}

export function clientIp(request) {
  const h = request.headers;
  return (
    h.get('x-nf-client-connection-ip') ||
    h.get('x-real-ip') ||
    (h.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  );
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readConfig(env) {
  const cfg = {
    supabaseUrl: (env.SUPABASE_URL || '').replace(/\/+$/, ''),
    supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    bucket: env.SUPABASE_BUCKET || 'brief-files',
    table: env.SUPABASE_TABLE || 'briefs',
    resendKey: env.RESEND_API_KEY || '',
    resendUrl: (env.RESEND_API_URL || 'https://api.resend.com').replace(/\/+$/, ''),
    emailTo: String(env.BRIEF_EMAIL_TO || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    emailFrom: env.BRIEF_EMAIL_FROM || '',
    salt: env.IP_HASH_SALT || 'prodigi-brief',
    minFillSeconds: Number(env.MIN_FILL_SECONDS || 20),
    maxPerHour: Number(env.MAX_SUBMISSIONS_PER_HOUR || 5),
    maxUploadsPerHour: Number(env.MAX_UPLOADS_PER_HOUR || 40),
    linkDays: Number(env.FILE_LINK_DAYS || 30),
  };
  cfg.storageReady = Boolean(cfg.supabaseUrl && cfg.supabaseKey);
  cfg.emailReady = Boolean(cfg.resendKey && cfg.emailTo.length && cfg.emailFrom);
  return cfg;
}
