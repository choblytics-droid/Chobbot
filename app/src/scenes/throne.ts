// Verse A2, lines 7-8 — "He told you everything? That's my favorite part. / I'm the king of the shadows in
// his broken heart." The energy drops: a dark void, a spotlight, a giant voxel heart with Venmar sitting
// on top like a throne. "king": a gold crown drops onto her head; "shadows": hooded figures rise and kneel
// in a ring; "broken heart": the heart cracks and its halves swing apart.
import * as THREE from 'three';
import type { Frame, PostOverrides } from '../engine/scene';
import { Stage } from './_stage';
import { Boxes, VoxelChar } from '../engine/voxel';
import { SHADOW, type SpriteDef } from '../sprites/sprites';
import { karaokeLine } from '../engine/kinetic';
import { rgba } from '../engine/palette';
import { F } from '../engine/type';
import { drawEmbers } from '../engine/world';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

/** A 32x32 heart with a zigzag crack; the halves are the 'wingL'/'wingR' parts so they can swing apart. */
function heartSprite(): SpriteDef {
  const crack = (r: number) => 15 + (r % 6 < 3 ? (r % 3) : 3 - (r % 3)) - 1;
  const rows: string[] = [];
  for (let r = 0; r < 32; r++) {
    let row = '';
    for (let c = 0; c < 32; c++) {
      const x = (c - 15.5) / 13.5, y = -(r - 13) / 13.5;
      const v = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y;
      const inside = v <= 0;
      const x1 = (c - 15.5 + 1) / 13.5, y1 = -(r - 13 - 1) / 13.5;
      const edge = !(Math.pow(x1 * x1 + y * y - 1, 3) - x1 * x1 * y * y * y <= 0) || !(Math.pow(x * x + y1 * y1 - 1, 3) - x * x * y1 * y1 * y1 <= 0)
        || !(Math.pow(((c - 16.5) / 13.5) ** 2 + y * y - 1, 3) - ((c - 16.5) / 13.5) ** 2 * y * y * y <= 0) || !(Math.pow(x * x + (-(r - 12) / 13.5) ** 2 - 1, 3) - x * x * (-(r - 12) / 13.5) ** 3 <= 0);
      if (!inside) { row += '.'; continue; }
      if (c === crack(r) && r > 2) { row += 'e'; continue; }
      if (edge) { row += 'a'; continue; }
      const hl = (c - 9) ** 2 + (r - 7) ** 2 < 8;
      row += hl ? 'c' : r > 20 || c > 24 ? 'd' : 'b';
    }
    rows.push(row);
  }
  return {
    name: 'HEART', accent: 'blood', rows,
    pal: { a: '#2a0410', b: '#d8173a', c: '#ff8a98', d: '#8e0e25', e: '#ff4d2a' },
    emissive: { e: 4, c: 0.2 },
    part: (c, r) => (c <= crack(r) ? 'wingL' : 'wingR'),
    hinge: { wingL: [15, 31], wingR: [16, 31] },
    blink: [], mouth: [],
  };
}

export default class Throne extends Stage {
  heart = new VoxelChar(heartSprite(), { depth: 1.3 });
  props = new Boxes(64);
  subjects: VoxelChar[] = [];
  cone: THREE.Mesh;
  L6!: Line; L7!: Line;
  tKing = 0; tShadows = 0; tBroken = 0;

