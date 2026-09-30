// COVER PLATE 0 — "The alley" (count-in, 0 → the drop).
// "…king of the SHADOWS in his BROKEN HEART / He TOLD me EVERYTHING,"
// The cover's street, in portrait: a narrow wet alley at night, rain, blade signs down both walls.
// The camera dollies toward the stone wall at the end (the rusted door, the ghost sitting on top),
// accelerating over the two bars; each sung word lights its own blade sign as we pass it
// (BROKEN buzzes, HEART cracks in half). Lightning on the drop.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { loadLyrics, type Lyrics } from '../engine/lyrics';
import { clamp, ease, prog, pulse, noise1 } from '../engine/util';
import { beatNo, beatT } from './_kit';
import { drawAlley, makeFacades, ignite, buzz, lyricBlock, drawGhost, drawWisps, rain, type Cam, type Sign } from './_world';

export const END_Z = 40;

/** The wall at the end of the alley: stone, the rusted door (right of centre, as on the cover), the ghost on top. */
export function drawEndWall(c: CanvasRenderingContext2D, glow: CanvasRenderingContext2D, k: number, o: { x: number; y: number }, t: number) {
  const ww = 5.2 * k, wh = 4.4 * k;
  const x0 = o.x - ww / 2, y0 = o.y - wh;
  c.fillStyle = rgba('stone', 1);
  c.fillRect(x0, y0, ww, wh);
  // stone courses
  c.fillStyle = rgba('#1C1E36', 1);
  for (let r = 0; r < 7; r++) {
    const yy = y0 + (r / 7) * wh;
    c.fillRect(x0, yy, ww, Math.max(1, k * 0.05));
    for (let q = 0; q < 6; q++) c.fillRect(x0 + ((q + (r % 2) * 0.5) / 6) * ww, yy, Math.max(1, k * 0.05), wh / 7);
  }
  // the door
  const dx = o.x + 0.55 * k, dw = 1.25 * k, dh = 2.5 * k;
  c.fillStyle = rgba('rustDark', 1);
  c.fillRect(dx - dw / 2 - k * 0.08, o.y - dh - k * 0.08, dw + k * 0.16, dh + k * 0.08);
  c.fillStyle = rgba('rust', 1);
  c.fillRect(dx - dw / 2, o.y - dh, dw, dh);
  c.fillStyle = rgba('rustDark', 0.7);
  for (let i = 1; i < 4; i++) c.fillRect(dx - dw / 2, o.y - dh + (i / 4) * dh, dw, Math.max(1, k * 0.04));
  glow.fillStyle = rgba('cyan', 0.5);
  glow.fillRect(dx - dw * 0.18, o.y - dh * 0.86, dw * 0.36, dh * 0.06);
  // the ghost on top of the wall
  drawGhost(glow, x0 + ww * 0.72, y0 - 0.55 * k, 0.42 * k, t, { alpha: 0.95 });
  drawWisps(glow, x0 + ww * 0.72, y0 + 0.2 * k, 0.4 * k, t, { alpha: 0.35, seed: 4 });
}

export default class Alley extends Scene {
  flat = new Layer2D();
  glow = new Layer2D();
  lb = new LineBatch(3000);
  facades = makeFacades(3, 70);
  ly!: Lyrics;
  signs: Sign[] = [];

  override async init() {
    this.ly = await loadLyrics();
    const w = (q: string, n = 0) => this.ly.lines.flatMap((l) => l.words).filter((x) => x.w.toLowerCase().startsWith(q))[n]!.start;
    const S = (text: string, side: number, z: number, col: string, on: (t: number) => number, h = 4.6, y = 2.6): Sign =>
      ({ text, x: side * 1.95, y, z, w: 0.95, h, col, on });
    const tShadows = w('shadows'), tBroken = w('broken'), tHeart = w('heart'), tTold = w('told'), tEvery = w('everything');
    this.signs = [
      S('ABERTO', 1, 4, 'cyan', (t) => 0.55 * buzz(t, 0.08, 1), 4.2),
      S('SHADOWS', -1, 9, 'magenta', (t) => ignite(t, tShadows, 2), 5.6),
      S('BROKEN', 1, 15, 'cyan', (t) => ignite(t, tBroken, 3) * buzz(t, 0.3, 3), 5),
      S('HEART', -1, 20.5, 'magenta', (t) => ignite(t, tHeart, 4) * (t > tHeart + 0.45 ? buzz(t, 0.5, 4) : 1), 4.4),
      S('TOLD', 1, 26, 'cyan', (t) => ignite(t, tTold, 5), 3.8),
      S('EVERYTHING', -1, 31, 'magenta', (t) => ignite(t, tEvery, 6), 6.2, 2.2),
      S('BAR', 1, 36, 'violet', (t) => 0.5 * buzz(t, 0.1, 7), 2.6),
    ];
  }

  cam(t: number): Cam {
    const au = this.ctx.audio;
    const drop = au.drop;
    // accelerating dolly, plus a small surge on every beat
    const b = beatNo(au, t);
    const surge = Math.max(0, Math.floor(b + 1e-4)) + ease.outExpo(clamp((t - beatT(au, Math.floor(b + 1e-4))) / 0.2));
    const z = 34 * ease.inCubic(clamp(t / drop)) * 0.8 + 0.85 * surge;
    return { z: Math.min(z, 34.5), x: 0.25 * Math.sin(t * 0.8), y: 1.7 + 0.08 * Math.sin(t * 2.1), hor: 700, f: 900, roll: -0.02 + 0.015 * Math.sin(t * 1.3) };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, drop = au.drop;
    clearRT(renderer, out, [0, 0, 0]);
    const flat = this.flat.ctx, glow = this.glow.ctx;
    this.flat.clear(); this.glow.clear();
    const cam = this.cam(t);
    const light = pulse(t, drop - 0.07, 0.05) * (t < drop ? 1 : 0);
    drawAlley(flat, glow, cam, t, this.facades, this.signs, {
      endZ: END_Z,
      drawEnd: (k, o) => drawEndWall(flat, glow, k, o, t),
      lightning: light,
    });
    // karaoke, lower third
    const line = this.ly.lineAt(t, 0.5, 0.3);
    if (line) {
      glow.fillStyle = rgba('night', 0);
      lyricBlock(glow, line, t, W / 2, 1520, { col: line.i % 2 ? 'cyan' : 'magenta', hot: 'ghost', size: 86 });
    }
    this.flat.upload(); this.glow.upload();
    comp.draw(renderer, this.flat.texture, out);
    comp.draw(renderer, this.glow.texture, out, { mode: 'add', tint: [2.4, 2.4, 2.4] });
    const lb = this.lb; lb.clear();
    rain(lb, t, { n: 380, intensity: 0.32 });
    lb.render(renderer, out);
    const shake = 5 * pulse(t, beatT(au, Math.floor(beatNo(au, t) + 1e-4)), 0.06);
    return {
      bloom: 0.95, bloomThreshold: 0.75, halation: 0.08, vignette: 0.55, grain: 0.05, ca: 1.3,
      shake: [noise1(t * 60, 1) * shake, noise1(t * 60, 2) * shake],
      flash: 1.1 * ease.inExpo(prog(t, drop - 0.1, drop)),
    };
  }
}

