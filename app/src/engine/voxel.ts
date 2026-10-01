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
import type { Joint, SculptSpec } from '../sprites/sculpt';
import { rigPose, type Layer, type MoveCtx, type MoveOpts, type RigPose } from './moves';
import { sculptFor } from '../sprites/sculpt';
import { LEGS, V2 } from '../config';

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
#ifdef SCULPT
// v2 rig: 27-bit neighbour occupancy per voxel (bit (dx+1)*9+(dy+1)*3+(dz+1)) for corner AO,
// mouth voxels (pushed back as the jaw opens) and the voxel's local axes in world space (bevel)
in uint aOcc;
in float aMouth;
uniform float uMouth;
out float vAO;
out vec3 vAx;
out vec3 vAy;
out vec3 vAz;
float occ(ivec3 o) { return float((aOcc >> uint((o.x + 1) * 9 + (o.y + 1) * 3 + (o.z + 1))) & 1u); }
#endif
void main() {
  vec4 lp = instanceMatrix * vec4(position, 1.0);
#ifdef SCULPT
  {
    // block-game vertex AO: the two edge neighbours and the corner neighbour in front of this face corner
    ivec3 N = ivec3(round(normal));
    ivec3 S = ivec3(sign(position));
    ivec3 T1 = N.x != 0 ? ivec3(0, S.y, 0) : ivec3(S.x, 0, 0);
    ivec3 T2 = N.z != 0 ? ivec3(0, S.y, 0) : ivec3(0, 0, S.z);
    float s1 = occ(N + T1), s2 = occ(N + T2), sc = occ(N + T1 + T2);
    vAO = (s1 > 0.5 && s2 > 0.5) ? 0.0 : (3.0 - s1 - s2 - sc) / 3.0;
    lp.z -= aMouth * uMouth * 1.6;
    mat3 M = mat3(modelMatrix) * mat3(instanceMatrix);
    vAx = normalize(M[0]); vAy = normalize(M[1]); vAz = normalize(M[2]);
  }
#endif
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
#ifdef SCULPT
in float vAO;
in vec3 vAx;
in vec3 vAy;
in vec3 vAz;
uniform float uAOk, uRimK, uBevel;
#define RIMK uRimK
#else
#define RIMK 1.0
#endif
${GLSL_COMMON}
void main() {
  vec3 n = normalize(vN);
  vec3 nFace = n;
#ifdef SCULPT
  {
    // rounded voxel edges: bend the normal towards the two in-face axes near the cube's edges
    vec3 ln = vec3(dot(n, vAx), dot(n, vAy), dot(n, vAz));
    vec3 bl = sign(vLocal) * smoothstep(0.28, 0.5, abs(vLocal)) * (1.0 - abs(ln));
    n = normalize(n + uBevel * (bl.x * vAx + bl.y * vAy + bl.z * vAz));
  }
#endif
  vec3 v = normalize(cameraPosition - vW);
  float k = dot(n, normalize(uKeyDir));
  float wrap = sat(k * 0.6 + 0.4);
  vec3 amb = mix(uAmbBot, uAmbTop, n.y * 0.5 + 0.5);
  vec3 base = mix(vCol, uTintCol, uTint);
  vec3 col = base * (amb + uKeyCol * wrap);
#ifdef SCULPT
  col *= mix(1.0, 0.45 + 0.55 * vAO, uAOk);
#endif
#ifdef SCULPT
  // rim from the face normal (bevelled normals would light every voxel edge), soft-capped
  float fr = pow(1.0 - sat(dot(nFace, v)), 3.0);
  col += (uRimA * fr * sat(nFace.x * 0.8 + 0.4) + uRimB * fr * sat(-nFace.x * 0.8 + 0.4)) * RIMK * (0.4 + 0.6 * vAO);
#else
  float fr = pow(1.0 - sat(dot(n, v)), 2.5);
  // two rim lights from either side (the teal/orange split)
  col += (uRimA * fr * sat(n.x * 0.8 + 0.4) + uRimB * fr * sat(-n.x * 0.8 + 0.4)) * RIMK;
#endif
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
  /** v2 rig only: a full rig pose (overrides flap/wag/arms; blink/mouth come from it). */
  rig?: RigPose;
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
  /** Rows in the (possibly extended) sprite: px() puts the last row's pixel centres at y = 0.5. */
  private nRows = 32;
  /** v2 rig: the sculpt spec, the squash/root-motion group, and per-mesh voxel colour sources. */
  sculpt: SculptSpec | null = null;
  rigRoot: THREE.Group | null = null;
  private sMeshes: { mesh: THREE.InstancedMesh; vox: { c: number; r: number; key: (g: string[][]) => string }[] }[] = [];
  /** Last applied rig pose (v2), for helpers such as the contact shadow. */
  lastRig: RigPose | null = null;
  /** v2: this frame's movement layers and their context (set by Stage.place, extended by act()). */
  layers: Layer[] = [];
  cx: MoveCtx | null = null;
  /** v2: evaluate the layers at t and apply the pose. */
  applyRig(t: number) {
    if (this.sculpt && this.cx) this.pose({ rig: rigPose(this.layers, t, this.cx) });
    return this;
  }
  /** v2: add a move (see moves.ts) started at song time t0 and re-apply the pose at t. No-op on v1. */
  act(name: string, t0: number, t: number, o: MoveOpts = {}) {
    if (!this.sculpt) return this;
    this.layers.push({ name, t0, o });
    return this.applyRig(t);
  }

  constructor(public def: SpriteDef, o: { depth?: number; emissive?: number; sculpt?: SculptSpec | null } = {}) {
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
    if (o.sculpt) {
      this.buildSculpt(o.sculpt);
      return;
    }
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
  px(c: number, r: number): [number, number] { return [c - 15.5, this.nRows - 0.5 - r]; }

  // ---------------------------------------------------------------- v2: sculpted, jointed model
  private buildSculpt(S: SculptSpec) {
    this.sculpt = S;
    const u = this.mat.uniforms;
    this.mat.defines = { SCULPT: '' };
    u.uMouth = { value: 0 }; u.uAOk = { value: 1 }; u.uRimK = { value: 0.9 }; u.uBevel = { value: 0.6 };
    u.uEdge!.value = 0.18;
    const M = sculptModel(this.def, S);
    this.nRows = M.rows;
    const root = new THREE.Group();
    this.rigRoot = root;
    this.group.add(root);
    const pivots = {} as Record<Joint, THREE.Group>;
    for (const j of Object.keys(S.joints) as Joint[]) pivots[j] = new THREE.Group();
    for (const j of Object.keys(S.joints) as Joint[]) {
      const J = S.joints[j], [x, y] = this.px(...J.at);
      const par = J.parent ? S.joints[J.parent] : null, [px0, py0] = par ? this.px(...par.at) : [0, 0];
      pivots[j].position.set(x - px0, y - py0, 0);
      (J.parent ? pivots[J.parent] : root).add(pivots[j]);
      (this.parts as Record<string, THREE.Group>)[j] = pivots[j];
    }
    this.parts.body = pivots.torso;
    const box = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.Matrix4();
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const mouthCells = new Set(this.def.mouth.map(([c, r]) => c + r * 64));
    for (const j of Object.keys(S.joints) as Joint[]) {
      const vs = M.vox.filter((v) => v.part === j);
      if (!vs.length) continue;
      const [jx, jy] = this.px(...S.joints[j].at);
      const mesh = new THREE.InstancedMesh(box, this.mat, vs.length);
      mesh.frustumCulled = false;
      const n = vs.length;
      const col = new Float32Array(n * 3), emis = new Float32Array(n), rand = new Float32Array(n * 4), occ = new Uint32Array(n), mouth = new Float32Array(n);
      vs.forEach((v, i) => {
        const [x, y] = this.px(v.c, v.r);
        m.makeTranslation(x - jx, y - jy, v.k);
        mesh.setMatrixAt(i, m);
        rand.set([rnd(), rnd(), rnd(), rnd()], i * 4);
        occ[i] = v.occ;
        mouth[i] = v.front && v.k === v.zf && mouthCells.has(v.c + v.r * 64) ? 1 : 0;
      });
      const g = mesh.geometry.clone();
      g.setAttribute('aColor', new THREE.InstancedBufferAttribute(col, 3));
      g.setAttribute('aEmis', new THREE.InstancedBufferAttribute(emis, 1));
      g.setAttribute('aRand', new THREE.InstancedBufferAttribute(rand, 4));
      g.setAttribute('aOcc', new THREE.InstancedBufferAttribute(occ, 1));
      g.setAttribute('aMouth', new THREE.InstancedBufferAttribute(mouth, 1));
      mesh.geometry = g;
      pivots[j].add(mesh);
      this.sMeshes.push({ mesh, vox: vs.map((v) => ({ c: v.c, r: v.r, key: v.key })) });
    }
    this.lastPoseKey = '';
    this.pose({});
  }

  private poseSculpt(p: Pose) {
    const key = `${(p.rig ? p.rig.blink > 0.5 : p.blink) ? 1 : 0}${(p.rig ? p.rig.mouth > 0.2 : p.mouth) ? 1 : 0}`;
    if (key !== this.lastPoseKey) {
      this.lastPoseKey = key;
      const g = poseGrid(this.def, { blink: key[0] === '1', mouth: key[1] === '1' });
      if (this.nRows > 32) for (const row of this.sculpt!.extraRows ?? []) g.push(row.split(''));
      for (const { mesh, vox } of this.sMeshes) {
        const col = mesh.geometry.getAttribute('aColor') as THREE.InstancedBufferAttribute;
        const em = mesh.geometry.getAttribute('aEmis') as THREE.InstancedBufferAttribute;
        vox.forEach((v, i) => {
          const k = v.key(g);
          const lin = this.linPal[k === '.' ? 'a' : k] ?? [1, 0, 1];
          col.setXYZ(i, lin[0], lin[1], lin[2]);
          em.setX(i, this.def.emissive[k] ?? 0);
        });
        col.needsUpdate = true;
        em.needsUpdate = true;
      }
    }
    const R = p.rig, P = this.parts as Record<string, THREE.Group>;
    if (R) {
      this.lastRig = R;
      const root = this.rigRoot!;
      root.position.set(R.x, R.y, R.z);
      root.rotation.set(R.pitch, R.yaw, R.roll, 'YXZ');
      const sq = Math.max(0.3, R.sq);
      root.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      for (const j of Object.keys(R.j) as Joint[]) P[j]?.rotation.set(R.j[j][0], R.j[j][1], R.j[j][2]);
      this.mat.uniforms.uMouth!.value = R.mouth;
    } else {
      this.lastRig = null;
      this.rigRoot!.position.set(0, 0, 0); this.rigRoot!.rotation.set(0, 0, 0); this.rigRoot!.scale.set(1, 1, 1);
      for (const j of Object.keys(this.sculpt!.joints)) P[j]?.rotation.set(0, 0, 0);
      P.wingL?.rotation.set(0, p.flap ?? 0, (p.flap ?? 0) * 0.5);
      P.wingR?.rotation.set(0, -(p.flap ?? 0), -(p.flap ?? 0) * 0.5);
      P.tail?.rotation.set(0, (p.wag ?? 0) * 0.6, p.wag ?? 0);
      P.armL?.rotation.set(p.arms?.[0] ?? 0, 0, 0);
      P.armR?.rotation.set(p.arms?.[1] ?? 0, 0, 0);
      this.mat.uniforms.uMouth!.value = p.mouth ? 1 : 0;
    }
    return this;
  }

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
    if (this.sculpt) return this.poseSculpt(p);
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

/** The character for a sprite under the current rig (src/config.ts): sculpted on v2, extruded on v1. */
export function makeChar(def: SpriteDef, o: { depth?: number; emissive?: number } = {}) {
  return new VoxelChar(def, { ...o, sculpt: V2 ? sculptFor(def, LEGS) : null });
}

/** A soft contact shadow on the ground under a v2 character (fades and widens as it leaves the ground). */
export class ContactShadow {
  mesh: THREE.Mesh;
  private v = new THREE.Vector3();
  constructor() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uA: { value: 0.6 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform float uA; void main(){ float d = length(vUv - 0.5) * 2.0; float a = uA * (0.55 * (1.0 - smoothstep(0.0, 1.0, d)) + 0.45 * (1.0 - smoothstep(0.0, 0.5, d))); gl_FragColor = vec4(0.0, 0.0, 0.0, a); }',
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.visible = false;
    this.mesh.renderOrder = 1;
  }
  /** Place under `ch` on the plane y = ground. */
  update(ch: VoxelChar, ground: number, strength = 1) {
    if (!ch.group.visible || !ch.rigRoot) { this.mesh.visible = false; return; }
    ch.group.updateMatrixWorld(true);
    ch.rigRoot.getWorldPosition(this.v);
    const s = ch.group.scale.x, h = Math.max(0, this.v.y - ground);
    const fade = Math.max(0, 1 - h / (34 * s));
    this.mesh.visible = fade > 0.01;
    this.mesh.position.set(this.v.x, ground + 0.05 * s, this.v.z);
    const R = 30 * s * (1 + h / (40 * s));
    this.mesh.scale.set(R, R * 0.8, 1);
    (this.mesh.material as THREE.ShaderMaterial).uniforms.uA!.value = 0.65 * fade * strength;
  }
}

// ---------------------------------------------------------------- v2 sculpt model (cached per sprite + spec)
interface SVox { part: Joint; c: number; r: number; k: number; zf: number; front: boolean; occ: number; key: (g: string[][]) => string }
const sculptCache = new Map<string, { rows: number; vox: SVox[] }>();

/**
 * Voxelise a sprite with a sculpt spec: each pixel becomes a column of unit voxels from zb to zf, where
 * the half thickness follows a quarter-circle profile of the pixel's distance to its part's outline, plus
 * the spec's domes. Only shell voxels (an empty 6-neighbour within the same part) are kept. Front-half
 * voxels show the sprite pixel; back-half voxels show the spec's back palette (face details become fur;
 * interior outline pixels take the part's main colour).
 */
function sculptModel(def: SpriteDef, S: SculptSpec) {
  const ck = def.name + '|' + (S.extraRows?.join('') ?? '');
  const hit = sculptCache.get(ck);
  if (hit) return hit;
  const rows = [...def.rows, ...(S.extraRows ?? [])], NR = rows.length;
  const filled = (c: number, r: number) => r >= 0 && r < NR && c >= 0 && c < 32 && rows[r]![c] !== '.';
  const part: (Joint | null)[][] = rows.map((_, r) => Array.from({ length: 32 }, (_, c) => (filled(c, r) ? S.part(c, r) : null)));
  // euclidean distance (px) to the part's outline, and chessboard distance to the sprite's silhouette
  const dPart: number[][] = [], dSil: number[][] = [];
  for (let r = 0; r < NR; r++) {
    dPart.push([]); dSil.push([]);
    for (let c = 0; c < 32; c++) {
      if (!part[r]![c]) { dPart[r]!.push(0); dSil[r]!.push(0); continue; }
      let best = 99, bs = 99;
      for (let rr = -1; rr <= NR; rr++)
        for (let cc = -1; cc <= 32; cc++) {
          const pq = rr >= 0 && rr < NR && cc >= 0 && cc < 32 ? part[rr]![cc] : null;
          if (pq === part[r]![c]) continue;
          best = Math.min(best, Math.hypot(cc - c, rr - r));
          if (!pq) bs = Math.min(bs, Math.max(Math.abs(cc - c), Math.abs(rr - r)));
        }
      dPart[r]!.push(best); dSil[r]!.push(bs);
    }
  }
  // columns
  const ZO = 24, ZN = 48; // z index offset / range
  const occ = new Int8Array(32 * NR * ZN); // 0 empty, else part index + 1
  const partIdx = Object.keys(S.joints) as Joint[];
  const at = (c: number, r: number, k: number) => (c < 0 || c >= 32 || r < 0 || r >= NR || k + ZO < 0 || k + ZO >= ZN ? 0 : occ[(r * 32 + c) * ZN + k + ZO]!);
  const cols: { c: number; r: number; zb: number; zf: number; p: Joint }[] = [];
  for (let r = 0; r < NR; r++)
    for (let c = 0; c < 32; c++) {
      const p = part[r]![c];
      if (!p) continue;
      const D = S.depth[p];
      const u = Math.min(1, Math.max(0, dPart[r]![c]! - 0.5) / D.span);
      const h = D.edge + (D.R - D.edge) * Math.sqrt(1 - (1 - u) * (1 - u));
      let bump = 0;
      for (const b of S.bulges) {
        if (b.part !== p) continue;
        const q = ((c - b.c) / b.rx) ** 2 + ((r - b.r) / b.ry) ** 2;
        if (q < 1) bump += b.h * (1 - q);
      }
      const zf = Math.round(D.zc + h + bump), zb = Math.min(zf, Math.round(D.zc - h * (D.back ?? 1)));
      cols.push({ c, r, zb, zf, p });
      for (let k = zb; k <= zf; k++) occ[(r * 32 + c) * ZN + k + ZO] = partIdx.indexOf(p) + 1;
    }
  // outline pixels on the silhouette keep their dark key only on the front and back faces; the wall between
  // takes the nearest non-outline colour of the same part (so the sides read as body, not as a black slab)
  const fill: (string | null)[][] = rows.map((row, r) => Array.from({ length: 32 }, (_, c) => {
    if (row[c] !== 'a' || dSil[r]![c]! > 1) return null;
    let best: string | null = null, bd = 99;
    for (let rr = Math.max(0, r - 4); rr <= Math.min(NR - 1, r + 4); rr++)
      for (let cc = Math.max(0, c - 4); cc <= Math.min(31, c + 4); cc++) {
        const k = rows[rr]![cc]!, d = Math.hypot(cc - c, rr - r);
        if (k !== '.' && k !== 'a' && part[rr]![cc] === part[r]![c] && d < bd) { bd = d; best = k; }
      }
    return best;
  }));
  const vox: SVox[] = [];
  for (const { c, r, zb, zf, p } of cols) {
    const pi = partIdx.indexOf(p) + 1, D = S.depth[p], bm = S.back[p] ?? {};
    for (let k = zb; k <= zf; k++) {
      const same = (dc: number, dr: number, dk: number) => at(c + dc, r + dr, k + dk) === pi;
      if (same(1, 0, 0) && same(-1, 0, 0) && same(0, 1, 0) && same(0, -1, 0) && same(0, 0, 1) && same(0, 0, -1)) continue;
      let o = 0;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++)
        if (at(c + dx, r - dy, k + dz)) o |= 1 << ((dx + 1) * 9 + (dy + 1) * 3 + (dz + 1));
      const front = k >= D.zc - 0.25;
      const interior = dSil[r]![c]! > 1;
      const wall = fill[r]![c] && k < zf && k > zb ? fill[r]![c]! : null;
      const key = front
        ? (g: string[][]) => wall ?? g[r]![c]!
        : (g: string[][]) => { const k0 = wall ?? g[r]![c]!; return k0 === 'a' ? (interior ? bm.a ?? 'a' : 'a') : bm[k0] ?? k0; };
      vox.push({ part: p, c, r, k, zf, front, occ: o, key });
    }
  }
  const res = { rows: NR, vox };
  sculptCache.set(ck, res);
  return res;
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
