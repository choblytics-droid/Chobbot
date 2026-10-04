// Frame 13: the end card (the same brand card closes every film), held over the sonic logo.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { clearRT, W, H } from '../../engine/gl';
import { Overlay } from '../../kit/overlay';
import { F, font } from '../../engine/type';
import { rgba } from '../../engine/palette';
import { clamp, ease } from '../../engine/util';

export default class EndCard extends Scene {
  ov = new Overlay();
  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, lt = f.lt;
    clearRT(this.ctx.renderer, out, [0.004, 0.004, 0.006]);
    const ov = this.ov, c = ov.c;
    ov.begin();
    const a = clamp(lt / 0.35);
    ov.spark(W / 2, H * 0.4, 30 * (0.6 + 0.4 * ease.outBack(clamp(lt / 0.5))), t, a);
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = font(F.archivo(100, 900), 120); c.fillStyle = rgba('bone', a);
    c.fillText('Chobbot', W / 2, H * 0.52);
    c.font = font(F.mono(500), 40); c.fillStyle = rgba('signal', clamp((lt - 0.3) / 0.3));
    c.fillText('never stream alone', W / 2, H * 0.52 + 110);
    c.font = font(F.mono(400), 24); c.fillStyle = rgba('ash', 0.8 * clamp((lt - 0.6) / 0.3));
    c.fillText('Story shared by a streamer on Reddit, retold with permission', W / 2, H * 0.9);
    c.restore();
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.04, vignette: 0.3, bloom: 0.9, halation: 0.3, ca: 0.6 };
  }
}
