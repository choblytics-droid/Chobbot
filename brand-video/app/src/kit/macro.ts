// The phone screen in macro: whatever is drawn on `layer` (the screen's content) is shown as an LCD
// seen from a few centimetres: tilted, with its RGB subpixel grid, shallow focus falling off away from
// the focus line, the glass catching a reflection; around it the bezel and the carriage, far out of focus.
import * as THREE from 'three';
import { FSPass, Layer2D, W, H } from '../engine/gl';

export class Macro {
  layer = new Layer2D();
  pass = new FSPass(/* glsl */ `
    uniform sampler2D src; uniform float t, tilt, focusY, blurK, cell, glow, warm, zoom, bgK; uniform vec2 pan;
    vec2 warp(vec2 uv) {
      // a gentle keystone and rotation: the phone held at an angle; zoom > 1 pulls back to show more of the room
      vec2 p = uv - 0.5;
      p = rot2(tilt) * p;
      p.x *= 1.0 + (p.y) * 0.18;
      return p * zoom + 0.5 + pan;   // pan > 0 moves the phone down / right in frame
    }
    vec3 screenAt(vec2 q) {
      vec4 s = texture(src, q);
      vec3 base = vec3(0.012, 0.014, 0.02);
      return mix(base, s.rgb, s.a);
    }
    // the carriage behind the phone, far out of focus: the warm lamp strip, the window's cold blue band
    // with lights sliding past as big soft discs, the seat backs below
    vec3 room(vec2 v) {
      vec3 c = mix(vec3(0.05, 0.035, 0.025), vec3(0.12, 0.085, 0.05), smoothstep(0.0, 0.9, v.y));
      c += vec3(1.0, 0.82, 0.55) * 0.55 * exp(-pow((v.y - 0.93) / 0.035, 2.0));                 // lamp strip
      float wnd = smoothstep(0.30, 0.36, v.y) * smoothstep(0.74, 0.68, v.y);
      c = mix(c, vec3(0.05, 0.08, 0.15), wnd * 0.85);                                              // the window
      c = mix(c, vec3(0.09, 0.11, 0.2), smoothstep(0.24, 0.0, v.y) * 0.6);                         // seat backs
      for (int i = 0; i < 7; i++) {
        float fi = float(i);
        vec2 bp = vec2(fract(hash11(fi * 3.1) - t * (0.05 + 0.08 * hash11(fi + 4.0))), 0.38 + 0.3 * hash11(fi * 7.7));
        float d = length((v - bp) * vec2(${W / H}, 1.0)), rad = 0.035 + 0.035 * hash11(fi * 5.3);
        vec3 col = mix(vec3(1.0, 0.72, 0.4), vec3(0.6, 0.75, 1.0), step(0.55, hash11(fi * 9.1)) * (1.0 - warm));
        c += col * 0.22 * wnd * smoothstep(rad, rad * 0.9, d) * (0.65 + 0.35 * smoothstep(rad * 0.5, rad * 0.95, d));
      }
      return c * bgK;
    }
    void main() {
      vec2 uv = warp(vUv);
      // the phone: a rounded screen, black glass bezel with a lit rim, side buttons, then the room
      vec2 q = (uv - 0.5) * vec2(${W}.0, ${H}.0), hb = vec2(${W}.0, ${H}.0) * 0.48;
      vec2 k = max(abs(q) - hb + 70.0, 0.0);
      float sd = length(k) + min(max(abs(q).x - hb.x + 70.0, abs(q).y - hb.y + 70.0), 0.0) - 70.0;
      if (sd > 0.0) {
        vec3 bezel = vec3(0.012) + vec3(0.32, 0.28, 0.22) * smoothstep(5.0, 0.0, abs(sd - 46.0)) + vec3(0.05) * smoothstep(4.0, 0.0, abs(sd - 2.0));
        bezel += vec3(0.06, 0.055, 0.05) * smoothstep(0.3, 0.0, abs((vUv.x - vUv.y * 0.6) - 0.15));      // glare on the frame
        float btn = step(hb.x + 48.0, q.x) * step(q.x, hb.x + 58.0) * (step(abs(q.y - 380.0), 70.0) + step(abs(q.y - 170.0), 110.0));
        vec3 col = sd < 50.0 ? bezel : btn > 0.0 ? vec3(0.16, 0.15, 0.14) + vec3(0.25) * smoothstep(3.0, 0.0, abs(q.x - hb.x - 50.0)) : room(vUv);
        fragColor = vec4(col, 1.0); return;
      }
      // the front camera: a punch hole at the top centre, a glint in the lens
      float ch = length(q - vec2(0.0, hb.y - 46.0));
      if (ch < 20.0) { fragColor = vec4(vec3(0.005) + vec3(0.25, 0.3, 0.5) * smoothstep(5.0, 0.0, length(q - vec2(-6.0, hb.y - 40.0))) + vec3(0.06) * smoothstep(2.0, 0.0, abs(ch - 17.0)), 1.0); return; }
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
      // the train window mirrored in the glass: a cold rectangle with a bar, lights sliding through it
      vec2 wr = uv - vec2(0.62 + 0.04 * sin(t * 0.2), 0.7);
      float wnd = smoothstep(0.08, -0.02, max(abs(wr.x) - 0.22, abs(wr.y) - 0.14)) * (1.0 - 0.5 * smoothstep(0.02, 0.0, abs(wr.x + 0.05)));
      float pass = 0.6 + 0.4 * sin(uv.x * 30.0 - t * 9.0) * sin(uv.y * 7.0);
      c += vec3(0.012, 0.018, 0.032) * wnd * pass;
      fragColor = vec4(c, 1.0);
    }`, { src: { value: null }, t: { value: 0 }, tilt: { value: -0.06 }, focusY: { value: 0.5 }, blurK: { value: 0.012 }, cell: { value: 7 }, glow: { value: 1.3 }, warm: { value: 0 }, zoom: { value: 1.07 }, bgK: { value: 1 }, pan: { value: [0, 0] } });

  render(r: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, o: { t: number; tilt?: number; focusY?: number; blur?: number; cell?: number; glow?: number; warm?: number; zoom?: number; bg?: number; pan?: [number, number] }) {
    const u = this.pass.u;
    u.src!.value = this.layer.upload();
    u.t!.value = o.t; u.tilt!.value = o.tilt ?? -0.06; u.focusY!.value = o.focusY ?? 0.5; u.blurK!.value = o.blur ?? 0.012;
    u.cell!.value = o.cell ?? 7; u.glow!.value = o.glow ?? 1.3; u.warm!.value = o.warm ?? 0; u.zoom!.value = o.zoom ?? 1.07; u.bgK!.value = o.bg ?? 1; u.pan!.value = o.pan ?? [0, 0];
    this.pass.render(r, out);
  }
}
