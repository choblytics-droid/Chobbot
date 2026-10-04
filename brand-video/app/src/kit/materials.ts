// Pixel-art materials (docs/QA.md, QA-2: every surface gets texture and at least 3 tones).
// Each returns a (x, y) => Mat painter anchored to the object (it moves with the object's layer).
// Ramps run dark → light; `ramp()` builds one from a base colour the way pixel artists do:
// shadows shift cool, highlights shift warm.
import type { Mat } from './pixel';

// ---------------------------------------------------------------------------- colour helpers
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => toLin(v / 255)); };
const rgbHex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, toSrgb(v))) * 255).toString(16).padStart(2, '0')).join('');

/** A 5-step ramp around `base` (index 2): darker steps cooler, lighter steps warmer. */
export function ramp(base: string, spread = 1): string[] {
  const b = hexRgb(base);
  const k = [0.42, 0.68, 1, 1.32, 1.68].map((m) => 1 + (m - 1) * spread);
  return k.map((m, i) => {
    const cool = i < 2 ? (2 - i) * 0.06 * spread : 0, warm = i > 2 ? (i - 2) * 0.05 * spread : 0;
    return rgbHex([b[0]! * m * (1 - cool + warm), b[1]! * m * (1 - cool * 0.3 + warm * 0.5), b[2]! * m * (1 + cool - warm * 0.6)]);
  });
}
export const mix = (a: string, b: string, k: number) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i]! - v) * k)); };

