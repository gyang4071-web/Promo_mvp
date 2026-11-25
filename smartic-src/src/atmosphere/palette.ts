/**
 * Lighting atmosphere palette.
 *
 * A single value 0–100 drives the whole page. Three anchor moods sit at
 * 0 / 50 / 100 and every colour in between is interpolated in OKLab, which
 * keeps the in-between states clean (no muddy greys between amber and blue).
 * Text and CTA-label colours are then chosen by contrast so copy is always
 * readable while the background moves from dark walnut to warm white.
 */

export type MoodId = 'warm' | 'natural' | 'cool';

export interface MoodAnchor {
  id: MoodId;
  label: string; // shown on the device display and captions
  at: number; // 0–100
  bg: string;
  bg2: string;
  surface: string;
  inkLight: string; // used when the background is dark
  inkDark: string; // used when the background is light
  accent: string;
  light: string; // colour of the apartment's artificial light
  glow: string; // halo around the controller and light effects
  /** 0 = room barely lit by lamps, 1 = lamps dominate (warm evening) */
  lampStrength: number;
  /** 0 = night outside, 1 = full daylight */
  daylight: number;
  kelvin: number;
}

export const MOODS: MoodAnchor[] = [
  {
    id: 'warm',
    label: 'Ջերմ երեկո',
    at: 0,
    bg: '#1c130d',
    bg2: '#261a12',
    surface: '#312218',
    inkLight: '#f5e7d3',
    inkDark: '#2a1d14',
    accent: '#d4a053',
    light: '#ffb25e',
    glow: '#ffa947',
    lampStrength: 1,
    daylight: 0.05,
    kelvin: 2700,
  },
  {
    id: 'natural',
    label: 'Բնական լույս',
    at: 50,
    bg: '#f4eee5',
    bg2: '#ebe2d5',
    surface: '#fbf8f3',
    inkLight: '#f8f3ec',
    inkDark: '#25211d',
    accent: '#2f2b27',
    light: '#fff0da',
    glow: '#ffdcae',
    lampStrength: 0.45,
    daylight: 0.75,
    kelvin: 4000,
  },
  {
    id: 'cool',
    label: 'Սառը լույս',
    at: 100,
    bg: '#e3e8ed',
    bg2: '#d6dde4',
    surface: '#f2f5f7',
    inkLight: '#f2f6fa',
    inkDark: '#1c2632',
    accent: '#46637f',
    light: '#e6f0ff',
    glow: '#b9d3f2',
    lampStrength: 0.35,
    daylight: 0.9,
    kelvin: 6000,
  },
];

/* ---------- colour maths (sRGB <-> OKLab) ---------- */

type RGB = [number, number, number];
type Lab = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
};
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function rgbToOklab([r, g, b]: RGB): Lab {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, A, B]: Lab): RGB {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    clamp01(toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    clamp01(toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    clamp01(toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}

const labCache = new Map<string, Lab>();
const lab = (hex: string) => {
  let v = labCache.get(hex);
  if (!v) labCache.set(hex, (v = rgbToOklab(hexToRgb(hex))));
  return v;
};

export const mixLab = (a: Lab, b: Lab, t: number): Lab => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const rgbToHex = (c: RGB) =>
  '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

export const rgbToCss = (c: RGB) => c.map((v) => Math.round(v * 255)).join(' ');

export function luminance([r, g, b]: RGB) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
export function contrast(a: RGB, b: RGB) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ---------- palette evaluation ---------- */

const smooth = (t: number) => t * t * (3 - 2 * t);
/** share of each segment that stays close to its anchor mood */
const HOLD = 0.16;

export interface Palette {
  value: number;
  mood: MoodAnchor; // nearest anchor
  /** position between anchors, for labels: 0 warm … 1 cool */
  bg: RGB;
  bg2: RGB;
  surface: RGB;
  ink: RGB;
  muted: RGB;
  line: RGB;
  accent: RGB;
  accentInk: RGB;
  light: RGB;
  glow: RGB;
  lampStrength: number;
  daylight: number;
  kelvin: number;
  isDark: boolean;
  /** 0–1 warmth, used for overlays */
  warmth: number;
}

type ColorKey = 'bg' | 'bg2' | 'surface' | 'inkLight' | 'inkDark' | 'accent' | 'light' | 'glow';

function segment(value: number) {
  const v = Math.min(100, Math.max(0, value));
  for (let i = 0; i < MOODS.length - 1; i++) {
    const a = MOODS[i], b = MOODS[i + 1];
    if (v <= b.at) {
      // each mood keeps its character near its anchor, then blends smoothly
      const raw = (v - a.at) / (b.at - a.at);
      const t = Math.min(1, Math.max(0, (raw - HOLD) / (1 - 2 * HOLD)));
      return { a, b, t: smooth(t) };
    }
  }
  const last = MOODS[MOODS.length - 1];
  return { a: last, b: last, t: 0 };
}

export function nearestMood(value: number): MoodAnchor {
  return MOODS.reduce((best, m) => (Math.abs(m.at - value) < Math.abs(best.at - value) ? m : best));
}

export function evaluatePalette(value: number): Palette {
  const { a, b, t } = segment(value);
  const pick = (k: ColorKey) => oklabToRgb(mixLab(lab(a[k]), lab(b[k]), t));
  const num = (k: 'lampStrength' | 'daylight' | 'kelvin') => a[k] + (b[k] - a[k]) * t;

  const bg = pick('bg');
  const bg2 = pick('bg2');
  const surface = pick('surface');
  const light = pick('light');
  const glow = pick('glow');
  const accent = pick('accent');

  // Text colour: whichever family reads better on the current background.
  const inkL = pick('inkLight');
  const inkD = pick('inkDark');
  const isDark = contrast(inkL, bg) >= contrast(inkD, bg);
  const ink = isDark ? inkL : inkD;
  const muted = oklabToRgb(mixLab(rgbToOklab(ink), rgbToOklab(bg), 0.3));
  const line = oklabToRgb(mixLab(rgbToOklab(ink), rgbToOklab(bg), 0.82));

  // CTA label: light or dark, whichever contrasts more with the accent.
  const lightLabel = hexToRgb('#fbf7f1');
  const darkLabel = hexToRgb('#1b140e');
  const accentInk = contrast(lightLabel, accent) >= contrast(darkLabel, accent) ? lightLabel : darkLabel;

  return {
    value,
    mood: nearestMood(value),
    bg,
    bg2,
    surface,
    ink,
    muted,
    line,
    accent,
    accentInk,
    light,
    glow,
    lampStrength: num('lampStrength'),
    daylight: num('daylight'),
    kelvin: Math.round(num('kelvin') / 100) * 100,
    isDark,
    warmth: 1 - Math.min(1, Math.max(0, value / 100)),
  };
}
