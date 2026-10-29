// Письмо команде Prodigi: разделы брифа в том же порядке, что и в анкете.
import { STEPS, CONTACTS } from '../public/js/config/brief.js';
import { getMessages, translate } from '../public/js/config/locales/index.js';
import { OTHER } from '../public/js/core/validate.js';

const ru = getMessages('ru');
const t = (key, params) => translate(ru, key, params);

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`;
}

// Значение поля → { text, html }
function render(field, value, fileLinks) {
  const empty = { text: '—', html: '<span style="color:#9a9a95">—</span>' };
  switch (field.type) {
    case 'choice': {
      if (!value.selected.length) return empty;
      const items = value.selected.map((id) =>
        id === OTHER ? `${t('common.other')}: ${value.other}` : t(`fields.${field.id}.options.${id}`),
      );
      return {
        text: items.map((i) => `• ${i}`).join('\n'),
        html: items.map((i) => `• ${esc(i)}`).join('<br>'),
      };
    }
    case 'links':
      if (!value.length) return empty;
      return {
        text: value.join('\n'),
        html: value.map((u) => `<a href="${esc(u)}" style="color:#0d0d0d">${esc(u)}</a>`).join('<br>'),
      };
    case 'files':
      if (!value.length) return empty;
      return {
        text: value.map((f) => `${f.name} (${formatSize(f.size)}): ${fileLinks[f.path] || 'ссылка недоступна'}`).join('\n'),
        html: value
          .map((f) =>
            fileLinks[f.path]
              ? `<a href="${esc(fileLinks[f.path])}" style="color:#0d0d0d">${esc(f.name)}</a> <span style="color:#7a7a76">· ${formatSize(f.size)}</span>`
              : `${esc(f.name)} <span style="color:#7a7a76">· ${formatSize(f.size)}</span>`,
          )
          .join('<br>'),
      };
    case 'url':
      if (!value) return empty;
      return { text: value, html: `<a href="${esc(value)}" style="color:#0d0d0d">${esc(value)}</a>` };
    default:
      if (!value) return empty;
      return { text: value, html: esc(value).replace(/\n/g, '<br>') };
  }
}

export function buildEmail({ id, answers, fileLinks, createdAt, linkDays }) {
  const brand = answers.company.replace(/[\r\n]+/g, ' ').slice(0, 120);
  const subject = t('email.subject', { brand });
  const date = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Moscow',
  }).format(createdAt);
  const meta = t('email.meta', { id: id.slice(0, 8).toUpperCase(), date: `${date} (МСК)` });

  const textParts = [t('email.heading'), meta, ''];
  const htmlSections = [];

  // Контакт — первым блоком, чтобы сразу было видно, кому отвечать.
  const contactRows = CONTACTS.questions[0].fields.map((f) => [t(`fields.${f.id}.label`), render(f, answers[f.id], fileLinks)]);
  textParts.push(`== ${t('email.contactTitle')} ==`);
  contactRows.forEach(([label, v]) => textParts.push(`${label}: ${v.text}`));
  textParts.push('');
  htmlSections.push(section(t('email.contactTitle'), null, contactRows));

  STEPS.forEach((step, i) => {
    const num = String(i + 1).padStart(2, '0');
    const title = t(`steps.${step.id}.title`);
    textParts.push(`== ${num}. ${title} ==`);
    const rows = [];
    for (const q of step.questions) {
      const qTitle = t(`questions.${q.id}.title`);
      textParts.push(`\n${qTitle}`);
      for (const f of q.fields) {
        const v = render(f, answers[f.id], fileLinks);
        const label = q.fields.length > 1 ? `${t(`fields.${f.id}.label`)}: ` : '';
        textParts.push(`${label}${v.text}`);
        rows.push([q.fields.length > 1 ? t(`fields.${f.id}.label`) : qTitle, v]);
      }
    }
    textParts.push('');
    htmlSections.push(section(title, num, rows));
  });

  const hasFiles = Object.keys(fileLinks).length > 0;
  if (hasFiles) textParts.push(t('email.filesNote', { days: linkDays }));
  textParts.push(t('email.replyHint'));

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f1;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#0d0d0d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f1"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="padding:28px 32px 8px;font-size:13px;letter-spacing:2px;font-weight:700">PRODIGI <span style="color:#7a7a76;font-weight:500">AGENCY</span></td></tr>
<tr><td style="padding:8px 32px 4px"><span style="display:inline-block;background:#b6f36b;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600">${esc(t('email.heading'))}</span></td></tr>
<tr><td style="padding:12px 32px 4px;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.5px">${esc(brand)}</td></tr>
<tr><td style="padding:4px 32px 20px;font-size:13px;color:#7a7a76">${esc(meta)}</td></tr>
${htmlSections.join('\n')}
<tr><td style="padding:20px 32px 28px;font-size:12px;color:#7a7a76;border-top:1px solid #e7e7e3">
${hasFiles ? `${esc(t('email.filesNote', { days: linkDays }))}<br>` : ''}${esc(t('email.replyHint'))}
</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, html, text: textParts.join('\n') };
}

function section(title, num, rows) {
  const head = `<tr><td style="padding:20px 32px 6px;border-top:1px solid #e7e7e3">
<span style="font-size:12px;font-weight:700;${num ? 'background:#b6f36b;border-radius:6px;padding:2px 7px;margin-right:8px' : ''}">${num ? esc(num) : ''}</span>
<span style="font-size:18px;font-weight:700">${esc(title)}</span></td></tr>`;
  const body = rows
    .map(
      ([label, v]) => `<tr><td style="padding:8px 32px">
<div style="font-size:12px;color:#7a7a76;margin-bottom:3px">${esc(label)}</div>
<div style="font-size:15px;line-height:1.5">${v.html}</div></td></tr>`,
    )
    .join('');
  return head + body + '<tr><td style="height:12px"></td></tr>';
}
