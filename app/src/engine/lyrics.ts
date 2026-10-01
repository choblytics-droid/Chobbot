// Word-timed lyrics (data/lyrics.json) with queries for karaoke rendering.
import { smart } from './type';
import { V2 } from '../config';

/**
 * v2 timing fixes (data/lyrics.json stays as it is for v1). Checked against the vocal stem envelope:
 * in the outro the aligner crammed "bad things..." and "Keep my name in" into 0.7 s at 152.1 s, while
 * the song has one held phrase at 148.3-150.3 s and rhythmic bursts at 150.8-156.9 s; "It's cozy in
 * your head" starts on the burst at 159.25 s, not 160.45 s. [start, end] per word.
 */
const FIXES_V2: Record<number, [number, number][]> = {
  32: [[148.35, 148.85], [148.9, 149.25], [149.3, 149.65], [149.7, 150.4]],
  33: [[150.75, 151.1], [151.15, 151.55], [151.6, 152.4], [152.5, 152.95], [153.0, 153.35], [153.4, 156.9]],
  34: [[159.25, 159.45], [159.5, 160.3], [160.4, 160.7], [160.75, 161.2], [161.3, 165.3]],
};
/**
 * The aligner sometimes ran out of slot and squeezed a line's last words into ~0.05 s each (they flash by
 * in the kinetic type). Re-space such runs: if a long gap (> 0.8 s) inside the line precedes them, the
 * phrase after the gap starts a quarter into the gap; then the squeezed words and the word before them
 * share their span by letter count, so every word is on screen for a readable moment.
 */
export function respace(l: any) {
  const ws = l.words as { w: string; start: number; end: number }[];
  const tiny = (w: { start: number; end: number }) => w.end - w.start < 0.08;
  for (let k = 1; k < ws.length; k++) {
    if (!(tiny(ws[k]!) && k + 1 < ws.length && tiny(ws[k + 1]!)) && !(tiny(ws[k]!) && k === ws.length - 1 && tiny(ws[k - 1]!))) continue;
    let a = k; while (a > 0 && tiny(ws[a - 1]!)) a--;
    let b = k; while (b + 1 < ws.length && tiny(ws[b + 1]!)) b++;
    // include the word before the run; and pull the phrase earlier into a preceding gap
    let s0 = Math.max(0, a - 1);
    for (let g = s0; g >= 1; g--) {
      const gap = ws[g]!.start - ws[g - 1]!.end;
      if (gap > 0.8) { ws[g]!.start = ws[g - 1]!.end + gap * 0.25; s0 = g; break; }
      if (g < a - 2) break;
    }
    const t0 = ws[s0]!.start, t1 = ws[b]!.end, run = ws.slice(s0, b + 1);
    const tot = run.reduce((n, w) => n + w.w.length + 2, 0);
    let t = t0;
    for (const w of run) { const d = ((w.w.length + 2) / tot) * (t1 - t0); w.start = t; w.end = t + d; t += d; }
    k = b;
  }
}
function applyFixes(j: any) {
  for (const l of j.lines) respace(l);
  for (const [li, ws] of Object.entries(FIXES_V2)) {
    const l = j.lines[+li];
    if (!l || l.words.length !== ws.length) continue;
    l.words.forEach((w: any, i: number) => { w.start = ws[i]![0]; w.end = ws[i]![1]; });
    l.start = ws[0]![0]; l.end = ws[ws.length - 1]![1];
  }
  return j;
}

export interface Word {
  w: string; // display token (punctuation attached, typographic quotes: don’t, ’cause)
  start: number;
  end: number;
  conf?: number;
  syl?: [number, number][];
  /** filled in by Lyrics: */
  line: number;
  index: number; // index within line
  gi: number; // global word index
}
export interface Line {
  i: number;
  text: string;
  start: number;
  end: number;
  words: Word[];
}

export class Lyrics {
  lines: Line[];
  words: Word[];
  constructor(j: { lines: Omit<Line, 'words'> & { words: Omit<Word, 'line' | 'index' | 'gi'>[] }[] | any[] }) {
    // display text gets curly apostrophes and quotes (the data keeps the typed ones); mono UI
    // text that wants them straight uses plain()
    this.lines = (j.lines as any[]).map((l, li) => ({
      ...l,
      i: li,
      text: smart(l.text),
      words: (l.words as any[]).map((w, wi) => ({ ...w, w: smart(w.w), line: li, index: wi, gi: 0 })),
    }));
    this.words = this.lines.flatMap((l) => l.words);
    this.words.forEach((w, i) => (w.gi = i));
  }

  static async load(): Promise<Lyrics> {
    for (const url of ['data/lyrics.json', 'data/lyrics.approx.json']) {
      const r = await fetch(url);
      if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) return new Lyrics(V2 ? applyFixes(await r.json()) : await r.json());
    }
    throw new Error('no lyrics data found');
  }

  /** The line being sung at t (or null in gaps). */
  lineAt(t: number): Line | null {
    return this.lines.find((l) => t >= l.start && t < l.end) ?? null;
  }
  /** Most recent line that started at or before t. */
  lastLine(t: number): Line | null {
    let best: Line | null = null;
    for (const l of this.lines) if (l.start <= t) best = l;
    return best;
  }
  nextLine(t: number): Line | null {
    return this.lines.find((l) => l.start > t) ?? null;
  }
  linesIn(t0: number, t1: number): Line[] {
    return this.lines.filter((l) => l.end > t0 && l.start < t1);
  }
  /** Lines whose text includes `s` (case-insensitive, straight or curly quotes). Handy for finding a lyric by content. */
  find(s: string): Line[] {
    const q = fold(s);
    return this.lines.filter((l) => fold(l.text).includes(q));
  }
  /** First line containing `s`; throws if missing (fail loudly while authoring). */
  get(s: string, nth = 0): Line {
    const l = this.find(s)[nth];
    if (!l) throw new Error(`lyric not found: ${s}`);
    return l;
  }
  wordAt(t: number): Word | null {
    return this.words.find((w) => t >= w.start && t < w.end) ?? null;
  }
  lastWord(t: number): Word | null {
    let best: Word | null = null;
    for (const w of this.words) if (w.start <= t) best = w;
    return best;
  }
  /** Words whose normalized text matches (e.g. 'p(doom)'). */
  findWords(s: string): Word[] {
    const q = norm(s);
    return this.words.filter((w) => norm(w.w) === q);
  }

  /**
   * Sung progress of a word at time t: 0 before start, 1 after end, linear inside
   * (or piecewise across syllables when available). Use for karaoke wipes.
   */
  static wordProgress(w: Word, t: number): number {
    if (t <= w.start) return 0;
    if (t >= w.end) return 1;
    if (w.syl && w.syl.length > 1) {
      const n = w.syl.length;
      for (let i = 0; i < n; i++) {
        const [a, b] = w.syl[i]!;
        if (t < a) return i / n;
        if (t < b) return (i + (t - a) / Math.max(1e-3, b - a)) / n;
      }
      return 1;
    }
    return (t - w.start) / Math.max(1e-3, w.end - w.start);
  }

  /** Progress through a whole line in characters (0..text.length), for per-glyph wipes. */
  static lineCharProgress(l: Line, t: number): number {
    let chars = 0;
    for (const w of l.words) {
      const p = Lyrics.wordProgress(w, t);
      chars += p * w.w.length;
      if (p < 1) break;
      chars += 1; // the space
    }
    return Math.min(chars, l.text.length);
  }
}

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9()]/g, '');
const fold = (s: string) => s.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
