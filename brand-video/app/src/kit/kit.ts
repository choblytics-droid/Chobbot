// The brand kit: the pieces every Chobbot film shares, so each series varies its world while these
// stay identical (docs/SERIES.md, "the consistency system"):
//   - beat-grid helpers and the timed copy (films/<film>/copy.json → data/lyrics.json)
//   - the companion in its three stages (1 live spark, 2 + memory ring, 3 full form)
//   - the chat card (our own generic chat, never a real platform's UI)
//   - the type voices: Archivo display slams, IBM Plex Mono for the machine and the chat
import type { AudioData } from '../engine/audio';
import { LineBatch } from '../engine/lines';
import { HEX, LIN, rgba, type PaletteKey } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import type { Line, Lyrics } from '../engine/lyrics';
import { clamp, ease, hash, lerp, prog, TAU } from '../engine/util';

export type P2 = { x: number; y: number };
export type RGB = [number, number, number];

// ------------------------------------------------------------------ timing
/** Time of bar `bar`, beat `beat` (both 0-based, fractional ok) on the analysed grid. */
export const barT = (au: AudioData, bar: number, beat = 0) => au.timeOfBeat(bar * 4 + beat);
/** Continuous bar position at t. */
export const barAt = (au: AudioData, t: number) => au.beatAt(t) / 4;

/** A copy line by its id in copy.json. */
export function line(ly: Lyrics, id: string): Line {
  const l = ly.lines.find((x) => (x as Line & { id?: string }).id === id);
  if (!l) throw new Error(`copy line not found: ${id}`);
  return l;
}

/** How many characters of a line are visible at t when it is typed word by word (each word typed across its window). */
export function typedChars(l: Line, t: number) {
  let n = 0;
  for (let i = 0; i < l.words.length; i++) {
    const w = l.words[i]!;
    const k = clamp((t - w.start) / Math.max(0.03, (w.end - w.start) * 0.8));
    n += Math.floor(k * w.w.length + 1e-6) + (k >= 1 && i < l.words.length - 1 ? 1 : 0);
    if (k < 1) break;
  }
  return n;
}

const Lc = (k: PaletteKey, m: number): RGB => [LIN[k][0] * m, LIN[k][1] * m, LIN[k][2] * m];

// ------------------------------------------------------------------ the companion
/**
 * The companion, the one character in every film. `stage` is continuous 1..3 so it can grow on screen:
 *   1   the live bot: a warm spark with a short flickering halo (free Live app)
 *   2   + the memory ring: a ring of ticks orbiting it, one per remembered moment (Insights)
 *   3   + the full form: a speech bubble of light around it, with two calm eyes (the merged companion)
 * Drawn into an additive 2D LineBatch. `r` is the base size in px (spark core radius ≈ r/4).
 */
