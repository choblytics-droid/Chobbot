// Frame 10a: the front page. On the hook's downbeat a newspaper page slams in: the carousel shot
// printed in halftone, the headline "3 VIEWERS. ENOUGH." (newspaper halftone: tier A, docs/STYLE_DECK.md).
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { FSPass, Layer2D, makeRT, W, H } from '../../engine/gl';
import { PixelCanvas, PixelLight } from '../../kit/pixel';
import { paintTown, townLights } from './sets/town';
import { F, font, measure } from '../../engine/type';
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
      // the curled bottom-right corner
      float curl = step(${W + H - 260}.0, q.x + q.y);
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
      float fold = abs(q.x - ${W / 2}.0);
      c *= 1.0 - 0.18 * exp(-fold * 0.5) + 0.05 * exp(-(fold - 3.0) * (fold - 3.0) * 0.2);
      c *= 0.86 + 0.14 * smoothstep(0.0, 260.0, min(q.x, ${W}.0 - q.x));
      float cd = q.x + q.y - ${W + H - 260}.0;
      c *= 1.0 - 0.35 * smoothstep(-90.0, 0.0, cd);
      fragColor = vec4(c * 0.92, 1.0);
    }`, { photo: { value: null }, page: { value: null }, t: { value: 0 }, slam: { value: 0 }, rotA: { value: 0 }, scl: { value: 1 }, rect: { value: [PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h] } });

  override init() {
    // the page's type: masthead, headline, standfirst, rules, columns of body text as word-shaped
    // glyph lines (no invented copy), a photo caption line. Everything below y 170 (QA-3).
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
    // standfirst: two bold glyph lines under the headline
    let rnd = 7;
    const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
    const glyphLine = (x: number, y: number, w: number, h: number, gap: number) => {
      let xx = x;
      while (xx < x + w - 20) { const ww = Math.min(x + w - xx, 14 + r() * 70); c.fillRect(xx, y, ww, h); xx += ww + gap; }
    };
    const sy = 340 + size * 1.74 + 40;
    c.globalAlpha = 0.85; glyphLine(110, sy, W - 220, 13, 12); glyphLine(110, sy + 26, (W - 220) * 0.7, 13, 12); c.globalAlpha = 1;
    c.fillRect(60, PHOTO.y - 30, W - 120, 3);
    c.fillRect(PHOTO.x - 2, PHOTO.y - 2, PHOTO.w + 4, 2); c.fillRect(PHOTO.x - 2, PHOTO.y + PHOTO.h, PHOTO.w + 4, 2);
    // photo caption
    c.globalAlpha = 0.7; glyphLine(PHOTO.x, PHOTO.y + PHOTO.h + 16, 520, 8, 8); c.globalAlpha = 1;
    // three columns of body text with rules between them
    for (let col = 0; col < 3; col++) {
      const x = 60 + col * 330;
      if (col) c.fillRect(x - 14, PHOTO.y + PHOTO.h + 44, 1, 180);
      c.globalAlpha = 0.6;
      for (let k = 0; k < 9; k++) glyphLine(x, PHOTO.y + PHOTO.h + 46 + k * 20, k === 8 ? 160 : 300, 8, 7);
      c.globalAlpha = 1;
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
