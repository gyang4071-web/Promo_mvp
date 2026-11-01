import hy from './hy.js';
import ru from './ru.js';

// Чтобы добавить язык: import en from './en.js'; и добавить его в LOCALES.
// Переключатель языка показывается сам, когда языков больше одного. Порядок здесь = порядок в переключателе.
export const LOCALES = { hy, ru };
export const DEFAULT_LOCALE = 'hy';

export function getMessages(locale) {
  return LOCALES[locale] || LOCALES[DEFAULT_LOCALE];
}

// t(messages, 'errors.tooLong', { max: 200 })
export function translate(messages, key, params) {
  let value = key.split('.').reduce((obj, part) => (obj == null ? obj : obj[part]), messages);
  if (value == null && messages !== LOCALES[DEFAULT_LOCALE]) {
    value = translate(LOCALES[DEFAULT_LOCALE], key);
  }
  if (typeof value !== 'string') return value ?? '';
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}
