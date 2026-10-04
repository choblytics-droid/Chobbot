// The train: frames 5 (pulling out), 7 (the hero shot: the city falls away into farmland) and 8 (signal lost).
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { PixelCanvas, PixelLight } from '../../kit/pixel';
import { Overlay } from '../../kit/overlay';
import { Glitch } from '../../kit/glitch';
import { loadLyrics, type Lyrics } from '../../engine/lyrics';
import { paintCarriage, carriageLights, PHONE_CU } from './sets/carriage';
import { roundRect } from '../../kit/kit';
import { F, font } from '../../engine/type';
import { clamp } from '../../engine/util';
import { W, H } from '../../engine/gl';

/** Distance travelled since the train started at t0 (nearest-layer art px): speeds up over 6 s to 320 px/s. */
export function travel(t: number, t0: number) {
  const x = Math.max(0, t - t0), T = 6, V = 320;
  if (x < T) return V * (x * x * x / (T * T) - x * x * x * x / (2 * T * T * T)); // integral of smoothstep(0,T)·V
  return V * (T / 2) + V * (x - T);
}

export default class Carriage extends Scene {
  pc = new PixelCanvas();
  pl = new PixelLight(this.pc);
  ov = new Overlay();
  gl = new Glitch();
  ly!: Lyrics;
  override async init() { this.ly = await loadLyrics(); }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const P = this.ctx.params as { shot: string; t0: number; gone?: number; black?: number; blackEnd?: number };
    let t = f.t;
    // signal lost: the picture freezes on the word "gone"
    const gone = P.gone ?? 1e9;
    const frozen = t >= gone;
    const tp = frozen ? gone : t;
    const s = travel(tp, P.t0);
    const bars = P.shot === 'board' ? 4 : Math.max(0, 4 - Math.floor(clamp((t - P.t0 - 4) / 9) * 4.999));
    const view = (this.ctx.params.view as 'wide' | 'city' | 'fields' | 'phone' | undefined) ?? (P.shot === 'board' ? 'wide' : 'city');
    const o = { t: tp, scroll: s, cityEnd: 1500, station: s < 160 ? 1 : 0, phone: P.shot === 'board' ? clamp((t - f.start) / 1.2) : 1, view, bars: frozen ? 0 : bars };
    paintCarriage(this.pc, o);
    this.pl.render(this.ctx.renderer, out, {
      lights: carriageLights(o), t: tp, sunEl: -0.11, sunAz: -0.4, skyExp: 4.5, ambient: 0.8, ambNear: 0.6, stars: 1, clouds: 0.35,
      bands: 9, horizonY: 222, fov: 260, haze: view === 'phone' ? 0.75 : 0.35, snow: 0, wet: 0, hazeCol: [0.01, 0.012, 0.02],
    });
    if (P.shot === 'lost') {
      const amt = clamp((t - (gone - 0.35)) / 0.35);
      const black = t >= (P.black ?? 1e9) ? Math.max(0.02, clamp((t - P.black!) / 0.5)) : 0;
      if (amt > 0 || black) this.gl.apply(this.ctx.renderer, out, { amt: frozen ? 1 : amt, t: frozen ? gone : t, block: 22, black });
    }
    // text: lyric low over the seats, signal bars top right
    const ov = this.ov;
    ov.begin();
    const black = t >= (P.black ?? 1e9);
    if (!black) ov.lyric(this.ly.lineAt(t, 0.35, 0.3), t, { y: H * 0.165, maxW: view === 'fields' ? W * 0.66 : undefined, plate: 0.7 }); // upper third, over the ceiling (docs/QA.md)
    if (!black && view !== 'phone' && view !== 'wide') this.signal(frozen ? 0 : bars, 70, 225);   // top left, clear of the lyric and the top bar
    if (view === 'phone' && !black) this.phoneUI(frozen ? 0 : bars, t);
    if (frozen && !black && view !== 'phone') ov.caption('reconnecting…', W / 2, H * 0.36, { size: 38, align: 'center' });
    if (black) ov.caption('signal lost', W / 2, H * 0.5, { size: 60, align: 'center' });
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.05, vignette: 0.45, bloom: 0.7, halation: 0.3, ca: 1.0 };
  }

  /** The phone close-up's own screen UI, crisp, over the pixel screen: LIVE, 3 watching, the signal. */
  phoneUI(n: number, t: number) {
    const c = this.ov.c, k = 4, x0 = (PHONE_CU.x + 4) * k, y0 = (PHONE_CU.y + 10) * k, w = (PHONE_CU.w - 8) * k;
    c.save();
    c.fillStyle = n === 0 ? 'rgba(120,120,128,0.9)' : 'rgba(229,72,77,0.95)'; roundRect(c, x0 + 24, y0 + 24, 92, 40, 10); c.fill();   // LIVE greys out when the signal goes
    c.font = font(F.mono(700), 26); c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('LIVE', x0 + 40, y0 + 45);
    c.fillStyle = 'rgba(241,238,232,0.95)'; c.font = font(F.mono(500), 26); c.fillText('3 watching', x0 + 132, y0 + 45);
    for (let i = 0; i < 4; i++) { c.fillStyle = i < n ? 'rgba(241,238,232,0.95)' : 'rgba(241,238,232,0.25)'; c.fillRect(x0 + w - 110 + i * 22, y0 + 60 - (12 + i * 9), 14, 12 + i * 9); }
    if (n === 0) {
      c.strokeStyle = 'rgba(229,72,77,0.95)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0 + w - 116, y0 + 66); c.lineTo(x0 + w - 18, y0 + 14); c.stroke();
      if (Math.floor(t * 2.5) % 2 === 0) { c.font = font(F.mono(700), 30); c.textAlign = 'center'; c.fillStyle = 'rgba(241,238,232,0.95)'; c.fillText('reconnecting…', x0 + w / 2, y0 + 130); }
    }
    c.restore();
  }

  /** Phone signal bars, top right. */
  signal(n: number, x: number, y: number) {
    const c = this.ov.c;
    c.save();
    for (let i = 0; i < 4; i++) {
      const h = 20 + i * 14;
      c.fillStyle = i < n ? 'rgba(241,238,232,0.95)' : 'rgba(241,238,232,0.22)';
      c.fillRect(x + i * 26, y - h, 17, h);
    }
    if (n === 0) { c.strokeStyle = 'rgba(229,72,77,0.95)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 8, y + 6); c.lineTo(x + 104, y - 70); c.stroke(); }
    c.restore();
  }
}
