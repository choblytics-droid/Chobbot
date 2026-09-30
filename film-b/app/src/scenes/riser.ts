// PLATE 0 — "Count-in" (2 bars before the drop).
// A vertical meter: the spark climbs one tick per beat (snap, hold), dragging its orange line.
// Behind it a full-frame numeral counts 8 → 1, condensing and getting heavier each beat
// (Archivo width 125 → 62, weight 300 → 900): typographic pressure instead of a riser sweep.
// On the last beat the numeral collapses into the line, the frame creeps in, and the drop
// arrives as a flash.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN, rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { clamp, ease, prog, pulse, smoothstep, noise1 } from '../engine/util';
import { beatNo, beatT, sparkHead, sparkParticles, mono, CAP, timecode } from './_kit';

const X = W / 2, Y0 = 1560, Y1 = 360; // meter: bottom → top
const WIDTHS = [125, 125, 112.5, 100, 87.5, 75, 62, 62];
const WEIGHTS = [300, 300, 500, 500, 700, 700, 900, 900];

export default class Riser extends Scene {
  bg = new Layer2D();
  fg = new Layer2D();
  lb = new LineBatch(4000);

  /** Spark height along the meter (0..1) at time t: snaps up a step on each beat. */
  level(t: number) {
    const au = this.ctx.audio;
    const b = beatNo(au, t);
    const k = Math.floor(b + 1e-4);
    if (k < 0) return 0;
    if (k === 0) return 0;
    const u = (t - beatT(au, k)) / 0.16;
    // beat k snaps the spark from tick k-1 to tick k; the last beat then keeps climbing into the drop
    const climb = k >= 7 ? ease.inCubic(prog(t, beatT(au, 7) + 0.16, this.ctx.end)) : 0;
    return clamp((Math.min(k, 7) - 1 + ease.outExpo(clamp(u)) + climb) / 8, 0, 1);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t;
    const drop = this.ctx.end;
    const b = beatNo(au, t);
    const k = clamp(Math.floor(b + 1e-4), 0, 7);
    const tk = beatT(au, k);
    const last = beatT(au, 7);
    clearRT(renderer, out, LIN.ink);

    // ---- the numeral
    const c = this.bg.ctx; this.bg.clear();
    const fam = F.archivo(WIDTHS[k]!, WEIGHTS[k]!);
    const num = String(8 - k);
    const size = 1180;
    const w = measure(num, fam, size);
    const fit = Math.min(1, 940 / w);
    const slam = 1 + 0.12 * (1 - ease.outExpo(clamp((t - tk) / 0.2)));
    const collapse = ease.inExpo(prog(t, last + 0.05, drop - 0.02)); // "1" collapses into the line
    c.save();
    c.translate(X, H * 0.5);
    c.scale(fit * slam * (1 - collapse), fit * slam * (1 + 0.25 * collapse));
    c.font = font(fam, size);
    c.fillStyle = rgba('bone', 0.93);
    c.fillText(num, -w / 2, (size * CAP) / 2);
    c.restore();

    // ---- mono voice: title (top), readouts (bottom)
    const a0 = 1 - smoothstep(last, drop, t) * 0.6;
    mono(c, 'FERRUGEM NA FENDA × COWBELL INFECTION', 64, 150, { size: 24, a: 0.85 * a0, weight: 500 });
    mono(c, 'tribute mashup · code film · version B', 64, 186, { size: 20, col: 'ash', a: 0.8 * a0 });
    c.fillStyle = rgba('bone', 0.18 * a0);
    c.fillRect(64, 214, W - 128, 1);
    const drp = Math.max(0, drop - Math.round(t * 60) / 60);
    mono(c, `${au.bpm.toFixed(2)} BPM · 4/4`, 64, 1700, { size: 22, a: 0.7 });
    mono(c, `BAR ${String(Math.floor(k / 4) + 1).padStart(2, '0')}/22 · BEAT ${(k % 4) + 1}`, 64, 1736, { size: 22, a: 0.7 });
    mono(c, `DROP IN ${drp.toFixed(2)} s`, W - 64, 1700, { size: 22, col: 'signal', a: 0.95, align: 'right', weight: 600 });
    mono(c, timecode(t), W - 64, 1736, { size: 22, a: 0.5, align: 'right' });
    // meter ticks: 8 → 1 beside the line
    for (let i = 0; i <= 8; i++) {
      const y = Y0 + (Y1 - Y0) * (i / 8);
      const on = i <= k;
      c.fillStyle = rgba(on ? 'signal' : 'bone', on ? 0.9 : 0.35);
      c.fillRect(X - (i % 4 === 0 ? 34 : 18), Math.round(y), i % 4 === 0 ? 68 : 36, 2);
      if (i < 8) mono(c, String(8 - i), X - 56, y + 8, { size: 20, col: on ? 'signal' : 'bone', a: on ? 0.9 : 0.45, align: 'right' });
    }
    this.bg.upload();
    comp.draw(renderer, this.bg.texture, out);

    // ---- the meter line and the spark
    const lb = this.lb; lb.clear();
    const lv = this.level(t);
    const sy = Y0 + (Y1 - Y0) * lv;
    const tight = smoothstep(last, drop, t);
    lb.seg2(X, Y1, X, Y0, 1.5, [LIN.bone[0] * 0.35, LIN.bone[1] * 0.35, LIN.bone[2] * 0.35], 1);
    const hot = 1.6 + 2.5 * tight + 1.5 * pulse(t, tk, 0.12);
    lb.seg2(X, Y0, X, sy, 3 + 3 * tight, [LIN.signal[0] * hot, LIN.signal[1] * hot, LIN.signal[2] * hot], 1);
    const headAt = (tb: number) => ({ x: X, y: Y0 + (Y1 - Y0) * this.level(tb) });
    sparkParticles(lb, t, headAt, { rate: 70 + 160 * tight, speed: 260 + 200 * tight, seed: 3 });
    sparkHead(lb, X, sy, t, 1.3 + 1.2 * tight + 0.6 * pulse(t, tk, 0.1), 1 + tight);
    lb.render(renderer, out);

    // ---- post: creep in over the last bar, shake on the beats, flash into the drop
    const creep = ease.inCubic(prog(t, beatT(au, 4), drop));
    const shake = (4 + 10 * tight) * pulse(t, tk, 0.07);
    return {
      zoom: 1 + 0.07 * creep,
      shake: [noise1(t * 60, 1) * shake, noise1(t * 60, 2) * shake],
      flash: 1.2 * ease.inExpo(prog(t, drop - 0.09, drop)),
      bloom: 0.6 + 0.6 * tight,
      grain: 0.06 + 0.03 * tight,
      vignette: 0.45,
      bloomThreshold: 1.0,
    };
  }
}
