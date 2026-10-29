import { STEPS, CONTACTS, SECTIONS, isQuestionOptional } from './config/brief.js';
import { LOCALES, DEFAULT_LOCALE, getMessages, translate } from './config/locales/index.js';
import { createStore } from './core/store.js';
import { validateSection, sanitizeBrief, checkField, isEmpty, OTHER } from './core/validate.js';
import { submitBrief } from './core/api.js';
import { h, icon, formatSize, prefersReducedMotion } from './ui/dom.js';
import { renderField, setFieldError, hasActiveUploads } from './ui/fields.js';

// ---------- язык ----------
function pickLocale() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && LOCALES[fromUrl]) return fromUrl;
  return DEFAULT_LOCALE;
}

let locale = pickLocale();
let messages = getMessages(locale);
const t = (key, params) => translate(messages, key, params);

// ---------- состояние ----------
const store = createStore({ locale, onSaved: flashSaved });
if (store.state.locale && LOCALES[store.state.locale] && !new URLSearchParams(location.search).get('lang')) {
  locale = store.state.locale;
  messages = getMessages(locale);
}

const view = document.getElementById('view');
const progressEl = document.getElementById('progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const savedEl = document.getElementById('saved');
const TOTAL = STEPS.length;
const CONTACTS_INDEX = TOTAL; // в maxStep: 0..5 — этапы, 6 — контакты, 7 — проверка

let savedTimer;
function flashSaved() {
  if (store.state.screen === 'welcome' || store.state.screen === 'success') return;
  savedEl.textContent = t('draft.saved');
  savedEl.classList.add('is-visible');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => savedEl.classList.remove('is-visible'), 2200);
}

function applyChrome() {
  document.documentElement.lang = messages.meta.lang;
  document.title = `${t('welcome.title')} · ${t('brand.name')} ${t('brand.suffix')}`;
  document.getElementById('brand-name').textContent = t('brand.name');
  document.getElementById('brand-suffix').textContent = t('brand.suffix');
  document.getElementById('brand-product').textContent = t('brand.product');
  progressEl.setAttribute('aria-label', t('progress.label'));

  const langBox = document.getElementById('lang');
  langBox.replaceChildren();
  const codes = Object.keys(LOCALES);
  if (codes.length > 1) {
    const select = h(
      'select',
      { class: 'lang', 'aria-label': 'Language' },
      codes.map((c) => h('option', { value: c, selected: c === locale }, LOCALES[c].meta.name)),
    );
    select.addEventListener('change', () => {
      locale = select.value;
      messages = getMessages(locale);
      store.update({ locale });
      applyChrome();
      render(false);
    });
    langBox.append(select);
  }
}

function setProgress(screen, step) {
  let value = 0;
  let text = '';
  if (screen === 'step') {
    value = step / TOTAL;
    text = t('progress.step', { n: step + 1, total: TOTAL });
  } else if (screen === 'contacts') {
    value = 0.94;
    text = t('progress.contacts');
  } else if (screen === 'review') {
    value = 1;
    text = t('progress.review');
  }
  const visible = screen !== 'welcome' && screen !== 'success';
  progressEl.hidden = !visible;
  progressText.hidden = !visible;
  progressFill.style.transform = `scaleX(${Math.max(value, 0.015)})`;
  progressEl.setAttribute('aria-valuenow', String(Math.round(value * 100)));
  progressText.textContent = text;
}

// ---------- навигация ----------
let navToken = 0;
function go(screen, step = store.state.step) {
  const maxStep = Math.max(
    store.state.maxStep,
    screen === 'step' ? step : screen === 'contacts' ? CONTACTS_INDEX : screen === 'review' ? CONTACTS_INDEX + 1 : 0,
  );
  const patch = { screen, step, maxStep };
  if (screen === 'review') patch.returnToReview = false;
  store.update(patch);
  render(true);
}

