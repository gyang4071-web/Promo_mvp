import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startMock } from './mock-services.mjs';
import { handleSubmit } from '../server/submit.js';
import { handleUploadUrl } from '../server/upload-url.js';
import { sanitizeBrief } from '../public/js/core/validate.js';

let mock;
before(async () => (mock = await startMock()));
after(() => mock.close());

const ID = '3f1c2b4a-5d6e-4f70-8a91-b2c3d4e5f607';

function answers(extra = {}) {
  return {
    company: 'Альфа Форекс',
    product: 'Брокерский счёт\nдля новичков',
    website: 'alfaforex.ru',
    advantages: 'Низкие комиссии <b>и</b> поддержка',
    goals: { selected: ['introduce', 'other'], other: 'Повысить доверие' },
    keyMessage: 'Начать просто',
    audience: 'Новички 25–40',
    barriers: 'Страх потерять деньги',
    features: 'Демо-счёт',
    facts: '',
    factLinks: ['https://example.com/research', ''],
    cta: { selected: ['signup'], other: '' },
    landingUrl: '',
    offer: '',
    materials: { selected: ['brandbook'], other: '' },
    materialFiles: [],
    materialLinks: [],
    restrictions: '',
    name: 'Анна Смирнова',
    position: '',
    email: 'anna@alfa.example',
    phone: '+7 900 000-00-00',
    ...extra,
  };
}

function req(path, body, headers = {}) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'localhost', 'x-forwarded-for': '10.0.0.1', ...headers },
    body: JSON.stringify(body),
  });
}

const payload = (extra = {}) => ({
  submissionId: ID,
  locale: 'ru',
  startedAt: Date.now() - 5 * 60_000,
  hp: '',
  answers: answers(),
  ...extra,
});

test('валидация: обязательные поля и форматы', () => {
  const r = sanitizeBrief(answers({ company: ' ', email: 'not-an-email', website: 'javascript:alert(1)' }));
  assert.equal(r.valid, false);
  assert.deepEqual(Object.keys(r.errors.brand).sort(), ['company', 'website']);
  assert.ok(r.errors.contacts.email);
  const ok = sanitizeBrief(answers());
  assert.equal(ok.valid, true);
  assert.equal(ok.clean.website, 'https://alfaforex.ru/');
  assert.deepEqual(ok.clean.factLinks, ['https://example.com/research']);
});

test('без настроек сервер честно отвечает not_configured', async () => {
  const res = await handleSubmit(req('/api/submit', payload()), {});
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'not_configured');
});

test('антиспам: скрытое поле и слишком быстрая отправка', async () => {
  let res = await handleSubmit(req('/api/submit', payload({ hp: 'spam' })), mock.env);
  assert.equal(res.status, 400);
  res = await handleSubmit(req('/api/submit', payload({ startedAt: Date.now() - 2000 })), mock.env);
  assert.equal((await res.json()).error, 'too_fast');
  assert.equal(mock.state.emails.length, 0);
});

test('чужой сайт не может отправить бриф', async () => {
  const res = await handleSubmit(req('/api/submit', payload(), { origin: 'https://evil.example' }), mock.env);
  assert.equal(res.status, 403);
});

test('невалидные ответы отклоняются на сервере', async () => {
  const res = await handleSubmit(req('/api/submit', payload({ answers: answers({ company: '' }) })), mock.env);
  assert.equal(res.status, 422);
  assert.deepEqual((await res.json()).details, { brand: ['company'] });
});

test('ошибка почты: клиент получает ошибку, бриф сохранён со статусом failed', async () => {
  mock.state.failEmail = true;
  const res = await handleSubmit(req('/api/submit', payload()), mock.env);
  assert.equal(res.status, 502);
  assert.equal((await res.json()).error, 'email_failed');
  assert.equal(mock.state.briefs.get(ID).email_status, 'failed');
  mock.state.failEmail = false;
});

test('загрузка файла и успешная отправка с письмом', async () => {
  // Файл неподходящего типа
  let res = await handleUploadUrl(req('/api/upload-url', { submissionId: ID, name: 'virus.exe', size: 10 }), mock.env);
  assert.equal((await res.json()).error, 'bad_type');

  res = await handleUploadUrl(req('/api/upload-url', { submissionId: ID, name: 'Брендбук 2026.pdf', size: 4 }), mock.env);
  const ticket = await res.json();
  assert.equal(ticket.ok, true);
  assert.match(ticket.path, new RegExp(`^${ID}/[0-9a-f]{12}-[\\w.-]+\\.pdf$`));
  assert.equal(ticket.contentType, 'application/pdf');
  const put = await fetch(ticket.uploadUrl, { method: 'PUT', headers: { 'content-type': 'application/pdf' }, body: 'test' });
  assert.equal(put.status, 200);

  const files = [
    { path: ticket.path, name: 'Брендбук 2026.pdf', size: 999 },
    { path: `${ID}/missing.pdf`, name: 'нет такого', size: 1 },
    { path: 'other-id/x.pdf', name: 'чужой', size: 1 },
  ];
  res = await handleSubmit(req('/api/submit', payload({ answers: answers({ materialFiles: files }) })), mock.env);
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.deepEqual(body, { ok: true, id: ID });

  const row = mock.state.briefs.get(ID);
  assert.equal(row.email_status, 'sent');
  assert.equal(row.files.length, 1);
  assert.equal(row.files[0].size, 4);

  const email = mock.state.emails.at(-1);
  assert.equal(email.subject, 'Новый бриф Promo Experience — Альфа Форекс');
  assert.deepEqual(email.to, ['team@prodigi.test']);
  assert.equal(email.reply_to, 'anna@alfa.example');
  assert.ok(email.html.includes('Низкие комиссии &lt;b&gt;и&lt;/b&gt; поддержка'), 'HTML экранирован');
  assert.ok(email.html.includes('/storage/v1/object/sign/brief-files/'), 'есть ссылка на файл');
  assert.ok(email.text.includes('Анна Смирнова'));
  assert.ok(email.text.includes('Другое: Повысить доверие'));
});

test('повторная отправка того же брифа не дублирует письмо', async () => {
  const before = mock.state.emails.length;
  const res = await handleSubmit(req('/api/submit', payload()), mock.env);
  assert.equal(res.status, 200);
  assert.equal(mock.state.emails.length, before);
});

test('ограничение частоты отправок с одного IP', async () => {
  const env = { ...mock.env, MAX_SUBMISSIONS_PER_HOUR: '1' };
  const res = await handleSubmit(
    req('/api/submit', payload({ submissionId: '9a1c2b4a-5d6e-4f70-8a91-b2c3d4e5f607' })),
    env,
  );
  assert.equal(res.status, 429);
});
