// Signal loss as a material: pixelate, tear into displaced blocks, split the channels, then freeze.
import * as THREE from 'three';
import { FSPass, makeRT, W, H } from '../engine/gl';

export class Glitch {
  tmp = makeRT(W, H, { depthBuffer: false });
  pass = new FSPass(/* glsl */ `
    uniform sampler2D src; uniform float amt, t, block, black;
    void main() {
      vec2 uv = vUv;
      // pixelate: cells grow with the amount
      float cell = mix(1.0, block, amt);
      vec2 res = vec2(${W}.0, ${H}.0) / cell;
      vec2 q = (floor(uv * res) + 0.5) / res;
      // torn rows: blocks of rows shift sideways
      float row = floor(uv.y * 24.0 + floor(t * 12.0) * 3.0);
      float tear = step(1.0 - 0.45 * amt, hash11(row + floor(t * 20.0))) * (hash11(row * 7.0) - 0.5) * 0.25 * amt;
      q.x += tear;
      float sp = 0.012 * amt;
      vec3 c = vec3(texture(src, q + vec2(sp, 0.0)).r, texture(src, q).g, texture(src, q - vec2(sp, 0.0)).b);
      // scanline dropouts
      c *= 1.0 - 0.6 * amt * step(0.92, hash11(floor(uv.y * 400.0) + floor(t * 30.0)));
      // signal lost (black = progress 0..1 since the drop): a P-frame datamosh. Macroblocks carry the
      // last motion on and smear the frozen picture along it, some blocks are stale copies of their
      // neighbours, chroma bleeds at half the block resolution, a tear line slides down, light drains.
      if (black > 0.0) {
        float pg = black;
        vec2 mb = vec2(22.5, 40.0);
        vec2 base = uv;
        float ty = 0.66 - 0.22 * pg;
        if (uv.y < ty) base.x = fract(base.x + 0.035 + 0.05 * pg);
        vec2 cell = floor(base * mb);
        float n1 = hash12(cell), n2 = hash12(cell + 11.0);
        if (n1 < 0.22) base.y += floor(1.0 + n2 * 2.0) / mb.y;                       // stale block from above
        vec2 mv = vec2(0.9 + 0.5 * sin(cell.y * 0.37 + n1), 0.35 * sin(cell.x * 0.51 + cell.y * 0.13));
        mv = normalize(mv) * (0.015 + 0.16 * pg) * (0.35 + 0.65 * n2) * step(0.12, n2);
        vec3 acc = vec3(0.0); float ws = 0.0;
        for (int i = 0; i < 14; i++) { float k = float(i) / 13.0; float w = 1.0 - 0.7 * k; acc += texture(src, base - mv * k).rgb * w; ws += w; }
        vec3 sm = acc / ws;
        vec2 cb = mb * 0.5;
        vec3 cc = texture(src, (floor((base - mv * 0.6) * cb) + 0.5) / cb).rgb;
        float L = luma(sm);
        vec3 m = max(vec3(0.0), vec3(L) + (cc - vec3(luma(cc))) * 1.5);
        vec2 f = fract(base * mb);
        m *= 1.0 - 0.18 * step(0.5, step(f.x, 0.03) + step(f.y, 0.02)) * step(0.4, n1);
        m = mix(m, vec3(L) * vec3(0.6, 0.75, 1.0), 0.3 * pg);
        m *= mix(0.9, 0.38, pg);
        float line = smoothstep(0.004, 0.0, abs(uv.y - ty));
        m += vec3(0.55, 0.6, 0.7) * line * (0.6 + 0.4 * hash11(floor(uv.x * 90.0)));
        c = m;
      }
      fragColor = vec4(c, 1.0);
    }`, { src: { value: null }, amt: { value: 0 }, t: { value: 0 }, block: { value: 24 }, black: { value: 0 } });

  /** Apply to `rt` in place. */
  apply(r: THREE.WebGLRenderer, rt: THREE.WebGLRenderTarget, o: { amt: number; t: number; block?: number; black?: number }) {
    const u = this.pass.u;
    // render into a temporary target, then copy back (a pass can't read and write the same target)
    u.src!.value = rt.texture; u.amt!.value = o.amt; u.t!.value = o.t; u.block!.value = o.block ?? 24; u.black!.value = o.black ?? 0;
    this.pass.render(r, this.tmp);
    copy.u.src!.value = this.tmp.texture; copy.render(r, rt);
  }
}
const copy = new FSPass(`uniform sampler2D src; void main(){ fragColor = texture(src, vUv); }`, { src: { value: null } });
