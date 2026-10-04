import type * as THREE from 'three';
import { FSPass } from '../../engine/gl';
import { Scene, type Frame } from '../../engine/scene';
export default class Test extends Scene {
  pass = new FSPass(`uniform float t; void main(){ fragColor = vec4(vUv.x, vUv.y, 0.5+0.5*sin(t), 1.0); }`, { t: { value: 0 } });
  render(f: Frame, out: THREE.WebGLRenderTarget) { this.pass.u.t!.value = f.t; this.pass.render(this.ctx.renderer, out); }
}
