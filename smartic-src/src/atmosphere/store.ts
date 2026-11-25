/**
 * Global atmosphere store (framework-free).
 *
 * - value 0–100 is the single source of truth for lighting.
 * - Every change writes CSS custom properties on <html> directly, so the
 *   whole page re-themes without React re-rendering 60 times a second.
 * - The 3D knob registers itself as the "driver": requests from the slider,
 *   keyboard or presets are handed to it so the physical knob animates to
 *   the target. Without a driver the store eases the value itself.
 */
import { evaluatePalette, rgbToCss, rgbToHex, type Palette } from './palette';

export type Source = 'knob' | 'slider' | 'keyboard' | 'init' | 'tween';
type Listener = (p: Palette, source: Source) => void;

const STORAGE_KEY = 'smartic.atmosphere';
const DEFAULT_VALUE = 8; // a warm evening is the campaign's signature look

function readStored(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const v = raw == null ? NaN : Number(raw);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : DEFAULT_VALUE;
  } catch {
    return DEFAULT_VALUE;
  }
}

let palette: Palette = evaluatePalette(readStored());
const listeners = new Set<Listener>();
let driver: ((target: number, source: Source) => void) | null = null;
let saveTimer = 0;
let tweenRaf = 0;

function writeCssVars(p: Palette) {
  const s = document.documentElement.style;
  s.setProperty('--bg', rgbToHex(p.bg));
  s.setProperty('--bg-2', rgbToHex(p.bg2));
  s.setProperty('--surface', rgbToHex(p.surface));
  s.setProperty('--ink', rgbToHex(p.ink));
  s.setProperty('--muted', rgbToHex(p.muted));
  s.setProperty('--line', rgbToHex(p.line));
  s.setProperty('--accent', rgbToHex(p.accent));
  s.setProperty('--accent-ink', rgbToHex(p.accentInk));
  s.setProperty('--light', rgbToHex(p.light));
  s.setProperty('--glow', rgbToHex(p.glow));
  // space-separated channels for rgb(var(--x-rgb) / a)
  s.setProperty('--ink-rgb', rgbToCss(p.ink));
  s.setProperty('--bg-rgb', rgbToCss(p.bg));
  s.setProperty('--accent-rgb', rgbToCss(p.accent));
  s.setProperty('--light-rgb', rgbToCss(p.light));
  s.setProperty('--glow-rgb', rgbToCss(p.glow));
  s.setProperty('--lamp', p.lampStrength.toFixed(3));
  s.setProperty('--daylight', p.daylight.toFixed(3));
  s.setProperty('--warmth', p.warmth.toFixed(3));
  s.setProperty('--dial', (p.value / 100).toFixed(4));
  document.documentElement.dataset.tone = p.isDark ? 'dark' : 'light';
  document.documentElement.dataset.mood = p.mood.id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', rgbToHex(p.bg));
}

export const atmosphere = {
  get(): Palette {
    return palette;
  },

  /** Set immediately (used by the knob every frame and by tweens). */
  set(value: number, source: Source) {
    const v = Math.min(100, Math.max(0, value));
    if (Math.abs(v - palette.value) < 0.001 && source !== 'init') return;
    palette = evaluatePalette(v);
    writeCssVars(palette);
    listeners.forEach((l) => l(palette, source));
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, palette.value.toFixed(2));
      } catch {
        /* storage unavailable: the mood still lives for this page view */
      }
    }, 250);
  },

  /** Ask for a value: the knob animates to it, or the store eases there. */
  request(value: number, source: Source = 'slider') {
    const target = Math.min(100, Math.max(0, value));
    if (driver) {
      driver(target, source);
      return;
    }
    cancelAnimationFrame(tweenRaf);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || source === 'slider') {
      this.set(target, source);
      return;
    }
    const step = () => {
      const cur = palette.value;
      const next = cur + (target - cur) * 0.14;
      if (Math.abs(target - next) < 0.05) {
        this.set(target, 'tween');
        return;
      }
      this.set(next, 'tween');
      tweenRaf = requestAnimationFrame(step);
    };
    tweenRaf = requestAnimationFrame(step);
  },

  setDriver(fn: ((target: number, source: Source) => void) | null) {
    driver = fn;
  },

  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  init() {
    writeCssVars(palette);
  },
};
