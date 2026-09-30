// PLATE 6 — "Detonation / loop" (the last downbeat, 0.3 s).
// The spark the infection collapsed into goes off on the downbeat: a white flash and one
// shock ring. Under it the film's first frame is already there (the count-in at "8"),
// so as the flash clears the last frame IS the first frame and the video loops seamlessly.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { W, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN } from '../engine/palette';
import { clamp, ease, prog, TAU, hash } from '../engine/util';
import Riser from './riser';

const CX = W / 2, CY = 8 * 120 + 60;

export default class End extends Scene {
  lb = new LineBatch(8000);
  first!: Riser;

  override init() {
    this.first = new Riser({ ...this.ctx, id: 'riser', params: {}, start: 0, end: this.ctx.audio.drop });
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer } = this.ctx;
    const lt = f.lt, dur = this.ctx.end - this.ctx.start;
    clearRT(renderer, out, LIN.ink);
    // the first frame of the film, frozen
    const ov = this.first.render({ ...f, t: 0, lt: 0, p: 0, beat: 0, bar: 0, beatPhase: 0, barPhase: 0 }, out) ?? {};
    // shock ring + debris
    const lb = this.lb; lb.clear();
    const k = ease.outExpo(clamp(lt / 0.26));
    const r = 30 + 1500 * k;
    const I = (1 - k) * 4;
    if (I > 0.01) {
      const n = 180;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
        const w = 1 + 0.08 * Math.sin(i * 7.3);
        lb.seg2(CX + Math.cos(a0) * r * w, CY + Math.sin(a0) * r * w, CX + Math.cos(a1) * r * w, CY + Math.sin(a1) * r * w, 3 + 22 * (1 - k), [LIN.ember[0] * I, LIN.ember[1] * I, LIN.ember[2] * I], 1);
      }
      for (let i = 0; i < 90; i++) {
        const a = hash(i, 1) * TAU, sp = 900 + 2600 * hash(i, 2) ** 2;
        const d0 = sp * Math.max(0, lt - 0.02), d1 = sp * lt;
        lb.seg2(CX + Math.cos(a) * d0, CY + Math.sin(a) * d0, CX + Math.cos(a) * d1, CY + Math.sin(a) * d1, 2.2, [3 * I, 1.6 * I, 0.7 * I], 1);
      }
    }
    lb.render(renderer, out);
    const flash = 1.6 * (1 - ease.outCubic(prog(lt, 0, dur * 0.85)));
    return { ...ov, flash, zoom: 1 + 0.06 * (1 - k), shake: [0, 0] };
  }
}
