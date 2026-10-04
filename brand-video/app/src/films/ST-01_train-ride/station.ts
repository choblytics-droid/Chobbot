// Frame 4: the station, seen through the stream itself. The train is in; "End stream?" comes up as
// the song says goodbye, then the chat line lands: "wait, I've never been on a train".
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { PixelCanvas, PixelLight } from '../../kit/pixel';
import { Overlay } from '../../kit/overlay';
import { loadLyrics, type Lyrics } from '../../engine/lyrics';
import { paintStation, stationLights } from './sets/station';
import { clamp } from '../../engine/util';
import { H } from '../../engine/gl';

export default class Station extends Scene {
  pc = new PixelCanvas();
  pl = new PixelLight(this.pc);
  ov = new Overlay();
  ly!: Lyrics;
  override async init() { this.ly = await loadLyrics(); }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t;
    // handheld: a slow drift and a little sway
    paintStation(this.pc, { t, camX: -6 + 12 * f.p + 1.2 * Math.sin(t * 1.7) });
    this.pl.render(this.ctx.renderer, out, {
      lights: stationLights(t), t, sunEl: -0.1, sunAz: -0.6, skyExp: 4.5, ambient: 0.9, ambNear: 0.7, stars: 1, clouds: 0.4,
      bands: 9, horizonY: 230, fov: 280, haze: 0.5, snow: 1, wet: 0.25, groundY: 378, hazeCol: [0.012, 0.016, 0.03],
    });
    const ov = this.ov;
    ov.begin();
    const l5 = this.ly.get('Train to catch'), l6 = this.ly.get('never been on a train');
    const s0 = f.start;
    ov.streamUI({
      t, viewers: 3, time: `1:${String(12 + Math.floor((t - s0) / 60)).padStart(2, '0')}:${String(40 + Math.floor(t - s0)).padStart(2, '0')}`,
      chat: [
        // neutral reactions only (no invented lines); the one real line is viewer_3's
        { user: 'viewer_1', text: '<3', at: s0 - 10 },
        { user: 'viewer_2', text: ':)', at: s0 - 6 },
        { user: 'viewer_1', text: 'o/', at: l5.start + 0.6 },
        { user: 'viewer_3', text: "wait, I've never been on a train", hot: true, at: l6.start - 0.1 },
      ],
      prompt: { a: clamp((t - (l5.start + 0.2)) / 0.2), keep: clamp((t - (l6.end - 0.3)) / 0.25) },
    });
    ov.lyric(this.ly.lineAt(t, 0.35, 0.3), t, { y: H * 0.375 });
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.05, vignette: 0.35, bloom: 0.7, halation: 0.3, ca: 1.0 };
  }
}
