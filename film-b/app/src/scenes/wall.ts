// COVER PLATE 4 — "The wall" (4 bars).
// "He's TALKING LOUD, keep spreading the INFECTION / BUILDING A WALL, seeking PROTECTION"
// An old stone wall, head-on. TALKING LOUD is a neon sign whose size is the song's own loudness.
// From "keep spreading" the infection moves through the wall one brick per cowbell or kick: the
// ghost's cyan light spreads through the mortar in a ragged flood. On "building a wall" a new,
// clean wall is stacked in front of it, one course per 8th note, bricks slamming down, hiding the
// glow; it tops out on "protection", and the ghost floats up and sits on top of it, as on the cover.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { loadLyrics, type Lyrics } from '../engine/lyrics';
import { clamp, ease, prog, pulse, noise1, hash, lerp } from '../engine/util';
import { beatNo, beatT } from './_kit';
import { lyricBlock, drawGhost, drawWisps, rain, ignite } from './_world';

const BW = 180, BH = 96;
const COLS = 7, ROWS = 21; // old wall grid (offset rows)
const N = COLS * ROWS;
const NBH = 108; // new wall course height

export default class Wall extends Scene {
  flat = new Layer2D();
  glow = new Layer2D();
  frontL = new Layer2D();
  frontGlow = new Layer2D();
  txt = new Layer2D();
  lb = new LineBatch(3000);
  ly!: Lyrics;
  tw: Record<string, number> = {};
  dist = new Float32Array(N);
  steps: number[] = [];
  courses: number[] = []; // landing time of each new course

