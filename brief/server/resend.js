// Отправка письма через Resend (https://resend.com). Ключ хранится только в переменных окружения.
import { ServiceError } from './supabase.js';

export async function sendEmail(cfg, { subject, html, text, replyTo, idempotencyKey }) {
  const res = await fetch(`${cfg.resendUrl}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.resendKey}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: cfg.emailFrom,
      to: cfg.emailTo,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new ServiceError('resend', res.status, body);
  try {
    return JSON.parse(body).id || null;
  } catch {
    return null;
  }
}
