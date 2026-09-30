// PLATE 4 — "Hit log" (4 bars).
// Kinetic type as a log file: every hit the analysis found is set as its own line, the moment
// it sounds, in full-width Archivo — KICK wide and heavy, CLAP condensed, BELL in signal orange —
// with a mono timestamp and velocity bar beside it. New lines slam in, older ones settle and dim,
// and the log scrolls when the page is full. One page per bar with the paper flipping
// ink → bone → signal → ink, hard cuts on the downbeats.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { LIN, rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { clamp, ease, pulse, noise1, lerp } from '../engine/util';
import { beatNo, beatT, mono, timecode, CAP } from './_kit';

type Kind = 'kick' | 'snare' | 'bell';
type Row = { t: number; s: number; kind: Kind };
const STYLE: Record<Kind, { word: string; fam: string; size: number; h: number }> = {
  kick: { word: 'KICK', fam: F.archivo(125, 900), size: 250, h: 200 },
  snare: { word: 'CLAP', fam: F.archivo(62, 900), size: 230, h: 175 },
  bell: { word: 'BELL', fam: F.archivo(100, 700), size: 190, h: 150 },
};
const PAGES = [
  { bg: 'ink', ink: 'bone', dim: 'bone', bell: 'signal' },
  { bg: 'bone', ink: 'ink', dim: 'ink', bell: 'signal' },
  { bg: 'signal', ink: 'ink', dim: 'ink', bell: 'bone' },
  { bg: 'ink', ink: 'bone', dim: 'bone', bell: 'signal' },
] as const;
const TOP = 330, BOT = 1560;

export default class Slam extends Scene {
  L = new Layer2D();
  pages: Row[][] = [];
  b0 = 0;

  override init() {
    const au = this.ctx.audio;
    this.b0 = Math.round(beatNo(au, this.ctx.start));
    const all: Row[] = [];
    for (const kind of ['kick', 'snare', 'bell'] as Kind[])
      for (const [t, s] of au.events(kind, this.ctx.start - 0.03, this.ctx.end - 0.03)) all.push({ t, s, kind });
    all.sort((a, b) => a.t - b.t);
    // merge hits closer than 60 ms (one line each: kick > clap > bell)
    const pri = { kick: 0, snare: 1, bell: 2 };
    const rows: Row[] = [];
    for (const r of all) {
      const last = rows[rows.length - 1];
      if (last && r.t - last.t < 0.06) { if (pri[r.kind] < pri[last.kind]) rows[rows.length - 1] = { ...r, t: last.t }; continue; }
      rows.push(r);
    }
    for (let j = 0; j < 4; j++) {
      const a = beatT(au, this.b0 + 4 * j) - 0.03, b = beatT(au, this.b0 + 4 * j + 4) - 0.03;
      this.pages.push(rows.filter((r) => r.t >= a && r.t < b));
    }
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t;
    const bb = beatNo(au, t) - this.b0;
    const j = clamp(Math.floor(bb / 4 + 1e-4), 0, 3);
    const tb = beatT(au, this.b0 + 4 * j);
    const pg = PAGES[j]!;
    clearRT(renderer, out, LIN[pg.bg]);
    const c = this.L.ctx; this.L.clear();

    const rows = this.pages[j]!.filter((r) => t >= r.t - 0.002);
    // layout: rows stack downward; scroll so the newest line stays above BOT
    const ys: number[] = [];
    let y = TOP;
    for (const r of rows) { y += STYLE[r.kind].h; ys.push(y); }
    const scrollAt = (i: number) => Math.max(0, (ys[i] ?? TOP) - BOT);
    let scroll = 0;
    if (rows.length) {
      const i = rows.length - 1;
      const k = ease.outExpo(clamp((t - rows[i]!.t) / 0.14));
      scroll = lerp(scrollAt(i - 1), scrollAt(i), k);
    }
    c.save();
    c.translate(0, -scroll);
    rows.forEach((r, i) => {
      const st = STYLE[r.kind];
      const newest = i === rows.length - 1;
      const age = t - r.t;
      const col = r.kind === 'bell' ? pg.bell : pg.ink;
      const alpha = newest ? 1 : Math.max(0.28, 1 - age * 1.6);
      const w = measure(st.word, st.fam, st.size);
      const fit = Math.min(1, 640 / w);
      const slam = newest ? 1 + 0.22 * (1 - ease.outExpo(clamp(age / 0.16))) : 1;
      const base = ys[i]! - 18;
      c.save();
      c.translate(64, base);
      c.scale(fit * slam, fit * slam);
      c.font = font(st.fam, st.size);
      c.fillStyle = rgba(col, alpha);
      c.fillText(st.word, 0, 0);
      c.restore();
      // the log columns
      const x2 = 64 + w * fit + 28;
      const capTop = base - st.size * fit * CAP;
      mono(c, timecode(r.t + au.songOffset), x2, capTop + 22, { size: 20, col: pg.dim, a: 0.8 * alpha });
      mono(c, `v ${r.s.toFixed(2)}`, x2, capTop + 50, { size: 20, col: pg.dim, a: 0.6 * alpha });
      c.fillStyle = rgba(col, 0.9 * alpha);
      c.fillRect(x2, capTop + 62, (W - 64 - x2) * r.s * ease.outExpo(clamp(age / 0.2)), 8);
      c.fillStyle = rgba(pg.dim, 0.2 * alpha);
      c.fillRect(64, base + 16, W - 128, 1);
    });
    c.restore();

    // header / footer (fixed)
    c.fillStyle = rgba(pg.bg, 1);
    c.fillRect(0, 0, W, TOP - 40);
    c.font = font(F.archivo(125, 900), 96);
    c.fillStyle = rgba(pg.ink, 0.95);
    c.fillText('HIT LOG', 64, 230);
    mono(c, `BAR ${String(15 + j).padStart(2, '0')}/22`, W - 64, 196, { size: 22, col: pg.ink, a: 0.8, align: 'right', weight: 600 });
    mono(c, `${this.pages[j]!.filter((r) => r.t <= t).length} hits`, W - 64, 230, { size: 22, col: pg.ink, a: 0.6, align: 'right' });
    c.fillStyle = rgba(pg.bg, 1);
    c.fillRect(0, BOT + 30, W, H - BOT - 30);
    c.fillStyle = rgba(pg.dim, 0.5);
    c.fillRect(64, BOT + 40, W - 128, 1);
    mono(c, 'song time · velocity', 64, BOT + 80, { size: 20, col: pg.dim, a: 0.6 });
    mono(c, timecode(t), W - 64, BOT + 80, { size: 20, col: pg.dim, a: 0.6, align: 'right' });
    this.L.upload();
    comp.draw(renderer, this.L.texture, out);

    const kick = au.hit('kick', t, 0.07);
    const shake = 16 * kick + 8 * pulse(t, tb, 0.05);
    return {
      bloomThreshold: pg.bg === 'ink' ? 0.95 : 4, bloom: 0.6, ca: 1.3, vignette: pg.bg === 'ink' ? 0.45 : 0.25,
      paper: pg.bg === 'ink' ? 0 : 1,
      zoom: 1 + 0.025 * kick + 0.05 * pulse(t, tb, 0.07),
      shake: [noise1(t * 60, 9) * shake, noise1(t * 60, 10) * shake],
    };
  }
}