function render(animate) {
  const token = ++navToken;
  const { screen, step } = store.state;
  setProgress(screen, step);
  const build = () => {
    if (token !== navToken) return;
    let node;
    if (screen === 'step') node = renderSection(STEPS[step], step);
    else if (screen === 'contacts') node = renderSection(CONTACTS, CONTACTS_INDEX);
    else if (screen === 'review') node = renderReview();
    else if (screen === 'success') node = renderSuccess();
    else node = renderWelcome();
    view.replaceChildren(node);
    if (animate) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const heading = node.querySelector('[data-autofocus]');
      heading && heading.focus({ preventScroll: true });
    }
  };
  const old = view.firstElementChild;
  if (!animate || !old || prefersReducedMotion()) build();
  else {
    old.classList.add('is-leaving');
    setTimeout(build, 180);
  }
}

// ---------- приветствие ----------
function renderWelcome() {
  const draft = store.hasDraft();
  const start = () => {
    if (!store.state.startedAt) store.update({ startedAt: Date.now() });
    const last = store.state.lastScreen;
    if (draft && last && last !== 'welcome' && last !== 'success') go(last, store.state.step);
    else go('step', 0);
  };
  const restart = () => {
    if (!window.confirm(t('welcome.restartConfirm'))) return;
    store.reset();
    store.update({ startedAt: Date.now() });
    go('step', 0);
  };

  return h(
    'section',
    { class: 'screen screen--welcome' },
    h(
      'div',
      { class: 'welcome' },
      h('p', { class: 'eyebrow' }, h('span', { class: 'dot' }), t('welcome.eyebrow')),
      h('h1', { class: 'display', tabindex: '-1', 'data-autofocus': true }, t('welcome.title')),
      h('p', { class: 'welcome__lead' }, t('welcome.subtitle')),
      draft ? h('p', { class: 'welcome__draft' }, t('welcome.resumeNote')) : null,
      h(
        'div',
        { class: 'welcome__actions' },
        h(
          'button',
          { type: 'button', class: 'btn btn--primary btn--lg', onclick: start },
          h('span', null, draft ? t('welcome.resume') : t('welcome.start')),
          h('span', { class: 'btn__icon' }, icon('arrowRight')),
        ),
        draft ? h('button', { type: 'button', class: 'btn btn--ghost btn--lg', onclick: restart }, t('welcome.restart')) : null,
      ),
      h('ul', { class: 'welcome__facts' }, t('welcome.facts').map((f) => h('li', null, f))),
    ),
    h(
      'aside',
      { class: 'welcome__steps', 'aria-label': t('welcome.stepsTitle') },
      h('p', { class: 'welcome__steps-title' }, t('welcome.stepsTitle')),
      h(
        'ol',
        null,
        STEPS.map((s, i) =>
          h('li', null, h('span', { class: 'num' }, String(i + 1).padStart(2, '0')), h('span', null, t(`steps.${s.id}.title`))),
        ),
      ),
      h('p', { class: 'welcome__note' }, t('welcome.note')),
    ),
  );
}

// ---------- этап ----------
function stepNav(currentIndex, onJump) {
  const items = [...STEPS.map((s, i) => ({ index: i, title: t(`steps.${s.id}.title`) })), {
    index: CONTACTS_INDEX,
    title: t('steps.contacts.title'),
  }];
  return h(
    'nav',
    { class: 'step-nav', 'aria-label': t('nav.stepsLabel') },
    h(
      'ol',
      null,
      items.map((item) => {
        const reachable = item.index <= store.state.maxStep;
        const done = item.index < store.state.maxStep && item.index !== currentIndex;
        return h(
          'li',
          null,
          h(
            'button',
            {
              type: 'button',
              class: `step-nav__item${item.index === currentIndex ? ' is-current' : ''}${done ? ' is-done' : ''}`,
              'aria-current': item.index === currentIndex ? 'step' : null,
              disabled: !reachable || item.index === currentIndex,
              onclick: () => onJump(item.index),
            },
            h('span', { class: 'step-nav__num' }, done ? icon('check') : item.index < TOTAL ? String(item.index + 1) : '·'),
            h('span', { class: 'step-nav__title' }, item.title),
          ),
        );
      }),
    ),
  );
}

