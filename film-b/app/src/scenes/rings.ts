// PLATE 3 — "Rings" (4 bars; the last two beats are the mini-break).
// The spark is an emitter: every 25 ms it lets go of a ring whose outline is that instant's
// 48-band spectrum wrapped around the circle (lows at the bottom, highs at the top, mirrored),
// so the frame is a record of the last 1.6 s travelling outward. Rings born on a kick burn
// orange; each clap snaps the whole record 1/16 of a turn. One setting per bar:
//   bar 1 flat record   bar 2 the rings rise into a cone   bar 3 time runs INWARD
//   bar 4 flat and spinning; at the break emission stops, and the record collapses into the spark.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, prog, pulse, noise1, TAU, smoothstep } from '../engine/util';
import { beatNo, beatT, sparkHead, sparkParticles, mono, timecode } from './_kit';
import { rgba } from '../engine/palette';

const CX = W / 2, CY = 930;
const DT = 1 / 40, LIFE = 1.6, SEG = 120;

export default class Rings extends Scene {
  lb = new LineBatch(60000);
  L = new Layer2D();
  snares: number[] = [];
  kicks: [number, number][] = [];
  b0 = 0;
  tBreak = Infinity;

  override init() {
    const au = this.ctx.audio;
    this.b0 = Math.round(beatNo(au, this.ctx.start));
    this.snares = au.events('snare', this.ctx.start - 2, this.ctx.end).map(([t]) => t);
    this.kicks = au.events('kick', this.ctx.start - 2, this.ctx.end);
    this.tBreak = au.breaks.find((b) => b > this.ctx.start && b < this.ctx.end) ?? this.ctx.end - 0.9;
  }

  /** Accumulated rotation: 1/16 turn per clap, each snap eased over 120 ms. */
  rot(t: number) {
    let r = 0;
    for (const s of this.snares) { if (s > t) break; r += (TAU / 16) * ease.outExpo(clamp((t - s) / 0.12)); }
    return r;
  }

  kickAt(te: number) {
    let v = 0;
    for (const [k, s] of this.kicks) if (te >= k && te - k < 0.09) v = Math.max(v, s * (1 - (te - k) / 0.09));
    return v;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t;
    const bb = beatNo(au, t) - this.b0;
    const bar = clamp(Math.floor(bb / 4 + 1e-4), 0, 3);
    const tb = beatT(au, this.b0 + 4 * bar);
    const end = this.ctx.end;
    const collapse = ease.inExpo(prog(t, end - 0.42, end - 0.02));
    clearRT(renderer, out, LIN.ink);
    const lb = this.lb; lb.clear();
    const rot = this.rot(t) + (bar === 3 ? (t - tb) * 1.1 : 0);
    const bone = LIN.bone, sig = LIN.signal;
    const n1 = Math.floor(Math.min(t, this.tBreak) / DT), n0 = Math.floor((t - LIFE) / DT);
    for (let n = n1; n >= n0; n--) {
      const te = n * DT;
      const a = t - te;
      if (a < 0 || a > LIFE) continue;
      const life = 1 - a / LIFE;
      let base: number, cy = CY, sy = 1;
      if (bar === 2) base = 1050 * (1 - a / LIFE) ** 1.1 + 30;
      else base = 36 + 700 * a ** 0.85;
      if (bar === 1) { sy = 0.34; cy = CY + 520 - 900 * Math.min(1, a / LIFE) ** 0.9; base = 60 + 420 * a ** 0.7; }
      base *= 1 - collapse;
      const k = this.kickAt(te);
      const fade = bar === 2 ? smoothstep(0, 0.25, a) * (1 - a / LIFE) ** 0.4 : life ** 1.4;
      const I = (0.32 + 0.25 * life) * fade;
      const col: [number, number, number] = k > 0.05
        ? [sig[0] * (1.2 + 2.2 * k) * fade, sig[1] * (1.2 + 2.2 * k) * fade, sig[2] * (1.2 + 2.2 * k) * fade]
        : [bone[0] * I, bone[1] * I, bone[2] * I];
      const w = k > 0.05 ? 1.6 + 1.6 * k : 1.3;
      const amp = (60 + 160 * Math.min(1, a / 0.6)) * (1 - collapse);
      let px = 0, py = 0;
      for (let i = 0; i <= SEG; i++) {
        const th = (i / SEG) * TAU;
        // mirrored band map: bottom (th = π from the top) = 40 Hz, top = 16 kHz
        const u = Math.abs(((th / TAU) * 2) % 2 - 1); // 0 at the top, 1 at the bottom
        const band = Math.round((1 - u) * (au.specBands - 1));
        const r = base + amp * au.specAt(te, band) ** 1.4;
        const ang = th + rot - Math.PI / 2;
        const x = CX + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * sy;
        if (i > 0) lb.seg2(px, py, x, y, w, col, 1);
        px = x; py = y;
      }
    }
    // the emitter
    const kick = au.hit('kick', t, 0.1);
    sparkParticles(lb, t, (tb2) => (tb2 < this.tBreak || tb2 > end - 0.45 ? { x: CX, y: bar === 1 ? CY + 520 : CY } : null), { rate: 50, speed: 260, life: 0.35, seed: 21 });
    sparkHead(lb, CX, bar === 1 ? CY + 520 : CY, t, 1.2 + 1.2 * kick + 2 * collapse, 1.2 + collapse);
    lb.render(renderer, out);

    // ---- mono voice
    const c = this.L.ctx; this.L.clear();
    const hf = F.archivo(125, 900);
    c.font = font(hf, 96);
    c.fillStyle = rgba('bone', 0.95);
    c.fillText('RINGS', 64, 230);
    mono(c, 'one ring / 25 ms · 48 bands', 64, 276, { size: 22, a: 0.75 });
    mono(c, ['FLAT RECORD', 'CONE', 'TIME ↘ INWARD', t >= this.tBreak ? 'BREAK · EMISSION OFF' : 'SPIN'][bar]!, W - 64, 196, { size: 22, col: 'signal', a: 1, weight: 600, align: 'right' });
    mono(c, `BAR ${String(11 + bar).padStart(2, '0')}/22`, W - 64, 230, { size: 22, a: 0.7, align: 'right' });
    mono(c, '16 kHz ↑', 64, 1660, { size: 20, a: 0.55 });
    mono(c, '40 Hz ↓', 64, 1694, { size: 20, a: 0.55 });
    mono(c, `clap ↻ 1/16 turn · ${this.snares.filter((s) => s <= t && s >= this.ctx.start).length} so far`, 64, 1740, { size: 20, a: 0.55 });
    mono(c, timecode(t), W - 64, 1740, { size: 20, a: 0.5, align: 'right' });
    this.L.upload();
    comp.draw(renderer, this.L.texture, out);

    const shake = 10 * pulse(t, tb, 0.05) + 5 * kick;
    return {
      bloom: 0.8, bloomThreshold: 0.9, ca: 1.5, vignette: 0.5,
      zoom: 1 + 0.03 * kick + 0.04 * pulse(t, tb, 0.08) + 0.25 * collapse,
      shake: [noise1(t * 60, 7) * shake, noise1(t * 60, 8) * shake],
      flash: 0.6 * pulse(t, this.ctx.start, 0.05),
    };
  }
}
