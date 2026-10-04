// Frame 1b: the desk. A year of game streaming from this chair; the monitor goes dark, the door
// opens, the phone wakes up LIVE. Caption: `first real IRL` → `LIVE · IRL`.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { PixelCanvas, PixelLight } from '../../kit/pixel';
import { Overlay } from '../../kit/overlay';
import { paintDesk, deskLights } from './sets/desk';
import { clamp, ease } from '../../engine/util';
import { W, H } from '../../engine/gl';

export default class Desk extends Scene {
  pc = new PixelCanvas();
  pl = new PixelLight(this.pc);
  ov = new Overlay();
  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, k = ease.inOutCubic(clamp(f.p * 1.4));
    paintDesk(this.pc, { t, k });
    this.pl.render(this.ctx.renderer, out, {
      lights: deskLights(k), t, sunEl: -0.12, sunAz: -0.5, skyExp: 4.5, ambient: 0.5, ambNear: 0.5, stars: 1, clouds: 0.3,
      bands: 9, horizonY: 160, fov: 200, haze: 0.6, snow: 0, wet: 0, hazeCol: [0.01, 0.012, 0.02],
    });
    const ov = this.ov;
    ov.begin();
    const sw = f.start + (f.end - f.start) * 0.55;
    ov.caption('first real IRL', W / 2, H * 0.12, { size: 40, align: 'center', a: 1 - clamp((t - sw) / 0.08) });
    ov.caption('LIVE · IRL', W / 2, H * 0.12, { size: 40, align: 'center', dot: '#ff3b3b', a: clamp((t - sw) / 0.08) });
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.05, vignette: 0.45, bloom: 0.7, halation: 0.3, ca: 1.0 };
  }
}
