// Shared 3D world kit for the rift city: a camera-aware sky (night gradient, stars, lit cloud deck,
// the glowing rift crack, lightning), instanced rusted buildings with procedural windows and neon
// trims, a wet reflective street, rooftops, rain and ember/spark particles, pixel dust.
// Everything is a pure function of the uniforms set each frame (time, beat pulses).
import * as THREE from 'three';
import { FSPass, makeRT, W, H } from './gl';
import { GLSL_COMMON } from './glsl/common';
import { LineBatch } from './lines';
import { hash, mulberry32 } from './util';

// ------------------------------------------------------------------------------------------ sky
export class Sky {
  pass = new FSPass(/* glsl */ `
    uniform mat4 uInvProj, uCamWorld;
    uniform float uTime, uRift, uStorm, uStars, uClouds, uPulse, uRiftAngle, uMoon;
    uniform vec3 uTop, uHorizon, uRiftCol, uGlowCol;
    vec3 rayDir() {
      vec4 c = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
      return normalize((uCamWorld * vec4(c.xyz / c.w, 0.0)).xyz);
    }
    void main() {
      vec3 d = rayDir();
      float el = d.y;
      vec3 col = mix(uHorizon, uTop, pow(sat(el * 1.4 + 0.05), 0.6));
      // city glow at the horizon
      col += uGlowCol * exp(-abs(el) * 9.0) * 0.8;
      // stars
      vec2 sp = vec2(atan(d.z, d.x), el) * vec2(90.0, 90.0);
      vec2 cell = floor(sp);
      float h = hash12(cell);
      vec2 f = fract(sp) - 0.5 - (hash22(cell) - 0.5) * 0.6;
      float star = step(0.985, h) * smoothstep(0.12, 0.0, length(f)) * sat(el * 4.0);
      col += vec3(0.8, 0.85, 1.0) * star * uStars * (0.6 + 0.4 * sin(uTime * 3.0 + h * 50.0));
      // moon
      vec3 md = normalize(vec3(-0.45, 0.42, -0.78));
      float mdot = dot(d, md);
      col += vec3(0.9, 0.85, 0.75) * smoothstep(0.9993, 0.9996, mdot) * 2.2 * uMoon;
      col += vec3(0.25, 0.3, 0.5) * pow(sat(mdot), 400.0) * 0.8 * uMoon;
      // the rift: a jagged crack across the sky, blazing from inside
      vec2 rp = vec2(atan(d.x, -d.z), el);
      rp = rot2(uRiftAngle) * (rp - vec2(0.0, 0.32));
      float jag = fbm(vec2(rp.x * 3.0, uTime * 0.05), 4) * 0.12 + sin(rp.x * 17.0) * 0.012;
      float rd = abs(rp.y - jag);
      float width = 0.004 + 0.035 * uRift * smoothstep(1.2, 0.0, abs(rp.x));
      float core = smoothstep(width, 0.0, rd);
      float glow = exp(-rd / (0.03 + 0.08 * uRift)) * smoothstep(1.6, 0.0, abs(rp.x));
      col += uRiftCol * (core * 6.0 + glow * (0.6 + uPulse)) * uRift;
      // cloud deck lit from below by the city
      if (el > -0.02 && uClouds > 0.0) {
        vec2 cp = d.xz / max(el + 0.08, 0.02) * 0.35 + vec2(uTime * 0.02, 0.0);
        float c = fbm(cp, 4) * 0.5 + 0.5;
        c = smoothstep(0.45, 0.85, c) * uClouds * sat(1.0 - el * 1.2);
        vec3 cc = mix(uGlowCol * 0.5, uTop * 0.5, sat(el * 3.0)) + uRiftCol * glow * uRift * 0.6;
        col = mix(col, cc, c * 0.85);
      }
      // lightning: whole-sky flash with a bright cloud patch
      col += vec3(0.6, 0.7, 1.0) * uStorm * (0.25 + 0.75 * smoothstep(0.4, 1.0, fbm(d.xz * 3.0 + 5.0, 3) + 0.5));
      fragColor = vec4(col, 1.0);
    }`, {
    uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
    uTime: { value: 0 }, uRift: { value: 0 }, uStorm: { value: 0 }, uStars: { value: 1 }, uClouds: { value: 1 }, uPulse: { value: 0 },
    uRiftAngle: { value: 0.12 }, uMoon: { value: 1 },
    uTop: { value: new THREE.Vector3(0.004, 0.006, 0.025) }, uHorizon: { value: new THREE.Vector3(0.03, 0.02, 0.05) },
    uRiftCol: { value: new THREE.Vector3(1.0, 0.35, 0.08) }, uGlowCol: { value: new THREE.Vector3(0.25, 0.08, 0.03) },
  });
  set(o: { t: number; rift?: number; storm?: number; stars?: number; clouds?: number; pulse?: number; riftAngle?: number; moon?: number; top?: [number, number, number]; horizon?: [number, number, number]; riftCol?: [number, number, number]; glow?: [number, number, number] }) {
    const u = this.pass.u;
    u.uTime!.value = o.t;
    u.uRift!.value = o.rift ?? 0;
    u.uStorm!.value = o.storm ?? 0;
    u.uStars!.value = o.stars ?? 1;
    u.uClouds!.value = o.clouds ?? 1;
    u.uPulse!.value = o.pulse ?? 0;
    u.uMoon!.value = o.moon ?? 1;
    if (o.riftAngle !== undefined) u.uRiftAngle!.value = o.riftAngle;
    if (o.top) (u.uTop!.value as THREE.Vector3).set(...o.top);
    if (o.horizon) (u.uHorizon!.value as THREE.Vector3).set(...o.horizon);
    if (o.riftCol) (u.uRiftCol!.value as THREE.Vector3).set(...o.riftCol);
    if (o.glow) (u.uGlowCol!.value as THREE.Vector3).set(...o.glow);
  }
  /** The sky is smooth: rendered at 1/3 resolution and upscaled (the heaviest per-pixel noise in the video). */
  low = makeRT(Math.ceil(W / 3), Math.ceil(H / 3), { depthBuffer: false });
  private blit = new FSPass(`uniform sampler2D src; void main(){ fragColor = texture(src, vUv); }`, { src: { value: null } });
  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, cam: THREE.PerspectiveCamera) {
    cam.updateMatrixWorld();
    (this.pass.u.uInvProj!.value as THREE.Matrix4).copy(cam.projectionMatrixInverse);
    (this.pass.u.uCamWorld!.value as THREE.Matrix4).copy(cam.matrixWorld);
    this.pass.render(renderer, this.low);
    this.blit.u.src!.value = this.low.texture;
    this.blit.render(renderer, out);
  }
}

