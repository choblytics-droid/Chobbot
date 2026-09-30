// Voxel characters: a 32x32 pixel sprite extruded into 3D. Every pixel becomes one box whose depth
// grows with its distance from the silhouette edge ("inflated" pixel art: flat at the outline,
// puffy in the middle), so the characters read as solid toys from any angle. Moving parts (wings,
// tail, arms) are separate hinged groups. One custom shader does the look: wrapped key light, two
// coloured rim lights, emissive pixels, fog, and the effects: ghost (hologram), dissolve (voxels
// fly apart), flash, and a pixel "glitch" offset.
import * as THREE from 'three';
import { GLSL_COMMON } from './glsl/common';
import { hexToLinear } from './util';
import { poseGrid, type PartName, type SpriteDef } from '../sprites/sprites';

const VERT = /* glsl */ `
precision highp float;
in vec3 position;
in vec3 normal;
in mat4 instanceMatrix;
in vec3 aColor;
in float aEmis;
in vec4 aRand;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
uniform float uDissolve, uTime, uGlitch, uBreath;
uniform vec3 uDissolveDir;
out vec3 vN;
out vec3 vW;
out vec3 vCol;
out float vEmis;
out float vRand;
out vec3 vLocal;
void main() {
  vec4 lp = instanceMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(instanceMatrix) * normal);
  // dissolve: each voxel flies out along a random direction biased by uDissolveDir, tumbling
  if (uDissolve > 0.0) {
    float d = max(0.0, uDissolve * 1.6 - aRand.w * 0.6);
    vec3 dir = normalize(aRand.xyz * 2.0 - 1.0 + uDissolveDir);
    vec3 c = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    float a = d * (3.0 + aRand.w * 6.0);
    mat3 R = mat3(cos(a), sin(a), 0.0, -sin(a), cos(a), 0.0, 0.0, 0.0, 1.0);
    lp.xyz = c + R * (lp.xyz - c) * (1.0 - 0.5 * min(d, 1.0)) + dir * d * d * 40.0;
    n = R * n;
  }
  // glitch: rows of voxels slide sideways (sampled per 1/30 s step in uTime)
  if (uGlitch > 0.0) {
    float row = floor(lp.y * 0.5);
    float h = fract(sin(row * 91.7 + floor(uTime * 30.0) * 13.1) * 43758.5);
    lp.x += step(1.0 - uGlitch * 0.5, h) * (h - 0.5) * 12.0 * uGlitch;
  }
  lp.xyz *= vec3(1.0 + uBreath * 0.03, 1.0 - uBreath * 0.02, 1.0 + uBreath * 0.03);
  vec4 w = modelMatrix * lp;
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * n);
  vCol = aColor;
  vEmis = aEmis;
  vRand = aRand.w;
  vLocal = position;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */ `
