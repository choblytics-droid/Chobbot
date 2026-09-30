// A 5x7 bitmap pixel font (uppercase, digits, punctuation) drawn as rects on Canvas2D: the "game"
// voice of the video (dialogue boxes, HUD, arcade text) matching the 32x32 sprites.
const G: Record<string, string> = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  '0': '01110 10001 10011 10101 11001 10001 01110', '1': '00100 01100 00100 00100 00100 00100 01110',
  '2': '01110 10001 00001 00010 00100 01000 11111', '3': '11111 00010 00100 00010 00001 10001 01110',
  '4': '00010 00110 01010 10010 11111 00010 00010', '5': '11111 10000 11110 00001 00001 10001 01110',
  '6': '00110 01000 10000 11110 10001 10001 01110', '7': '11111 00001 00010 00100 01000 01000 01000',
  '8': '01110 10001 10001 01110 10001 10001 01110', '9': '01110 10001 10001 01111 00001 00010 01100',
  ' ': '00000 00000 00000 00000 00000 00000 00000', '.': '00000 00000 00000 00000 00000 01100 01100',
  ',': '00000 00000 00000 00000 01100 00100 01000', '!': '00100 00100 00100 00100 00100 00000 00100',
  '?': '01110 10001 00001 00010 00100 00000 00100', "'": '00100 00100 01000 00000 00000 00000 00000',
  '"': '01010 01010 10100 00000 00000 00000 00000', '-': '00000 00000 00000 11111 00000 00000 00000',
  ':': '00000 01100 01100 00000 01100 01100 00000', '(': '00010 00100 01000 01000 01000 00100 00010',
  ')': '01000 00100 00010 00010 00010 00100 01000', '/': '00001 00010 00010 00100 01000 01000 10000',
  '>': '01000 00100 00010 00001 00010 00100 01000', '<': '00010 00100 01000 10000 01000 00100 00010',
  '_': '00000 00000 00000 00000 00000 00000 11111', '#': '01010 11111 01010 01010 11111 01010 00000',
  '+': '00000 00100 00100 11111 00100 00100 00000', '*': '00000 10101 01110 11111 01110 10101 00000',
  '=': '00000 00000 11111 00000 11111 00000 00000', '%': '11001 11010 00010 00100 01000 01011 10011',
  '▶': '10000 11000 11100 11110 11100 11000 10000', // ▶
  '♥': '00000 01010 11111 11111 01110 00100 00000', // ♥
  '█': '11111 11111 11111 11111 11111 11111 11111', // █
};

const MAP: Record<string, string> = { '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', '×': 'X' };

/** Normalise display text to what the pixel font can draw. */
export function pixText(s: string) {
  let o = '';
  for (const ch of s) o += MAP[ch] ?? ch;
  return o.toUpperCase();
}

const rows = new Map<string, number[][]>();
function glyph(ch: string) {
  let g = rows.get(ch);
  if (!g) {
    const src = G[ch] ?? G['?']!;
    g = src.split(' ').map((r) => r.split('').map(Number));
    rows.set(ch, g);
  }
  return g;
}

/** Advance of a string in pixels at pixel size `px` (6 cells per char incl. 1 spacing). */
export const pixWidth = (s: string, px: number, spacing = 1) => pixText(s).length * (5 + spacing) * px - spacing * px;

/**
 * Draw pixel text with its top-left at (x, y). `chars` limits how many characters are drawn
 * (typewriter reveal); `shadow` draws a hard 1-px drop shadow in that colour.
 */
export function drawPix(c: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, color: string, o: { chars?: number; shadow?: string; spacing?: number; wave?: number; t?: number; jitter?: number } = {}) {
  const t = pixText(s);
  const n = Math.min(t.length, o.chars ?? t.length);
  const sp = o.spacing ?? 1;
  const draw = (col: string, dx: number, dy: number) => {
    c.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const g = glyph(t[i]!);
      const gx = x + i * (5 + sp) * px + dx;
      const wy = o.wave ? Math.round(Math.sin((o.t ?? 0) * 8 + i * 0.6) * o.wave) * px : 0;
      for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r]![q]) c.fillRect(gx + q * px, y + r * px + dy + wy, px, px);
    }
  };
  if (o.shadow) draw(o.shadow, px, px);
  draw(color, 0, 0);
}

/** Word-wrap a string to lines of at most `maxChars` pixel-font characters. */
export function pixWrap(s: string, maxChars: number) {
  const words = pixText(s).split(' ');
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > maxChars) { out.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}

/** The 5x7 cells of a character (rows of 0/1), for building pixel text out of 3D boxes. */
export function glyphCells(ch: string): number[][] { return glyph(pixText(ch)[0] ?? ' '); }
