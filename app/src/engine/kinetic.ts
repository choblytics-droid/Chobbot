// Lyric typography, word-synced to data/lyrics.json. Four voices:
//  - dialogueBox: a JRPG text box with the singer's pixel portrait, typed per sung word (pixel font)
//  - slamWord: the current word huge and punchy (Archivo Black-width), the line building up below
//  - karaokeLine: a whole line, sung part lit, unsung dim, each word pops as it lands
//  - stackWords: words dropping into a tight rotated stack (the chant)
import { Lyrics, type Line, type Word } from './lyrics';
import { rgba } from './palette';
import { F, font, measure, glyphX } from './type';
import { drawPix, pixText, pixWrap } from './pixelfont';
import { drawSprite, type SpriteDef } from '../sprites/sprites';
import { clamp, ease, prog, frameIdx, hash } from './util';

/** Characters of `line` revealed at t for a typewriter synced to words (a word types out over its sung span). */
export function typedChars(line: Line, t: number) {
  let n = 0;
  for (const w of line.words) {
    const p = Lyrics.wordProgress(w, t);
    const len = pixText(w.w).length;
    if (p <= 0) break;
    n += Math.ceil(len * Math.min(1, p * 1.6));
    if (p < 1 / 1.6) break;
    n += 1;
  }
  return n;
}

export interface BoxOpts {
  x?: number; y?: number; w?: number; h?: number;
  px?: number;
  def?: SpriteDef;
  accent?: string;
  alpha?: number;
  /** 0..1 box open animation. */
  open?: number;
  mouth?: boolean;
}

/** JRPG dialogue box, bottom of frame, with portrait + name tag. */
export function dialogueBox(c: CanvasRenderingContext2D, line: Line | null, t: number, o: BoxOpts = {}) {
  const W = o.w ?? 1400, H = o.h ?? 230, x = o.x ?? (1920 - W) / 2, y = o.y ?? 1080 - H - 70;
  const px = o.px ?? 6;
  const open = clamp(o.open ?? 1);
  if (open <= 0) return;
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  const hh = H * ease.outBack(open, 1.2);
  const yy = y + (H - hh) / 2;
  // frame: navy fill, double pixel border
  c.fillStyle = 'rgba(8,10,28,0.88)';
  c.fillRect(x, yy, W, hh);
  const acc = rgba(o.accent ?? 'cyan', 1);
  c.fillStyle = rgba('bone', 0.95);
  const b = px;
  c.fillRect(x, yy, W, b); c.fillRect(x, yy + hh - b, W, b); c.fillRect(x, yy, b, hh); c.fillRect(x + W - b, yy, b, hh);
  c.fillStyle = acc;
  c.fillRect(x + 2 * b, yy + 2 * b, W - 4 * b, b / 2); c.fillRect(x + 2 * b, yy + hh - 2.5 * b, W - 4 * b, b / 2);
  if (open < 1) { c.restore(); return; }
  // portrait
  const pw = 32 * 5.5;
  if (o.def) {
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(x + 22, y + (H - pw) / 2 - 4, pw + 8, pw + 8);
    drawSprite(c, o.def, x + 26, y + (H - pw) / 2, 5.5, { blink: (t % 3.3) < 0.12, mouth: o.mouth });
    // name tag
    const nm = o.def.name;
    const tw = nm.length * 6 * 4 + 28;
    c.fillStyle = acc;
    c.fillRect(x + 30, y - 34, tw, 44);
    drawPix(c, nm, x + 44, y - 26, 4, '#0b0d1e');
  }
  if (line) {
    const tx = x + (o.def ? pw + 70 : 50), ty = y + 44;
    const maxChars = Math.floor((W - (tx - x) - 40) / (6 * px));
    const lines = pixWrap(line.text, maxChars);
    let left = typedChars(line, t);
    lines.forEach((ln, i) => {
      if (left <= 0) return;
      drawPix(c, ln, tx, ty + i * 12 * px, px, rgba('bone', 1), { chars: left, shadow: 'rgba(0,0,0,0.6)' });
      left -= ln.length + 1;
    });
    const done = t > line.words[line.words.length - 1]!.end;
    if (done && (frameIdx(t) >> 4) % 2 === 0) drawPix(c, '▶', x + W - 60, y + H - 64, 5, acc);
  }
  c.restore();
}

export interface SlamOpts {
  cx?: number; cy?: number;
  size?: number;
  color?: string;
  dim?: string;
  /** Show the line so far under the slam word. */
  context?: boolean;
  width?: number;
  alpha?: number;
  italic?: boolean;
  maxW?: number;
  jitter?: number;
}

