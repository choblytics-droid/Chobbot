// The cover's world, shared by the version-B plates: neon lyric type, the sheet ghost and its
// smoke wisps, rain, and a perspective alley (portrait, looking down a narrow wet street).
// Glowing things are drawn into a "glow" Layer2D that the plates composite with an HDR tint, so
// the engine's bloom turns them into neon; everything else goes into a plain layer.
import type { Lyrics, Line } from '../engine/lyrics';
import { Lyrics as L } from '../engine/lyrics';
import { LineBatch } from '../engine/lines';
import { LIN, rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, noise1, TAU } from '../engine/util';
import { W, H } from '../engine/gl';

export type RGB = [number, number, number];
export const lin = (k: keyof typeof LIN, m = 1): RGB => [LIN[k][0] * m, LIN[k][1] * m, LIN[k][2] * m];

// ------------------------------------------------------------------ neon ignition
/** Neon tube ignition: flickers for ~120 ms after t0, then holds. 0 before t0. Keyed to output frames. */
export function ignite(t: number, t0: number, seed = 0) {
  if (t < t0) return 0;
  const a = t - t0;
  if (a > 0.13) return 1;
  const f = frameIdx(t);
  return hash(f, seed, 3) < 0.35 + a * 4 ? 1 : 0.15;
}
/** A failing tube: mostly on, with dropouts whose rate is `bad` (0..1). */
export function buzz(t: number, bad: number, seed = 0) {
  const f = frameIdx(t);
  const h = hash(Math.floor(f / 2), seed, 11);
  return h < bad ? 0.08 + 0.2 * hash(f, seed) : 0.85 + 0.15 * hash(f, seed, 2);
}

// ------------------------------------------------------------------ lyric type
export type LyricStyle = { fam?: string; size?: number; lead?: number; col?: string; hot?: string; dim?: number; align?: 'left' | 'center'; upper?: boolean; maxW?: number; lineH?: number };

/** Break a line into rows of words that fit maxW. */
export function wrapWords(line: Line, fam: string, size: number, maxW: number, upper = true) {
  const rows: number[][] = [[]];
  let w = 0;
  const sp = measure(' ', fam, size) * 1.7;
  line.words.forEach((wd, i) => {
    const ww = measure(upper ? wd.w.toUpperCase() : wd.w, fam, size);
    const row = rows[rows.length - 1]!;
    if (row.length && w + sp + ww > maxW) { rows.push([i]); w = ww; } else { row.push(i); w += (row.length > 1 ? sp : 0) + ww; }
  });
  return rows;
}

/**
 * Karaoke block: the line's words set in rows; each word ignites like a neon tube at its start
 * (never ahead of the voice); upcoming words sit dim. Draw into the glow layer.
 * Returns the block's height.
 */
export function lyricBlock(c: CanvasRenderingContext2D, line: Line, t: number, x: number, y: number, s: LyricStyle = {}) {
  const fam = s.fam ?? F.archivo(87.5, 900), size = s.size ?? 88, upper = s.upper ?? true;
  const maxW = s.maxW ?? W - 150, lh = s.lineH ?? size * 1.14;
  const rows = wrapWords(line, fam, size, maxW, upper);
  c.font = font(fam, size);
  const sp = measure(' ', fam, size) * 1.7;
  rows.forEach((row, r) => {
    const txt = row.map((i) => (upper ? line.words[i]!.w.toUpperCase() : line.words[i]!.w));
    const rw = txt.reduce((a, b) => a + measure(b, fam, size), 0) + sp * (row.length - 1);
    let cx = s.align === 'left' ? x : x - rw / 2;
    row.forEach((i, k) => {
      const wd = line.words[i]!;
      const on = ignite(t, wd.start, i + line.i * 31);
      const cur = t >= wd.start && t < wd.end;
      c.fillStyle = rgba(cur && s.hot ? s.hot : s.col ?? 'magenta', on > 0 ? on : s.dim ?? 0.16);
      c.fillText(txt[k]!, cx, y + r * lh);
      cx += measure(txt[k]!, fam, size) + sp;
    });
  });
  return rows.length * lh;
}

