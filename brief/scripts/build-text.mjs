// Собирает public/content.html — весь бриф простым текстом (без JavaScript),
// чтобы его могли прочитать люди без браузера и ИИ-ассистенты (ChatGPT и др.).
// Запуск: npm run build:text — после любых правок вопросов или текстов.
import { writeFileSync } from 'node:fs';
import { STEPS, isQuestionOptional } from '../public/js/config/brief.js';
import { LOCALES, translate } from '../public/js/config/locales/index.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function section(code) {
  const m = LOCALES[code];
  const t = (k, p) => translate(m, k, p);
  const out = [`<section lang="${m.meta.lang}">`, `<h1>${esc(t('welcome.title'))} — ${esc(m.meta.name)}</h1>`];
  out.push(`<p>${esc(t('welcome.subtitle'))}</p>`, `<p><em>${esc(t('welcome.note'))}</em></p>`);
  STEPS.forEach((step, i) => {
    out.push(`<h2>${i + 1}. ${esc(t(`steps.${step.id}.title`))}</h2>`, `<p>${esc(t(`steps.${step.id}.lead`))}</p>`);
    for (const q of step.questions) {
      const n = q.id.replace(/\D/g, '');
      const opt = isQuestionOptional(q) ? ` (${esc(t('common.optional'))})` : '';
      out.push(`<h3>${esc(t('common.question', { n }))}. ${esc(t(`questions.${q.id}.title`))}${opt}</h3>`);
      const hint = t(`questions.${q.id}.hint`);
      if (hint) out.push(`<p>${esc(hint)}</p>`);
      out.push('<ul>');
      for (const f of q.fields) {
        const req = f.required ? t('common.required') : t('common.optional');
        let line = `<li><strong>${esc(t(`fields.${f.id}.label`))}</strong> — ${esc(req)}`;
        if (f.type === 'choice') {
          const opts = f.options.map((o) => t(`fields.${f.id}.options.${o}`));
          if (f.other) opts.push(t('common.other'));
          line += `<ul>${opts.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>`;
        }
        out.push(`${line}</li>`);
      }
      out.push('</ul>');
      const ex = t(`questions.${q.id}.example`);
      if (ex) out.push(`<p><strong>${esc(t('common.example'))}:</strong> ${esc(ex)}</p>`);
    }
  });
  out.push(`<h2>${esc(t('review.title'))}</h2>`, `<p>${esc(t('review.lead'))}</p>`);
  out.push(`<h2>${esc(t('success.title'))}</h2>`, `<p>${esc(t('success.text'))}</p>`, '</section>');
  return out.join('\n');
}

const html = `<!doctype html>
<html lang="hy">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Promo Experience — текст брифа / բրիֆի տեքստը</title>
<link rel="stylesheet" href="/css/content.css">
</head>
<body>
<p>PRODIGI AGENCY · Promo Experience. Интерактивная версия: <a href="/">prodigi-brief.netlify.app</a></p>
${Object.keys(LOCALES).map(section).join('\n')}
</body>
</html>
`;

writeFileSync(new URL('../public/content.html', import.meta.url), html);
console.log('public/content.html готов');