/** Current word slammed huge (scale-in punch on its start), the line so far small beneath. */
export function slamWord(c: CanvasRenderingContext2D, line: Line | null, t: number, o: SlamOpts = {}) {
  if (!line) return;
  const cx = o.cx ?? 960, cy = o.cy ?? 540;
  let cur: Word | null = null;
  for (const w of line.words) if (w.start <= t + 0.03) cur = w;
  if (!cur) return;
  const k = t - cur.start;
  const punch = 1 + 0.35 * Math.pow(0.5, Math.max(0, k) / 0.05) ;
  const fam = o.italic ? F.archivoItalic(100, 800) : F.archivo(o.width ?? 125, 900);
  const text = cur.w.replace(/^[“"(]+|[”",.!?…:;)]+$/g, '').toUpperCase();
  let size = o.size ?? 230;
  const maxW = o.maxW ?? 1700;
  const mw = measure(text, fam, size);
  if (mw > maxW) size *= maxW / mw;
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  c.translate(cx + (o.jitter ?? 0) * (hash(frameIdx(t), 1) - 0.5), cy + (o.jitter ?? 0) * (hash(frameIdx(t), 2) - 0.5));
  c.scale(punch, punch);
  c.font = font(fam, size);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = o.color ?? rgba('bone', 1);
  c.fillText(text, 0, 0);
  c.restore();
  if (o.context !== false) {
    c.save();
    c.globalAlpha = o.alpha ?? 1;
    c.font = font(F.mono(500), 30);
    c.textAlign = 'center';
    c.textBaseline = 'top';
    let s = '';
    for (const w of line.words) { if (w.start > t + 0.03) break; s += (s ? ' ' : '') + w.w; }
    c.fillStyle = o.dim ?? rgba('bone', 0.65);
    c.letterSpacing = '2px';
    c.fillText(s.toUpperCase(), cx, cy + size * 0.5 + 34);
    c.restore();
  }
}

export interface KaraokeOpts {
  x: number; y: number;
  size?: number;
  family?: string;
  sung?: string;
  unsung?: string;
  align?: 'left' | 'center';
  alpha?: number;
  /** show unsung words this many seconds early (dim) */
  lead?: number;
  pop?: number;
  upper?: boolean;
  maxW?: number;
}

/** A whole line: sung words lit and popping in, unsung words dim. Returns the drawn width. */
export function karaokeLine(c: CanvasRenderingContext2D, line: Line, t: number, o: KaraokeOpts) {
  let size = o.size ?? 72;
  const fam = o.family ?? F.archivo(100, 800);
  const txt = o.upper ? line.text.toUpperCase() : line.text;
  let full = measure(txt, fam, size);
  if (o.maxW && full > o.maxW) { size *= o.maxW / full; full = o.maxW; }
  const x0 = o.align === 'center' ? o.x - full / 2 : o.x;
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  c.font = font(fam, size);
  c.textBaseline = 'alphabetic';
  let idx = 0;
  const lead = o.lead ?? 0.4;
  for (const w of line.words) {
    const i = txt.toLowerCase().indexOf(w.w.toLowerCase(), idx);
    const at = i >= 0 ? i : idx;
    const word = txt.slice(at, at + w.w.length);
    const x = x0 + glyphX(txt, at, fam, size);
    idx = at + w.w.length;
    const p = Lyrics.wordProgress(w, t);
    const vis = prog(t, w.start - lead, w.start, ease.outCubic);
    if (vis <= 0) continue;
    const popk = p > 0 ? Math.pow(0.5, (t - w.start) / 0.06) : 0;
    const dy = -(o.pop ?? 14) * popk;
    c.fillStyle = p > 0 ? (o.sung ?? rgba('bone', 1)) : (o.unsung ?? rgba('bone', 0.28));
    c.globalAlpha = (o.alpha ?? 1) * (p > 0 ? 1 : vis);
    c.fillText(word, x, o.y + dy);
  }
  c.restore();
  return full;
}

/** Words of the lines in [t0, t1] dropping into a stack, newest biggest (the chant). */
export function stackWords(c: CanvasRenderingContext2D, lines: Line[], t: number, o: { x: number; y: number; size?: number; colors?: string[]; rot?: number; max?: number }) {
  const words = lines.flatMap((l) => l.words).filter((w) => w.start <= t + 0.02);
  const shown = words.slice(-(o.max ?? 6));
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? -0.08);
  let y = 0;
  for (let i = shown.length - 1; i >= 0; i--) {
    const w = shown[i]!;
    const age = shown.length - 1 - i;
    const size = (o.size ?? 200) * Math.pow(0.62, age);
    const k = prog(t, w.start - 0.02, w.start + 0.12, ease.outBack);
    const text = w.w.replace(/[“”".,…]/g, '').toUpperCase();
    c.font = font(F.archivo(age === 0 ? 125 : 100, 900), size);
    c.textBaseline = 'alphabetic';
    c.textAlign = 'center';
    c.globalAlpha = age === 0 ? 1 : 0.8 - age * 0.1;
    c.fillStyle = (o.colors ?? [rgba('bone', 1)])[(w.gi) % (o.colors?.length ?? 1)]!;
    c.save();
    c.translate(0, y - (1 - k) * 200);
    c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
    c.fillText(text, 0, 0);
    c.restore();
    y -= size * 0.86;
  }
  c.restore();
}