  override async init() {
    this.ly = await loadLyrics();
    const au = this.ctx.audio;
    const words = this.ly.lines.flatMap((l) => l.words);
    const at = (q: string) => words.find((w) => w.w.toLowerCase().replace(/[^a-z']/g, '') === q && w.start > this.ctx.start - 1.5)!.start;
    for (const q of ['talking', 'loud', 'keep', 'infection', 'building', 'wall', 'seeking', 'protection', 'and']) this.tw[q] = at(q);
    // infection: flood fill from a brick near the middle, one ring per cowbell / kick
    const seed = 10 * COLS + 3;
    this.dist.fill(Infinity); this.dist[seed] = 0;
    const done = new Uint8Array(N);
    for (let it = 0; it < N; it++) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && (u < 0 || this.dist[i]! < this.dist[u]!)) u = i;
      done[u] = 1;
      const ux = u % COLS, uy = Math.floor(u / COLS);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [uy % 2 ? 1 : -1, 1], [uy % 2 ? 1 : -1, -1]] as const) {
        const vx = ux + dx, vy = uy + dy;
        if (vx < 0 || vy < 0 || vx >= COLS || vy >= ROWS) continue;
        const v = vy * COLS + vx;
        const w = 0.6 + 1.2 * hash(Math.min(u, v), Math.max(u, v), 3);
        if (this.dist[u]! + w < this.dist[v]!) this.dist[v] = this.dist[u]! + w;
      }
    }
    const ev = [...au.events('bell', this.tw.keep!, this.tw.building!), ...au.events('kick', this.tw.keep!, this.tw.building!)].map(([t]) => t).sort((a, b) => a - b);
    for (const t of ev) if (!this.steps.length || t - this.steps[this.steps.length - 1]! > 0.06) this.steps.push(t);
    let dmax = 0; for (let i = 0; i < N; i++) dmax = Math.max(dmax, this.dist[i]!);
    for (let i = 0; i < N; i++) this.dist[i] = (this.dist[i]! / dmax) * (this.steps.length - 0.3);
    // new wall: one course per 8th from "building" until it tops out on "protection"
    const P = 60 / au.bpm;
    const k0 = Math.ceil((beatNo(au, this.tw.building!) - 0.02) * 2);
    const n = Math.ceil(H / NBH) - 4;
    for (let i = 0; i < n; i++) this.courses.push(Math.min(beatT(au, (k0 + i) / 2), this.tw.protection! - (n - 1 - i) * P * 0.12));
  }

  front(t: number) {
    let g = 0;
    for (const s of this.steps) { if (s > t) break; g += ease.outCubic(clamp((t - s) / 0.1)); }
    return g;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, tw = this.tw;
    const b0 = Math.round(beatNo(au, this.ctx.start));
    const bar = clamp(Math.floor((beatNo(au, t) - b0) / 4 + 1e-4), 0, 3);
    const tb = beatT(au, b0 + 4 * bar);
    const kick = au.hit('kick', t, 0.09);
    clearRT(renderer, out, [0, 0, 0]);
    this.flat.clear(); this.glow.clear(); this.frontL.clear(); this.frontGlow.clear();
    const fl = this.flat.ctx, gl = this.glow.ctx, fr = this.frontL.ctx, fg = this.frontGlow.ctx;
    const zoom = bar === 1 ? 1.12 : 1, cy = bar === 1 ? 900 : 960;
    for (const c of [fl, gl, fr, fg]) { c.save(); c.translate(W / 2, H / 2); c.scale(zoom, zoom); c.translate(-W / 2, -cy); }

    // ---- the old wall, and the infection moving through it
    const g = this.front(t);
    fl.fillStyle = rgba('#0A0B1A', 1); fl.fillRect(-100, -100, W + 200, H + 200);
    for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
      const i = r * COLS + q;
      const x = q * BW - (r % 2 ? BW / 2 : 0) - 60, y = r * BH - 60;
      const h = hash(q, r, 1);
      fl.fillStyle = rgba(h < 0.5 ? 'stone' : '#353A5E', 1);
      fl.fillRect(x + 4, y + 4, BW - 8, BH - 8);
      fl.fillStyle = rgba('magenta', 0.05 + 0.05 * h);
      fl.fillRect(x + 4, y + 4, BW - 8, 6);
      const d = this.dist[i]!;
      if (g >= d) {
        const ti = this.steps[Math.max(0, Math.ceil(d) - 1)] ?? t;
        const age = t - ti;
        const hot = 1 + 2 * Math.exp(-age / 0.15);
        gl.strokeStyle = rgba('cyan', clamp(0.28 * hot));
        gl.lineWidth = 4;
        gl.strokeRect(x + 3, y + 3, BW - 6, BH - 6);
        gl.fillStyle = rgba('cyan', 0.03 + 0.15 * Math.exp(-age / 0.25) + 0.04 * kick);
        gl.fillRect(x + 6, y + 6, BW - 12, BH - 12);
      }
    }
    // TALKING LOUD: sized by the loudness envelope
    if (t < tw.building! + 0.2) {
      const loud = au.env('rms', t);
      const fam = F.archivo(125, 900);
      const on = (w: number, s: number) => ignite(t, w, s);
      const size = 150 * (0.85 + 0.35 * loud);
      gl.font = font(fam, size);
      const w1 = measure('TALKING', fam, size), w2 = measure('LOUD', fam, size * 1.35);
      gl.fillStyle = rgba('magenta', on(tw.talking!, 1));
      gl.fillText('TALKING', W / 2 - w1 / 2, 520);
      gl.font = font(fam, size * 1.35);
      gl.fillStyle = rgba('magenta', on(tw.loud!, 2));
      gl.fillText('LOUD', W / 2 - w2 / 2, 520 + size * 1.25);
      const fam2 = F.archivo(100, 700), s2 = 104;
      gl.font = font(fam2, s2);
      const w3 = measure('INFECTION', fam2, s2);
      gl.fillStyle = rgba('ghost', on(tw.infection!, 3));
      gl.fillText('INFECTION', W / 2 - w3 / 2, 1180);
    }

    // ---- the new wall, course by course from the bottom
    let top = H + 60;
    this.courses.forEach((tc, k) => {
      if (t < tc - 0.12) return;
      const drop = ease.outExpo(clamp((t - tc + 0.12) / 0.12));
      const y = H - (k + 1) * NBH + lerp(-260, 0, drop);
      top = Math.min(top, H - (k + 1) * NBH);
      const off = k % 2 ? BW / 2 : 0;
      for (let q = -1; q < 7; q++) {
        const x = q * BW + off - 30;
        const h = hash(q, k, 9);
        fr.fillStyle = rgba('#12132A', 1); fr.fillRect(x, y, BW, NBH);
        fr.fillStyle = rgba(h < 0.5 ? '#4B4F78' : '#565B86', 1); fr.fillRect(x + 5, y + 5, BW - 10, NBH - 10);
        fr.fillStyle = rgba('cyan', 0.08); fr.fillRect(x + 5, y + 5, BW - 10, 5);
      }
      if (t - tc < 0.15 && t >= tc) { fg.fillStyle = rgba('ghost', 0.35 * (1 - (t - tc) / 0.15)); fg.fillRect(-100, y + NBH - 8, W + 200, 8); }
    });

    // ---- the ghost rises over the finished wall and sits on it
    const tr = tw.protection! - 0.2;
    if (t > tr) {
      const k = ease.outCubic(prog(t, tr, tr + 0.8));
      const gx = 760, gy = lerp(top + 200, top - 118, k) + 8 * Math.sin(t * 2.4);
      drawWisps(fg, gx, gy + 140, 60, t, { alpha: 0.4 * k, seed: 12 });
      drawGhost(fg, gx, gy, 84, t, { alpha: k });
    }
    for (const c of [fl, gl, fr, fg]) c.restore();
    this.flat.upload(); this.glow.upload(); this.frontL.upload(); this.frontGlow.upload();
    comp.draw(renderer, this.flat.texture, out);
    comp.draw(renderer, this.glow.texture, out, { mode: 'add', tint: [2.0, 2.0, 2.0] });
    comp.draw(renderer, this.frontL.texture, out);
    comp.draw(renderer, this.frontGlow.texture, out, { mode: 'add', tint: [2.3, 2.3, 2.3] });

    const c = this.txt.ctx; this.txt.clear();
    const line = this.ly.lineAt(t, 0.5, 0.3);
    if (line) lyricBlock(c, line, t, W / 2, 1600, { col: line.i % 2 ? 'cyan' : 'magenta', hot: 'ghost', size: 84 });
    this.txt.upload();
    comp.draw(renderer, this.txt.texture, out, { mode: 'add', tint: [2.3, 2.3, 2.3] });

    const lb = this.lb; lb.clear();
    rain(lb, t, { n: 260, intensity: 0.24 });
    lb.render(renderer, out);

    const land = this.courses.reduce((m, tc) => Math.max(m, pulse(t, tc, 0.05)), 0);
    const shake = 7 * kick + 9 * land + 14 * pulse(t, tw.and!, 0.07) + 6 * pulse(t, tb, 0.05);
    return {
      bloom: 0.95, bloomThreshold: 0.75, halation: 0.08, vignette: 0.55, grain: 0.055, ca: 1.3 + kick,
      zoom: 1 + 0.02 * kick + 0.015 * land,
      shake: [noise1(t * 60, 41) * shake, noise1(t * 60, 42) * shake],
      flash: 0.45 * pulse(t, this.ctx.start, 0.06),
    };
  }
}