export function companion(lb: LineBatch, x: number, y: number, t: number, o: { stage?: number; r?: number; intensity?: number; memories?: number; blink?: number; look?: P2 } = {}) {
  const st = o.stage ?? 1, r = o.r ?? 40, I = o.intensity ?? 1;
  const flick = 0.88 + 0.12 * Math.sin(t * 83.1) * Math.sin(t * 51.7);
  const k = I * flick;
  // the spark: halo, hot ring, white core, four soft rays
  lb.seg2(x, y, x + 0.01, y, r * 2.4, Lc('signal', 0.32 * k), 0.3);
  lb.seg2(x, y, x + 0.01, y, r * 1.1, Lc('signal', 1.6 * k), 0.7);
  lb.seg2(x, y, x + 0.01, y, r * 0.55, Lc('ember', 3.2 * k), 0.95);
  lb.seg2(x, y, x + 0.01, y, r * 0.22, [7 * k, 6.5 * k, 5.5 * k], 1);
  for (let i = 0; i < 4; i++) {
    const a = i * (TAU / 4) + t * 0.9 + 0.3;
    const len = r * (0.9 + 0.35 * hash(Math.floor(t * 24), i));
    lb.seg2(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, r * 0.05, Lc('ember', 2.2 * k), 0.6);
  }
  // stage 2: the memory ring
  const m = clamp(st - 1);
  if (m > 0) {
    const R = r * 1.75, n = o.memories ?? 12;
    const rot = t * 0.35;
    const segs = 96;
    for (let i = 0; i < segs; i++) {
      const a0 = rot + (i / segs) * TAU, a1 = rot + ((i + 0.6) / segs) * TAU;
      if (i / segs > ease.outCubic(m)) break;
      lb.seg2(x + Math.cos(a0) * R, y + Math.sin(a0) * R, x + Math.cos(a1) * R, y + Math.sin(a1) * R, r * 0.035, Lc('signal', 1.3 * I), 0.8);
    }
    for (let i = 0; i < n; i++) {
      const on = clamp(m * n * 1.2 - i);
      if (on <= 0) continue;
      const a = rot * 1.4 + (i / n) * TAU;
      const r0 = R - r * 0.14, r1 = R + r * 0.18 * (0.6 + 0.4 * hash(i, 3));
      lb.seg2(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1, r * 0.06, Lc('ember', 2.4 * I * on), on);
    }
  }
  // stage 3: the full form, a speech bubble of light, two eyes
  const fm = clamp(st - 2);
  if (fm > 0) {
    const bw = r * 3.3, bh = r * 2.5, rad = r * 0.9;
    const pts = bubblePath(x, y, bw, bh, rad, r);
    const n = Math.floor(pts.length * ease.inOutCubic(fm));
    for (let i = 0; i + 1 < n; i++) lb.seg2(pts[i]!.x, pts[i]!.y, pts[i + 1]!.x, pts[i + 1]!.y, r * 0.09, Lc('signal', 1.8 * I), 0.9);
    const ea = clamp(fm * 2 - 1) * (1 - (o.blink ?? 0));
    if (ea > 0) {
      const lk = o.look ?? { x: 0, y: 0 };
      for (const s of [-1, 1]) {
        const ex = x + s * r * 0.55 + lk.x * r * 0.15, ey = y - r * 0.15 + lk.y * r * 0.12;
        const h = r * 0.28 * ea;
        lb.seg2(ex, ey - h / 2, ex, ey + h / 2, r * 0.17, Lc('ember', 2.8 * I), 1);
      }
    }
  }
}

/** Outline of the companion's speech bubble (rounded rect with a tail at bottom-left), as points. */
function bubblePath(cx: number, cy: number, w: number, h: number, rad: number, r: number): P2[] {
  const pts: P2[] = [];
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  const arc = (ax: number, ay: number, a0: number, a1: number) => {
    for (let i = 0; i <= 10; i++) { const a = lerp(a0, a1, i / 10); pts.push({ x: ax + Math.cos(a) * rad, y: ay + Math.sin(a) * rad }); }
  };
  arc(x0 + rad, y0 + rad, Math.PI, Math.PI * 1.5);
  arc(x1 - rad, y0 + rad, Math.PI * 1.5, Math.PI * 2);
  arc(x1 - rad, y1 - rad, 0, Math.PI * 0.5);
  pts.push({ x: x0 + w * 0.42, y: y1 }, { x: x0 + w * 0.2, y: y1 + r * 0.75 }, { x: x0 + w * 0.26, y: y1 });
  arc(x0 + rad, y1 - rad, Math.PI * 0.5, Math.PI);
  pts.push(pts[0]!);
  return pts;
}

/** A light streak from a to b (the companion travelling), head at progress u. */
export function streak(lb: LineBatch, a: P2, b: P2, u: number, w = 6, I = 1) {
  const n = 18;
  for (let i = 0; i < n; i++) {
    const u0 = u - (i + 1) * 0.035, u1 = u - i * 0.035;
    if (u1 <= 0) break;
    const p0 = { x: lerp(a.x, b.x, Math.max(0, u0)), y: lerp(a.y, b.y, Math.max(0, u0)) };
    const p1 = { x: lerp(a.x, b.x, u1), y: lerp(a.y, b.y, u1) };
    const f = 1 - i / n;
    lb.seg2(p0.x, p0.y, p1.x, p1.y, w * f, Lc('signal', 2.2 * I * f), f);
  }
}

// ------------------------------------------------------------------ the chat card
export interface ChatMsg {
  user: string;
  /** the copy line whose words type this message; or a fixed text shown at `at` */
  line?: Line;
  text?: string;
  at?: number;
  /** who speaks: a viewer, the bot (warm), or a system line (dim) */
  kind?: 'viewer' | 'bot' | 'system';
  /** optional small tag after the name (e.g. "first message", "visit 6") */
  tag?: string;
  /** 0..1 dim (an unanswered message going cold) */
  fade?: number;
}

