import ru from './ru.js';

// Чтобы добавить язык: import hy from './hy.js'; и добавить его в LOCALES.
// Переключатель языка появится в интерфейсе сам, когда языков станет больше одного.
export const LOCALES = { ru };
export const DEFAULT_LOCALE = 'ru';

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
