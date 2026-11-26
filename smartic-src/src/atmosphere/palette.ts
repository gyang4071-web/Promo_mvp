/**
 * Lighting atmospheres driven by the rotary controller.
 *
 * One value 0–100 sets three architectural moods: warm evening (0),
 * natural light (50) and cool modern light (100). The biggest change
 * happens in the apartment photo and the panel around the device; the
 * article itself only takes a soft tint, so reading stays comfortable.
 * Article text is always dark, so it never flips from black to white.
 * Every colour is mixed in OKLab between the anchors, with a short hold
 * near each anchor so each mood keeps its character.
 */

export type MoodId = 'warm' | 'natural' | 'cool';

export interface MoodAnchor {
  id: MoodId;
  label: string; // shown on the device display and in the caption
  at: number; // 0–100
  /* article (subtle) */
  bg: string;
  fg: string;
  accent: string; // chapter numbers, labels, links
  hl: string; // inline highlight: Smartic violet, tuned per mood
  ctaBg: string;
  ctaFg: string;
  /* lighting stage (strong) */
  panel: string; // ground behind the device
  glow: string; // device LEDs and halo
  lampStrength: number;
  kelvin: number;
}

export const MOODS: MoodAnchor[] = [
  {
    id: 'warm',
    label: 'Ջերմ երեկո',
    at: 0,
    bg: '#faf5ee',
    fg: '#2a2019',
    accent: '#8a5f2c',
    hl: '#5530c8',
    ctaBg: '#2f2219',
    ctaFg: '#fbf4ea',
    panel: '#2a1d15',
    glow: '#ffb35c',
    lampStrength: 1,
    kelvin: 2700,
  },
  {
    id: 'natural',
    label: 'Բնական լույս',
    at: 50,
    bg: '#fcfbf8',
    fg: '#24211e',
    accent: '#6e604f',
    hl: '#5433d6',
    ctaBg: '#26231f',
    ctaFg: '#fbf9f5',
    panel: '#ece5da',
    glow: '#ffe2bd',
    lampStrength: 0.55,
    kelvin: 4000,
  },
  {
    id: 'cool',
    label: 'Սառը լույս',
    at: 100,
    bg: '#f5f7f9',
    fg: '#1c2530',
    accent: '#4b6580',
    hl: '#4936cf',
    ctaBg: '#1f2d3c',
    ctaFg: '#f4f7fa',
    panel: '#dfe5eb',
    glow: '#cfe1f7',
    lampStrength: 0.45,
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
const HOLD = 0.14;

function segment(value: number) {
  const v = Math.min(100, Math.max(0, value));
  for (let i = 0; i < MOODS.length - 1; i++) {
    const a = MOODS[i], b = MOODS[i + 1];
    if (v <= b.at) {
      const raw = (v - a.at) / (b.at - a.at);
      const t = Math.min(1, Math.max(0, (raw - HOLD) / (1 - 2 * HOLD)));
      return { i, a, b, t: smooth(t) };
    }
  }
  const last = MOODS[MOODS.length - 1];
  return { i: MOODS.length - 1, a: last, b: last, t: 0 };
}

export interface Palette {
  value: number;
  mood: MoodAnchor; // nearest anchor
  bg: RGB;
  fg: RGB;
  muted: RGB;
  accent: RGB;
  hl: RGB;
  ctaBg: RGB;
  ctaFg: RGB;
  panel: RGB;
  panelInk: RGB;
  glow: RGB;
  lampStrength: number;
  kelvin: number;
  /** opacity of the natural-light and cool-light room photos over the warm one */
  roomNatural: number;
  roomCool: number;
}

type ColorKey = 'bg' | 'fg' | 'accent' | 'hl' | 'ctaBg' | 'ctaFg' | 'panel' | 'glow';

export function nearestMood(value: number): MoodAnchor {
  return MOODS.reduce((best, m) => (Math.abs(m.at - value) < Math.abs(best.at - value) ? m : best));
}

export function evaluatePalette(value: number): Palette {
  const v = Math.min(100, Math.max(0, value));
  const { i, a, b, t } = segment(v);
  const pick = (k: ColorKey) => oklabToRgb(mixLab(lab(a[k]), lab(b[k]), t));
  const num = (k: 'lampStrength' | 'kelvin') => a[k] + (b[k] - a[k]) * t;
  const bg = pick('bg');
  const fg = pick('fg');
  const panel = pick('panel');
  // the caption on the panel: cream on walnut, charcoal on the light panels,
  // cross-faded through the panel's own colour so it never flashes
  const cream = hexToRgb('#f6ecdf');
  const charcoal = hexToRgb('#2b2722');
  const ink = contrast(cream, panel) >= contrast(charcoal, panel) ? cream : charcoal;
  return {
    value: v,
    mood: nearestMood(v),
    bg,
    fg,
    muted: oklabToRgb(mixLab(rgbToOklab(fg), rgbToOklab(bg), 0.36)),
    accent: pick('accent'),
    hl: pick('hl'),
    ctaBg: pick('ctaBg'),
    ctaFg: pick('ctaFg'),
    panel,
    panelInk: ink,
    glow: pick('glow'),
    lampStrength: num('lampStrength'),
    kelvin: Math.round(num('kelvin') / 100) * 100,
    roomNatural: i === 0 ? t : 1,
    roomCool: i === 0 ? 0 : i === 1 ? t : 1,
  };
}
