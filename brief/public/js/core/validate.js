// Проверка и нормализация ответов. Один и тот же код работает в браузере и на сервере,
// поэтому сервер не доверяет клиенту, но правила не расходятся.
import { SECTIONS, LIMITS, FILE_RULES, allFields } from '../config/brief.js';

export const OTHER = 'other';

const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/;
const TEL_RE = /^\+?[\d\s()\-.]{5,40}$/;

export function normalizeUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.') || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function fileExtension(name) {
  const match = /\.([a-z\d]{1,8})$/i.exec(String(name || ''));
  return match ? match[1].toLowerCase() : '';
}

export function emptyValue(field) {
  if (field.type === 'choice') return { selected: [], other: '' };
  if (field.type === 'links' || field.type === 'files') return [];
  return '';
}

export function isEmpty(field, value) {
  if (field.type === 'choice') return !value || !value.selected || value.selected.length === 0;
  if (field.type === 'links') return !Array.isArray(value) || value.every((v) => !String(v || '').trim());
  if (field.type === 'files') return !Array.isArray(value) || value.length === 0;
  return !String(value ?? '').trim();
}

const err = (key, params) => ({ key, params });

// Возвращает { value, error } — нормализованное значение поля и ошибку, если есть.
export function checkField(field, rawValue) {
  const limit = LIMITS[field.type];

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'tel': {
      const value = typeof rawValue === 'string' ? rawValue.trim() : '';
      if (!value) return { value: '', error: field.required ? err('errors.required') : null };
      if (value.length > limit) return { value, error: err('errors.tooLong', { max: limit }) };
      if (field.type === 'email' && !EMAIL_RE.test(value)) return { value, error: err('errors.email') };
      if (field.type === 'tel' && (!TEL_RE.test(value) || value.replace(/\D/g, '').length < 5)) {
        return { value, error: err('errors.tel') };
      }
      return { value, error: null };
    }

    case 'url': {
      const raw = typeof rawValue === 'string' ? rawValue.trim() : '';
      if (!raw) return { value: '', error: field.required ? err('errors.required') : null };
      if (raw.length > limit) return { value: raw, error: err('errors.tooLong', { max: limit }) };
      const url = normalizeUrl(raw);
      return url ? { value: url, error: null } : { value: raw, error: err('errors.url') };
    }

    case 'choice': {
      const allowed = new Set([...field.options, ...(field.other ? [OTHER] : [])]);
      const source = rawValue && Array.isArray(rawValue.selected) ? rawValue.selected : [];
      let selected = field.options.concat(OTHER).filter((id) => allowed.has(id) && source.includes(id));
      if (!field.multiple) selected = selected.slice(0, 1);
      const other = selected.includes(OTHER) && typeof rawValue.other === 'string' ? rawValue.other.trim() : '';
      const value = { selected, other };
      if (!selected.length) {
        return {
          value,
          error: field.required ? err(field.multiple ? 'errors.requiredChoice' : 'errors.requiredSingle') : null,
        };
      }
      if (selected.includes(OTHER) && !other) return { value, error: err('errors.otherRequired') };
      if (other.length > LIMITS.other) return { value, error: err('errors.tooLong', { max: LIMITS.other }) };
      return { value, error: null };
    }

    case 'links': {
      const list = (Array.isArray(rawValue) ? rawValue : [])
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean);
      if (!list.length) return { value: [], error: field.required ? err('errors.required') : null };
      if (list.length > LIMITS.links) return { value: list, error: err('errors.tooMany', { max: LIMITS.links }) };
      const value = [];
      for (const item of list) {
        const url = item.length <= LIMITS.url ? normalizeUrl(item) : null;
        if (!url) return { value: list, error: err('errors.url') };
        value.push(url);
      }
      return { value, error: null };
    }

    case 'files': {
      const list = (Array.isArray(rawValue) ? rawValue : []).filter(
        (f) => f && typeof f.path === 'string' && typeof f.name === 'string',
      );
      const value = list.slice(0, FILE_RULES.maxFiles).map((f) => ({
        path: f.path,
        name: f.name.slice(0, 200),
        size: Number(f.size) || 0,
      }));
      if (!value.length && field.required) return { value, error: err('errors.required') };
      if (list.length > FILE_RULES.maxFiles) {
        return { value, error: err('errors.tooMany', { max: FILE_RULES.maxFiles }) };
      }
      return { value, error: null };
    }

    default:
      return { value: null, error: null };
  }
}

// Ошибки одного раздела: { fieldId: { key, params } }
export function validateSection(section, answers) {
  const errors = {};
  for (const field of allFields(section)) {
    const { error } = checkField(field, answers[field.id]);
    if (error) errors[field.id] = error;
  }
  return errors;
}

// Полная проверка брифа: чистые ответы только с известными полями и ошибки по разделам.
export function sanitizeBrief(answers) {
  const clean = {};
  const errors = {};
  const source = answers && typeof answers === 'object' ? answers : {};
  for (const section of SECTIONS) {
    for (const field of allFields(section)) {
      const { value, error } = checkField(field, source[field.id]);
      clean[field.id] = value;
      if (error) {
        errors[section.id] = errors[section.id] || {};
        errors[section.id][field.id] = error;
      }
    }
  }
  return { clean, errors, valid: Object.keys(errors).length === 0 };
}
