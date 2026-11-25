/**
 * Page colour driven by the rotary controller.
 *
 * One value 0–100 sets the whole landing: 0 is a clean white page, 100 is
 * deep Smartic violet. Stops are mixed in OKLab with a smoothstep between
 * them, so the in-between states stay clear lavenders instead of greyish
 * purples. Text colour is picked by contrast, so it turns white only once
 * the violet is deep enough to need it.
 */

export type MoodId = 'day' | 'evening' | 'night';

export interface MoodAnchor {
  id: MoodId;
  label: string; // shown on the device display
  at: number; // 0–100
}

export const MOODS: MoodAnchor[] = [
  { id: 'day', label: 'Ցերեկային լույս', at: 0 },
  { id: 'evening', label: 'Երեկոյան լույս', at: 50 },
  { id: 'night', label: 'Գիշերային լույս', at: 100 },
];

/** Page background along the dial. */
const BG_STOPS: [number, string][] = [
  [0, '#ffffff'],
  [22, '#f8f6ff'],
  [45, '#ece6ff'],
  [65, '#d6caff'],
  [82, '#9c87ff'],
  [100, '#3210d2'],
];
/** Colour of the device's LEDs and halo along the dial. */
const GLOW_STOPS: [number, string][] = [
  [0, '#b3a4ff'],
  [50, '#8a6dff'],
  [100, '#b7a6ff'],
];

const BRAND = '#3200ff';
const BRAND_INK = '#2600c4';
const INK_DARK = '#15131f';
const INK_LIGHT = '#ffffff';

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

function along(stops: [number, string][], v: number): RGB {
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (v <= b) return oklabToRgb(mixLab(lab(ca), lab(cb), smooth((v - a) / (b - a))));
  }
  return hexToRgb(stops[stops.length - 1][1]);
}

export interface Palette {
  value: number;
  mood: MoodAnchor; // nearest anchor
  bg: RGB;
  fg: RGB;
  muted: RGB;
  brand: RGB;
  brandInk: RGB;
  surface: RGB;
  ctaBg: RGB;
  ctaFg: RGB;
  glow: RGB;
  /** 0–1, brightness of the device's light ring */
  lampStrength: number;
  isDark: boolean;
}

export function nearestMood(value: number): MoodAnchor {
  return MOODS.reduce((best, m) => (Math.abs(m.at - value) < Math.abs(best.at - value) ? m : best));
}

export function evaluatePalette(value: number): Palette {
  const v = Math.min(100, Math.max(0, value));
  const bg = along(BG_STOPS, v);
  const glow = along(GLOW_STOPS, v);
  const inkL = hexToRgb(INK_LIGHT);
  const inkD = hexToRgb(INK_DARK);
  const isDark = contrast(inkL, bg) > contrast(inkD, bg);
  const fg = isDark ? inkL : inkD;
  const bgLab = rgbToOklab(bg);
  const white = rgbToOklab([1, 1, 1]);
  return {
    value: v,
    mood: nearestMood(v),
    bg,
    fg,
    muted: oklabToRgb(mixLab(rgbToOklab(fg), bgLab, 0.38)),
    // on light grounds the accent is Smartic violet; on the deep violet it turns white
    brand: isDark ? inkL : hexToRgb(BRAND),
    brandInk: isDark ? hexToRgb('#e6e0ff') : hexToRgb(BRAND_INK),
    surface: oklabToRgb(isDark ? mixLab(bgLab, white, 0.16) : mixLab(bgLab, lab(BRAND), 0.09)),
    ctaBg: isDark ? inkL : hexToRgb(BRAND),
    ctaFg: isDark ? hexToRgb('#2a0bc7') : inkL,
    glow,
    lampStrength: 0.45 + 0.55 * (v / 100),
    isDark,
  };
}