/**
 * The chat card: a dark glass panel with messages in Plex Mono, newest at the bottom.
 * Our own generic design (no platform UI). Returns the card's bottom-right corner.
 */
export function chatCard(c: CanvasRenderingContext2D, x: number, y: number, w: number, msgs: ChatMsg[], t: number, o: { size?: number; alpha?: number; warm?: number; title?: string } = {}) {
  const size = o.size ?? 38, lh = size * 1.32, pad = size * 0.8, A = o.alpha ?? 1;
  const warm = o.warm ?? 0;
  const visible = msgs.filter((m) => (m.line ? t >= m.line.words[0]!.start - 0.02 : t >= (m.at ?? 0)));
  // wrap each message
  const fam = F.mono(400), famB = F.mono(600);
  const rows: { m: ChatMsg; parts: string[] }[] = [];
  for (const m of visible) {
    const full = m.line ? m.line.text : m.text ?? '';
    const shown = m.line ? full.slice(0, typedChars(m.line, t)) : full;
    const head = `${m.user}${m.kind === 'system' ? '' : ':'} `;
    const parts = wrap(head + shown, fam, size, w - pad * 2);
    rows.push({ m, parts });
  }
  const titleH = size * 1.6;
  const h = titleH + pad * 0.6 + Math.max(1, rows.reduce((a, r) => a + r.parts.length, 0)) * lh + pad;
  // panel
  c.save();
  c.globalAlpha = A;
  roundRect(c, x, y, w, h, size * 0.5);
  c.fillStyle = rgba('ink2', 0.88);
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = warm > 0 ? mixRgba('graphite', 'signal', warm, 0.9) : rgba('graphite', 0.8);
  c.stroke();
  // title bar
  c.font = font(famB, size * 0.62);
  c.fillStyle = rgba('ash', 0.85);
  c.fillText(o.title ?? 'STREAM CHAT', x + pad, y + size * 1.05);
  c.fillStyle = rgba(warm > 0.5 ? 'signal' : 'alert', 0.9);
  c.beginPath(); c.arc(x + w - pad - size * 0.2, y + size * 0.85, size * 0.16, 0, TAU); c.fill();
  c.fillStyle = rgba('graphite', 0.6);
  c.fillRect(x + pad * 0.5, y + titleH, w - pad, 1.5);
  // messages
  let yy = y + titleH + pad * 0.6 + size;
  for (const r of rows) {
    const m = r.m, fade = m.fade ?? 0;
    const nameCol: PaletteKey = m.kind === 'bot' ? 'signal' : m.kind === 'system' ? 'graphite' : 'frost';
    const textCol: PaletteKey = m.kind === 'system' ? 'graphite' : 'bone';
    r.parts.forEach((p, i) => {
      if (i === 0) {
        const nm = `${m.user}${m.kind === 'system' ? '' : ':'}`;
        c.font = font(famB, size);
        c.fillStyle = rgba(nameCol, (m.kind === 'system' ? 0.9 : 1) * (1 - fade * 0.6));
        c.fillText(nm, x + pad, yy);
        const nx = x + pad + measure(nm + ' ', famB, size);
        c.font = font(fam, size);
        c.fillStyle = rgba(textCol, 1 - fade * 0.75);
        c.fillText(p.slice(nm.length + 1), nx, yy);
        if (m.tag) {
          const tw = measure(p, fam, size) + size * 0.5;
          c.font = font(fam, size * 0.55);
          c.fillStyle = rgba(m.kind === 'bot' ? 'signal' : 'ash', 0.8 * (1 - fade));
          c.fillText(m.tag, x + pad + tw, yy - size * 0.05);
        }
      } else {
        c.font = font(fam, size);
        c.fillStyle = rgba(textCol, 1 - fade * 0.75);
        c.fillText(p, x + pad, yy);
      }
      yy += lh;
    });
  }
  c.restore();
  return { x: x + w, y: y + h, rowsY: yy - lh };
}

function mixRgba(a: PaletteKey, b: PaletteKey, k: number, al: number) {
  const pa = parseInt(HEX[a].slice(1), 16), pb = parseInt(HEX[b].slice(1), 16);
  const ch = (n: number, sh: number) => (n >> sh) & 255;
  const m = (sh: number) => Math.round(lerp(ch(pa, sh), ch(pb, sh), k));
  return `rgba(${m(16)},${m(8)},${m(0)},${al})`;
}