  constructor(ctx: any) {
    super(ctx);
    const g = new THREE.CylinderGeometry(18, 120, 600, 48, 1, true);
    g.translate(0, -300, 0);
    this.cone = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uI: { value: 1 } },
      vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = -position.y / 600.0; vec4 w = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uI; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(normalize(vN), vV)), 1.5); float a = f * (1.0 - vY) * 0.35 * uI; gl_FragColor = vec4(vec3(1.0, 0.85, 0.7) * a, 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
  }

  build() {
    this.useSky = false;
    this.clearCol = [0.002, 0.002, 0.006];
    const ly = this.ctx.lyrics;
    this.L6 = ly.get('favorite part'); this.L7 = ly.get('king of the shadows');
    const w = (q: RegExp) => this.L7.words.find((x) => q.test(x.w))!.start;
    this.tKing = w(/king/i); this.tShadows = w(/shadows/i); this.tBroken = w(/broken/i);
    this.heart.group.scale.setScalar(3.2);
    this.cone.position.set(0, 560, 0);
    this.world.add(this.heart.group, this.props.mesh, this.cone);
    for (let i = 0; i < 8; i++) { const s = new VoxelChar(SHADOW); this.subjects.push(s); this.world.add(s.group); }
    // floor: a dark disc of plates
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      this.props.add(Math.cos(a) * 150, -2, Math.sin(a) * 150, 60, 4, 20, [0.015, 0.012, 0.02], 0, [0, -a, 0]);
    }
    this.props.add(0, -3, 0, 240, 2, 240, [0.008, 0.008, 0.012], 0);
    this.heart.look({ rimA: [0.3, 0.6, 1.2], rimB: [2.0, 0.4, 0.2], keyDir: [0.0, 1.0, 0.3], keyCol: [1.1, 1.0, 0.9], ambTop: [0.08, 0.06, 0.1], ambBot: [0.02, 0.0, 0.01] });
    this.venmar.look({ keyDir: [0.0, 1.0, 0.3], keyCol: [1.2, 1.1, 1.0], ambTop: [0.1, 0.1, 0.18] });
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), bl = this.bell(t);
    // heart: slow beat (scale pulse on kicks), cracks glow, halves swing apart on "broken"
    const br = prog(t, this.tBroken - 0.05, this.tBroken + 0.6, ease.outBack);
    this.heart.group.visible = true;
    this.heart.group.position.set(0, 0, 0);
    this.heart.group.rotation.set(0, Math.sin(t * 0.4) * 0.1, 0);
    this.heart.group.scale.setScalar(3.2 * (1 + 0.025 * k));
    this.heart.parts.wingL!.rotation.set(0, 0, br * 0.35);
    this.heart.parts.wingR!.rotation.set(0, 0, -br * 0.35);
    this.heart.parts.wingL!.position.x = -0.5 - br * 3;
    this.heart.parts.wingR!.position.x = 0.5 + br * 3;
    this.heart.fx({ t, glow: 1 + br * 2 + bl, flash: pulse(t, this.tBroken, 0.08) * 0.4 });

    // Venmar sits on top of the heart (the heart's top is ~ 31*3.2 = 99 units); she drops with the split
    const topY = 31.5 * 3.2 - 12 - br * 30;
    this.place(this.venmar, f, [0, topY, 6], { yaw: 0.25 + Math.sin(t * 0.5) * 0.1, scale: 1.1, energy: 0.6 });

    // crown: gold voxels dropping onto her head on "king"
    const cp = prog(t, this.tKing - 0.1, this.tKing + 0.25, ease.outBack);
    const cy = topY + 33 * 1.1 + (1 - cp) * 90;
    const gold: [number, number, number] = [1.6, 0.9, 0.12];
    const base = 25;
    this.props.set(base, 0, cy, 6, 16, 3, 6, gold, 0.8);
    for (let i = 0; i < 5; i++) this.props.set(base + 1 + i, -6.5 + i * 3.25, cy + 3 + (i % 2 === 0 ? 2 : 0), 6, 2.2, i % 2 === 0 ? 5 : 3, 2.2, gold, 0.8);
    this.props.set(base + 6, 0, cy + 1, 9.2, 2, 2, 1, [2.5, 0.2, 0.4], 2);
    if (cp <= 0) for (let i = 0; i < 7; i++) this.props.hide(base + i);

    // shadows: rise out of the floor and kneel in a ring
    this.subjects.forEach((s, i) => {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const rp = prog(t, this.tShadows - 0.1 + i * 0.04, this.tShadows + 0.4 + i * 0.04, ease.outCubic);
      s.group.visible = rp > 0;
      s.group.position.set(Math.sin(a) * 120, -34 + rp * 34, Math.cos(a) * 120);
      s.group.rotation.set(0.25 * rp, a + Math.PI, 0);
      s.group.scale.setScalar(1.0);
      s.fx({ t, glow: 2.5 });
    });

    // camera: slow low orbit (line 6), then a push up toward her on "king", pull back on "broken"
    const yaw = lerp(-0.7, 0.5, prog(t, f.start, f.end));
    if (t < this.tKing - 0.1) {
      this.orbit([0, 60, 0], yaw, 0.02, lerp(300, 240, prog(t, f.start, this.tKing)), { t, hand: 3, fov: 38 });
    } else if (t < this.tBroken - 0.05) {
      this.orbit([0, topY + 30, 0], yaw, 0.1, lerp(140, 110, prog(t, this.tKing, this.tBroken)), { t, hand: 2, fov: 36 });
    } else {
      this.orbit([0, 55, 0], yaw + 0.3, 0.18, lerp(250, 330, prog(t, this.tBroken, f.end, ease.outCubic)), { t, hand: 2, fov: 40, shake: pulse(t, this.tBroken, 0.2) * 4 });
    }
    // (the camera flies inside the cone for the crown close-up: dim it there or it floods the frame)
    const inside = t >= this.tKing - 0.1 && t < this.tBroken - 0.05;
    (this.cone.material as THREE.ShaderMaterial).uniforms.uI!.value = inside ? 0 : 0.7 + 0.25 * bl;

    // dust/embers in the spotlight, red sparks from the crack on "broken"
    drawEmbers(this.fx, t, { center: [0, 120, 0], size: [140, 240, 140], n: 140, speed: 6, col: [0.9, 0.8, 0.7], width: 0.35, alpha: 0.5 });
    if (br > 0) drawEmbers(this.fx, t, { center: [0, 50, 0], size: [20, 100, 10], n: 120, speed: 50, col: [3.5, 0.4, 0.3], width: 0.7, seed: 3 });

    // typography: elegant serif italic, the prophetic register, centred low
    const line = t < this.L7.start - 0.1 ? this.L6 : this.L7;
    karaokeLine(this.c, line, t, { x: 960, y: 1080 - 138 - 60, size: 76, family: F.serif(600, true), align: 'center', sung: rgba('bone', 1), unsung: rgba('bone', 0.22), maxW: 1600, pop: 8 });

    return {
      ...this.tag(t),
      letterbox: 1,
      bloom: 0.8,
      bloomThreshold: 0.7,
      vignette: 0.7,
      ca: 1.5,
      grain: 0.07,
      flash: pulse(t, this.tKing, 0.1) * 0.25,
      flashColor: [1.0, 0.75, 0.2],
      shake: [(hash(frameIdx(t), 1) - 0.5) * pulse(t, this.tBroken, 0.15) * 30, (hash(frameIdx(t), 2) - 0.5) * pulse(t, this.tBroken, 0.15) * 30],
      zoom: 1 + k * 0.01,
      gain: [0.95, 0.98, 1.08],
      contrast: 1.12,
      saturation: 1.05,
      glitch: pulse(t, this.tBroken, 0.1) * 0.4,
    };
  }
}
