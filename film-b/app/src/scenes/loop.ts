// COVER PLATE 6 — "Every word he SPEAKS" (the last downbeat, 0.3 s) → loop.
// The power comes back on the downbeat: SPEAKS slams in white-hot with a flash, and as it
// clears, the film's first frame (the alley, SHADOWS lit) is already underneath, so the
// last frame hands straight back to the first and the video loops.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { clamp, ease, prog } from '../engine/util';
import Alley from './alley';

export default class Loop extends Scene {
  first!: Alley;
  L = new Layer2D();

  override async init() {
    this.first = new Alley({ ...this.ctx, id: 'alley', params: {}, start: 0, end: this.ctx.audio.drop });
    await this.first.init();
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const lt = f.lt, dur = this.ctx.end - this.ctx.start;
    const ov = this.first.render({ ...f, t: 0, lt: 0, p: 0, beat: 0, bar: 0, beatPhase: 0, barPhase: 0 }, out) ?? {};
    // SPEAKS, slammed over the frame and burning out
    const k = 1 - ease.inCubic(prog(lt, 0.04, dur * 0.8));
    if (k > 0.001) {
      const c = this.L.ctx; this.L.clear();
      const fam = F.archivo(125, 900), size = 250;
      const w = measure('SPEAKS', fam, size);
      const s = 1.25 - 0.25 * ease.outExpo(clamp(lt / 0.12));
      c.save(); c.translate(W / 2, 1040); c.scale(Math.min(1, 960 / w) * s, Math.min(1, 960 / w) * s);
      c.font = font(fam, size);
      c.fillStyle = rgba('ghost', k);
      c.fillText('SPEAKS', -w / 2, 0);
      c.restore();
      this.L.upload();
      comp.draw(renderer, this.L.texture, out, { mode: 'add', tint: [3, 3, 3] });
    }
    return { ...ov, flash: 1.2 * (1 - ease.outCubic(prog(lt, 0, dur * 0.9))), zoom: 1 + 0.05 * k, shake: [0, 0] };
  }
}