precision highp float;
in vec3 vN;
in vec3 vW;
in vec3 vCol;
in float vEmis;
in float vRand;
in vec3 vLocal;
out vec4 fragColor;
uniform vec3 cameraPosition;
uniform vec3 uKeyDir, uKeyCol, uRimA, uRimB, uAmbTop, uAmbBot, uFogCol, uTintCol;
uniform float uFogNear, uFogFar, uGhost, uGlow, uFlash, uTime, uTint, uAlpha, uEdge;
${GLSL_COMMON}
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vW);
  float k = dot(n, normalize(uKeyDir));
  float wrap = sat(k * 0.6 + 0.4);
  vec3 amb = mix(uAmbBot, uAmbTop, n.y * 0.5 + 0.5);
  vec3 base = mix(vCol, uTintCol, uTint);
  vec3 col = base * (amb + uKeyCol * wrap);
  float fr = pow(1.0 - sat(dot(n, v)), 2.5);
  // two rim lights from either side (the teal/orange split)
  col += uRimA * fr * sat(n.x * 0.8 + 0.4) + uRimB * fr * sat(-n.x * 0.8 + 0.4);
  // bevel: darken voxel edges slightly so the pixel grid reads in 3D
  vec3 e = abs(vLocal) * 2.0;
  float edge = max(max(min(e.x, e.y), min(e.y, e.z)), min(e.x, e.z));
  col *= 1.0 - uEdge * smoothstep(0.82, 1.0, edge);
  col += vCol * vEmis * uGlow;
  col += vec3(1.0) * uFlash;
  float a = uAlpha;
  if (uGhost > 0.0) {
    // hologram: scanlines, fresnel glow, flicker
    float sl = 0.55 + 0.45 * sin(vW.y * 3.0 - uTime * 8.0);
    vec3 holo = mix(C_CYAN, C_ICE, fr) * (0.45 + 1.6 * fr) * sl + vCol * 0.35;
    col = mix(col, holo, uGhost);
    a *= mix(1.0, 0.5 + 0.5 * fr + 0.25 * sl, uGhost);
  }
  float fog = smoothstep(uFogNear, uFogFar, length(cameraPosition - vW));
  col = mix(col, uFogCol, fog);
  fragColor = vec4(col * a, a);
}`;

export interface VoxelLook {
  keyDir: [number, number, number];
  keyCol: [number, number, number];
  rimA: [number, number, number];
  rimB: [number, number, number];
  ambTop: [number, number, number];
  ambBot: [number, number, number];
  fogCol: [number, number, number];
  fogNear: number;
  fogFar: number;
}

export const DEFAULT_LOOK: VoxelLook = {
  keyDir: [0.4, 0.8, 0.6],
  keyCol: [0.9, 0.85, 0.8],
  rimA: [0.2, 1.1, 1.6], // cyan rim from the right
  rimB: [1.8, 0.5, 0.12], // orange rim from the left
  ambTop: [0.22, 0.24, 0.35],
  ambBot: [0.06, 0.05, 0.08],
  fogCol: [0.004, 0.005, 0.012],
  fogNear: 400,
  fogFar: 2600,
};

export interface Pose {
  blink?: boolean;
  mouth?: boolean;
  /** radians: wing flap (Venmar), tail wag, arm swing (Quest: [left, right]). */
  flap?: number;
  wag?: number;
  arms?: [number, number];
}

const PARTS: PartName[] = ['body', 'wingL', 'wingR', 'tail', 'armL', 'armR'];

export class VoxelChar {
  group = new THREE.Group();
  /** Pivot groups of each part (rotate these; body is at the root). */
  parts: Partial<Record<PartName, THREE.Group>> = {};
  mat: THREE.RawShaderMaterial;
  private meshes: { part: PartName; mesh: THREE.InstancedMesh; cells: [number, number][] }[] = [];
  private lastPoseKey = '';
  private linPal: Record<string, [number, number, number]> = {};

  constructor(public def: SpriteDef, o: { depth?: number; emissive?: number } = {}) {
    for (const [k, hex] of Object.entries(def.pal)) this.linPal[k] = hexToLinear(hex);
    this.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uKeyDir: { value: new THREE.Vector3() }, uKeyCol: { value: new THREE.Vector3() },
        uRimA: { value: new THREE.Vector3() }, uRimB: { value: new THREE.Vector3() },
        uAmbTop: { value: new THREE.Vector3() }, uAmbBot: { value: new THREE.Vector3() },
        uFogCol: { value: new THREE.Vector3() }, uFogNear: { value: 60 }, uFogFar: { value: 600 },
        uTintCol: { value: new THREE.Vector3(1, 1, 1) }, uTint: { value: 0 },
        uGhost: { value: 0 }, uGlow: { value: 1 }, uFlash: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 1 },
        uDissolve: { value: 0 }, uDissolveDir: { value: new THREE.Vector3(0, 0.3, 0) }, uGlitch: { value: 0 },
        uBreath: { value: 0 }, uEdge: { value: 0.35 },
      },
      transparent: false,
      depthWrite: true,
      depthTest: true,
    });
    this.look(DEFAULT_LOOK);
    const grid = poseGrid(def);
    const filled = (c: number, r: number) => r >= 0 && r < 32 && c >= 0 && c < 32 && grid[r]![c] !== '.';
    // distance to the silhouette edge (chessboard, 2 passes)
    const dist: number[][] = Array.from({ length: 32 }, (_, r) => Array.from({ length: 32 }, (_, c) => (filled(c, r) ? 99 : 0)));
    for (let pass = 0; pass < 6; pass++)
      for (let r = 0; r < 32; r++)
        for (let c = 0; c < 32; c++) {
          if (!filled(c, r)) continue;
          let m = 99;
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const cc = c + dc!, rr = r + dr!;
            m = Math.min(m, cc < 0 || cc > 31 || rr < 0 || rr > 31 ? 0 : dist[rr]![cc]!);
          }
          dist[r]![c] = Math.min(dist[r]![c]!, m + 1);
        }
    const D = o.depth ?? 1;
    const box = new THREE.BoxGeometry(1, 1, 1);
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const part of PARTS) {
      const cells: [number, number][] = [];
      for (let r = 0; r < 32; r++) for (let c = 0; c < 32; c++) if (filled(c, r) && def.part(c, r) === part) cells.push([c, r]);
      if (!cells.length) continue;
      const pivot = new THREE.Group();
      const h = def.hinge[part];
      const [hx, hy] = h ? this.px(h[0], h[1]) : [0, 0];
      pivot.position.set(hx, hy, 0);
      if (part === 'body') this.group.add(pivot);
      else this.group.add(pivot);
      this.parts[part] = pivot;
      const mesh = new THREE.InstancedMesh(box, this.mat, cells.length);
      mesh.frustumCulled = false;
      const col = new Float32Array(cells.length * 3), emis = new Float32Array(cells.length), rand = new Float32Array(cells.length * 4);
      const m = new THREE.Matrix4();
      cells.forEach(([c, r], i) => {
        const [x, y] = this.px(c, r);
        const thin = part === 'wingL' || part === 'wingR' ? 0.6 : 1;
        const depth = (1 + Math.min(dist[r]![c]!, 6) * 0.9) * D * thin;
        m.makeScale(1, 1, depth);
        m.setPosition(x - hx, y - hy, 0);
        mesh.setMatrixAt(i, m);
        rand.set([rnd(), rnd(), rnd(), rnd()], i * 4);
      });
      const g = mesh.geometry.clone();
      g.setAttribute('aColor', new THREE.InstancedBufferAttribute(col, 3));
      g.setAttribute('aEmis', new THREE.InstancedBufferAttribute(emis, 1));
      g.setAttribute('aRand', new THREE.InstancedBufferAttribute(rand, 4));
      mesh.geometry = g;
      pivot.add(mesh);
      this.meshes.push({ part, mesh, cells });
    }
    this.pose({});
  }

  /** Pixel (col,row) -> local units: 1 unit per pixel, feet on y = 0, centred on x. */
  px(c: number, r: number): [number, number] { return [c - 15.5, 31.5 - r]; }

  look(l: Partial<VoxelLook>) {
    const u = this.mat.uniforms;
    const v = (k: string, x?: [number, number, number]) => { if (x) (u[k]!.value as THREE.Vector3).set(...x); };
    v('uKeyDir', l.keyDir); v('uKeyCol', l.keyCol); v('uRimA', l.rimA); v('uRimB', l.rimB);
    v('uAmbTop', l.ambTop); v('uAmbBot', l.ambBot); v('uFogCol', l.fogCol);
    if (l.fogNear !== undefined) u.uFogNear!.value = l.fogNear;
    if (l.fogFar !== undefined) u.uFogFar!.value = l.fogFar;
    return this;
  }

  /** Effect uniforms: ghost 0..1, dissolve 0..1, glow, flash, glitch, alpha, tint (colour, amount), breath. */
  fx(o: { t?: number; ghost?: number; dissolve?: number; dissolveDir?: [number, number, number]; glow?: number; flash?: number; glitch?: number; alpha?: number; tint?: [number, number, number]; tintA?: number; breath?: number; edge?: number }) {
    const u = this.mat.uniforms;
    if (o.t !== undefined) u.uTime!.value = o.t;
    u.uGhost!.value = o.ghost ?? 0;
    u.uDissolve!.value = o.dissolve ?? 0;
    if (o.dissolveDir) (u.uDissolveDir!.value as THREE.Vector3).set(...o.dissolveDir);
    u.uGlow!.value = o.glow ?? 1;
    u.uFlash!.value = o.flash ?? 0;
    u.uGlitch!.value = o.glitch ?? 0;
    u.uAlpha!.value = o.alpha ?? 1;
    u.uTint!.value = o.tintA ?? 0;
    if (o.tint) (u.uTintCol!.value as THREE.Vector3).set(...o.tint);
    u.uBreath!.value = o.breath ?? 0;
    u.uEdge!.value = o.edge ?? 0.35;
    const translucent = (o.ghost ?? 0) > 0 || (o.alpha ?? 1) < 1;
    if (this.mat.transparent !== translucent) {
      this.mat.transparent = translucent;
      this.mat.depthWrite = !translucent;
      this.mat.blending = translucent ? THREE.CustomBlending : THREE.NormalBlending;
      this.mat.blendSrc = THREE.OneFactor;
      this.mat.blendDst = THREE.OneMinusSrcAlphaFactor;
      this.mat.needsUpdate = true;
    }
    return this;
  }

  /** Apply a pose: pixel patches (blink, mouth) and part rotations. */
  pose(p: Pose) {
    const key = `${p.blink ? 1 : 0}${p.mouth ? 1 : 0}`;
    if (key !== this.lastPoseKey) {
      this.lastPoseKey = key;
      const g = poseGrid(this.def, p);
      for (const { mesh, cells } of this.meshes) {
        const col = mesh.geometry.getAttribute('aColor') as THREE.InstancedBufferAttribute;
        const em = mesh.geometry.getAttribute('aEmis') as THREE.InstancedBufferAttribute;
        cells.forEach(([c, r], i) => {
          const k = g[r]![c]!;
          const lin = this.linPal[k === '.' ? 'a' : k] ?? [1, 0, 1];
          col.setXYZ(i, lin[0], lin[1], lin[2]);
          em.setX(i, this.def.emissive[k] ?? 0);
        });
        col.needsUpdate = true;
        em.needsUpdate = true;
      }
    }
    const P = this.parts;
    P.wingL?.rotation.set(0, p.flap ?? 0, (p.flap ?? 0) * 0.5);
    P.wingR?.rotation.set(0, -(p.flap ?? 0), -(p.flap ?? 0) * 0.5);
    P.tail?.rotation.set(0, (p.wag ?? 0) * 0.6, p.wag ?? 0);
    P.armL?.rotation.set(p.arms?.[0] ?? 0, 0, 0);
    P.armR?.rotation.set(p.arms?.[1] ?? 0, 0, 0);
    return this;
  }
}

/** A lively default pose as a function of song time: blinks, beat-synced wing/tail motion, mouth on vocal. */
export function autoPose(t: number, beat: number, o: { singing?: boolean; vocal?: number; seed?: number; energy?: number } = {}): Pose {
  const s = o.seed ?? 0;
  const bp = beat - Math.floor(beat);
  // blink ~ every 2.7-4 s for 0.12 s
  const period = 3.1 + (s % 3) * 0.37;
  const blink = ((t + s * 1.3) % period) < 0.12;
  const e = o.energy ?? 1;
  return {
    blink,
    mouth: !!o.singing && (o.vocal ?? 0) > 0.35,
    flap: (0.35 + 0.45 * e) * Math.sin((beat + s) * Math.PI),
    wag: 0.25 * e * Math.sin((beat * 0.5 + s) * Math.PI * 2),
    arms: [0.15 * Math.sin(bp * Math.PI * 2) * e, -0.15 * Math.sin(bp * Math.PI * 2) * e],
  };
}

// ------------------------------------------------------------------------------------ props
/** A voxel-look material (same shader as the characters) for prop boxes. */
export function voxelMaterial(look: Partial<VoxelLook> = {}) {
  const probe = new VoxelChar({ name: '', rows: Array(32).fill('.'.repeat(31) + 'a'), pal: { a: '#000000' }, emissive: {}, part: () => 'body', hinge: {}, blink: [], mouth: [], accent: 'bone' });
  probe.look({ ...DEFAULT_LOOK, rimA: [0.05, 0.25, 0.4], rimB: [0.4, 0.12, 0.03], ...look });
  return probe;
}

/**
 * Instanced boxes with per-box colour, emission and a random seed (for dissolve), drawn with the voxel
 * shader: walls, bars, pedestals, bridges, furniture. Boxes can be moved every frame with set().
 */
export class Boxes {
  mesh: THREE.InstancedMesh;
  owner: VoxelChar;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  n = 0;
  constructor(public capacity: number, look: Partial<VoxelLook> = {}) {
    this.owner = voxelMaterial(look);
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3));
    g.setAttribute('aEmis', new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1));
    const r = new Float32Array(capacity * 4);
    let seed = 7;
    for (let i = 0; i < r.length; i++) r[i] = ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.setAttribute('aRand', new THREE.InstancedBufferAttribute(r, 4));
    this.mesh = new THREE.InstancedMesh(g, this.owner.mat, capacity);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
  }
  get mat() { return this.owner.mat; }
  /** Set box i (centre, size, linear colour, emission, rotation). Grows the drawn count as needed. */
  set(i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, col: [number, number, number], emis = 0, rot?: [number, number, number]) {
    this.q.setFromEuler(this.e.set(rot?.[0] ?? 0, rot?.[1] ?? 0, rot?.[2] ?? 0));
    this.m.compose(new THREE.Vector3(x, y, z), this.q, new THREE.Vector3(Math.max(1e-4, sx), Math.max(1e-4, sy), Math.max(1e-4, sz)));
    this.mesh.setMatrixAt(i, this.m);
    const c = this.mesh.geometry.getAttribute('aColor') as THREE.InstancedBufferAttribute;
    const em = this.mesh.geometry.getAttribute('aEmis') as THREE.InstancedBufferAttribute;
    c.setXYZ(i, col[0], col[1], col[2]);
    em.setX(i, emis);
    c.needsUpdate = true; em.needsUpdate = true;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (i + 1 > this.mesh.count) this.mesh.count = i + 1;
    return this;
  }
  add(x: number, y: number, z: number, sx: number, sy: number, sz: number, col: [number, number, number], emis = 0, rot?: [number, number, number]) {
    this.set(this.n, x, y, z, sx, sy, sz, col, emis, rot);
    return this.n++;
  }
  hide(i: number) { this.set(i, 0, -1e5, 0, 1e-4, 1e-4, 1e-4, [0, 0, 0]); }
}

/** A glowing flat panel in 3D showing a Canvas2D texture (signs, screens, portraits). */
export class Billboard {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  constructor(public w: number, public h: number, pxW = 512, pxH = Math.round((pxW * h) / w), o: { additive?: boolean; pixelated?: boolean } = {}) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = pxW; this.canvas.height = pxH;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    if (o.pixelated) { this.tex.magFilter = THREE.NearestFilter; this.tex.minFilter = THREE.NearestFilter; }
    this.tex.generateMipmaps = false;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: !o.additive, side: THREE.DoubleSide, toneMapped: false });
    if (o.additive) { this.mat.blending = THREE.AdditiveBlending; }
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
  }
  /** Brightness multiplier (>1 glows into the bloom). */
  glow(k: number, tint: [number, number, number] = [1, 1, 1]) { this.mat.color.setRGB(k * tint[0], k * tint[1], k * tint[2]); return this; }
  update() { this.tex.needsUpdate = true; }
}
