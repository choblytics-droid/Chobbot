// v2 atmosphere: light shafts from the rift. The sky (already rendered at 1/3 res by Sky) is re-covered by
// the world drawn in flat black at the same low resolution, so only the sky that is actually visible
// between buildings and characters shines; a radial blur towards the rift's screen position turns that
// into god rays / lit haze, added onto the frame. Cost: one low-res silhouette pass + one 48-tap blur.
import * as THREE from 'three';
import { FSPass, makeRT, W, H } from './gl';
import type { Sky } from './world';

export class GodRays {
  private occ = makeRT(Math.ceil(W / 3), Math.ceil(H / 3), { depthBuffer: true });
  private ray = makeRT(Math.ceil(W / 3), Math.ceil(H / 3), { depthBuffer: false });
  private black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  private copy = new FSPass('uniform sampler2D src; void main(){ fragColor = texture(src, vUv); }', { src: { value: null } });
  private blur = new FSPass(/* glsl */ `
    uniform sampler2D src; uniform vec2 uL; uniform float uThr, uDecay, uLen;
    void main() {
      vec2 uv = vUv, d = (vUv - uL) * uLen / 48.0;
      float il = 1.0; vec3 acc = vec3(0.0);
      for (int i = 0; i < 48; i++) {
        uv -= d;
        vec3 c = texture(src, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
        acc += max(c - uThr, 0.0) * il;
        il *= uDecay;
      }
      fragColor = vec4(acc / 48.0, 1.0);
    }`, { src: { value: null }, uL: { value: new THREE.Vector2() }, uThr: { value: 0.6 }, uDecay: { value: 0.965 }, uLen: { value: 0.85 } });
  // rays over solid geometry (characters, buildings) at 35%: haze in front of them, not a wash
  private add = new FSPass('uniform sampler2D src; uniform sampler2D occ; uniform float uK; uniform vec3 uTint; void main(){ float sky = step(0.004, dot(texture(occ, vUv).rgb, vec3(0.33))); fragColor = vec4(texture(src, vUv).rgb * uK * uTint * (0.35 + 0.65 * sky), 1.0); }',
    { src: { value: null }, occ: { value: null }, uK: { value: 1 }, uTint: { value: new THREE.Vector3(1, 0.85, 0.75) } }, { blending: THREE.AdditiveBlending, transparent: true });
  private v = new THREE.Vector3();
  private fwd = new THREE.Vector3();

  /** Add rays onto `out`. strength ~1; hide = objects to leave out of the silhouette (e.g. contact shadows). */
  render(renderer: THREE.WebGLRenderer, sky: Sky, world: THREE.Scene, cam: THREE.PerspectiveCamera, out: THREE.WebGLRenderTarget, strength: number, hide: THREE.Object3D[] = []) {
    const rift = (sky.pass.u.uRift!.value as number) ?? 0;
    // rift centre direction (see Sky: azimuth 0 towards -z, elevation 0.32)
    const dir = this.v.set(0, 0.32, -Math.sqrt(1 - 0.32 * 0.32));
    cam.getWorldDirection(this.fwd);
    const facing = THREE.MathUtils.smoothstep(this.fwd.dot(dir), -0.1, 0.4);
    const k = strength * Math.min(1.5, rift) * facing;
    if (k <= 0.01) return;
    const p = dir.multiplyScalar(4000).add(cam.position).project(cam);
    // silhouette pass: visible sky only
    this.copy.u.src!.value = sky.low.texture;
    this.copy.render(renderer, this.occ);
    const vis = hide.map((o) => o.visible);
    hide.forEach((o) => (o.visible = false));
    const bg = world.background;
    world.background = null;
    world.overrideMaterial = this.black;
    renderer.setRenderTarget(this.occ);
    renderer.clearDepth();
    renderer.render(world, cam);
    world.overrideMaterial = null;
    world.background = bg;
    hide.forEach((o, i) => (o.visible = vis[i]!));
    // radial blur towards the rift, then add
    this.blur.u.src!.value = this.occ.texture;
    (this.blur.u.uL!.value as THREE.Vector2).set(p.x * 0.5 + 0.5, p.y * 0.5 + 0.5);
    this.blur.render(renderer, this.ray);
    this.add.u.src!.value = this.ray.texture;
    this.add.u.occ!.value = this.occ.texture;
    this.add.u.uK!.value = k * 1.3;
    this.add.render(renderer, out);
  }
}

/**
 * v2 text legibility: a soft dark halo under everything on the Canvas2D UI layer (lyrics, titles, HUD),
 * so white type reads on bright skies, flashes and sunbursts. The halo is the UI alpha dilated over two
 * rings (~5 and ~11 px), multiplied into the frame before the UI is drawn on top.
 */
export class TextHalo {
  private pass = new FSPass(/* glsl */ `
    uniform sampler2D src; uniform vec2 texel; uniform float uK;
    void main() {
      float a = 0.0;
      for (int i = 0; i < 12; i++) {
        float ang = float(i) * 0.5236;
        vec2 d = vec2(cos(ang), sin(ang));
        a = max(a, texture(src, vUv + d * texel * 5.0).a);
        a = max(a, 0.6 * texture(src, vUv + d * texel * 11.0).a);
      }
      a = max(a, texture(src, vUv).a);
      fragColor = vec4(vec3(1.0 - uK * a), 1.0);
    }`, { src: { value: null }, texel: { value: new THREE.Vector2(1 / W, 1 / H) }, uK: { value: 0.72 } },
    { blending: THREE.CustomBlending, transparent: true });
  constructor() {
    const m = this.pass.mat;
    m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.ZeroFactor; m.blendDst = THREE.SrcColorFactor;
  }
  render(renderer: THREE.WebGLRenderer, ui: THREE.Texture, out: THREE.WebGLRenderTarget, k = 0.72) {
    this.pass.u.src!.value = ui;
    this.pass.u.uK!.value = k;
    this.pass.render(renderer, out);
  }
}
