// The text layer over every Story film: lyric subtitles (the written lyric, lit word by word as it is
// sung), small captions (the Text column of the script), the opening card and chat lines.
// Drawn crisp at full resolution over the pixel art (the HD-2D split: pixel world, clean type).
import type * as THREE from 'three';
import { Layer2D, W, H, PORTRAIT, type Compositor } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { rgba } from '../engine/palette';
import type { Line } from '../engine/lyrics';
import { clamp, ease } from '../engine/util';
import { roundRect, wrap, typedChars } from './kit';

export class Overlay {
  layer = new Layer2D();
  get c() { return this.layer.ctx; }
  begin() { this.layer.clear(); }
  draw(r: THREE.WebGLRenderer, comp: Compositor, out: THREE.WebGLRenderTarget) {
    comp.draw(r, this.layer.upload(), out, { mode: 'normal' });
  }

  /**
   * The lyric subtitle, lower third: the whole line shows a beat early at low opacity, each word
   * lights as it is sung. `a` fades the whole line.
   */
  lyric(l: Line | null, t: number, o: { y?: number; size?: number; a?: number } = {}) {
    if (!l) return;
    const c = this.c, size = o.size ?? (PORTRAIT ? 62 : 54), fam = F.archivo(100, 700);
    const inA = clamp((t - (l.words[0]!.start - 0.35)) / 0.2), outA = 1 - clamp((t - (l.end + 0.35)) / 0.25);
    const A = (o.a ?? 1) * inA * outA;
    if (A <= 0) return;
    const maxW = W * 0.84, sp = measure(' ', fam, size);
    const words = l.words.map((w) => w.w);
    const rows: number[][] = [[]];
    let rw = 0;
    words.forEach((w, i) => {
      const ww = measure(w, fam, size);
      if (rows[rows.length - 1]!.length && rw + sp + ww > maxW) { rows.push([]); rw = 0; }
      rw += (rows[rows.length - 1]!.length ? sp : 0) + ww;
      rows[rows.length - 1]!.push(i);
    });
    // two rows: balance them (no single orphan word)
    if (rows.length === 2) {
      const all = [...rows[0]!, ...rows[1]!], wd = all.map((i) => measure(words[i]!, fam, size));
      let best = 1, bestD = Infinity;
      for (let k = 1; k < all.length; k++) {
        const a = wd.slice(0, k).reduce((x, y) => x + y + sp, -sp), b = wd.slice(k).reduce((x, y) => x + y + sp, -sp);
        if (a <= maxW && b <= maxW && Math.abs(a - b) < bestD) { bestD = Math.abs(a - b); best = k; }
      }
      rows.splice(0, 2, all.slice(0, best), all.slice(best));
    }
    const lh = size * 1.18, y0 = (o.y ?? H * 0.8) - ((rows.length - 1) * lh) / 2;
    c.save();
    c.font = font(fam, size);
    c.textBaseline = 'middle';
    rows.forEach((row, r) => {
      const ws = row.map((i) => measure(words[i]!, fam, size));
      let x = (W - (ws.reduce((a, b) => a + b, 0) + sp * (row.length - 1))) / 2;
      row.forEach((i, k) => {
        const w = l.words[i]!;
        const on = clamp((t - w.start) / 0.09);
        c.shadowColor = 'rgba(0,0,0,0.75)'; c.shadowBlur = size * 0.35; c.shadowOffsetY = size * 0.04;
        c.fillStyle = rgba('bone', A * (0.32 + 0.68 * on));
        c.fillText(words[i]!, x, y0 + r * lh - size * 0.06 * (1 - ease.outCubic(on)) * (on > 0 ? 1 : 0));
        x += ws[k]! + sp;
      });
    });
    c.restore();
  }

