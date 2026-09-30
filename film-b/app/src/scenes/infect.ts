// PLATE 5 — "Infection" (4 bars; the last beat is the break).
// The frame is a 9 × 16 field of cells. One cell in the middle is patient zero; every bell or
// kick infects the next ring of cells (a hashed-weight flood fill, so the front is ragged), and
// the count rolls up in big type. Kicks make the whole infected mass flare; claps flip a scatter
// of cells to bone. Bar 3: 100 %, and the field strobes on the 8ths. Bar 4: the cells shrink to
// dots on the kicks; at the break every dot is pulled into the spark, which waits, trembling,
// for the last downbeat.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN, rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { clamp, ease, prog, pulse, noise1, hash, lerp } from '../engine/util';
import { beatNo, beatT, mono, sparkHead, sparkParticles, lastHit, timecode } from './_kit';

const COLS = 9, ROWS = 16, CS = 120;
const N = COLS * ROWS;

export default class Infect extends Scene {
  L = new Layer2D();
  lb = new LineBatch(4000);
  dist = new Float32Array(N);
  /** Times of the spreading steps (bells and kicks, merged within 60 ms). */
  steps: number[] = [];
  snares: number[] = [];
  b0 = 0;
  tBreak = 0;

  override init() {
    const au = this.ctx.audio;
    this.b0 = Math.round(beatNo(au, this.ctx.start));
    this.tBreak = au.breaks.find((b) => b > this.ctx.start && b < this.ctx.end) ?? this.ctx.end - 0.45;
    // flood fill with hashed edge weights (Dijkstra on the 8-neighbour grid)
    this.dist.fill(Infinity);
    const seed = 8 * COLS + 4;
    this.dist[seed] = 0;
    const done = new Uint8Array(N);
    for (let it = 0; it < N; it++) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && (u < 0 || this.dist[i]! < this.dist[u]!)) u = i;
      done[u] = 1;
      const ux = u % COLS, uy = Math.floor(u / COLS);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const vx = ux + dx, vy = uy + dy;
        if (vx < 0 || vy < 0 || vx >= COLS || vy >= ROWS) continue;
        const v = vy * COLS + vx;
        const w = (dx && dy ? 1.4 : 1) * (0.55 + 1.1 * hash(Math.min(u, v), Math.max(u, v), 17));
        if (this.dist[u]! + w < this.dist[v]!) this.dist[v] = this.dist[u]! + w;
      }
    }
    const ev = [...au.events('bell', this.ctx.start, this.ctx.end), ...au.events('kick', this.ctx.start, this.ctx.end)].map(([t]) => t).sort((a, b) => a - b);
    for (const t of ev) if (!this.steps.length || t - this.steps[this.steps.length - 1]! > 0.06) this.steps.push(t);
    // make sure the field is full by the start of bar 3: rescale distances to the steps available
    const P = 60 / au.bpm;
    const full = this.steps.filter((t) => t < this.ctx.start + 8 * P - 0.05).length;
    let dmax = 0;
    for (let i = 0; i < N; i++) dmax = Math.max(dmax, this.dist[i]!);
    for (let i = 0; i < N; i++) this.dist[i] = (this.dist[i]! / dmax) * (full - 0.5);
    this.snares = au.events('snare', this.ctx.start, this.ctx.end).map(([t]) => t);
  }

  /** Continuous infection front (in steps) at time t: each step eases in over 90 ms. */
  front(t: number) {
    let g = 0;
    for (const s of this.steps) { if (s > t) break; g += ease.outCubic(clamp((t - s) / 0.09)); }
    return g;
  }
  /** Time a cell became infected (first step whose count reaches its distance). */
  infectedAt(i: number) {
    const k = Math.ceil(this.dist[i]!);
    return k <= 0 ? this.ctx.start : this.steps[k - 1] ?? Infinity;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, P = 60 / au.bpm, end = this.ctx.end;
    const bb = beatNo(au, t) - this.b0;
    const bar = clamp(Math.floor(bb / 4 + 1e-4), 0, 3);
    const tb = beatT(au, this.b0 + 4 * bar);
    const g = this.front(t);
    const kick = au.hit('kick', t, 0.1);
    const pull = ease.inExpo(prog(t, this.tBreak, this.tBreak + 0.3));
    const shrinkK = bar === 3 ? ease.outCubic(prog(t, tb, this.tBreak)) : 0;
    clearRT(renderer, out, LIN.ink);
    const c = this.L.ctx; this.L.clear();

    // strobe in bar 3: checkerboard flips each 8th
    const e8 = Math.floor((t - tb) / (P / 2));
    let infected = 0;
    const cx0 = W / 2, cy0 = 8 * CS + CS / 2;
    for (let i = 0; i < N; i++) {
      const cx = (i % COLS) * CS + CS / 2, cy = Math.floor(i / COLS) * CS + CS / 2;
      const d = this.dist[i]!;
      const on = g >= d;
      if (!on) {
        c.strokeStyle = rgba('graphite', 0.55);
        c.lineWidth = 1;
        c.strokeRect(cx - CS / 2 + 6.5, cy - CS / 2 + 6.5, CS - 13, CS - 13);
        c.fillStyle = rgba('ash', 0.5);
        c.fillRect(cx - 1, cy - 6, 2, 12); c.fillRect(cx - 6, cy - 1, 12, 2);
        continue;
      }
      infected++;
      const ti = this.infectedAt(i);
      const age = t - ti;
      const pop = 1 + 0.4 * (1 - ease.outExpo(clamp(age / 0.2)));
      let fill: string = 'signal';
      if (bar === 2) fill = (Math.floor(i / COLS) + (i % COLS) + e8) % 2 ? 'signal' : (e8 % 3 === 0 ? 'bone' : 'ink2');
      const sn = this.snares.find((s) => t >= s && t < s + P && hash(i, Math.round(s * 100)) < 0.22);
      if (sn !== undefined && bar !== 2) fill = 'bone';
      let size = (CS - 12) * pop * (1 - 0.85 * shrinkK * (0.6 + 0.4 * hash(i, 5)));
      let x = cx, y = cy;
      if (pull > 0) {
        const delay = hash(i, 9) * 0.5;
        const k = clamp((pull - delay) / (1 - delay));
        x = lerp(cx, cx0, k); y = lerp(cy, cy0, k); size *= 1 - k;
      }
      if (size < 0.5) continue;
      c.fillStyle = rgba(fill, 1);
      c.fillRect(x - size / 2, y - size / 2, size, size);
      if (bar < 2 && size > 60) mono(c, `0x${i.toString(16).toUpperCase().padStart(2, '0')}`, x - size / 2 + 10, y - size / 2 + 24, { size: 15, col: fill === 'bone' ? 'ink' : 'ink', a: 0.75 });
    }

    // the count: big type over the field
    const pct = Math.round((Math.min(N, infected) / N) * 100);
    if (pull < 0.95) {
      const hf = F.archivo(125, 900);
      const str = `${pct}%`;
      const size = 300;
      const w = measure(str, hf, size);
      const slam = 1 + 0.08 * (1 - ease.outExpo(clamp((t - lastHit(au, 'bell', t, this.ctx.start)) / 0.12)));
      c.save();
      c.translate(W / 2, 1650);
      c.scale(slam * (1 - pull), slam * (1 - pull));
      c.fillStyle = rgba('ink', 0.92);
      c.fillRect(-W / 2, -size * 0.8, W, size * 0.98);
      c.font = font(hf, size);
      c.fillStyle = rgba(bar === 2 && e8 % 2 ? 'signal' : 'bone', 1);
      c.fillText(str, -w / 2, 0);
      c.restore();
      const a = 1 - pull;
      c.fillStyle = rgba('ink', 0.92 * a);
      c.fillRect(0, 130, W, 150);
      c.font = font(hf, 96);
      c.fillStyle = rgba('bone', 0.95 * a);
      c.fillText('INFECTED', 64, 230);
      mono(c, `${String(Math.min(N, infected)).padStart(3, '0')} / ${N} cells`, W - 64, 196, { size: 22, col: 'signal', a, align: 'right', weight: 600 });
      mono(c, `BAR ${String(19 + bar).padStart(2, '0')}/22 · ${timecode(t)}`, W - 64, 230, { size: 22, a: 0.7 * a, align: 'right' });
    }
    this.L.upload();
    comp.draw(renderer, this.L.texture, out);

    // flare on kicks + the spark once the field collapses
    const lb = this.lb; lb.clear();
    if (t >= this.tBreak) {
      const tr = (tb2: number) => ({ x: cx0 + noise1(tb2 * 40, 3) * 6 * pull, y: cy0 + noise1(tb2 * 40, 4) * 6 * pull });
      sparkParticles(lb, t, (tb2) => (tb2 >= this.tBreak ? tr(tb2) : null), { rate: 120, speed: 340, life: 0.4, seed: 31 });
      const h = tr(t);
      sparkHead(lb, h.x, h.y, t, 1 + 2.2 * pull, 1 + pull);
    }
    lb.render(renderer, out);

    const shake = 14 * kick + 10 * pulse(t, tb, 0.05) + 5 * pull;
    return {
      bloom: 0.7 + 0.6 * kick, bloomThreshold: 0.9 - 0.5 * kick, exposure: 1 + 0.35 * kick * (bar < 3 ? 1 : 0.3),
      ca: 1.4 + 2 * kick, vignette: 0.5, grain: 0.06,
      zoom: 1 + 0.03 * kick + 0.05 * pulse(t, tb, 0.07) + 0.12 * ease.inCubic(prog(t, this.tBreak, end)),
      shake: [noise1(t * 60, 11) * shake, noise1(t * 60, 12) * shake],
    };
  }
}