// ------------------------------------------------------------------ the ghost
/**
 * The sheet ghost (after the cover): round head, soft sides with two arm nubs, a scalloped hem that
 * ripples, two dark oval eyes. (x, y) = centre of the head, s = head radius in px.
 */
export function drawGhost(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, o: { alpha?: number; eyes?: number; lean?: number; hem?: number } = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.003 || s < 1) return;
  c.save();
  c.translate(x, y);
  c.rotate(o.lean ?? 0.06 * Math.sin(t * 1.7));
  c.scale(s, s);
  const hemY = o.hem ?? 1.75;
  c.beginPath();
  c.arc(0, 0, 1, Math.PI, 0);
  c.bezierCurveTo(1.02, 0.4, 1.35, 0.55, 1.28, 0.78); // right arm nub
  c.bezierCurveTo(1.22, 0.9, 1.08, 0.82, 1.08, 1.0);
  c.lineTo(1.14, hemY);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const x0 = 1.14 - (2.28 * i) / n, x1 = 1.14 - (2.28 * (i + 1)) / n;
    const dip = 0.22 + 0.06 * Math.sin(t * 5.3 + i * 1.9);
    c.quadraticCurveTo((x0 + x1) / 2, hemY - dip + 0.05 * Math.sin(t * 7 + i), x1, hemY + 0.04 * Math.sin(t * 6 + i * 2.3));
  }
  c.lineTo(-1.08, 1.0);
  c.bezierCurveTo(-1.08, 0.82, -1.22, 0.9, -1.28, 0.78); // left arm nub
  c.bezierCurveTo(-1.35, 0.55, -1.02, 0.4, -1, 0);
  c.closePath();
  const g = c.createLinearGradient(0, -1, 0, hemY);
  g.addColorStop(0, rgba('ghost', 0.97 * a));
  g.addColorStop(0.55, rgba('ghost', 0.85 * a));
  g.addColorStop(1, rgba('cyan', 0.35 * a));
  c.fillStyle = g;
  c.fill();
  // eyes
  const e = o.eyes ?? 1;
  if (e > 0) {
    c.fillStyle = rgba('night', a);
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.ellipse(sx * 0.36, -0.02, 0.12, 0.19 * e, 0, 0, TAU);
      c.fill();
    }
  }
  c.restore();
}

/** Smoke wisps curling off a point (the ghost's hem, a crack): tapered strokes, drawn into the glow layer. */
export function drawWisps(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, o: { n?: number; alpha?: number; seed?: number; dir?: number } = {}) {
  const n = o.n ?? 3, a = o.alpha ?? 0.6, seed = o.seed ?? 1, dir = o.dir ?? 1;
  for (let k = 0; k < n; k++) {
    let px = x + (hash(k, seed) - 0.5) * s * 1.6, py = y;
    let ang = Math.PI / 2 + (hash(k, seed, 2) - 0.5) * 1.6;
    const len = s * (1.6 + hash(k, seed, 3) * 1.4);
    const steps = 28;
    for (let i = 0; i < steps; i++) {
      const u = i / steps;
      ang += 0.22 * noise1(u * 3 + t * 0.9 + k * 7, seed + k) + 0.06 * dir;
      const nx = px + Math.cos(ang) * (len / steps), ny = py + Math.sin(ang) * (len / steps) * 0.8;
      c.strokeStyle = rgba(i % 2 ? 'ghost' : 'cyan', a * (1 - u) ** 1.5);
      c.lineWidth = Math.max(0.6, s * 0.09 * (1 - u));
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke();
      px = nx; py = ny;
    }
  }
}

