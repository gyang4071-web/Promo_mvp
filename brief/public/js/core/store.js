// Состояние брифа и черновик в localStorage.
import { BRIEF_VERSION } from '../config/brief.js';

const DRAFT_KEY = 'prodigi-brief-draft';
const SAVE_DELAY = 400;

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function blank(locale) {
  return {
    version: BRIEF_VERSION,
    locale,
    submissionId: newId(),
    startedAt: null,
    screen: 'welcome', // welcome | step | contacts | review | success
    step: 0,
    maxStep: 0,
    answers: {},
  };
}

export function createStore({ locale, onSaved }) {
  let state = blank(locale);
  let timer = null;
  let hasDraft = false;

  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (saved && saved.version === BRIEF_VERSION && saved.submissionId) {
      state = { ...state, ...saved, screen: 'welcome' };
      hasDraft = Boolean(saved.startedAt);
      state.lastScreen = saved.screen;
    }
  } catch {
    // Хранилище недоступно (приватный режим) — работаем без черновика.
  }

  function persist() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const { lastScreen, ...rest } = state;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
        onSaved && onSaved();
      } catch {
        /* без черновика */
      }
    }, SAVE_DELAY);
  }

  return {
    get state() {
      return state;
    },
    hasDraft: () => hasDraft,
    setAnswer(fieldId, value) {
      state.answers[fieldId] = value;
      persist();
    },
    update(patch) {
      Object.assign(state, patch);
      persist();
    },
    reset() {
      clearTimeout(timer);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ничего */
      }
      state = blank(state.locale);
      hasDraft = false;
    },
    clearDraft() {
      clearTimeout(timer);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ничего */
      }
      hasDraft = false;
    },
  };
}