function renderSection(section, index) {
  const isContacts = section === CONTACTS;
  const state = store.state;
  const wrappers = new Map();

  const questions = section.questions.map((q) => {
    const optional = isQuestionOptional(q);
    const num = Number(q.id.replace(/\D/g, ''));
    const ctx = {
      t,
      get: (id) => store.state.answers[id],
      set: (id, value) => store.setAnswer(id, value),
      submissionId: state.submissionId,
      hideLabel: false,
      optionalTag: !optional,
    };
    const fields = q.fields.map((field) => {
      const el = renderField(field, { ...ctx, hideLabel: q.fields.length === 1 && field.type !== 'choice' });
      wrappers.set(field.id, el);
      return el;
    });
    const hint = t(`questions.${q.id}.hint`);
    const example = t(`questions.${q.id}.example`);
    return h(
      'div',
      { class: 'question', id: `q-${q.id}` },
      isContacts
        ? null
        : h(
            'div',
            { class: 'question__head' },
            h('span', { class: 'question__num' }, t('common.question', { n: num })),
            optional ? h('span', { class: 'tag' }, t('common.optional')) : null,
          ),
      h(isContacts ? 'h2' : 'h2', { class: 'question__title' }, t(`questions.${q.id}.title`)),
      hint ? h('p', { class: 'question__hint' }, hint) : null,
      example
        ? h('details', { class: 'example' }, h('summary', null, t('common.example')), h('p', null, example))
        : null,
      h('div', { class: `question__fields${isContacts ? ' question__fields--grid' : ''}` }, fields),
    );
  });

  const formError = h('div', { class: 'form-alert', role: 'alert', hidden: true });

  function showErrors(errors) {
    let first = null;
    for (const [id, wrap] of wrappers) {
      const e = errors[id];
      setFieldError(wrap, e ? t(e.key, e.params) : null);
      if (e && !first) first = wrap;
    }
    return first;
  }

  function validateHere() {
    if (hasActiveUploads()) {
      formError.hidden = false;
      formError.replaceChildren(icon('alert'), h('span', null, t('files.waitUploads')));
      return false;
    }
    const errors = validateSection(section, store.state.answers);
    const first = showErrors(errors);
    if (first) {
      formError.hidden = false;
      formError.replaceChildren(icon('alert'), h('span', null, t('errors.summary')));
      first.focusFirst ? first.focusFirst() : first.querySelector('input,textarea,button')?.focus();
      first.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      return false;
    }
    formError.hidden = true;
    return true;
  }

  const forward = () => {
    if (!validateHere()) return;
    if (store.state.returnToReview) go('review');
    else if (isContacts) go('review');
    else if (index < TOTAL - 1) go('step', index + 1);
    else go('contacts');
  };
  const back = () => {
    if (hasActiveUploads()) return validateHere();
    if (isContacts) go('step', TOTAL - 1);
    else if (index === 0) go('welcome');
    else go('step', index - 1);
  };
  const jump = (target) => {
    if (target > index && !validateHere()) return;
    if (target < index && hasActiveUploads()) return validateHere();
    if (target === CONTACTS_INDEX) go('contacts');
    else go('step', target);
  };

  const primaryLabel = store.state.returnToReview
    ? t('nav.backToReview')
    : isContacts
      ? t('nav.toReview')
      : index === TOTAL - 1
        ? t('nav.toContacts')
        : t('nav.next');

  const form = h(
    'form',
    {
      class: 'step-body',
      novalidate: true,
      onsubmit: (e) => {
        e.preventDefault();
        forward();
      },
    },
    questions,
    // Ловушка для ботов: люди это поле не видят и не заполняют.
    isContacts
      ? h(
          'div',
          { class: 'hp', 'aria-hidden': 'true' },
          h('label', { for: 'hp-company-site' }, 'Company site'),
          h('input', {
            id: 'hp-company-site',
            type: 'text',
            name: 'company_site',
            tabindex: '-1',
            autocomplete: 'off',
            oninput: (e) => (hp.value = e.target.value),
          }),
        )
      : null,
    formError,
    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        { type: 'button', class: 'btn btn--ghost', onclick: back, 'aria-label': t('nav.back') },
        h('span', { class: 'btn__icon btn__icon--left' }, icon('arrowLeft')),
        h('span', null, t('nav.back')),
      ),
      h(
        'button',
        { type: 'submit', class: 'btn btn--primary' },
        h('span', null, primaryLabel),
        h('span', { class: 'btn__icon' }, icon('arrowRight')),
      ),
    ),
  );

  return h(
    'section',
    { class: `screen screen--step${isContacts ? ' screen--contacts' : ''}` },
    h(
      'aside',
      { class: 'step-aside' },
      h(
        'p',
        { class: 'step-count' },
        isContacts
          ? h('span', { class: 'step-count__label' }, t('progress.contacts'))
          : [h('span', { class: 'step-count__now' }, String(index + 1).padStart(2, '0')), h('span', { class: 'step-count__total' }, `/${String(TOTAL).padStart(2, '0')}`)],
      ),
      h('h1', { class: 'step-title', tabindex: '-1', 'data-autofocus': true }, t(`steps.${section.id}.title`)),
      h('p', { class: 'step-lead' }, t(`steps.${section.id}.lead`)),
      stepNav(index, jump),
    ),
    form,
  );
}