// ------------------------------------------------------------------ rain
/** Rain streaks (deterministic; `speed` px/s, slanted), additive into a 2D LineBatch. */
export function rain(lb: LineBatch, t: number, o: { n?: number; speed?: number; slant?: number; len?: number; intensity?: number; freeze?: number; seed?: number; y0?: number; y1?: number } = {}) {
  const n = o.n ?? 420, sp = o.speed ?? 2600, sl = o.slant ?? 0.12, len = o.len ?? 0.022, I = o.intensity ?? 0.28, seed = o.seed ?? 5;
  const y0 = o.y0 ?? -100, y1 = o.y1 ?? H + 100, span = y1 - y0;
  const tt = o.freeze !== undefined ? Math.min(t, o.freeze) : t;
  const col = lin('mist', I);
  for (let i = 0; i < n; i++) {
    const depth = 0.35 + 0.65 * hash(i, seed, 1);
    const v = sp * depth;
    const yy = y0 + ((hash(i, seed, 2) * span + v * tt) % span);
    const xx = hash(i, seed, 3) * (W + 200) - 100 + sl * (yy - y0);
    const l = v * len;
    lb.seg2(xx, yy, xx - sl * l, yy - l, 0.8 + 1.1 * depth, [col[0] * depth, col[1] * depth, col[2] * depth], 0.8);
  }
}

// ------------------------------------------------------------------ the alley (perspective, Canvas2D)
export type Cam = { z: number; x: number; y: number; hor: number; f: number; roll: number };
export type Sign = { x: number; y: number; z: number; w: number; h: number; text: string; col: string; on: (t: number) => number; vertical?: boolean };

/** Project world (x right, y up, z forward) to screen. Returns null behind the camera. */
export function proj(cam: Cam, x: number, y: number, z: number) {
  const d = z - cam.z;
  if (d < 0.05) return null;
  const k = cam.f / d;
  return { x: W / 2 + (x - cam.x) * k, y: cam.hor - (y - cam.y) * k, k };
}

const HALF = 2.6; // half-width of the alley

/** Facade blocks along both walls: seeded depths, heights and tones. */
export function makeFacades(seed = 1, zMax = 70) {
  const out: { side: number; z0: number; z1: number; top: number; tone: number; win: number }[] = [];
  for (const side of [-1, 1]) {
    let z = -2;
    let k = 0;
    while (z < zMax) {
      const len = 5 + 7 * hash(k, side, seed);
      out.push({ side, z0: z, z1: z + len, top: 9 + 26 * hash(k, side, seed + 1), tone: hash(k, side, seed + 2), win: hash(k, side, seed + 3) });
      z += len; k++;
    }
  }
  return out;
}

