// Frame 10a: the front page. On the hook's downbeat a newspaper page slams in: the carousel shot
// printed in halftone, the headline "3 VIEWERS. ENOUGH." (newspaper halftone: tier A, docs/STYLE_DECK.md).
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { FSPass, Layer2D, makeRT, W, H } from '../../engine/gl';
import { PixelCanvas, PixelLight } from '../../kit/pixel';
import { paintTown, townLights } from './sets/town';
import { F, font, measure } from '../../engine/type';
import { wrap } from '../../kit/kit';
import { clamp, ease } from '../../engine/util';

const PHOTO = { x: 60, y: 900, w: 960, h: 760 };

export default class FrontPage extends Scene {
  pc = new PixelCanvas();
  pl = new PixelLight(this.pc);
  photo = makeRT(W, H, { depthBuffer: false });
  page = new Layer2D();
  pass = new FSPass(/* glsl */ `
    uniform sampler2D photo, page; uniform float t, slam, rotA, scl;
    uniform vec4 rect; // photo rect in page px (x, y, w, h), y down
    const vec3 PAPER = vec3(0.86, 0.83, 0.77), INK = vec3(0.025, 0.025, 0.03);
    void main() {
      // the page, slammed in: scaled and rotated about the centre
      vec2 p = (vUv - 0.5) * vec2(${W}.0, ${H}.0);
      p = rot2(rotA) * p / scl;
      vec2 pp = p + vec2(${W / 2}.0, ${H / 2}.0);     // page px, y up
      vec2 q = vec2(pp.x, ${H}.0 - pp.y);              // y down
      // the table under the page: dark wood grain
      vec3 table = vec3(0.045, 0.028, 0.018) * (0.75 + 0.5 * fbm(vec2(q.x * 0.004, q.y * 0.05), 4)) * (0.8 + 0.2 * sin(q.y * 0.08 + fbm(q * 0.01, 3) * 6.0));
      // the curled bottom-right corner: cut off along x + y = L, folded back over the page (we see the
      // flap's back, shaded like a roll: lit along the crease, darker toward its tip), a shadow under it
      float cd0 = q.x + q.y - ${W + H - 260}.0;
      vec2 pr = q - vec2(cd0);
      if (cd0 < 0.0 && pr.x < ${W - 20}.0 && pr.y < ${H - 20}.0) {
        float roll = -cd0;
        vec3 back = vec3(0.80, 0.77, 0.71) * (0.78 + 0.22 * smoothstep(0.0, 26.0, roll) - 0.2 * smoothstep(60.0, 180.0, roll) + 0.12 * exp(-pow(roll - 14.0, 2.0) / 60.0));
        back *= 0.97 + fbm(pr * vec2(0.02, 0.2), 3) * 0.04;
        float rim = min(${W - 20}.0 - pr.x, ${H - 20}.0 - pr.y);
        back *= 0.8 + 0.2 * smoothstep(0.0, 6.0, rim);
        fragColor = vec4(back * 0.92, 1.0); return;
      }
      float curl = step(0.0, cd0);
      if (q.x < 20.0 || q.y < 20.0 || q.x > ${W - 20}.0 || q.y > ${H - 20}.0 || curl > 0.5) { fragColor = vec4(table * (1.0 - 0.5 * smoothstep(60.0, 0.0, min(min(q.x - 20.0, ${W - 20}.0 - q.x), min(q.y - 20.0, ${H - 20}.0 - q.y)) + 30.0)), 1.0); return; }
      // newsprint: fibres and tone
      float fib = fbm(q * vec2(0.02, 0.2), 3) * 0.04 + hash12(floor(q)) * 0.03;
      vec3 c = PAPER * (0.96 + fib);
      // the photo in halftone: a 45° dot screen, dot size from the tone
      vec2 r = (q - rect.xy) / rect.zw;
      if (r.x > 0.0 && r.y > 0.0 && r.x < 1.0 && r.y < 1.0) {
        vec3 ph = texture(photo, vec2(0.1 + r.x * 0.8, 1.0 - (0.5 + r.y * 0.4))).rgb;
        float tone = 1.0 - sat(pow(luma(ph / (1.0 + ph)) * 3.2, 0.6));
        vec2 g = rot2(0.785) * q / 9.0;
        float d = length(fract(g) - 0.5);
        float dot1 = 1.0 - smoothstep(-0.03, 0.03, d - sqrt(tone) * 0.62);
        c = mix(c, INK, dot1 * 0.92);
        // a spot of red ink where the bulbs are
        float hot = smoothstep(1.2, 3.0, max(ph.r, ph.g));
        c = mix(c, vec3(0.78, 0.12, 0.1), hot * 0.5 * (1.0 - dot1));
      }
      // type and rules (drawn black on the page layer), slightly mis-registered
      float ink = texture(page, vec2(pp.x / ${W}.0, pp.y / ${H}.0) + vec2(0.0006, 0.0)).a;
      c = mix(c, INK, ink * 0.95);
      // a centre fold (dark crease, lit lip), soft shading toward the edges, the shadow of the curl
      float fs = q.x - ${W / 2}.0, fold = abs(fs);
      c *= 1.0 - 0.28 * exp(-fold * 0.45) - 0.1 * exp(-fold / 60.0) * step(fs, 0.0) + 0.07 * exp(-(fs - 4.0) * (fs - 4.0) * 0.15) + 0.04 * exp(-fs / 50.0) * step(0.0, fs);
      c *= 0.86 + 0.14 * smoothstep(0.0, 260.0, min(q.x, ${W}.0 - q.x));
      // the flap's shadow on the page, along its outer edges
      vec2 pr2 = q - vec2(cd0);
      float sh = cd0 < 0.0 ? smoothstep(28.0, 0.0, min(pr2.x - ${W - 20}.0, pr2.y - ${H - 20}.0)) * smoothstep(-260.0, -60.0, cd0) : 0.0;
      c *= 1.0 - 0.3 * sh;
      fragColor = vec4(c * 0.92, 1.0);
    }`, { photo: { value: null }, page: { value: null }, t: { value: 0 }, slam: { value: 0 }, rotA: { value: 0 }, scl: { value: 1 }, rect: { value: [PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h] } });

