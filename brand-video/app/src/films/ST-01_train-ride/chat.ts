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
    // status line: only in the first chat shot (in the thank-you it would imply the stream reconnected: QA-1)
    if (shot === 'keep') {
      c.font = font(F.mono(700), 34); c.textBaseline = 'middle';
      c.fillStyle = 'rgba(229,72,77,1)'; c.beginPath(); c.arc(80, 260, 12, 0, Math.PI * 2); c.fill();
      c.fillStyle = rgba('bone', 0.9); c.fillText('LIVE · 3 watching', 104, 262);
      for (let i = 0; i < 4; i++) { c.fillStyle = rgba('bone', 0.95); c.fillRect(W - 260 + i * 28, 278 - (16 + i * 13), 18, 16 + i * 13); }
    }
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
    // the chat so far, in the same order as at the station (neutral reactions and the one real line)
    const HIST = [['viewer_1', '<3'], ['viewer_2', ':)'], ['viewer_1', 'o/'], ['viewer_3', "wait, I've never been on a train"]] as const;
    // a received message pops in on the sung words (no cursor: nobody sees a viewer typing)
    const pop = (at: number) => ease.outBack(clamp((t - at) / 0.25));
    if (shot === 'keep') {
      const l = this.ly.get('Can you keep it on');
      let y = 360;
      for (const [u, m] of HIST) y = msg(u, m, y, { size: u === 'viewer_3' ? 52 : 44, a: u === 'viewer_3' ? 0.5 : 0.3 });
      const k = pop(l.words[0]!.start - 0.05);
      if (k > 0) { c.save(); c.translate(80, y + 80); c.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); c.translate(-80, -(y + 80)); msg('viewer_3', 'can you keep it on?', y + 80, { size: big, a: clamp(k), hot: true }); c.restore(); }
      focusY = 1 - (y + 260) / H;
    } else {
      const l = this.ly.get('Said it was amazing');
      // the chat log (no live header, no input box: the stream is over; the post doesn't say when it came)
      let y = 300;
      for (const [u, m] of [...HIST, ['viewer_3', 'can you keep it on?']] as const) y = msg(u, m, y, { size: 44, a: 0.3 });
      const k = pop(f.start + 0.15);
      if (k > 0) { c.save(); c.translate(80, y + 60); c.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); c.translate(-80, -(y + 60)); msg('viewer_3', 'thanks for being so chill. amazing stream', y + 60, { size: 96, a: clamp(k), hot: true }); c.restore(); }
      focusY = 1 - (y + 320) / H;
    }
    if (shot === 'keep') {
      const iy = H * 0.7;
      c.fillStyle = 'rgba(241,238,232,0.08)'; c.fillRect(60, iy, W - 200, 90);
      c.font = font(F.mono(400), 34); c.fillStyle = rgba('ash', 0.6); c.fillText('Say something…', 100, iy + 52);
    }
    // keep: tight on the screen, the room barely there; thanks: pulled back, the phone in the carriage, pushing in slowly
    // keep: close on the top of the screen, the room barely there; thanks: the phone low in frame
    // under the lyric, a big move (push in and a turn) across the shot
    const e = ease.inOutCubic(f.p);
    const zoom = shot === 'keep' ? 1.08 : 1.55 - 0.4 * e;
    const pan: [number, number] = shot === 'keep' ? [-0.03, 0.07] : [0.03 - 0.06 * e, 0.07 + 0.09 * e];
    this.mc.render(this.ctx.renderer, out, { t, focusY, zoom, pan, tilt: shot === 'keep' ? -0.05 + 0.02 * f.p : 0.16 - 0.24 * e, blur: shot === 'keep' ? 0.005 : 0.012, warm: shot === 'thanks' ? 1 : 0 });
    // the sung lyric (subtitle) over the macro, low
    const ov = this.ov;
    ov.begin();
    if (shot === 'thanks') ov.lyric(this.ly.lineAt(t, 0.35, 0.3), t, { y: H * 0.15, plate: 0.7 });   // above the phone
    ov.draw(this.ctx.renderer, this.ctx.comp, out);
    const punch = shot === 'keep' ? 1 + 0.03 * ease.outCubic(clamp((t - f.start) / 1.8)) : 1;
    return { grain: 0.05, vignette: 0.5, bloom: 0.8, halation: 0.35, ca: 1.6, zoom: punch };
  }
}
