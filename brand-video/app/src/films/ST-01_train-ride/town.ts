// The old town: frames 1a (opening card), 2 (the tour), 11 (the outro walk), 12 (the next day).
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { PixelCanvas, PixelLight } from '../../kit/pixel';
import { Overlay } from '../../kit/overlay';
import { loadLyrics, type Lyrics } from '../../engine/lyrics';
import { paintTown, townLights, type TownOpts } from './sets/town';
import { clamp, ease } from '../../engine/util';
import { W, H } from '../../engine/gl';

export default class Town extends Scene {
  pc = new PixelCanvas();
  pl = new PixelLight(this.pc);
  ov = new Overlay();
  ly!: Lyrics;
  override async init() { this.ly = await loadLyrics(); }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const shot = this.ctx.params.shot as 'open' | 'tour' | 'outro' | 'newday';
    const t = f.t, p = f.p;
    const o: TownOpts = { t, rot: t * 0.55 };
    let sky = { sunEl: -0.045, sunAz: -0.9, skyExp: 3.2, ambient: 0.9, stars: 1, clouds: 0.5 };
    let haze = 0.55, wet = 0.6, snow = 1;
    if (shot === 'open') { o.streamer = 'none'; o.camY = -26 * (1 - ease.outCubic(p)); o.camX = 6 * (1 - p); }
    if (shot === 'tour') { o.streamer = 'tripod'; o.sx = 74; o.camX = -4 + 8 * p; }
    if (shot === 'outro') { o.streamer = 'none'; o.camX = -30 + 60 * p; o.camY = 1.5 * Math.sin(t * 4.1); sky = { ...sky, sunEl: -0.04, skyExp: 3.6 }; }
    if (shot === 'newday') { o.streamer = 'none'; o.day = 1; sky = { sunEl: 0.12, sunAz: 2.3, skyExp: 0.42, ambient: 1.3, stars: 0, clouds: 0.6 }; haze = 0.25; wet = 0.35; snow = 0.4; }
    paintTown(this.pc, o);
    this.pl.render(this.ctx.renderer, out, {
      lights: townLights(o), t, ...sky, bands: 9, horizonY: 262, fov: 300, haze, snow, wet, groundY: 405,
      hazeCol: shot === 'newday' ? [0.06, 0.05, 0.05] : [0.015, 0.022, 0.05],
    });
    // text
    const ov = this.ov;
    ov.begin();
    if (shot === 'open') ov.card('Based on a true story', t, f.start, this.ctx.params.cardOut ?? f.end, { y: H * 0.24 });
    if (shot === 'tour' || shot === 'outro' || (shot === 'newday' && t < (this.ctx.params.keptAt ?? 1e9))) ov.lyric(this.ly.lineAt(t, 0.35, 0.3), t, { y: H * 0.2 });
    if (shot === 'newday') {
      const a = clamp((t - (this.ctx.params.keptAt ?? 1e9)) / 0.3);
      if (a > 0) ov.title('They kept streaming IRL.', W / 2, H * 0.2, { a });
      ov.caption('LIVE · IRL', W * 0.08, H * 0.07, { size: 30, dot: '#ff3b3b', a: clamp((t - f.start - 0.4) / 0.2) });
    }
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.045, vignette: 0.4, bloom: 0.7, halation: 0.35, ca: 1.0 };
  }
}