// ---------------------------------------------------------------------------- noise
const hash = (x: number, y: number, s = 0) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
/** Smooth value noise, 0..1. */
export function vnoise(x: number, y: number, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const pick = (r: string[], i: number) => r[Math.max(0, Math.min(r.length - 1, i))]!;
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Ordered-dither a continuous tone index (e.g. 1.6) to an integer step. */
export const dither = (v: number, x: number, y: number) => Math.floor(v + (bayer[((y & 3) << 2) | (x & 3)]! + 0.5) / 16);

type Base = { d: number; id: number; n?: [number, number] };

// ---------------------------------------------------------------------------- materials
/** Plaster wall: blotchy tone, speckle, dirt rising from the ground line `gy`, darker under eaves `ty`. */
export function plaster(r: string[], b: Base & { gy?: number; ty?: number; seed?: number }) {
  return (x: number, y: number): Mat => {
    let v = 2 + (vnoise(x * 0.11, y * 0.11, b.seed ?? 1) - 0.5) * 1.4;
    if (b.gy !== undefined) v -= Math.max(0, 1 - (b.gy - y) / 14) * 1.1;
    if (b.ty !== undefined) v -= Math.max(0, 1 - (y - b.ty) / 6) * 0.8;
    const sp = hash(x, y, b.seed ?? 1);
    if (sp < 0.06) v -= 1; else if (sp > 0.965) v += 1;
    return { a: pick(r, dither(v, x, y)), d: b.d, id: b.id, n: b.n };
  };
}

/** Dressed stone in courses: mortar lines, per-block tone, a lit top lip, the odd crack. */
export function stone(r: string[], b: Base & { bw?: number; bh?: number; seed?: number; ox?: number; oy?: number }) {
  const bw = b.bw ?? 6, bh = b.bh ?? 3;
  return (x: number, y: number): Mat => {
    const lx = x - (b.ox ?? 0), ly = y - (b.oy ?? 0);
    const row = Math.floor(ly / bh), off = (row % 2) * Math.floor(bw / 2);
    const col = Math.floor((lx + off) / bw);
    const inX = (lx + off) - col * bw, inY = ly - row * bh;
    const n: [number, number] | undefined = b.n;
    if (inY === bh - 1 || inX === bw - 1) return { a: r[0]!, d: b.d, id: b.id, n };       // mortar
    let v = 2 + (hash(col, row, b.seed ?? 3) - 0.5) * 1.6 + (vnoise(x * 0.07, y * 0.07, 9) - 0.5) * 0.8;
    if (inY === 0) v += 0.9;                                                             // lit top lip
    if (hash(x, y, 77) < 0.025) v -= 1.2;                                                // pits and cracks
    return { a: pick(r, dither(v, x, y)), d: b.d, id: b.id, n };
  };
}

/** Roof slate / tiles in rows: a dark lower edge per row, staggered joints, per-tile tone, snow catching on rows. */
export function slate(r: string[], b: Base & { tw?: number; th?: number; snow?: string; snowK?: number; seed?: number }) {
  const tw = b.tw ?? 4, th = b.th ?? 3;
  return (x: number, y: number): Mat => {
    const row = Math.floor(y / th), off = (row % 2) * Math.floor(tw / 2), col = Math.floor((x + off) / tw);
    const inY = y - row * th, inX = (x + off) - col * tw;
    if (b.snow && inY === 0 && hash(col, row, 5) < (b.snowK ?? 0.5)) return { a: b.snow, d: b.d, id: b.id, n: [b.n?.[0] ?? 0, 0.9] };
    let v = 2 + (hash(col, row, b.seed ?? 4) - 0.5) * 1.2;
    if (inY === th - 1) v -= 1.4; else if (inX === 0) v -= 0.7; else if (inY === 0) v += 0.6;
    return { a: pick(r, dither(v, x, y)), d: b.d, id: b.id, n: b.n };
  };
}

/** Wood: planks (vertical or horizontal) with seams, grain and knots. */
export function wood(r: string[], b: Base & { pw?: number; vertical?: boolean; seed?: number }) {
  const pw = b.pw ?? 4;
  return (x: number, y: number): Mat => {
    const a = b.vertical ? x : y, along = b.vertical ? y : x;
    const plank = Math.floor(a / pw), inP = a - plank * pw;
    if (inP === pw - 1) return { a: r[0]!, d: b.d, id: b.id, n: b.n };
    let v = 2 + (hash(plank, 0, b.seed ?? 6) - 0.5) * 1.2;
    v += Math.sin(along * 0.45 + plank * 2.1 + Math.sin(along * 0.11 + plank) * 2.5) * 0.45;
    if (inP === 0) v += 0.6;
    if (hash(plank, Math.floor(along / 9), 31) < 0.06 && hash(x, y, 2) < 0.5) v -= 1.3;    // knots
    return { a: pick(r, dither(v, x, y)), d: b.d, id: b.id, n: b.n };
  };
}

/** Painted metal panels: seams, rivets, a soft vertical sheen and grime toward the bottom `gy`. */
export function metal(r: string[], b: Base & { pw?: number; ph?: number; gy?: number; seed?: number; rivets?: boolean }) {
  const pw = b.pw ?? 24, ph = b.ph ?? 40;
  return (x: number, y: number): Mat => {
    const inX = ((x % pw) + pw) % pw, inY = ((y % ph) + ph) % ph;
    if (inX === 0 || inY === 0) return { a: r[1]!, d: b.d, id: b.id, n: b.n };
    if ((b.rivets ?? true) && (inX === 2 || inX === pw - 2) && inY % 5 === 2) return { a: r[3]!, d: b.d, id: b.id, n: b.n };
    let v = 2 + (vnoise(x * 0.05, y * 0.2, b.seed ?? 8) - 0.5) * 0.9;
    if (inX === 1) v += 0.7;
    if (b.gy !== undefined) v -= Math.max(0, 1 - (b.gy - y) / 18) * 1.0;
    return { a: pick(r, dither(v, x, y)), d: b.d, id: b.id, n: b.n };
  };
}

/** Woven fabric / upholstery: a fine weave plus a repeating pattern colour. */
export function fabric(r: string[], b: Base & { pat?: string; seed?: number }) {
  return (x: number, y: number): Mat => {
    if (b.pat && ((x + y) % 8 === 0 || (x - y + 800) % 8 === 0)) return { a: b.pat, d: b.d, id: b.id, n: b.n };
    let v = 2 + ((x + y) % 2 ? 0.35 : -0.35) + (vnoise(x * 0.15, y * 0.15, b.seed ?? 10) - 0.5) * 0.8;
    return { a: pick(r, dither(v, x, y)), d: b.d, id: b.id, n: b.n };
  };
}

/** Snow cover: bright with blue hollows and the odd sparkle. */
export function snow(r: string[], b: Base & { seed?: number }) {
  return (x: number, y: number): Mat => {
    let v = 3 + (vnoise(x * 0.09, y * 0.18, b.seed ?? 12) - 0.5) * 1.8;
    if (hash(x, y, 13) > 0.985) v += 1.5;
    return { a: pick(r, dither(v, x, y)), d: b.d, id: b.id, n: b.n ?? [0, 0.85] };
  };
}

/** Hillside under snow: rock and scrub showing through drifts, lighter toward the top edge `ty(x)`. */
export function hillside(rock: string[], sn: string[], b: Base & { ty: (x: number) => number; seed?: number }) {
  return (x: number, y: number): Mat => {
    const depth = y - b.ty(x);
    const drift = vnoise(x * 0.06, y * 0.12, b.seed ?? 14) + (depth < 3 ? 0.35 : 0) - depth * 0.004;
    if (drift > 0.62) return { a: pick(sn, dither(1.6 + (drift - 0.62) * 4, x, y)), d: b.d, id: b.id, n: [0, 0.8] };
    let v = 1.6 + (vnoise(x * 0.2, y * 0.2, 15) - 0.5) * 1.8 - depth * 0.01;
    return { a: pick(rock, dither(v, x, y)), d: b.d, id: b.id, n: [(vnoise(x * 0.2, y * 0.2, 16) - 0.5) * 0.8, 0.5] };
  };
}