// ------------------------------------------------------------------------------------ buildings
const BLD_VERT = /* glsl */ `
precision highp float;
in vec3 position; in vec3 normal; in mat4 instanceMatrix; in vec4 aSeed;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
out vec3 vW; out vec3 vN; out vec3 vL; out vec4 vSeed; out vec3 vScale;
void main() {
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vL = position * vScale;
  vSeed = aSeed;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const BLD_FRAG = /* glsl */ `
precision highp float;
in vec3 vW; in vec3 vN; in vec3 vL; in vec4 vSeed; in vec3 vScale;
out vec4 fragColor;
uniform vec3 cameraPosition;
uniform float uTime, uPulse, uWin, uFogNear, uFogFar, uInfect, uInfectR;
uniform vec3 uFogCol, uNeonA, uNeonB, uWinCol, uInfectCol, uInfectPos;
${GLSL_COMMON}
void main() {
  vec3 n = normalize(vN);
  // rusted metal / concrete albedo with streaks
  float streak = snoise(vec2(vW.x * 0.05 + vW.z * 0.05, vW.y * 0.01)) * 0.5;
  vec3 alb = mix(vec3(0.018, 0.02, 0.035), vec3(0.06, 0.028, 0.016), sat(streak + 0.5 * vSeed.x));
  vec3 col = alb * (0.4 + 0.6 * sat(n.y * 0.5 + 0.5));
  // windows on the side faces: a grid in face-local coordinates
  if (abs(n.y) < 0.5) {
    vec2 fp = abs(n.x) > 0.5 ? vec2(vL.z, vL.y) : vec2(vL.x, vL.y);
    vec2 g = fp / vec2(3.2, 4.0);
    vec2 id = floor(g);
    vec2 f = fract(g);
    float win = step(0.25, f.x) * step(f.x, 0.75) * step(0.3, f.y) * step(f.y, 0.8);
    float on = step(0.55 - 0.25 * uWin, hash12(id + vSeed.yz * 100.0));
    // some windows flicker with the beat
    float fl = step(0.93, hash12(id * 1.7 + vSeed.zw * 50.0)) * uPulse;
    vec3 wc = mix(uWinCol, mix(uNeonA, uNeonB, step(0.5, hash12(id + 3.0))), step(0.8, hash12(id * 2.3)));
    col += wc * win * (on * 0.55 + fl * 2.5) * (0.6 + 0.4 * hash12(id + 7.0));
    // neon trim near the roof
    float top = vScale.y * 0.5 - vL.y;
    float trim = smoothstep(0.5, 0.0, abs(top - 1.2)) * step(0.6, vSeed.w);
    col += mix(uNeonA, uNeonB, step(0.5, vSeed.x)) * trim * (1.6 + 1.5 * uPulse);
  }
  // infection: a green front of glitch tiles spreading from uInfectPos
  if (uInfect > 0.0) {
    float d = length(vW.xz - uInfectPos.xz);
    vec2 tile = floor(vW.xy * 0.8) + floor(vW.zz * 0.8);
    float edge = uInfectR + (hash12(tile) - 0.5) * 30.0;
    float inf = step(d, edge) * uInfect;
    float blink = step(0.6, hash12(tile + floor(uTime * 12.0)));
    col = mix(col, uInfectCol * (0.08 + 0.9 * blink * step(0.55, hash12(tile * 3.1))), inf * 0.7);
  }
  float fog = smoothstep(uFogNear, uFogFar, length(cameraPosition - vW));
  // height fog: thicker near the street
  fog = max(fog, smoothstep(12.0, -30.0, vW.y) * 0.6);
  col = mix(col, uFogCol, fog);
  fragColor = vec4(col, 1.0);
}`;

export interface CityOpts { seed?: number; count?: number; radius?: number; clear?: number; minH?: number; maxH?: number; groundY?: number }

export class City {
  group = new THREE.Group();
  mat: THREE.RawShaderMaterial;
  constructor(o: CityOpts = {}) {
    const rnd = mulberry32(o.seed ?? 7);
    const n = o.count ?? 260;
    const R = o.radius ?? 900, clear = o.clear ?? 60, gy = o.groundY ?? -80;
    this.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: BLD_VERT, fragmentShader: BLD_FRAG,
      uniforms: {
        uTime: { value: 0 }, uPulse: { value: 0 }, uWin: { value: 0.5 }, uFogNear: { value: 150 }, uFogFar: { value: 1100 },
        uFogCol: { value: new THREE.Vector3(0.02, 0.012, 0.03) }, uNeonA: { value: new THREE.Vector3(0.2, 1.2, 1.8) },
        uNeonB: { value: new THREE.Vector3(2.0, 0.5, 0.1) }, uWinCol: { value: new THREE.Vector3(0.9, 0.55, 0.25) },
        uInfect: { value: 0 }, uInfectR: { value: 0 }, uInfectCol: { value: new THREE.Vector3(0.25, 1.4, 0.2) },
        uInfectPos: { value: new THREE.Vector3() },
      },
    });
    const box = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.InstancedMesh(box, this.mat, n);
    mesh.frustumCulled = false;
    const seeds = new Float32Array(n * 4);
    const m = new THREE.Matrix4();
    let i = 0;
    for (let k = 0; i < n && k < n * 20; k++) {
      const a = rnd() * Math.PI * 2, r = clear + Math.pow(rnd(), 0.7) * R;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const w = 18 + rnd() * 40, d = 18 + rnd() * 40;
      const h = (o.minH ?? 40) + Math.pow(rnd(), 2) * ((o.maxH ?? 320) - (o.minH ?? 40));
      m.makeScale(w, h, d);
      m.setPosition(x, gy + h / 2, z);
      mesh.setMatrixAt(i, m);
      seeds.set([rnd(), rnd(), rnd(), rnd()], i * 4);
      i++;
    }
    mesh.count = i;
    const g = mesh.geometry.clone();
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
    mesh.geometry = g;
    this.group.add(mesh);
  }
  set(o: { t: number; pulse?: number; win?: number; infect?: number; infectR?: number; infectPos?: [number, number, number]; fog?: [number, number, number]; fogNear?: number; fogFar?: number; neonA?: [number, number, number]; neonB?: [number, number, number] }) {
    const u = this.mat.uniforms;
    u.uTime!.value = o.t;
    u.uPulse!.value = o.pulse ?? 0;
    if (o.win !== undefined) u.uWin!.value = o.win;
    u.uInfect!.value = o.infect ?? 0;
    u.uInfectR!.value = o.infectR ?? 0;
    if (o.infectPos) (u.uInfectPos!.value as THREE.Vector3).set(...o.infectPos);
    if (o.fog) (u.uFogCol!.value as THREE.Vector3).set(...o.fog);
    if (o.fogNear !== undefined) u.uFogNear!.value = o.fogNear;
    if (o.fogFar !== undefined) u.uFogFar!.value = o.fogFar;
    if (o.neonA) (u.uNeonA!.value as THREE.Vector3).set(...o.neonA);
    if (o.neonB) (u.uNeonB!.value as THREE.Vector3).set(...o.neonB);
  }
}

// ------------------------------------------------------------------------------- ground / roof
const SURF_FRAG = /* glsl */ `
precision highp float;
in vec3 vW; in vec2 vUv2;
out vec4 fragColor;
uniform vec3 cameraPosition;
uniform float uTime, uWet, uGrid, uFogNear, uFogFar, uPulse, uRust;
uniform vec3 uFogCol, uReflA, uReflB, uGridCol, uBase;
${GLSL_COMMON}
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float fres = pow(1.0 - sat(v.y), 3.0);
  // base: dark asphalt / rusted plate with fine noise
  float nz = snoise(vW.xz * 0.15) * 0.5 + snoise(vW.xz * 0.6) * 0.25;
  vec3 col = uBase * (0.85 + 0.3 * nz);
  col = mix(col, vec3(0.07, 0.022, 0.01) * (0.8 + nz), uRust * smoothstep(0.1, 0.5, snoise(vW.xz * 0.04 + 3.0) * 0.5 + 0.25));
  // wet reflections: thin streaks of neon stretched toward the camera (reflected light sources)
  float puddle = smoothstep(-0.2, 0.4, snoise(vW.xz * 0.015 + 9.0)) * uWet;
  vec2 rv = vec2(vW.x - cameraPosition.x, vW.z - cameraPosition.z);
  float across = dot(normalize(vec2(-rv.y, rv.x)), vW.xz);
  float lanes = pow(0.5 + 0.5 * snoise(vec2(across * 0.09, 3.0)), 6.0);
  float lanes2 = pow(0.5 + 0.5 * snoise(vec2(across * 0.05, 7.0)), 8.0);
  vec3 refl = uReflA * lanes + uReflB * lanes2;
  col += refl * puddle * (0.1 + 0.9 * fres) * (0.6 + uPulse * 0.6);
  // ripples from rain
  vec2 rc = floor(vW.xz * 0.5);
  float rt = fract(uTime * 1.3 + hash12(rc));
  float rr = length(fract(vW.xz * 0.5) - 0.5 - (hash22(rc) - 0.5) * 0.4);
  col += vec3(0.3, 0.35, 0.5) * smoothstep(0.03, 0.0, abs(rr - rt * 0.45)) * (1.0 - rt) * puddle * 0.4;
  // optional arcade grid
  if (uGrid > 0.0) {
    vec2 g = abs(fract(vW.xz / 12.0) - 0.5) * 12.0;
    float dist = length(cameraPosition.xz - vW.xz);
    // line width in world units grows with distance so lines stay ~1.5 px; fade them out far away
    float lw = 0.35 + dist * 0.0025;
    float gl = 1.0 - smoothstep(lw * 0.5, lw, min(g.x, g.y));
    col += uGridCol * gl * uGrid * (0.6 + uPulse) * exp(-dist / 500.0);
  }
  float fog = smoothstep(uFogNear, uFogFar, length(cameraPosition - vW));
  col = mix(col, uFogCol, fog);
  fragColor = vec4(col, 1.0);
}`;
const SURF_VERT = /* glsl */ `
precision highp float;
in vec3 position; in vec2 uv;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
out vec3 vW; out vec2 vUv2;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vUv2 = uv; gl_Position = projectionMatrix * viewMatrix * w; }`;

export class Surface {
  mesh: THREE.Mesh;
  mat: THREE.RawShaderMaterial;
  constructor(size = 4000, o: { y?: number; base?: [number, number, number]; rust?: number } = {}) {
    this.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: SURF_VERT, fragmentShader: SURF_FRAG,
      uniforms: {
        uTime: { value: 0 }, uWet: { value: 1 }, uGrid: { value: 0 }, uFogNear: { value: 100 }, uFogFar: { value: 1500 }, uPulse: { value: 0 },
        uRust: { value: o.rust ?? 0 },
        uFogCol: { value: new THREE.Vector3(0.02, 0.012, 0.03) }, uReflA: { value: new THREE.Vector3(0.15, 0.7, 1.1) },
        uReflB: { value: new THREE.Vector3(1.3, 0.35, 0.08) }, uGridCol: { value: new THREE.Vector3(1.4, 0.3, 0.08) },
        uBase: { value: new THREE.Vector3(...(o.base ?? [0.012, 0.012, 0.018])) },
      },
    });
    const g = new THREE.PlaneGeometry(size, size);
    g.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.position.y = o.y ?? -80;
    this.mesh.frustumCulled = false;
  }
  set(o: { t: number; wet?: number; grid?: number; pulse?: number; fog?: [number, number, number]; fogNear?: number; fogFar?: number; reflA?: [number, number, number]; reflB?: [number, number, number]; gridCol?: [number, number, number] }) {
    const u = this.mat.uniforms;
    u.uTime!.value = o.t;
    if (o.wet !== undefined) u.uWet!.value = o.wet;
    u.uGrid!.value = o.grid ?? 0;
    u.uPulse!.value = o.pulse ?? 0;
    if (o.fog) (u.uFogCol!.value as THREE.Vector3).set(...o.fog);
    if (o.fogNear !== undefined) u.uFogNear!.value = o.fogNear;
    if (o.fogFar !== undefined) u.uFogFar!.value = o.fogFar;
    if (o.reflA) (u.uReflA!.value as THREE.Vector3).set(...o.reflA);
    if (o.reflB) (u.uReflB!.value as THREE.Vector3).set(...o.reflB);
    if (o.gridCol) (u.uGridCol!.value as THREE.Vector3).set(...o.gridCol);
  }
}

/** A rooftop slab (rusted plate surface on top, dark sides) with an edge light strip. */
export function makeRoof(w: number, d: number, y = 0, o: { rust?: number } = {}) {
  const grp = new THREE.Group();
  const top = new Surface(1, { y, rust: o.rust ?? 1, base: [0.02, 0.018, 0.024] });
  top.mesh.scale.set(w, 1, d);
  grp.add(top.mesh);
  const side = new THREE.Mesh(new THREE.BoxGeometry(w, 200, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.006, 0.006, 0.01) }));
  side.position.y = y - 100.05;
  grp.add(side);
  return { group: grp, top };
}

// ------------------------------------------------------------------------------------ particles
/** Rain streaks in a box around `center` (world units), deterministic in t. */
export function drawRain(lb: LineBatch, t: number, o: { center: [number, number, number]; size: [number, number, number]; n?: number; speed?: number; len?: number; width?: number; wind?: number; col?: [number, number, number]; alpha?: number }) {
  const n = o.n ?? 1500, sp = o.speed ?? 260, L = o.len ?? 9, wd = o.width ?? 0.18, wind = o.wind ?? 0.15;
  const [cx, cy, cz] = o.center, [sx, sy, sz] = o.size;
  const c = o.col ?? [0.35, 0.42, 0.6];
  for (let i = 0; i < n; i++) {
    const x = cx + (hash(i, 1) - 0.5) * sx, z = cz + (hash(i, 2) - 0.5) * sz;
    const ph = hash(i, 3);
    const y = cy + sy / 2 - ((ph * sy + t * sp * (0.8 + 0.4 * hash(i, 4))) % sy);
    lb.seg(x, y, z, x + wind * L, y - L, z, wd, c[0], c[1], c[2], (o.alpha ?? 0.5) * (0.4 + 0.6 * hash(i, 5)));
  }
}

/** Embers rising from a region: short glowing streaks with flicker. */
export function drawEmbers(lb: LineBatch, t: number, o: { center: [number, number, number]; size: [number, number, number]; n?: number; speed?: number; col?: [number, number, number]; width?: number; seed?: number; alpha?: number }) {
  const n = o.n ?? 300, sp = o.speed ?? 30, s = o.seed ?? 0;
  const [cx, cy, cz] = o.center, [sx, sy, sz] = o.size;
  const c = o.col ?? [3.0, 0.9, 0.2];
  for (let i = 0; i < n; i++) {
    const ph = hash(i, s, 3);
    const life = (ph + t * sp / sy * (0.6 + 0.8 * hash(i, s, 4))) % 1;
    const x = cx + (hash(i, s, 1) - 0.5) * sx + Math.sin(t * 1.3 + i) * 3 * life;
    const z = cz + (hash(i, s, 2) - 0.5) * sz + Math.cos(t * 1.1 + i * 1.7) * 3 * life;
    const y = cy - sy / 2 + life * sy;
    const fl = (1 - life) * (0.5 + 0.5 * Math.sin(t * 20 + i * 3.1));
    lb.seg(x, y, z, x - Math.sin(t + i) * 0.6, y - 1.8, z, (o.width ?? 0.35) * (0.5 + hash(i, s, 5)), c[0], c[1], c[2], fl * (o.alpha ?? 1));
  }
}

/** Screen-space speed lines radiating from the centre (2D LineBatch), for hits and zooms. */
export function drawSpeedLines(lb: LineBatch, t: number, amt: number, o: { cx?: number; cy?: number; n?: number; col?: [number, number, number]; seed?: number } = {}) {
  if (amt <= 0) return;
  const n = o.n ?? 90, cx = o.cx ?? 960, cy = o.cy ?? 540;
  const c = o.col ?? [1, 1, 1];
  const fi = Math.round(t * 30);
  for (let i = 0; i < n; i++) {
    const a = hash(i, fi, o.seed ?? 0) * Math.PI * 2;
    const r0 = 380 + hash(i, fi, 9) * 500, r1 = r0 + 150 + hash(i, fi, 5) * 600;
    lb.seg2(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 1 + hash(i, 3) * 4, c, amt * (0.3 + 0.7 * hash(i, fi, 4)));
  }
}
