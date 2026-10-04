// The phone screen in macro: whatever is drawn on `layer` (the screen's content) is shown as an LCD
// seen from a few centimetres: tilted, with its RGB subpixel grid, shallow focus falling off away from
// the focus line, the glass catching reflections and out-of-focus lights.
import * as THREE from 'three';
import { FSPass, Layer2D, W, H } from '../engine/gl';

export class Macro {
  layer = new Layer2D();
  pass = new FSPass(/* glsl */ `
    uniform sampler2D src; uniform float t, tilt, focusY, blurK, cell, glow, warm;
    vec2 warp(vec2 uv) {
      // a gentle keystone and rotation: the phone held at an angle
      vec2 p = uv - 0.5;
      p = rot2(tilt) * p;
      p.x *= 1.0 + (p.y) * 0.18;
      return p * 0.92 + 0.5;
    }
    vec3 screenAt(vec2 q) {
      vec4 s = texture(src, q);
      vec3 base = vec3(0.012, 0.014, 0.02);
      return mix(base, s.rgb, s.a);
    }
    void main() {
      vec2 uv = warp(vUv);
      float dist = abs(uv.y - focusY);
      float r = blurK * smoothstep(0.04, 0.45, dist);
      vec3 c = vec3(0.0);
      for (int k = 0; k < 12; k++) {
        float a = float(k) * 2.39996, rr = sqrt((float(k) + 0.5) / 12.0) * r;
        c += screenAt(uv + vec2(cos(a), sin(a)) * rr * vec2(1.0, ${W / H}));
      }
      c /= 12.0;
      // LCD subpixels: vertical R, G, B stripes inside each cell, dark gaps between cells
      vec2 px = uv * vec2(${W}.0, ${H}.0) / cell;
      vec2 f = fract(px);
      float sub = floor(f.x * 3.0);
      vec3 mask = sub < 0.5 ? vec3(1.0, 0.15, 0.1) : sub < 1.5 ? vec3(0.12, 1.0, 0.15) : vec3(0.1, 0.18, 1.0);
      float gap = smoothstep(0.0, 0.12, f.y) * smoothstep(1.0, 0.88, f.y) * smoothstep(0.0, 0.06, fract(f.x * 3.0)) * smoothstep(1.0, 0.94, fract(f.x * 3.0));
      vec3 lcd = c * mask * 2.6 * gap;
      // further from focus the grid melts into plain light
      c = mix(lcd, c, smoothstep(0.02, 0.2, dist));
      c *= glow;
      // the glass: a soft diagonal reflection and out-of-focus lights from the carriage
      float streak = smoothstep(0.35, 0.0, abs((vUv.x - vUv.y * 0.6) - 0.15 + 0.03 * sin(t * 0.3)));
      c += vec3(0.05, 0.045, 0.04) * streak;
      for (int i = 0; i < 7; i++) {
        float fi = float(i);
        vec2 bp = vec2(hash11(fi * 3.1), hash11(fi * 7.7 + 1.0)) * vec2(1.2, 1.0) - vec2(0.1, 0.0);
        bp.x = fract(bp.x - t * 0.02 * (0.5 + hash11(fi)));
        float d = length((vUv - bp) * vec2(${W / H}, 1.0));
        float rad = 0.05 + 0.06 * hash11(fi * 5.3);
        vec3 col = mix(vec3(1.0, 0.75, 0.45), vec3(0.55, 0.7, 1.0), step(0.6, hash11(fi * 9.1)) * (1.0 - warm));
        c += col * 0.06 * smoothstep(rad, rad * 0.85, d) * (0.6 + 0.4 * smoothstep(rad * 0.6, rad, d));
      }
      fragColor = vec4(c, 1.0);
    }`, { src: { value: null }, t: { value: 0 }, tilt: { value: -0.06 }, focusY: { value: 0.5 }, blurK: { value: 0.012 }, cell: { value: 7 }, glow: { value: 1.3 }, warm: { value: 0 } });

  render(r: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, o: { t: number; tilt?: number; focusY?: number; blur?: number; cell?: number; glow?: number; warm?: number }) {
    const u = this.pass.u;
    u.src!.value = this.layer.upload();
    u.t!.value = o.t; u.tilt!.value = o.tilt ?? -0.06; u.focusY!.value = o.focusY ?? 0.5; u.blurK!.value = o.blur ?? 0.012;
    u.cell!.value = o.cell ?? 7; u.glow!.value = o.glow ?? 1.3; u.warm!.value = o.warm ?? 0;
    this.pass.render(r, out);
  }
}
