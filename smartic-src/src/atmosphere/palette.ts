/**
 * One apartment, one day.
 *
 * The rotary controller drives a single value 0–100 that moves the
 * apartment through the day: 0 is 09:00 (morning), 50 is 17:00 (friends
 * over) and 100 is 22:00 (movie night). Light colours and the device's
 * illumination change continuously; the scene with people changes only at
 * two narrative moments, with a short dissolve. Nothing here touches the
 * article, which stays white.
 */

export type SceneId = 'morning' | 'friends' | 'movie';

export interface SceneAnchor {
  id: SceneId;
  label: string; // shown small on the device display
  at: number; // 0–100
  hour: number; // clock time at this anchor
  panel: string; // ground behind the device, taken from the room's light
  glow: string; // device LEDs and halo
  lampStrength: number;
}

export const SCENES: SceneAnchor[] = [
  { id: 'morning', label: 'Առավոտ', at: 0, hour: 9, panel: '#ece7df', glow: '#f2efe8', lampStrength: 0.35 },
  { id: 'friends', label: 'Հյուրեր', at: 50, hour: 17, panel: '#3a2b20', glow: '#ffb867', lampStrength: 1 },
  { id: 'movie', label: 'Կինոերեկո', at: 100, hour: 22, panel: '#121015', glow: '#ff9a52', lampStrength: 0.55 },
];

/** Dial positions where the people in the room change (with hysteresis in the scene layer). */
export const SCENE_CUTS = [27, 76];

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
function contrast(a: RGB, b: RGB) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ---------- evaluation ---------- */

const smooth = (t: number) => t * t * (3 - 2 * t);

export interface Palette {
  value: number;
  /** scene whose people are shown at this dial position */
  mood: SceneAnchor;
  /** "09:00" … "22:00" */
  clock: string;
  panel: RGB;
  glow: RGB;
  lampStrength: number;
  /** 0 morning … 1 night */
  dusk: number;
  /** continuous light grade over the current scene photo: amber wash and dimming, 0–1 */
  warmWash: number;
  dim: number;
}

export function sceneAt(value: number): SceneAnchor {
  return value < SCENE_CUTS[0] ? SCENES[0] : value < SCENE_CUTS[1] ? SCENES[1] : SCENES[2];
}

/**
 * Between two scene photos the light keeps moving: the morning room warms
 * toward the afternoon, the afternoon room dims toward the evening. At each
 * cut the grade roughly matches the next photo, so the dissolve stays calm.
 */
function grade(v: number) {
  const [c1, c2] = SCENE_CUTS;
  if (v < c1) return { warmWash: (v / c1) * 0.38, dim: (v / c1) * 0.05 };
  if (v < c2) {
    const u = (v - c1) / (c2 - c1);
    return { warmWash: 0.06 + u * 0.22, dim: u * 0.34 };
  }
  const u = (v - c2) / (100 - c2);
  return { warmWash: 0, dim: 0.08 * (1 - u) };
}

export function evaluatePalette(value: number): Palette {
  const v = Math.min(100, Math.max(0, value));
  const i = v <= 50 ? 0 : 1;
  const a = SCENES[i], b = SCENES[i + 1];
  const t = smooth((v - a.at) / (b.at - a.at));
  const mix = (x: string, y: string) => oklabToRgb(mixLab(lab(x), lab(y), t));
  const hours = a.hour + (b.hour - a.hour) * ((v - a.at) / (b.at - a.at));
  const h = Math.floor(hours);
  const m = Math.floor(((hours - h) * 60) / 5) * 5;
  return {
    value: v,
    mood: sceneAt(v),
    clock: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    panel: mix(a.panel, b.panel),
    glow: mix(a.glow, b.glow),
    lampStrength: a.lampStrength + (b.lampStrength - a.lampStrength) * t,
    dusk: v / 100,
    ...grade(v),
  };
}

export { contrast };