  /** A caption chip in the machine voice (Plex Mono), e.g. `3 watching`, `signal lost`. */
  caption(s: string, x: number, y: number, o: { size?: number; a?: number; align?: 'left' | 'center'; col?: string; box?: boolean; dot?: string } = {}) {
    const c = this.c, size = o.size ?? 34, fam = F.mono(600), a = o.a ?? 1;
    if (a <= 0) return;
    const tw = measure(s, fam, size), pad = size * 0.55, dot = o.dot ? size * 0.9 : 0;
    const w = tw + pad * 2 + dot, h = size * 1.6;
    const x0 = o.align === 'center' ? x - w / 2 : x;
    c.save();
    c.globalAlpha = a;
    if (o.box !== false) {
      roundRect(c, x0, y - h / 2, w, h, size * 0.3);
      c.fillStyle = 'rgba(11,11,14,0.78)'; c.fill();
      c.lineWidth = 2; c.strokeStyle = 'rgba(241,238,232,0.25)'; c.stroke();
    }
    if (o.dot) { c.fillStyle = o.dot; c.beginPath(); c.arc(x0 + pad + size * 0.3, y, size * 0.22, 0, Math.PI * 2); c.fill(); }
    c.font = font(fam, size); c.textBaseline = 'middle';
    c.fillStyle = o.col ?? rgba('bone', 1);
    c.fillText(s, x0 + pad + dot, y + size * 0.04);
    c.restore();
  }

  /** The opening card: "Based on a true story". */
  card(s: string, t: number, t0: number, t1: number, o: { y?: number; size?: number } = {}) {
    const a = clamp((t - t0) / 0.25) * (1 - clamp((t - (t1 - 0.12)) / 0.12));
    if (a <= 0) return;
    const c = this.c, size = o.size ?? (PORTRAIT ? 64 : 58), fam = F.archivo(100, 500), y = o.y ?? H * 0.42;
    c.save();
    c.font = font(fam, size); c.textBaseline = 'middle'; c.textAlign = 'center';
    c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 30;
    c.fillStyle = rgba('bone', a);
    // typed in over the first 0.6 s, letter by letter
    const n = Math.floor(clamp((t - t0) / 0.6) * s.length + 0.999);
    c.fillText(s.slice(0, n), W / 2, y);
    c.fillStyle = rgba('bone', a * 0.5);
    c.fillRect(W / 2 - size * 1.2, y + size * 0.85, size * 2.4, 2);
    c.restore();
  }

  /** A plain title line in the lyric voice (e.g. the closing fact). */
  title(s: string, x: number, y: number, o: { size?: number; a?: number } = {}) {
    const c = this.c, size = o.size ?? (PORTRAIT ? 62 : 54), a = o.a ?? 1;
    if (a <= 0) return;
    c.save();
    c.font = font(F.archivo(100, 700), size); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = size * 0.4;
    c.fillStyle = rgba('bone', a);
    c.fillText(s, x, y);
    c.restore();
  }

  /** One chat message as a floating bubble (the chat as a character). */
  chat(user: string, text: string | { line: Line }, t: number, x: number, y: number, o: { size?: number; a?: number; w?: number; hot?: boolean } = {}) {
    const c = this.c, size = o.size ?? 38, A = o.a ?? 1;
    if (A <= 0) return;
    const full = typeof text === 'string' ? text : text.line.text;
    const shown = typeof text === 'string' ? text : full.slice(0, typedChars(text.line, t));
    const famB = F.mono(600), fam = F.mono(400), w = o.w ?? W * 0.62;
    const lines = wrap(shown || ' ', fam, size, w - size * 1.4);
    const h = size * 1.9 + lines.length * size * 1.3 + size * 0.4;
    c.save();
    c.globalAlpha = A;
    roundRect(c, x, y, w, h, size * 0.45);
    c.fillStyle = 'rgba(16,17,22,0.86)'; c.fill();
    c.lineWidth = 2; c.strokeStyle = o.hot ? 'rgba(255,178,36,0.9)' : 'rgba(142,166,194,0.5)'; c.stroke();
    c.font = font(famB, size * 0.78); c.textBaseline = 'alphabetic';
    c.fillStyle = o.hot ? rgba('signal', 1) : rgba('frost', 1);
    c.fillText(user, x + size * 0.7, y + size * 1.25);
    c.font = font(fam, size); c.fillStyle = rgba('bone', 1);
    lines.forEach((s, i) => c.fillText(s, x + size * 0.7, y + size * 2.35 + i * size * 1.3));
    c.restore();
    return { h };
  }
}