const hp = { value: '' };

// ---------- проверка ----------
function displayValue(field, value) {
  const { value: v } = checkField(field, value);
  if (isEmpty(field, v)) return h('span', { class: 'muted' }, t('common.empty'));
  switch (field.type) {
    case 'choice':
      return h(
        'ul',
        { class: 'chips' },
        v.selected.map((id) =>
          h('li', null, id === OTHER ? `${t('common.other')}: ${v.other}` : t(`fields.${field.id}.options.${id}`)),
        ),
      );
    case 'links':
      return h(
        'ul',
        { class: 'review-links' },
        v.map((url) => h('li', null, h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, url))),
      );
    case 'files':
      return h('ul', { class: 'review-links' }, v.map((f) => h('li', null, `${f.name} · ${formatSize(f.size)}`)));
    case 'url':
      return h('a', { href: v, target: '_blank', rel: 'noopener noreferrer' }, v);
    default:
      return h('span', { class: 'pre' }, v);
  }
}

function renderReview() {
  const answers = store.state.answers;
  const { errors } = sanitizeBrief(answers);
  const alertBox = h('div', { class: 'form-alert form-alert--submit', role: 'alert', hidden: true });

  const editSection = (section, i) => {
    store.update({ returnToReview: true });
    if (section === CONTACTS) go('contacts');
    else go('step', i);
  };

  const cards = SECTIONS.map((section, i) => {
    const invalid = Boolean(errors[section.id]);
    const rows = section.questions.flatMap((q) =>
      q.fields.map((field) =>
        h(
          'div',
          { class: 'review-row' },
          h('dt', null, t(`fields.${field.id}.label`)),
          h('dd', null, displayValue(field, answers[field.id])),
        ),
      ),
    );
    return h(
      'article',
      { class: `review-card${invalid ? ' is-invalid' : ''}`, dataset: { section: section.id } },
      h(
        'header',
        { class: 'review-card__head' },
        h('span', { class: 'review-card__num' }, section === CONTACTS ? '—' : String(i + 1).padStart(2, '0')),
        h('h2', null, t(`steps.${section.id}.title`)),
        invalid ? h('span', { class: 'tag tag--error' }, t('errors.summary')) : null,
        h(
          'button',
          {
            type: 'button',
            class: 'btn-text',
            onclick: () => editSection(section, i),
            'aria-label': `${t('review.edit')}: ${t(`steps.${section.id}.title`)}`,
          },
          t('review.edit'),
        ),
      ),
      h('dl', null, rows),
    );
  });

  const submitBtn = h(
    'button',
    { type: 'button', class: 'btn btn--accent btn--lg' },
    h('span', { class: 'btn__label' }, t('nav.submit')),
    h('span', { class: 'btn__icon' }, icon('arrowRight')),
  );

  function showSubmitError(text, retry) {
    alertBox.hidden = false;
    alertBox.replaceChildren(
      icon('alert'),
      h('div', null, h('strong', null, t('submit.errorTitle')), h('p', null, text)),
    );
    if (retry) submitBtn.querySelector('.btn__label').textContent = t('submit.retry');
    alertBox.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  submitBtn.addEventListener('click', async () => {
    const check = sanitizeBrief(store.state.answers);
    if (!check.valid) {
      for (const card of cards) card.classList.toggle('is-invalid', Boolean(check.errors[card.dataset.section]));
      showSubmitError(t('submit.errorValidation'));
      return;
    }
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.querySelector('.btn__label').textContent = t('nav.sending');
    alertBox.hidden = true;
    try {
      const res = await submitBrief({
        submissionId: store.state.submissionId,
        locale,
        startedAt: store.state.startedAt,
        hp: hp.value,
        answers: check.clean,
      });
      store.clearDraft();
      store.state.resultId = res.id;
      store.state.screen = 'success';
      render(true);
    } catch (e) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      submitBtn.querySelector('.btn__label').textContent = t('submit.retry');
      const map = {
        network: 'submit.errorNetwork',
        not_configured: 'submit.errorConfig',
        rate_limited: 'submit.errorRate',
        too_fast: 'submit.errorTooFast',
        validation: 'submit.errorValidation',
      };
      if (e.code === 'validation' && e.details) {
        for (const card of cards) card.classList.toggle('is-invalid', Boolean(e.details[card.dataset.section]));
      }
      showSubmitError(t(map[e.code] || 'submit.errorServer'), true);
    }
  });

  return h(
    'section',
    { class: 'screen screen--review' },
    h(
      'header',
      { class: 'review-head' },
      h('p', { class: 'eyebrow' }, h('span', { class: 'dot' }), t('review.eyebrow')),
      h('h1', { class: 'display display--md', tabindex: '-1', 'data-autofocus': true }, t('review.title')),
      h('p', { class: 'welcome__lead' }, t('review.lead')),
    ),
    h('div', { class: 'review-list' }, cards),
    h(
      'div',
      { class: 'submit-box' },
      alertBox,
      h('p', { class: 'submit-box__consent' }, t('review.consent')),
      h(
        'div',
        { class: 'actions actions--review' },
        h(
          'button',
          { type: 'button', class: 'btn btn--ghost', onclick: () => go('contacts'), 'aria-label': t('nav.back') },
          h('span', { class: 'btn__icon btn__icon--left' }, icon('arrowLeft')),
          h('span', null, t('nav.back')),
        ),
        submitBtn,
      ),
    ),
  );
}

// ---------- финал ----------
function renderSuccess() {
  const id = store.state.resultId || store.state.submissionId;
  return h(
    'section',
    { class: 'screen screen--success' },
    h('div', {
      class: 'success-mark',
      html:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="success-mark__ring" cx="60" cy="60" r="54"/><circle class="success-mark__fill" cx="60" cy="60" r="44"/><path class="success-mark__check" d="M41 61.5l12.5 12.5L80 47.5"/></svg>',
    }),
    h('h1', { class: 'display display--md', tabindex: '-1', 'data-autofocus': true }, t('success.title')),
    h('p', { class: 'welcome__lead' }, t('success.text')),
    h('p', { class: 'success-id' }, `${t('success.number')}: `, h('code', null, id.slice(0, 8).toUpperCase())),
    h(
      'button',
      {
        type: 'button',
        class: 'btn-text',
        onclick: () => {
          store.reset();
          go('welcome');
        },
      },
      t('success.again'),
    ),
  );
}

// Предупреждаем, если идёт загрузка файла и вкладку закрывают.
window.addEventListener('beforeunload', (e) => {
  if (hasActiveUploads()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

applyChrome();
render(false);
