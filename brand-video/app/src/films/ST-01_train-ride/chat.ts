// Frames 6 and 9: the chat as the hero, a macro shot of the phone screen. The viewer's words type in
// letter by letter, on the sung words.
//   keep:   "can you keep it on?" (signal bars full)
//   thanks: the viewer's thank-you, word for word: "thanks for being so chill. amazing stream"
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { Macro } from '../../kit/macro';
import { Overlay } from '../../kit/overlay';
import { loadLyrics, type Lyrics } from '../../engine/lyrics';
import { F, font, measure } from '../../engine/type';
import { rgba } from '../../engine/palette';
import { wrap } from '../../kit/kit';
import { clamp, ease } from '../../engine/util';
import { W, H } from '../../engine/gl';

export default class Chat extends Scene {
  mc = new Macro();
  ov = new Overlay();
  ly!: Lyrics;
  override async init() { this.ly = await loadLyrics(); }

  /** chars of `text` shown at t when typed across [t0, t1] */
  typed(text: string, t: number, t0: number, t1: number) { return text.slice(0, Math.floor(clamp((t - t0) / (t1 - t0)) * text.length + 0.0001)); }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, shot = this.ctx.params.shot as 'keep' | 'thanks';
    const c = this.mc.layer.ctx;
    this.mc.layer.clear();
    // the screen: the stream's chat, full screen, in our own generic UI
    c.fillStyle = '#0c0d12'; c.fillRect(0, 0, W, H);
    // status line
    c.font = font(F.mono(700), 34); c.textBaseline = 'middle';
    c.fillStyle = 'rgba(229,72,77,1)'; c.beginPath(); c.arc(80, 150, 12, 0, Math.PI * 2); c.fill();
    c.fillStyle = rgba('bone', 0.9); c.fillText('LIVE · 3 watching', 104, 152);
    const bars = shot === 'keep' ? 4 : Math.min(4, 1 + Math.floor((t - f.start) * 3));
    for (let i = 0; i < 4; i++) { c.fillStyle = i < bars ? rgba('bone', 0.95) : rgba('bone', 0.2); c.fillRect(W - 170 + i * 28, 168 - (16 + i * 13), 18, 16 + i * 13); }
    const big = 104, fam = F.mono(500), famB = F.mono(700);
    const msg = (user: string, text: string, y: number, o: { size: number; a: number; hot?: boolean; caret?: boolean }) => {
      c.save();
      c.globalAlpha = o.a;
      c.font = font(famB, o.size * 0.62); c.textBaseline = 'alphabetic';
      c.fillStyle = o.hot ? rgba('signal', 1) : rgba('frost', 1);
      c.fillText(user, 80, y);
      c.font = font(fam, o.size);
      c.fillStyle = rgba('bone', 1);
      const lines = wrap(text || ' ', fam, o.size, W - 160);
      lines.forEach((s, i) => c.fillText(s, 80, y + o.size * 1.25 * (i + 1)));
      if (o.caret && Math.floor(t * 3) % 2 === 0) {
        const last = lines[lines.length - 1] ?? '';
        c.fillStyle = rgba('signal', 1);
        c.fillRect(80 + measure(last, fam, o.size) + 8, y + o.size * 1.25 * lines.length - o.size * 0.8, o.size * 0.5, o.size * 0.95);
      }
      c.restore();
      return y + o.size * 1.25 * (lines.length + 0.9);
    };
    let focusY = 0.5;
    if (shot === 'keep') {
      const l = this.ly.get('Can you keep it on');
      let y = 420;
      y = msg('viewer_3', "wait, I've never been on a train", y, { size: 52, a: 0.45 });
      const s = 'can you keep it on?';
      msg('viewer_3', this.typed(s, t, l.words[0]!.start - 0.1, l.end), y + 80, { size: big, a: 1, hot: true, caret: true });
      focusY = 1 - (y + 260) / H;
    } else {
      const l = this.ly.get('Said it was amazing');
      // (no "reconnected" line: the post doesn't say when the thank-you came, only that it did)
      const y = 480;
      const s = 'thanks for being so chill. amazing stream';
      msg('viewer_3', this.typed(s, t, f.start, l.words[3]!.end), y, { size: 92, a: 1, hot: true, caret: true });
      focusY = 1 - (y + 300) / H;
    }
    // the input row
    c.fillStyle = 'rgba(241,238,232,0.08)'; c.fillRect(60, H * 0.62, W - 200, 90);
    c.font = font(F.mono(400), 34); c.fillStyle = rgba('ash', 0.6); c.fillText('Say something…', 100, H * 0.62 + 52);
    this.mc.render(this.ctx.renderer, out, { t, focusY, tilt: shot === 'keep' ? -0.05 + 0.02 * f.p : 0.04 - 0.02 * f.p, blur: 0.014, warm: shot === 'thanks' ? 1 : 0 });
    // the sung lyric (subtitle) over the macro, low
    const ov = this.ov;
    ov.begin();
    if (shot === 'thanks') ov.lyric(this.ly.lineAt(t, 0.35, 0.3), t, { y: H * 0.74 });
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    const punch = shot === 'keep' ? 1 + 0.03 * ease.outCubic(clamp((t - f.start) / 1.8)) : 1;
    return { grain: 0.05, vignette: 0.5, bloom: 0.8, halation: 0.35, ca: 1.6, zoom: punch };
  }
}
