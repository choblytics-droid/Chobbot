// PLATE 1 — "Scope" (the drop, 4 bars).
// A portrait oscilloscope drawing the song's real waveform: time runs DOWN the screen, the
// beam retriggers on the grid and writes the trace behind the spark, the previous sweeps
// linger as phosphor. Each bar is a new instrument setting (hard sub-cut on the downbeat):
//   bar 1  sweep = 1 beat          bar 2  sweep = 1 bar, punch-in
//   bar 3  MATH · FFT (48 bands)   bar 4  sweep = 1/8, gain ×2, strobing into the next plate
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN, rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { clamp, pulse, noise1, frameIdx } from '../engine/util';
import { beatNo, beatT, sparkHead, sparkParticles, mono, lastHit, timecode } from './_kit';

const X0 = 60, X1 = 1020, Y0 = 300, Y1 = 1620, DIV = 120;
const CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2, AMP = 400;

type Mode = { sweep: number; gain: number; label: string };

export default class Scope extends Scene {
  grat = new Layer2D();
  lb = new LineBatch(40000);
  /** Strobe frames print the scope as ink on bone paper: the beam then draws with normal blending. */
  lbInk = new LineBatch(40000, { blend: 'normal' });

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, P = 60 / au.bpm;
    const b0 = Math.round(beatNo(au, this.ctx.start));
    const bb = beatNo(au, t) - b0; // beats into the plate
    const bar = clamp(Math.floor(bb / 4 + 1e-4), 0, 3);
    const tBar = beatT(au, b0 + bar * 4);
    const modes: Mode[] = [
      { sweep: P, gain: 1, label: 'SWEEP 1 BEAT' },
      { sweep: 4 * P, gain: 1, label: 'SWEEP 1 BAR' },
      { sweep: P, gain: 1, label: 'MATH · FFT' },
      { sweep: P / 2, gain: 2, label: 'SWEEP 1/8 · GAIN ×2' },
    ];
    const m = modes[bar]!;
    const kick = au.hit('kick', t, 0.1);
    const end = this.ctx.end;
    // bar 4's last beat strobes on the 16ths between ink and bone paper (the next plate is paper)
    const paper = t > end - P && Math.floor((t - (end - P)) / (P / 4)) % 2 === 1;
    const ink = paper ? 'ink' : 'bone', grd = paper ? 'bone' : 'ink2';
    clearRT(renderer, out, paper ? LIN.bone : LIN.ink);

    // ---- graticule and readouts (Canvas2D)
    const c = this.grat.ctx; this.grat.clear();
    c.fillStyle = rgba(grd, 1);
    c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    for (let x = X0; x <= X1 + 0.5; x += DIV) { c.fillStyle = rgba(ink, x === CX ? 0.3 : 0.1); c.fillRect(x, Y0, 1, Y1 - Y0); }
    for (let y = Y0; y <= Y1 + 0.5; y += DIV) { c.fillStyle = rgba(ink, y === CY ? 0.3 : 0.1); c.fillRect(X0, y, X1 - X0, 1); }
    for (let y = Y0; y <= Y1; y += DIV / 5) { c.fillStyle = rgba(ink, 0.3); c.fillRect(CX - 6, y, 13, 1); }
    for (let x = X0; x <= X1; x += DIV / 5) { c.fillStyle = rgba(ink, 0.3); c.fillRect(x, CY - 6, 1, 13); }
    // header
    const hf = F.archivo(125, 900);
    c.font = font(hf, 96);
    c.fillStyle = rgba(ink, 0.95);
    c.fillText('CH1', X0, 230);
    const lx = X0 + measure('CH1', hf, 96) + 28;
    mono(c, `${m.label}`, lx, 196, { size: 22, col: 'signal', a: 1, weight: 600 });
    const tdiv = bar === 2 ? '40 Hz – 16 kHz, log' : `${((m.sweep / 11) * 1000).toFixed(1)} ms/div`;
    mono(c, `${bar === 2 ? 'SPAN' : 'TIME'}  ${tdiv}`, lx, 230, { size: 22, col: ink, a: 0.75 });
    mono(c, `${m.gain === 1 ? '0.50' : '0.25'} V/div · DC`, X1, 196, { size: 22, a: 0.75, align: 'right', col: ink });
    mono(c, `TRIG ▲ ${bar === 3 ? '8TH' : 'BEAT'}`, X1, 230, { size: 22, a: 0.75, align: 'right', col: ink });
    // footer
    const run = frameIdx(t) % 40 < 28;
    mono(c, run ? '● RUN' : '○ RUN', X0, 1680, { size: 22, col: 'signal', a: 1, weight: 600 });
    mono(c, `${au.bpm.toFixed(2)} BPM`, X0 + 150, 1680, { size: 22, a: 0.7, col: ink });
    mono(c, `BAR ${String(3 + bar).padStart(2, '0')}/22`, X0 + 360, 1680, { size: 22, a: 0.7, col: ink });
    mono(c, timecode(t), X1, 1680, { size: 22, a: 0.5, align: 'right', col: ink });
    mono(c, 'amplitude →', X1 - 4, Y0 - 12, { size: 16, a: 0.4, align: 'right', col: ink });
    mono(c, 't ↓', X0 + 6, Y0 + 24, { size: 16, a: 0.4, col: ink });
    this.grat.upload();
    comp.draw(renderer, this.grat.texture, out);

