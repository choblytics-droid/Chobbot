// Intro (0 -> verse A1): "Ferrugem na Fenda" — rust in the rift. A rusted steel wall fills the frame; a
// hairline crack of light splits it on the first cowbell hits, the title is stamped into the metal,
// the crack tears open (cyan on one lip, orange on the other: the two singers), their pixel silhouettes
// flicker inside, and the camera dives into the light on the downbeat.
import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { drawPix } from '../engine/pixelfont';
import { drawSprite, VENMAR, QUEST } from '../sprites/sprites';
import { clamp, ease, hash, lerp, prog, pulse, frameIdx } from '../engine/util';
import { V2 } from '../config';
import { TextHalo } from '../engine/atmos';
const HALO = V2 ? new TextHalo() : null;

export default class Intro extends Scene {
  wall = new FSPass(/* glsl */ `
    uniform float uTime, uOpen, uZoom, uHeat, uKick, uBell, uFlick;
    float path(float y) { return 0.5 + fbm(vec2(y * 3.0, 1.7), 4) * 0.06 + sin(y * 40.0) * 0.004; }
    void main() {
      vec2 uv = (vUv - 0.5) / uZoom + 0.5;
      vec2 p = uv * vec2(16.0 / 9.0, 1.0);
      // rusted plate: base iron, rust blooms, streaks running down, pitting, bolts on a grid
      float n1 = fbm(p * 2.2, 5);
      float n2 = fbm(p * vec2(0.8, 0.08) * 6.0 + 4.0, 3); // streaks running down
      float rust = smoothstep(0.0, 0.9, n1 * 0.8 + n2 * 0.7 + 0.25);
      vec3 iron = vec3(0.03, 0.034, 0.045) * (0.85 + 0.3 * fbm(p * 24.0, 2));
      vec3 rc = mix(vec3(0.06, 0.02, 0.008), vec3(0.16, 0.055, 0.014), smoothstep(-0.3, 0.8, n1 + 0.3 * fbm(p * 14.0, 2)));
      vec3 col = mix(iron, rc, rust * 0.85);
      // pitting and scratches
      col *= 0.82 + 0.25 * smoothstep(-0.2, 0.5, fbm(p * 70.0, 2));
      col += vec3(0.02) * pxLine(abs(fract(p.x * 30.0 + fbm(p * 3.0, 2) * 4.0) - 0.5) * 30.0 / 30.0 * 60.0, 0.4, 1.0) * step(0.7, fbm(p * 5.0, 2) + 0.5);
      // panel seams + bolts
      vec2 pg = fract(p * vec2(2.0, 2.0)) - 0.5;
      col *= 1.0 - 0.6 * smoothstep(0.49, 0.5, max(abs(pg.x), abs(pg.y)));
      vec2 bg = fract(p * 8.0) - 0.5;
      float bolt = smoothstep(0.09, 0.06, length(bg)) * step(0.46, max(abs(pg.x), abs(pg.y)));
      col = mix(col, vec3(0.06, 0.05, 0.05), bolt);
      // the crack
      float y = uv.y;
      float x0 = path(y);
      float d = (uv.x - x0) * 16.0 / 9.0;
      float taper = smoothstep(0.0, 0.25, y) * smoothstep(1.0, 0.75, y);
      float w = uOpen * (0.004 + 0.12 * uOpen * uOpen) * mix(0.35, 1.0, taper) * (1.0 + 0.3 * fbm(vec2(y * 12.0, uTime), 2));
      float grow = smoothstep(0.0, 0.02, uOpen * 1.2 - abs(y - 0.5));
      float inside = step(abs(d), w) * grow;
      // lips glow: cyan on the left, orange on the right
      float lip = exp(-max(abs(d) - w, 0.0) * (40.0 - 20.0 * uOpen)) * grow * step(0.0001, uOpen);
      vec3 lipCol = d < 0.0 ? C_CYAN * vec3(0.6, 1.2, 1.6) : C_SIGNAL * vec3(1.8, 0.9, 0.5);
      col += lipCol * lip * (1.2 + 3.0 * uKick + 2.0 * uBell) * (0.6 + uOpen);
      // heat: metal near the crack glows
      col += vec3(1.0, 0.25, 0.05) * exp(-abs(d) * 12.0) * grow * uHeat * 0.6 * (0.5 + 0.5 * fbm(p * 8.0 + uTime, 2));
      // inside: blinding light with a vertical gradient between the two colours
      vec3 light = mix(C_CYAN * 3.0, C_SIGNAL * 3.0, smoothstep(-1.0, 1.0, d / max(w, 1e-4)));
      light = mix(light, vec3(6.0), exp(-abs(d) / max(w * 0.4, 1e-4)) * 0.8);
      col = mix(col, light * (0.8 + 0.4 * uFlick), inside);
      fragColor = vec4(col, 1.0);
    }`, { uTime: { value: 0 }, uOpen: { value: 0 }, uZoom: { value: 1 }, uHeat: { value: 0 }, uKick: { value: 0 }, uBell: { value: 0 }, uFlick: { value: 0 } });
  ui = new Layer2D();
  sparks = new LineBatch(4000, { blend: 'add' });

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio } = this.ctx;
    const t = f.t, end = f.end;
    const k = audio.hit('kick', t, 0.1), bl = audio.hit('bell', t, 0.07), sn = audio.hit('snare', t, 0.1);
    const t0 = audio.timeOfBeat(Math.ceil(audio.beatAt(0.3))); // first beat
    const rise = 3.4; // energy jump
    // crack: a hairline on the first beats, opens in steps on each bar, tears wide in the last bar
    const bars = audio.barAt(t);
    const step = Math.floor(clamp(bars, 0, 4));
    const open = clamp(0.12 + step * 0.1 + 0.05 * prog(bars % 1, 0, 0.2, ease.outBack) + prog(t, end - 1.8, end - 0.2, ease.inExpo) * 0.9, 0, 1.1) * prog(t, t0 - 0.05, t0 + 0.1);
    const zoom = 1 + prog(t, end - 1.2, end, ease.inExpo) * 9;
    const u = this.wall.u;
    u.uTime!.value = t; u.uOpen!.value = open; u.uZoom!.value = zoom; u.uHeat!.value = prog(t, rise, end); u.uKick!.value = k; u.uBell!.value = bl;
    u.uFlick!.value = hash(frameIdx(t), 1);
    this.wall.render(renderer, out);

    // sparks from the crack on bells/kicks
    this.sparks.clear();
    const fi = frameIdx(t);
    const burst = Math.max(k, bl);
    if (open > 0 && burst > 0.05) {
      for (let i = 0; i < 60; i++) {
        const yy = 140 + hash(i, fi, 1) * 800;
        const side = hash(i, fi, 2) < 0.5 ? -1 : 1;
        const a = (hash(i, fi, 3) - 0.5) * 1.6;
        const L = 20 + 120 * hash(i, fi, 4) * burst;
        const x = 960 + side * (6 + open * 60);
        const col: [number, number, number] = side < 0 ? [0.6, 2.4, 3.2] : [3.4, 1.2, 0.3];
        this.sparks.seg2(x, yy, x + side * Math.cos(a) * L, yy + Math.sin(a) * L + 20 * hash(i, 9), 1.5 + 2 * hash(i, 5), col, burst);
      }
    }
    this.sparks.render(renderer, out);

    // title stamped into the metal, silhouettes in the light
    const L = this.ui, c = L.ctx;
    L.clear();
    const titleIn = prog(t, rise - 0.1, rise + 0.08, ease.outExpo);
    const titleOut = 1 - prog(t, end - 2 * 1.806 - 0.3, end - 2 * 1.806);
    if (titleIn > 0 && titleOut > 0) {
      const s = lerp(1.6, 1, titleIn) * (1 + 0.015 * k);
      c.save();
      c.globalAlpha = titleIn * titleOut;
      c.translate(960, 470);
      c.scale(s, s);
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.font = font(F.archivo(125, 900), 150);
      // embossed: dark cut + bone face
      c.fillStyle = 'rgba(0,0,0,0.75)';
      c.fillText('FERRUGEM', 6, -20 + 8);
      c.fillText('NA FENDA', 6, 120 + 8);
      c.fillStyle = rgba('bone', 0.96);
      c.fillText('FERRUGEM', 0, -20);
      c.fillText('NA FENDA', 0, 120);
      c.font = font(F.mono(600), 34);
      c.letterSpacing = '14px';
      c.fillStyle = rgba('gold', 0.95);
      c.fillText('× COWBELL INFECTION', 0, 200);
      c.restore();
    }
    // credits on the first bars, pixel font, top-left / bottom-right
    const cr = prog(t, t0, t0 + 0.2) * (1 - prog(t, end - 2 * 1.806 - 0.3, end - 2 * 1.806));
    if (cr > 0) {
      c.save();
      c.globalAlpha = cr;
      drawPix(c, 'VENMAR', 120, 120, 6, rgba('cyan', 1), { chars: Math.floor(prog(t, t0, t0 + 0.6) * 6) });
      drawPix(c, 'X', 120 + 6 * 6 * 6 + 20, 120, 6, rgba('bone', 0.8), { chars: t > t0 + 0.6 ? 1 : 0 });
      drawPix(c, 'QUEST', 120 + 7 * 6 * 6 + 20, 120, 6, rgba('signal', 1), { chars: Math.floor(prog(t, t0 + 0.7, t0 + 1.3) * 5) });
      c.font = font(F.mono(500), 20);
      c.letterSpacing = '5px';
      c.fillStyle = rgba('bone', 0.6);
      c.textAlign = 'right';
      c.fillText('VENMAR_LUPUS_ET_VULPES  ·  2026', 1800, 980);
      c.restore();
    }
    // the two emerge flanking the crack for the last two bars, popping in on beats, lit by it
    const emerge = end - 2 * 1.806;
    const vIn = prog(t, emerge, emerge + 0.12, ease.outBack), qIn = prog(t, emerge + 0.9, emerge + 1.02, ease.outBack);
    const out0 = 1 - prog(t, end - 0.3, end - 0.1);
    const pxs = 9 * (1 + 0.02 * k);
    if (vIn > 0) drawSprite(c, VENMAR, 960 - 90 - 32 * pxs, 540 - 16 * pxs + (1 - vIn) * 80, pxs, { alpha: clamp(vIn) * out0, blink: (t % 2.1) < 0.1 });
    if (qIn > 0) drawSprite(c, QUEST, 960 + 90, 540 - 16 * pxs + (1 - qIn) * 80, pxs, { alpha: clamp(qIn) * out0, flip: true, blink: (t % 2.7) < 0.1 });
    const tex = L.upload();
    if (HALO) HALO.render(renderer, tex, out);
    comp.draw(renderer, tex, out);

    const dive = prog(t, end - 0.35, end, ease.inExpo);
    return {
      bloom: 0.9 + dive,
      bloomThreshold: 0.7,
      ca: 2 + k * 3 + dive * 10,
      split: bl * 6 + dive * 30,
      glitch: pulse(t, rise, 0.1) * 0.7 + dive * 0.4,
      flash: pulse(t, rise, 0.08) * 0.5 + dive * 1.5,
      flashColor: [1.0, 0.9, 0.8],
      shake: [k * 6 * (hash(fi, 1) - 0.5), k * 6 * (hash(fi, 2) - 0.5)],
      zoom: 1 + sn * 0.01,
      grain: 0.07,
      vignette: 0.6,
      fade: 1 - prog(t, 0, 0.5),
      scan: 0.25,
      leak: 0.12 * prog(t, rise, end),
      contrast: 1.1,
    };
  }
}
