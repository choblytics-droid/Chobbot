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
      fragColor = vec4(c * (1.0 - black), 1.0);
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