  override init() {
    // the page's type: masthead, headline, standfirst, rules, columns of body text as word-shaped
    // copy built only from the post's facts, a photo caption line. Everything below y 170 (QA-3).
    const c = this.page.ctx;
    this.page.clear();
    c.fillStyle = '#000';
    c.font = font(F.archivo(125, 900), 64); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText('THE LIVE EDITION', W / 2, 236);
    c.fillRect(60, 262, W - 120, 6); c.fillRect(60, 276, W - 120, 2);
    c.font = font(F.mono(600), 26); c.textAlign = 'left'; c.fillText('CHRISTMAS', 64, 312); c.textAlign = 'right'; c.fillText('IRL · STREAM', W - 64, 312);
    c.fillRect(60, 326, W - 120, 2);
    c.textAlign = 'center';
    const hf = F.archivo(62, 900);
    let size = 250;
    while (measure('3 VIEWERS.', hf, size) > W - 120) size -= 4;
    c.font = font(hf, size);
    c.fillText('3 VIEWERS.', W / 2, 340 + size * 0.86);
    c.fillText('ENOUGH.', W / 2, 340 + size * 1.74);
    // standfirst, caption and body: real copy, every sentence from the post's facts (DESCRIPTION.md)
    const sy = 340 + size * 1.74 + 52;
    const sf = F.serif(600, true);
    c.font = font(sf, 34);
    wrap('A streamer did their first proper IRL stream. Three people were watching.', sf, 34, W - 220).forEach((l, i) => c.fillText(l, W / 2, sy + i * 38));
    c.fillRect(60, PHOTO.y - 30, W - 120, 3);
    c.fillRect(PHOTO.x - 2, PHOTO.y - 2, PHOTO.w + 4, 2); c.fillRect(PHOTO.x - 2, PHOTO.y + PHOTO.h, PHOTO.w + 4, 2);
    c.textAlign = 'left';
    const body = 'After a year of streaming games from their desk, they did their first proper IRL stream: a Christmas tour of their town. The market, the castle, a lit-up carousel. They had a train to catch and were about to end the stream. Then one viewer said they had never been on a train. So the stream stayed on, out of the city and across open farmland, until the signal dropped. The viewer thanked them for being so chill and called it an amazing stream. They were watching from the other side of the world. The streamer kept streaming IRL.';
    const bf = F.serif(600), bs = 19, colW = 300, rows = 9;
    const lines = wrap(body, bf, bs, colW);
    c.font = font(bf, bs);
    for (let col = 0; col < 3; col++) {
      const x = 60 + col * 330;
      if (col) c.fillRect(x - 14, PHOTO.y + PHOTO.h + 44, 1, 180);
      lines.slice(col * rows, col * rows + rows).forEach((l, k) => c.fillText(l, x, PHOTO.y + PHOTO.h + 60 + k * 20));
    }
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t;
    // the photo: the carousel, as the phone saw it
    const o = { t, streamer: 'none' as const, camX: 0, rot: t * 0.55 };
    paintTown(this.pc, o);
    this.pl.render(this.ctx.renderer, this.photo, { lights: townLights(o), t, sunEl: -0.045, sunAz: -0.9, skyExp: 3.2, ambient: 0.9, bands: 9, horizonY: 262, fov: 300, haze: 0.55, snow: 1, wet: 0.6, groundY: 405 });
    const k = ease.outCubic(clamp(f.lt / 0.22));
    const u = this.pass.u;
    u.photo!.value = this.photo.texture; u.page!.value = this.page.upload(); u.t!.value = t;
    u.scl!.value = 1.6 - 0.62 * k + 0.02 * Math.sin(f.lt * 3);
    u.rotA!.value = -0.12 * (1 - k) - 0.03;
    this.pass.render(this.ctx.renderer, out);
    const hit = Math.pow(0.5, f.lt / 0.08);
    return { grain: 0.06, vignette: 0.35, bloom: 0.3, halation: 0.15, ca: 1.2, flash: 0.5 * hit, shake: [6 * hit * Math.sin(t * 90), 6 * hit * Math.cos(t * 77)] as [number, number] };
  }
}