/** Draw the alley: sky, far facades, wet ground with sign reflections, walls, blade signs. */
export function drawAlley(flat: CanvasRenderingContext2D, glow: CanvasRenderingContext2D, cam: Cam, t: number, facades: ReturnType<typeof makeFacades>, signs: Sign[], o: { endZ?: number; drawEnd?: (k: number, p: { x: number; y: number }) => void; lightning?: number } = {}) {
  const c = flat;
  const endZ = o.endZ ?? 60;
  c.save();
  // camera roll around the screen centre
  if (cam.roll) { c.translate(W / 2, H / 2); c.rotate(cam.roll); c.translate(-W / 2, -H / 2); glow.save(); glow.translate(W / 2, H / 2); glow.rotate(cam.roll); glow.translate(-W / 2, -H / 2); }
  // sky
  const g = c.createLinearGradient(0, 0, 0, cam.hor + 200);
  g.addColorStop(0, rgba('night', 1));
  g.addColorStop(0.7, rgba('#1A1840', 1));
  g.addColorStop(1, rgba('#2C2458', 1));
  c.fillStyle = g;
  c.fillRect(-200, -200, W + 400, H + 400);
  // distant towers in the gap
  for (let i = 0; i < 7; i++) {
    const p = proj(cam, (hash(i, 9) - 0.5) * 7, 0, endZ + 25 + 30 * hash(i, 8));
    if (!p) continue;
    const tw = 1.2 + 2 * hash(i, 7), th = 30 + 50 * hash(i, 6);
    c.fillStyle = rgba('#1B1D3A', 1);
    c.fillRect(p.x - tw * p.k / 2, p.y - th * p.k, tw * p.k, th * p.k);
    for (let r = 0; r < 30; r++) for (let q = 0; q < 3; q++) {
      if (hash(i, r, q) > 0.35) continue;
      c.fillStyle = rgba(hash(i, r, q + 5) > 0.5 ? 'violet' : '#FFD9A0', 0.35);
      c.fillRect(p.x - tw * p.k / 2 + (q + 0.5) * tw * p.k / 3.4, p.y - th * p.k + (r + 1) * th * p.k / 32, Math.max(1, p.k * 0.25), Math.max(1, p.k * 0.4));
    }
  }
  // ground
  const gA = proj(cam, -HALF, 0, cam.z + 0.3), gB = proj(cam, HALF, 0, cam.z + 0.3), gC = proj(cam, HALF, 0, endZ), gD = proj(cam, -HALF, 0, endZ);
  if (gA && gB && gC && gD) {
    const gg = c.createLinearGradient(0, gC.y, 0, H);
    gg.addColorStop(0, rgba('#2A2A55', 1));
    gg.addColorStop(1, rgba('#0C0D20', 1));
    c.fillStyle = gg;
    c.beginPath(); c.moveTo(gA.x - 2000, gA.y + 2000); c.lineTo(gB.x + 2000, gB.y + 2000); c.lineTo(gC.x, gC.y); c.lineTo(gD.x, gD.y); c.closePath(); c.fill();
    // cobble cracks / puddle glints
    for (let i = 0; i < 90; i++) {
      const z = cam.z + 0.8 + ((hash(i, 21) * 40 - cam.z) % 40 + 40) % 40;
      const p = proj(cam, (hash(i, 22) - 0.5) * 2 * HALF * 0.95, 0, z);
      if (!p) continue;
      c.fillStyle = rgba(hash(i, 23) > 0.5 ? 'magenta' : 'cyan', 0.05 + 0.07 * hash(i, 24));
      c.beginPath(); c.ellipse(p.x, p.y, (0.3 + 0.5 * hash(i, 25)) * p.k, 0.025 * p.k, 0, 0, TAU); c.fill();
    }
  }
  // reflections of the signs on the wet ground (glow layer, stretched & rippled)
  for (const s of signs) {
    const on = s.on(t);
    if (on <= 0) continue;
    const top = proj(cam, s.x, 0, s.z), bot = proj(cam, s.x, -s.y - s.h, s.z);
    if (!top || !bot) continue;
    const len = Math.min(900, bot.y - top.y);
    const n = 36;
    for (let j = 0; j < n; j++) {
      const yy = top.y + (j / n) * len;
      const wob = Math.sin(j * 0.9 + t * 4 + s.z) * (3 + 0.12 * j);
      glow.fillStyle = rgba(s.col, 0.13 * on * (1 - j / n) ** 1.5);
      glow.fillRect(top.x - s.w * top.k * 0.35 + wob, yy, s.w * top.k * 0.7, len / n + 1);
    }
  }
  // end wall
  const e0 = proj(cam, -HALF, 0, endZ);
  if (e0 && o.drawEnd) o.drawEnd(e0.k, { x: W / 2 - cam.x * e0.k, y: e0.y });
  // facades, far → near
  const fs = [...facades].filter((f) => f.z1 > cam.z + 0.1 && f.z0 < endZ).sort((a, b) => b.z0 - a.z0);
  for (const f of fs) {
    const z0 = Math.max(f.z0, cam.z + 0.12), z1 = Math.min(f.z1, endZ);
    const a = proj(cam, f.side * HALF, 0, z0), b = proj(cam, f.side * HALF, 0, z1), cTop = proj(cam, f.side * HALF, f.top, z1), d = proj(cam, f.side * HALF, f.top, z0);
    if (!a || !b || !cTop || !d) continue;
    const fog = clamp((z0 - cam.z) / 55);
    const base = f.tone < 0.5 ? '#23264A' : '#2E2A52';
    c.fillStyle = base;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cTop.x, cTop.y); c.lineTo(d.x, d.y); c.closePath(); c.fill();
    // windows (lit ones glow)
    for (let yy = 2.6; yy < f.top - 1; yy += 2.8) for (let zz = z0 + 0.6; zz < z1 - 0.8; zz += 1.9) {
      const h = hash(Math.round(zz * 3), Math.round(yy), f.side);
      const q0 = proj(cam, f.side * HALF, yy, zz), q1 = proj(cam, f.side * HALF, yy, zz + 0.9);
      const q2 = proj(cam, f.side * HALF, yy + 1.3, zz + 0.9), q3 = proj(cam, f.side * HALF, yy + 1.3, zz);
      if (!q0 || !q1 || !q2 || !q3) continue;
      const lit = h < 0.22 * (0.4 + f.win);
      const ctx = lit ? glow : c;
      ctx.fillStyle = lit ? rgba(h < 0.07 ? 'magenta' : h < 0.14 ? '#FFC98A' : 'violet', 0.55 * (1 - fog * 0.6)) : rgba('#15162E', 1);
      ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.lineTo(q3.x, q3.y);
      ctx.closePath(); ctx.fill();
    }
    // wet edge light along the wall base
    c.strokeStyle = rgba(f.side < 0 ? 'magenta' : 'cyan', 0.25 * (1 - fog));
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    // fog over the facade
    c.fillStyle = rgba('#3A3470', fog * 0.75);
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cTop.x, cTop.y); c.lineTo(d.x, d.y); c.closePath(); c.fill();
  }
  // blade signs, far → near
  for (const s of [...signs].sort((a, b) => b.z - a.z)) {
    const p = proj(cam, s.x, s.y + s.h, s.z), q = proj(cam, s.x, s.y, s.z);
    if (!p || !q) continue;
    const on = s.on(t);
    const w = s.w * p.k, h = q.y - p.y;
    c.fillStyle = rgba('#0E0F22', 0.95);
    c.fillRect(p.x - w / 2, p.y, w, h);
    glow.strokeStyle = rgba(s.col, 0.25 + 0.75 * on);
    glow.lineWidth = Math.max(1, w * 0.05);
    glow.strokeRect(p.x - w / 2 + w * 0.08, p.y + w * 0.08, w * 0.84, h - w * 0.16);
    const letters = s.text.split('');
    const fam = F.archivo(100, 700);
    if (s.vertical !== false) {
      const size = Math.min(w * 0.62, (h - w * 0.3) / letters.length / 0.95);
      glow.font = font(fam, size);
      glow.fillStyle = rgba(s.col, on > 0 ? 0.2 + 0.8 * on : 0.12);
      letters.forEach((ch, i) => {
        const cw = measure(ch, fam, size);
        glow.fillText(ch, p.x - cw / 2, p.y + w * 0.2 + (i + 0.85) * ((h - w * 0.4) / letters.length));
      });
    } else {
      const size = Math.min(h * 0.62, (w * 0.84) / (measure(s.text, fam, 100) / 100));
      glow.font = font(fam, size);
      glow.fillStyle = rgba(s.col, on > 0 ? 0.2 + 0.8 * on : 0.12);
      glow.fillText(s.text, p.x - measure(s.text, fam, size) / 2, p.y + h / 2 + size * 0.35);
    }
  }
  // lightning wash
  if (o.lightning) { c.fillStyle = rgba('#C9D6FF', 0.5 * o.lightning); c.fillRect(-200, -200, W + 400, H + 400); }
  c.restore();
  if (cam.roll) glow.restore();
}

export { L as LyricsUtil, lerp, ease, clamp };
export type { Lyrics };