export function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** Greedy word wrap for one font size. */
export function wrap(text: string, fam: string, size: number, maxW: number): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    const nx = cur ? `${cur} ${w}` : w;
    if (cur && measure(nx, fam, size) > maxW) { out.push(cur); cur = w; } else cur = nx;
  }
  if (cur || out.length === 0) out.push(cur);
  return out;
}

// ------------------------------------------------------------------ type voices
/**
 * The display voice: a copy line slammed word by word (Archivo, condensed and heavy), each word
 * landing on its time with a short scale-down. Left-aligned at x, baseline y; wraps to maxW.
 * Returns the y below the block.
 */
export function slamLine(c: CanvasRenderingContext2D, l: Line, t: number, x: number, y: number, o: { size?: number; width?: number; weight?: number; col?: PaletteKey; hot?: PaletteKey; maxW?: number; upper?: boolean; alpha?: number; align?: 'left' | 'center'; cx?: number } = {}) {
  const size = o.size ?? 140, fam = F.archivo(o.width ?? 75, o.weight ?? 900), lh = size * 0.98;
  const upper = o.upper ?? true;
  const words = l.words.map((w) => (upper ? w.w.toUpperCase() : w.w));
  const sp = measure(' ', fam, size) * 1.1;
  const maxW = o.maxW ?? 900;
  // layout rows
  const rows: number[][] = [[]];
  let rw = 0;
  words.forEach((w, i) => {
    const ww = measure(w, fam, size);
    if (rows[rows.length - 1]!.length && rw + sp + ww > maxW) { rows.push([]); rw = 0; }
    rw += (rows[rows.length - 1]!.length ? sp : 0) + ww;
    rows[rows.length - 1]!.push(i);
  });
  c.font = font(fam, size);
  rows.forEach((row, r) => {
    const widths = row.map((i) => measure(words[i]!, fam, size));
    const total = widths.reduce((a, b) => a + b, 0) + sp * (row.length - 1);
    let cx = o.align === 'center' ? (o.cx ?? x) - total / 2 : x;
    row.forEach((i, k) => {
      const w = l.words[i]!;
      const u = (t - w.start) / 0.12;
      if (u >= 0) {
        const s = 1 + 0.35 * Math.pow(0.5, u * 1.6) * (u < 6 ? 1 : 0);
        const hot = t < w.end && o.hot;
        c.save();
        c.translate(cx + widths[k]! / 2, y + r * lh - size * 0.35);
        c.scale(s, s);
        c.fillStyle = rgba(hot ? o.hot! : o.col ?? 'bone', (o.alpha ?? 1) * clamp(u * 3));
        c.fillText(words[i]!, -widths[k]! / 2, size * 0.35);
        c.restore();
      }
      cx += widths[k]! + sp;
    });
  });
  return y + rows.length * lh;
}

/** The machine voice: a small mono label. */
export function mono(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: { size?: number; col?: PaletteKey; a?: number; weight?: number; align?: CanvasTextAlign; track?: number } = {}) {
  c.font = font(F.mono(o.weight ?? 500), o.size ?? 26);
  c.textAlign = o.align ?? 'left';
  c.fillStyle = rgba(o.col ?? 'ash', o.a ?? 0.85);
  c.fillText(o.track ? s.split('').join(' ') : s, x, y);
  c.textAlign = 'left';
}

/** A typed line in the mono voice (chars appear with the words' timing), with a caret while typing. */
export function typed(c: CanvasRenderingContext2D, l: Line, t: number, x: number, y: number, o: { size?: number; col?: PaletteKey; a?: number; caret?: boolean } = {}) {
  const n = typedChars(l, t);
  const s = l.text.slice(0, n);
  mono(c, s, x, y, { size: o.size ?? 30, col: o.col ?? 'bone', a: o.a ?? 1 });
  if (o.caret !== false && n < l.text.length && t >= l.words[0]!.start - 0.3) {
    const cw = measure(s, F.mono(500), o.size ?? 30);
    if (Math.floor(t * 4) % 2 === 0) { c.fillStyle = rgba(o.col ?? 'bone', 0.9); c.fillRect(x + cw + 3, y - (o.size ?? 30) * 0.8, (o.size ?? 30) * 0.5, (o.size ?? 30)); }
  }
}

/** Progress helper re-exported for scenes. */
export { prog, ease, clamp, lerp };