    // ---- beam
    const lb = paper ? this.lbInk : this.lb; lb.clear();
    const sig = LIN.signal;
    const I = paper ? 0.9 : 1.5 + 1.2 * kick;
    if (bar === 2) {
      // FFT: bands along y (low at the bottom), level mirrored left/right of the centre
      const nb = au.specBands;
      for (let i = 0; i < nb; i++) {
        const y = Y1 - ((i + 0.5) / nb) * (Y1 - Y0);
        const v = au.specAt(t, i);
        const hold = Math.max(v, au.specAt(t - 0.05, i), au.specAt(t - 0.1, i) * 0.97, au.specAt(t - 0.18, i) * 0.92);
        const w = v * AMP * 1.05;
        const h = ((Y1 - Y0) / nb) * 0.62;
        lb.seg2(CX - w, y, CX + w, y, h, [sig[0] * I * 0.9, sig[1] * I * 0.9, sig[2] * I * 0.9], 1);
        const hw = hold * AMP * 1.05 + 6;
        for (const s of [-1, 1]) lb.seg2(CX + s * hw, y - h / 2, CX + s * hw, y + h / 2, 2.5, [3.5, 2.2, 1.4], 0.9);
      }
    } else {
      const sw = m.sweep;
      const trig = tBar + Math.floor((t - tBar) / sw + 1e-6) * sw;
      const yOf = (s: number, tr: number) => Y0 + ((s - tr) / sw) * (Y1 - Y0);
      const rate = au.waveRate;
      const step = sw > 1 ? 2 : 1;
      // phosphor: the two previous sweeps, fading
      for (let e = 2; e >= 0; e--) {
        const tr = trig - e * sw;
        if (tr < tBar - 1e-6 && e > 0) continue;
        const tEnd = e === 0 ? t : tr + sw;
        const fade = e === 0 ? 1 : 0.28 / e;
        let px = CX, py = yOf(tr, tr);
        for (let n = Math.ceil(tr * rate); n / rate <= tEnd; n += step) {
          const s = n / rate;
          const [lo, hi] = au.waveAt(s);
          const y = yOf(s, tr);
          const g = m.gain * AMP;
          const a = clamp(lo * g, -AMP * 1.15, AMP * 1.15), bq = clamp(hi * g, -AMP * 1.15, AMP * 1.15);
          const age = e === 0 ? clamp((t - s) / sw) : 1;
          const k = fade * (1 - 0.55 * age);
          lb.seg2(CX + a, y, CX + bq, y, 1.4, [sig[0] * I * k, sig[1] * I * k, sig[2] * I * k], 0.9);
          const mid = CX + (a + bq) * 0.5;
          if (n !== Math.ceil(tr * rate)) lb.seg2(px, py, mid, y, 1.6, [sig[0] * 2.4 * k, sig[1] * 2.1 * k, sig[2] * 1.8 * k], 1);
          px = mid; py = y;
        }
      }
      const headAt = (tb: number) => {
        const tr = tBar + Math.floor((tb - tBar) / sw + 1e-6) * sw;
        const [lo, hi] = au.waveAt(tb);
        return { x: CX + clamp((lo + hi) * 0.5 * m.gain * AMP, -AMP, AMP), y: yOf(tb, tr) };
      };
      const h = headAt(t);
      sparkParticles(lb, t, (tb) => (tb >= tBar ? headAt(tb) : null), { rate: 60, speed: 220, life: 0.3, seed: 11 });
      sparkHead(lb, h.x, h.y, t, 1 + 0.7 * kick, 1.2);
    }
    lb.render(renderer, out);

    // ---- post: punch on kicks and on each bar's sub-cut; bar 4 strobes on its last two 8ths
    const cut = pulse(t, tBar, 0.08);
    const k0 = lastHit(au, 'kick', t, this.ctx.start);
    const shake = 9 * pulse(t, k0, 0.05);
    return {
      zoom: (bar === 1 ? 1.06 : 1) * (1 + 0.035 * cut + 0.015 * kick),
      shake: [noise1(t * 60, 3) * shake, noise1(t * 60, 4) * shake],
      paper: paper ? 1 : 0,
      bloomThreshold: paper ? 4 : 0.9,
      bloom: 0.75,
      vignette: 0.5,
      flash: 0.5 * pulse(t, this.ctx.start, 0.06),
      ca: 1.6,
    };
  }
}

