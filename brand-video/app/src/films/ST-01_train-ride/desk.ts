// Frame 1: the desk, the opening shot (the song starts at once). A year of game streaming from this chair;
// the monitor goes dark, the door opens, the phone wakes up LIVE on "stream". Caption: `first real IRL` →
// `LIVE · IRL`. The hook sticker "Based on a true story" pops on over it.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { PixelCanvas, PixelLight } from '../../kit/pixel';
import { Overlay } from '../../kit/overlay';
import { loadLyrics, type Lyrics } from '../../engine/lyrics';
import { paintDesk, deskLights } from './sets/desk';
import { clamp, ease } from '../../engine/util';
import { W, H } from '../../engine/gl';

export default class Desk extends Scene {
  pc = new PixelCanvas();
  pl = new PixelLight(this.pc);
  ov = new Overlay();
  ly!: Lyrics;
  override async init() { this.ly = await loadLyrics(); }
  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, k = ease.inOutCubic(clamp((t - 0.6) / 1.4));
    paintDesk(this.pc, { t, k });
    this.pl.render(this.ctx.renderer, out, {
      lights: deskLights(k), t, sunEl: -0.12, sunAz: -0.5, skyExp: 4.5, ambient: 0.5, ambNear: 0.5, stars: 1, clouds: 0.3,
      bands: 9, horizonY: 160, fov: 200, haze: 0.6, snow: 0, wet: 0, hazeCol: [0.01, 0.012, 0.02],
    });
    const ov = this.ov;
    ov.begin();
    // the switch to LIVE lands on "stream"
    const sw = this.ly.lines[0]!.words[2]!.start;
    ov.caption('first real IRL', W / 2, H * 0.105, { size: 36, align: 'center', a: 1 - clamp((t - sw) / 0.08) });
    ov.caption('LIVE · IRL', W / 2, H * 0.105, { size: 36, align: 'center', dot: '#ff3b3b', a: clamp((t - sw) / 0.08) });
    ov.hook('Based on a true story', t, 0.05, this.ctx.params.hookEnd ?? 2.75);
    ov.lyric(this.ly.lineAt(t, 0.35, 0.3), t, { y: H * 0.2, plate: 0.75 }); // same place as in the next shot (clear of the top bar)
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.05, vignette: 0.45, bloom: 0.7, halation: 0.3, ca: 1.0 };
  }
}
