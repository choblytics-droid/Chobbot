// PLATE 2 — "Pattern sheet" (4 bars, bone paper).
// The drum pattern the analysis actually found, printed as a step-sequencer score in portrait:
// 16 steps run DOWN the page, four lanes (KICK / CLAP / HAT / BELL) across. The playhead stamps
// each cell at the moment the hit sounds; the cell's width is the hit's velocity; the bell lane
// is the only orange. One page per bar (hard cut on the downbeat), the previous page's pattern
// ghosted underneath. Bar 3 follows the playhead close-up; on bar 4's last beat the page is
// blacked out from the top, handing an ink frame to the next plate.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, prog, pulse, noise1, hash, lerp } from '../engine/util';
import { beatNo, beatT, mono, timecode } from './_kit';

const GX0 = 170, GX1 = 1010, GY0 = 540, GY1 = 1640;
const LANES = [
  { kind: 'kick', name: 'KICK' },
  { kind: 'snare', name: 'CLAP' },
  { kind: 'hat', name: 'HAT' },
  { kind: 'bell', name: 'BELL' },
] as const;
const LW = (GX1 - GX0) / LANES.length, SH = (GY1 - GY0) / 16;

type Cell = { lane: number; step: number; t: number; s: number };

export default class Grid extends Scene {
  L = new Layer2D();
  pages: Cell[][] = [];
  b0 = 0;
  P = 0.45;

