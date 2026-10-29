// Компоненты полей. Каждый получает описание поля из config/brief.js и контекст:
// ctx = { t, get(id), set(id, value), submissionId, hideLabel, optionalTag }
import { h, icon, formatSize } from './dom.js';
import { FILE_RULES, LIMITS } from '../config/brief.js';
import { OTHER, emptyValue, fileExtension } from '../core/validate.js';
import { uploadFile } from '../core/api.js';

const fieldId = (id) => `f-${id}`;
const errorId = (id) => `e-${id}`;

function label(field, ctx, forId) {
  return h(
    'label',
    { class: `field__label${ctx.hideLabel ? ' sr-only' : ''}`, for: forId },
    ctx.t(`fields.${field.id}.label`),
    ctx.optionalTag && !field.required ? h('span', { class: 'tag' }, ctx.t('common.optional')) : null,
  );
}

function wrapper(field, ...children) {
  return h(
    'div',
    { class: `field field--${field.type}`, dataset: { field: field.id } },
    ...children,
    h('p', { class: 'field__error', id: errorId(field.id), hidden: true, 'aria-live': 'polite' }),
  );
}

export function setFieldError(wrap, message) {
  const box = wrap.querySelector(`:scope > .field__error`);
  wrap.classList.toggle('has-error', Boolean(message));
  box.hidden = !message;
  box.replaceChildren(...(message ? [icon('alert'), h('span', null, message)] : []));
  for (const input of wrap.querySelectorAll('[data-control]')) {
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
}

function clearErrorOnInput(wrap) {
  wrap.addEventListener('input', () => wrap.classList.contains('has-error') && setFieldError(wrap, null));
  wrap.addEventListener('change', () => wrap.classList.contains('has-error') && setFieldError(wrap, null));
}

export function autosize(el) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight + 2}px`;
}

function textInput(field, ctx) {
  const id = fieldId(field.id);
  const common = {
    id,
    class: 'input',
    name: field.id,
    'data-control': true,
    'aria-describedby': errorId(field.id),
    'aria-required': field.required ? 'true' : null,
    placeholder: ctx.t(`fields.${field.id}.placeholder`) || null,
    autocomplete: field.autocomplete || 'off',
  };
  let input;
  if (field.type === 'textarea') {
    input = h('textarea', { ...common, rows: 4, maxlength: LIMITS.textarea });
    input.value = ctx.get(field.id) || '';
    input.addEventListener('input', () => autosize(input));
    requestAnimationFrame(() => autosize(input));
  } else {
    const typeMap = { text: 'text', email: 'email', tel: 'tel', url: 'text' };
    input = h('input', {
      ...common,
      type: typeMap[field.type],
      inputmode: field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : null,
      maxlength: LIMITS[field.type],
      spellcheck: field.type === 'text' ? null : 'false',
      autocapitalize: field.type === 'text' ? null : 'off',
    });
    input.value = ctx.get(field.id) || '';
  }
  input.addEventListener('input', () => ctx.set(field.id, input.value));
  const wrap = wrapper(field, label(field, ctx, id), input);
  clearErrorOnInput(wrap);
  wrap.focusFirst = () => input.focus();
  return wrap;
}

function choiceInput(field, ctx) {
  const value = { ...emptyValue(field), ...(ctx.get(field.id) || {}) };
  value.selected = [...(value.selected || [])];
  const type = field.multiple ? 'checkbox' : 'radio';
  const options = field.options.map((opt) => ({ id: opt, text: ctx.t(`fields.${field.id}.options.${opt}`) }));
  if (field.other) options.push({ id: OTHER, text: ctx.t('common.other') });

  const otherInput = h('input', {
    class: 'input',
    type: 'text',
    id: `${fieldId(field.id)}-other-text`,
    maxlength: LIMITS.other,
    placeholder: ctx.t('common.otherPlaceholder'),
    'aria-label': `${ctx.t('common.other')}: ${ctx.t('common.otherPlaceholder')}`,
    'data-control': true,
  });
  otherInput.value = value.other || '';
  const otherBox = h('div', { class: 'other-field' }, otherInput);

  const cards = options.map((opt, i) => {
    const input = h('input', {
      type,
      class: 'card__input',
      name: field.id,
      value: opt.id,
      id: `${fieldId(field.id)}-${opt.id}`,
      'data-control': i === 0 ? true : null,
    });
    input.checked = value.selected.includes(opt.id);
    const card = h(
      'label',
      { class: `card${opt.id === OTHER ? ' card--other' : ''}`, for: input.id },
      input,
      h('span', { class: 'card__text' }, opt.text),
      h('span', { class: `card__mark card__mark--${type}`, html: '' }, icon('check')),
    );
    input.addEventListener('change', () => {
      if (field.multiple) {
        value.selected = options.map((o) => o.id).filter((oid) => fieldset.querySelector(`input[value="${oid}"]`).checked);
      } else {
        value.selected = [input.value];
      }
      sync();
      ctx.set(field.id, { ...value, selected: [...value.selected] });
      if (opt.id === OTHER && input.checked) requestAnimationFrame(() => otherInput.focus());
    });
    return card;
  });

  otherInput.addEventListener('input', () => {
    value.other = otherInput.value;
    ctx.set(field.id, { ...value, selected: [...value.selected] });
  });

  const fieldset = h(
    'fieldset',
    { class: 'choice', 'aria-describedby': errorId(field.id), role: field.multiple ? 'group' : 'radiogroup' },
    h('legend', { class: 'sr-only' }, ctx.t(`fields.${field.id}.label`)),
    h('div', { class: `cards${field.multiple ? '' : ' cards--single'}` }, cards),
    otherBox,
  );

  function sync() {
    for (const card of cards) card.classList.toggle('is-selected', card.querySelector('input').checked);
    const showOther = value.selected.includes(OTHER);
    otherBox.classList.toggle('is-open', showOther);
    otherInput.tabIndex = showOther ? 0 : -1;
    otherBox.setAttribute('aria-hidden', showOther ? 'false' : 'true');
  }
  sync();

  const wrap = wrapper(field, fieldset);
  clearErrorOnInput(wrap);
  wrap.focusFirst = () => {
    if (value.selected.includes(OTHER) && !otherInput.value.trim()) otherInput.focus();
    else fieldset.querySelector('input').focus();
  };
  return wrap;
}

function linksInput(field, ctx) {
  let items = [...(ctx.get(field.id) || [])];
  if (!items.length) items = [''];
  const list = h('div', { class: 'links' });
  const addBtn = h(
    'button',
    { type: 'button', class: 'btn-text', onclick: () => addRow('', true) },
    icon('plus'),
    ctx.t(`fields.${field.id}.add`),
  );

  const commit = () => {
    items = [...list.querySelectorAll('input')].map((i) => i.value);
    ctx.set(
      field.id,
      items.filter((v) => v.trim()),
    );
    addBtn.hidden = items.length >= LIMITS.links;
  };

  function addRow(val, focus) {
    const input = h('input', {
      class: 'input',
      type: 'text',
      inputmode: 'url',
      spellcheck: 'false',
      autocapitalize: 'off',
      maxlength: LIMITS.url,
      placeholder: ctx.t('links.placeholder'),
      'aria-label': ctx.t(`fields.${field.id}.label`),
      'aria-describedby': errorId(field.id),
      'data-control': true,
    });
    input.value = val;
    input.addEventListener('input', commit);
    const row = h(
      'div',
      { class: 'links__row' },
      input,
      h(
        'button',
        {
          type: 'button',
          class: 'icon-btn',
          'aria-label': ctx.t('links.remove'),
          onclick: () => {
            if (list.children.length > 1) row.remove();
            else input.value = '';
            commit();
            (list.querySelector('input') || addBtn).focus();
          },
        },
        icon('close'),
      ),
    );
    list.append(row);
    if (focus) input.focus();
    commit();
  }

  const header = h('p', { class: 'field__label' }, ctx.t(`fields.${field.id}.label`),
    ctx.optionalTag && !field.required ? h('span', { class: 'tag' }, ctx.t('common.optional')) : null);
  const wrap = wrapper(field, header, list, addBtn);
  items.forEach((v) => addRow(v, false));
  clearErrorOnInput(wrap);
  wrap.focusFirst = () => list.querySelector('input').focus();
  return wrap;
}

// Загрузки в процессе — приложение не даёт уйти с этапа, пока они не закончатся.
const activeUploads = new Set();
export const hasActiveUploads = () => activeUploads.size > 0;

function filesInput(field, ctx) {
  const done = () => [...(ctx.get(field.id) || [])];
  const id = fieldId(field.id);
  const input = h('input', {
    type: 'file',
    id,
    class: 'sr-only',
    multiple: true,
    accept: Object.keys(FILE_RULES.types).map((e) => `.${e}`).join(','),
    'aria-describedby': `${id}-rules ${errorId(field.id)}`,
    'data-control': true,
  });
  const list = h('ul', { class: 'files', 'aria-live': 'polite' });
  const zone = h(
    'label',
    { class: 'dropzone', for: id },
    icon('upload'),
    h('span', { class: 'dropzone__text' }, ctx.t('files.drop'), ' ', h('u', null, ctx.t('files.choose'))),
    h('span', { class: 'dropzone__rules', id: `${id}-rules` }, ctx.t('files.rules'), ' ', ctx.t('files.bigFiles')),
  );

  function renderDone(file) {
    const item = h(
      'li',
      { class: 'file is-done' },
      icon('file'),
      h('span', { class: 'file__name' }, file.name),
      h('span', { class: 'file__meta' }, formatSize(file.size)),
      h(
        'button',
        {
          type: 'button',
          class: 'icon-btn',
          'aria-label': `${ctx.t('files.remove')}: ${file.name}`,
          onclick: () => {
            ctx.set(field.id, done().filter((f) => f.path !== file.path));
            item.remove();
            zone.focus();
          },
        },
        icon('close'),
      ),
    );
    return item;
  }

  function startUpload(file, item) {
    const bar = h('span', { class: 'file__bar' }, h('span'));
    const meta = h('span', { class: 'file__meta' }, ctx.t('files.uploading'));
    const fresh = h('li', { class: 'file is-uploading' }, icon('file'), h('span', { class: 'file__name' }, file.name), meta, bar);
    if (item) item.replaceWith(fresh);
    else list.append(fresh);
    const task = uploadFile(file, ctx.submissionId, (p) => {
      bar.firstChild.style.width = `${Math.round(p * 100)}%`;
    });
    activeUploads.add(task);
    task
      .then((saved) => {
        ctx.set(field.id, [...done(), saved]);
        fresh.replaceWith(renderDone(saved));
      })
      .catch((e) => {
        const msg = e.code === 'not_configured' ? ctx.t('files.errorUnavailable') : ctx.t('files.errorUpload');
        const failed = h(
          'li',
          { class: 'file is-error' },
          icon('alert'),
          h('span', { class: 'file__name' }, file.name),
          h('span', { class: 'file__meta' }, msg),
          e.code === 'not_configured'
            ? null
            : h('button', { type: 'button', class: 'btn-text', onclick: () => startUpload(file, failed) }, ctx.t('files.retry')),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': ctx.t('files.remove'), onclick: () => failed.remove() }, icon('close')),
        );
        fresh.replaceWith(failed);
      })
      .finally(() => activeUploads.delete(task));
  }

  function addFiles(fileList) {
    for (const file of fileList) {
      const ext = fileExtension(file.name);
      let problem = null;
      if (!FILE_RULES.types[ext]) problem = ctx.t('files.errorType');
      else if (file.size > FILE_RULES.maxSize) problem = ctx.t('files.errorSize');
      else if (done().length + list.querySelectorAll('.is-uploading').length >= FILE_RULES.maxFiles) {
        problem = ctx.t('files.errorCount');
      }
      if (problem) {
        const bad = h(
          'li',
          { class: 'file is-error' },
          icon('alert'),
          h('span', { class: 'file__name' }, file.name),
          h('span', { class: 'file__meta' }, problem),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': ctx.t('files.remove'), onclick: () => bad.remove() }, icon('close')),
        );
        list.append(bad);
        continue;
      }
      startUpload(file);
    }
  }

  input.addEventListener('change', () => {
    addFiles([...input.files]);
    input.value = '';
  });
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('is-drag');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-drag'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('is-drag');
    addFiles([...(e.dataTransfer?.files || [])]);
  });
  zone.tabIndex = 0;
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  done().forEach((f) => list.append(renderDone(f)));
  const header = h('p', { class: 'field__label' }, ctx.t(`fields.${field.id}.label`),
    ctx.optionalTag && !field.required ? h('span', { class: 'tag' }, ctx.t('common.optional')) : null);
  const wrap = wrapper(field, header, input, zone, list);
  wrap.focusFirst = () => zone.focus();
  return wrap;
}

const RENDERERS = {
  text: textInput,
  textarea: textInput,
  url: textInput,
  email: textInput,
  tel: textInput,
  choice: choiceInput,
  links: linksInput,
  files: filesInput,
};

export function renderField(field, ctx) {
  return RENDERERS[field.type](field, ctx);
}
