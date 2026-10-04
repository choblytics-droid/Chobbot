// The old town: frames 1a (opening card), 2 (the tour), 11 (the outro walk), 12 (the next day).
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { PixelCanvas, PixelLight } from '../../kit/pixel';
import { Overlay } from '../../kit/overlay';
import { roundRect } from '../../kit/kit';
import { F, font } from '../../engine/type';
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
    const shot = this.ctx.params.shot as 'open' | 'tour' | 'neon' | 'outro' | 'newday';
    const t = f.t, p = f.p;
    const o: TownOpts = { t, rot: t * 0.55 };
    let sky = { sunEl: -0.045, sunAz: -0.9, skyExp: 3.2, ambient: 0.9, stars: 1, clouds: 0.5 };
    let haze = 0.55, wet = 0.6, snow = 1;
    if (shot === 'open') { o.streamer = 'none'; o.camY = -26 * (1 - ease.outCubic(p)); o.camX = 6 * (1 - p); }
    if (shot === 'tour') { o.streamer = 'tripod'; o.sx = 74; o.camX = -4 + 8 * p; }
    if (shot === 'neon') { o.streamer = 'tripod'; o.sx = 74; o.camX = 4 + 4 * p; }
    if (shot === 'outro') { o.streamer = 'none'; o.camX = -30 + 60 * p; o.camY = 1.5 * Math.sin(t * 4.1); sky = { ...sky, sunEl: -0.04, skyExp: 3.6 }; }
    if (shot === 'newday') { o.streamer = 'none'; o.day = 1; sky = { sunEl: 0.07, sunAz: -1.95, skyExp: 0.9, ambient: 1.2, stars: 0, clouds: 0.45 }; haze = 0.18; wet = 0.15; snow = 0; }   // dawn: pale sky above, low warm sun from the left
    paintTown(this.pc, o);
    if (shot === 'neon') return this.neon(f, out);
    this.pl.render(this.ctx.renderer, out, {
      lights: townLights(o), t, ...sky, bands: shot === 'newday' ? 6 : 9, horizonY: 262, fov: 300, haze, snow, wet, groundY: 405,
      hazeCol: shot === 'newday' ? [0.06, 0.05, 0.05] : [0.015, 0.022, 0.05],
    });
    // text
    const ov = this.ov;
    ov.begin();
    if (shot === 'tour') ov.hook('Based on a true story', t, 0.05, this.ctx.params.hookEnd ?? 0);
    if (shot === 'tour' || shot === 'outro' || (shot === 'newday' && t < (this.ctx.params.keptAt ?? 1e9))) ov.lyric(this.ly.lineAt(t, 0.35, 0.3), t, { y: H * 0.2 });
    if (shot === 'outro') {
      // the last chat message, remembered (no brand, no companion: a Story is not a brand video)
      const at = this.ctx.params.msgAt ?? 1e9;
      const a = clamp((t - at) / 0.3);
      if (a > 0) {
        ov.chat('viewer_3', 'thanks for being so chill. amazing stream', t, W * 0.05, H * 0.27, { a: a * 0.95, size: 30, w: W * 0.6, hot: true });   // left of the castle
      }
    }
    if (shot === 'newday') {
      const a = clamp((t - (this.ctx.params.keptAt ?? 1e9)) / 0.3);
      if (a > 0) ov.title('They kept streaming IRL.', W / 2, H * 0.2, { a });
      // the credit, small, at the bottom; then the film fades out with the song's last note
      const c = ov.c;
      c.save(); c.font = font(F.mono(500), 26); c.textAlign = 'center';
      c.fillStyle = `rgba(6,7,11,${0.62 * a})`; roundRect(c, W / 2 - 420, H * 0.25 - 26, 840, 40, 12); c.fill();
      c.fillStyle = `rgba(241,238,232,${0.95 * a})`;
      c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 18;
      c.fillText('Story shared by a streamer on Reddit, retold with permission', W / 2, H * 0.25); c.restore();   // under the closing line, clear of the caption zone
      ov.caption('LIVE · IRL', W * 0.08, H * 0.1, { size: 30, dot: '#ff3b3b', a: clamp((t - f.start - 0.4) / 0.2) });
    }
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    const fade = shot === 'newday' ? clamp((t - (f.end - 0.6)) / 0.6) : 0;
    return { grain: 0.045, vignette: 0.4, bloom: 0.7, halation: 0.35, ca: 1.0, fade };
  }

  /** Frame 3: the market as neon lines; the viewer counter climbs 1, 2, 3 and the chat pops up by the carousel. */
  neon(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t;
    this.pl.renderNeon(this.ctx.renderer, out, t, 405);
    const ov = this.ov;
    ov.begin();
    ov.lyric(this.ly.lineAt(t, 0.35, 0.3), t, { y: H * 0.2 });
    const three = this.ly.get('Three people').words[0]!.start;
    const n = t >= three ? 3 : t >= three - 0.5 ? 2 : 1;   // 3 on the sung word "Three"
    ov.caption(`${n} watching`, W / 2, H * 0.31, { size: 44, align: 'center', dot: '#ff3b3b' });
    // (only neutral reactions: the post doesn't say what the chat wrote, so no invented lines)
    const msgs: [string, string, number][] = [['viewer_1', 'o/', 0.08], ['viewer_1', '<3', 0.3], ['viewer_2', ':)', 0.5], ['viewer_1', '<3 <3', 0.72]];
    let y = H * 0.4;
    for (const [u, m, at] of msgs) {
      const a = clamp((f.p - at) / 0.04);
      if (a <= 0) continue;
      ov.caption(`${u}  ${m}`, W * 0.06, y, { size: 30, a, col: u === 'viewer_1' ? 'rgba(255,178,36,1)' : undefined });
      y += 66;
    }
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.05, vignette: 0.45, bloom: 0.8, bloomThreshold: 0.75, halation: 0.35, ca: 1.6 };
  }
}
