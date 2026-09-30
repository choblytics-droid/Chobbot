// Word-synced lyrics (data/lyrics.json, clip time), with the karaoke helpers the plates use.
export interface Word { w: string; start: number; end: number }
export interface Line { i: number; text: string; start: number; end: number; words: Word[] }

export class Lyrics {
  constructor(public lines: Line[]) {}
  static async load(): Promise<Lyrics> {
    const j = await (await fetch('data/lyrics.json')).json();
    return new Lyrics(j.lines.map((l: Omit<Line, 'i'>, i: number) => ({ ...l, i })));
  }
  /** The line containing a phrase (case/punctuation-insensitive). */
  get(q: string, nth = 0): Line {
    const n = (s: string) => s.toLowerCase().replace(/[^a-z' ]/g, '');
    const hits = this.lines.filter((l) => n(l.text).includes(n(q)));
    const l = hits[nth];
    if (!l) throw new Error(`lyric not found: ${q}`);
    return l;
  }
  /** The line being sung at t (or the next one within `lead` s, or the last one within `hold` s). */
  lineAt(t: number, lead = 0.4, hold = 0.6): Line | null {
    for (const l of this.lines) if (t >= l.start - lead && t < l.end + hold) return l;
    return null;
  }
  linesIn(t0: number, t1: number) { return this.lines.filter((l) => l.end > t0 && l.start < t1); }
  /** 0..1 sung progress of a word. */
  static wordProgress(w: Word, t: number) { return t <= w.start ? 0 : t >= w.end ? 1 : (t - w.start) / (w.end - w.start); }
  /** Plain word (no punctuation), upper-cased. */
  static bare(w: Word) { return w.w.replace(/[^A-Za-z']/g, '').toUpperCase(); }
}

let cache: Promise<Lyrics> | null = null;
export const loadLyrics = () => (cache ??= Lyrics.load());