  override init() {
    const au = this.ctx.audio;
    this.P = 60 / au.bpm;
    this.b0 = Math.round(beatNo(au, this.ctx.start));
    // pages -1 (ghost for bar 1) .. 3
    for (let j = -1; j < 4; j++) {
      const tb = beatT(au, this.b0 + 4 * j);
      const cells: Cell[] = [];
      LANES.forEach((ln, lane) => {
        const seen = new Set<number>();
        for (const [ot, s] of au.events(ln.kind, tb - this.P / 8, tb + 4 * this.P - this.P / 8)) {
          const step = clamp(Math.round((ot - tb) / (this.P / 4)), 0, 15);
          if (seen.has(step)) continue;
          seen.add(step);
          cells.push({ lane, step, t: ot, s });
        }
      });
      this.pages.push(cells);
    }
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, P = this.P;
    const bb = beatNo(au, t) - this.b0;
    const j = clamp(Math.floor(bb / 4 + 1e-4), 0, 3);
    const tb = beatT(au, this.b0 + 4 * j);
    const ph = clamp((t - tb) / (4 * P)); // playhead 0..1 through the bar
    const py = GY0 + ph * (GY1 - GY0);
    clearRT(renderer, out, LIN.bone);
    const c = this.L.ctx; this.L.clear();

    // ---- camera: bar 3 rides the playhead close-up
    c.save();
    if (j === 2) {
      const z = 1.55, cy = clamp(py, GY0 + 300, GY1 - 300);
      const rot = -0.035 + 0.02 * Math.sin(ph * Math.PI);
      c.translate(W / 2, H * 0.52);
      c.rotate(rot);
      c.scale(z, z);
      c.translate(-(GX0 + GX1) / 2 + 40, -cy);
    }

    // ---- header: the bar number slams on the downbeat
    const barNo = 7 + j;
    const hf = F.archivo(125, 900);
    const slam = 1 + 0.18 * (1 - ease.outExpo(clamp((t - tb) / 0.22)));
    const hs = 210;
    c.save();
    c.translate(64, 380);
    c.scale(slam, slam);
    c.font = font(hf, hs);
    c.fillStyle = rgba('ink', 1);
    c.fillText(`BAR ${String(barNo).padStart(2, '0')}`, 0, 0);
    c.restore();
    mono(c, 'PATTERN SHEET', 64, 440, { size: 22, col: 'ink', a: 0.95, weight: 600 });
    mono(c, `${au.bpm.toFixed(2)} BPM · 4/4 · 16 steps`, 290, 440, { size: 22, col: 'ink', a: 0.6 });
    mono(c, `${barNo} / 22`, W - 64, 440, { size: 22, col: 'ink', a: 0.6, align: 'right' });
    c.fillStyle = rgba('ink', 0.8); c.fillRect(64, 462, W - 128, 2);

    // ---- lanes + step numbers
    LANES.forEach((ln, lane) => {
      const x = GX0 + lane * LW;
      mono(c, ln.name, x + 10, GY0 - 18, { size: 22, col: ln.kind === 'bell' ? 'signal' : 'ink', a: 1, weight: 600 });
      c.fillStyle = rgba('ink', 0.35);
      c.fillRect(x, GY0 - 8, 1, GY1 - GY0 + 16);
    });
    c.fillStyle = rgba('ink', 0.35); c.fillRect(GX1, GY0 - 8, 1, GY1 - GY0 + 16);
    for (let s = 0; s <= 16; s++) {
      const y = GY0 + s * SH;
      c.fillStyle = rgba('ink', s % 4 === 0 ? 0.8 : 0.16);
      c.fillRect(GX0 - (s % 4 === 0 ? 70 : 0), Math.round(y), GX1 - GX0 + (s % 4 === 0 ? 70 : 0), s % 4 === 0 ? 2 : 1);
      if (s < 16) mono(c, String(s + 1).padStart(2, '0'), GX0 - 20, y + SH * 0.62, { size: 20, col: 'ink', a: s % 4 === 0 ? 0.95 : 0.5, align: 'right' });
    }

    // ---- ghost of the previous bar's pattern
    for (const cell of this.pages[j]!) this.drawCell(c, cell, 0, true);
    // ---- this bar: stamped as the hits sound
    for (const cell of this.pages[j + 1]!) if (t >= cell.t - 0.004) this.drawCell(c, cell, t - cell.t, false);

    // ---- playhead
    c.fillStyle = rgba('signal', 1);
    c.fillRect(GX0 - 70, py - 2, GX1 - GX0 + 110, 4);
    c.beginPath(); c.arc(GX0 - 70, py, 9, 0, Math.PI * 2); c.fill();
    mono(c, timecode(t), GX1 + 8, py - 10, { size: 16, col: 'signal', a: 1, align: 'right' });
    c.restore();

    // ---- bar 4's last beat: the page is blacked out from the top, 8th by 8th
    const end = this.ctx.end;
    if (t > end - P) {
      const k = Math.floor((t - (end - P)) / (P / 2)) + 1; // 1, 2
      const sub = ease.outExpo(clamp((t - (end - P) - (k - 1) * (P / 2)) / 0.12));
      const hgt = lerp((k - 1) / 2, k / 2, sub) * H;
      c.fillStyle = rgba('ink', 1);
      c.fillRect(0, 0, W, hgt);
    }
    this.L.upload();
    comp.draw(renderer, this.L.texture, out);

    const kick = au.hit('kick', t, 0.08);
    const shake = 6 * kick;
    return {
      bloomThreshold: 3, bloom: 0.4, halation: 0.1, vignette: 0.3, grain: 0.05, ca: 0.8, paper: 1,
      zoom: 1 + 0.012 * kick + 0.03 * pulse(t, tb, 0.06),
      shake: [noise1(t * 60, 5) * shake, noise1(t * 60, 6) * shake],
    };
  }

  private drawCell(c: CanvasRenderingContext2D, cell: Cell, age: number, ghost: boolean) {
    const x = GX0 + cell.lane * LW, y = GY0 + cell.step * SH;
    const bell = cell.lane === 3;
    if (ghost) {
      c.strokeStyle = rgba('ink', 0.28);
      c.lineWidth = 1.5;
      c.setLineDash([4, 5]);
      c.strokeRect(x + 10, y + 7, LW - 20, SH - 14);
      c.setLineDash([]);
      return;
    }
    const pop = 1 + 0.35 * (1 - ease.outExpo(clamp(age / 0.18)));
    const w = (LW - 20) * (0.3 + 0.7 * cell.s);
    const rot = (hash(cell.lane, cell.step, 7) - 0.5) * 0.05;
    c.save();
    c.translate(x + 10 + w / 2, y + SH / 2);
    c.rotate(rot);
    c.scale(pop, pop);
    c.fillStyle = rgba(bell ? 'signal' : 'ink', 1);
    c.fillRect(-w / 2, -(SH - 14) / 2, w, SH - 14);
    c.restore();
    mono(c, `v${cell.s.toFixed(2)}`, x + LW - 12, y + SH * 0.62, { size: 15, col: bell ? 'signal' : 'ink', a: 0.7 * prog(age, 0.05, 0.2), align: 'right' });
  }
}


