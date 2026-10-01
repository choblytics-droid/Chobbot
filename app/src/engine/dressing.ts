// v2 set dressing: rain splashes on wet ground and rooftop props (parapets, AC units, vents, water tanks,
// pipes, an antenna with a blinking warning light, a flickering neon sign). Deterministic in t and seed.
import { Boxes } from './voxel';
import type { LineBatch } from './lines';
import { hash } from './util';

/**
 * Rain hitting the ground: each splash lives ~0.3-0.55 s at a fresh random spot per cycle, a ripple ring
 * spreading and fading on the surface (the "puddle" rings) plus a small crown of three droplets.
 */
export function drawSplashes(lb: LineBatch, t: number, o: { center: [number, number, number]; size: [number, number]; n?: number; col?: [number, number, number]; alpha?: number; scale?: number; avoid?: [number, number, number] }) {
  const n = o.n ?? 220, [cx, gy, cz] = o.center, [sx, sz] = o.size, c = o.col ?? [0.45, 0.55, 0.75], A = o.alpha ?? 0.55, S = o.scale ?? 1;
  for (let i = 0; i < n; i++) {
    const P = 0.3 + 0.25 * hash(i, 11), tt = t + hash(i, 12) * P, cyc = Math.floor(tt / P), u = tt / P - cyc;
    const x = cx + (hash(i, cyc, 13) - 0.5) * sx, z = cz + (hash(i, cyc, 14) - 0.5) * sz;
    if (o.avoid && Math.hypot(x - o.avoid[0], z - o.avoid[1]) < o.avoid[2]) continue;
    const y = gy + 0.08, r = (0.4 + 2.6 * u) * S, a = A * (1 - u) * (0.5 + 0.5 * hash(i, cyc, 15));
    for (let k = 0; k < 8; k++) {
      const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2;
      lb.seg(x + Math.cos(a0) * r, y, z + Math.sin(a0) * r * 0.9, x + Math.cos(a1) * r, y, z + Math.sin(a1) * r * 0.9, 0.12 * S, c[0], c[1], c[2], a);
    }
    if (u < 0.45) {
      const v = u / 0.45;
      for (let k = 0; k < 3; k++) {
        const ang = k * 2.1 + hash(i, cyc, 16) * 6, d = 1.4 * v * S, h = 2.2 * v * (1 - v) * 4 * S * 0.5;
        const px = x + Math.cos(ang) * d, pz = z + Math.sin(ang) * d;
        lb.seg(px, y + h, pz, px - Math.cos(ang) * 0.35 * S, y + h - 0.5 * S, pz - Math.sin(ang) * 0.35 * S, 0.14 * S, c[0] * 1.3, c[1] * 1.3, c[2] * 1.3, A * (1 - v));
      }
    }
  }
}

type C3 = [number, number, number];
const STEEL: C3 = [0.045, 0.05, 0.058], DARK: C3 = [0.02, 0.02, 0.026], RUST: C3 = [0.085, 0.035, 0.016], CONCRETE: C3 = [0.035, 0.032, 0.034];

/** Props for a w x d roof at height y centred on (x0, z0); keep-out circles [x, z, r] stay clear for the action. */
export class RoofProps {
  boxes = new Boxes(420);
  private blink = -1;
  private neon: number[] = [];
  private neonCol: C3 = [0, 0, 0];
  constructor(w: number, d: number, y = 0, o: { seed?: number; x0?: number; z0?: number; keep?: [number, number, number][]; neon?: C3; antenna?: boolean; tank?: boolean } = {}) {
    const B = this.boxes, s = o.seed ?? 1, X = o.x0 ?? 0, Z = o.z0 ?? 0, keep = o.keep ?? [];
    const free = (x: number, z: number, r: number) => keep.every(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) > kr + r);
    // parapet (with gaps) and a pipe run along it
    const hw = w / 2, hd = d / 2;
    for (const [ax, az, bx, bz] of [[-hw, -hd, hw, -hd], [hw, -hd, hw, hd], [hw, hd, -hw, hd], [-hw, hd, -hw, -hd]] as const) {
      const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 14);
      for (let k = 0; k < n; k++) {
        if (hash(s, ax, bz, k) < 0.12) continue;
        const f = (k + 0.5) / n, x = X + ax + (bx - ax) * f, z = Z + az + (bz - az) * f;
        const horiz = Math.abs(bz - az) < 1e-6;
        B.add(x, y + 1.6, z, horiz ? L / n - 0.6 : 1.2, 3.2, horiz ? 1.2 : L / n - 0.6, CONCRETE);
      }
      const inset = 3, horiz = Math.abs(bz - az) < 1e-6;
      if (hash(s, ax, az, 7) < 0.6) B.add(X + (ax + bx) / 2 + (horiz ? 0 : -Math.sign(ax) * inset), y + 0.9, Z + (az + bz) / 2 + (horiz ? -Math.sign(az) * inset : 0), horiz ? L * 0.8 : 1.4, 1.4, horiz ? 1.4 : L * 0.8, STEEL, 0.05);
    }
    // AC units and vents scattered in the outer band
    let placed = 0;
    for (let k = 0; k < 60 && placed < 10; k++) {
      const x = X + (hash(s, k, 1) - 0.5) * (w - 16), z = Z + (hash(s, k, 2) - 0.5) * (d - 16);
      if (Math.max(Math.abs(x - X) / hw, Math.abs(z - Z) / hd) < 0.55 || !free(x, z, 9)) continue;
      if (hash(s, k, 3) < 0.6) {
        const sw = 9 + hash(s, k, 4) * 4;
        B.add(x, y + 3.6, z, sw, 7, 8, STEEL);
        B.add(x, y + 7.3, z, sw * 0.7, 0.4, 5, DARK, 0.12); // fan grille
        B.add(x - sw * 0.3, y + 0.4, z, 1, 0.8, 8.4, DARK); B.add(x + sw * 0.3, y + 0.4, z, 1, 0.8, 8.4, DARK);
      } else {
        B.add(x, y + 4, z, 2.6, 8, 2.6, STEEL); B.add(x, y + 8.4, z, 4, 0.8, 4, DARK);
      }
      placed++;
    }
    // water tank on legs
    if (o.tank !== false) for (let k = 0; k < 30; k++) {
      const x = X + (hash(s, k, 21) < 0.5 ? -1 : 1) * (hw - 12), z = Z + (hash(s, k, 22) - 0.5) * (d - 24);
      if (!free(x, z, 12)) continue;
      for (const [lx, lz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) B.add(x + lx, y + 5, z + lz, 1, 10, 1, DARK);
      B.add(x, y + 17, z, 12, 14, 12, RUST);
      B.add(x, y + 24.6, z, 9, 1.2, 9, RUST); B.add(x, y + 25.6, z, 4, 1, 4, DARK);
      for (let b = 0; b < 3; b++) B.add(x, y + 12 + b * 5, z, 12.4, 0.5, 12.4, DARK);
      break;
    }
    // antenna with a blinking light
    if (o.antenna !== false) for (let k = 0; k < 30; k++) {
      const x = X + (hash(s, k, 31) - 0.5) * (w - 10), z = Z + (hash(s, k, 32) < 0.5 ? -1 : 1) * (hd - 6);
      if (!free(x, z, 6)) continue;
      B.add(x, y + 22, z, 0.9, 44, 0.9, STEEL);
      for (let b = 0; b < 4; b++) B.add(x, y + 12 + b * 8, z, 7 - b * 1.4, 0.5, 0.5, STEEL);
      this.blink = B.add(x, y + 44.6, z, 1.6, 1.6, 1.6, [2.5, 0.08, 0.05], 2);
      break;
    }
    // neon sign on a frame at the far edge
    if (o.neon) {
      this.neonCol = o.neon;
      for (let k = 0; k < 30; k++) {
        const x = X + (hash(s, k, 41) - 0.5) * (w - 40), z = Z - hd + 2;
        if (!free(x, z, 14)) continue;
        B.add(x - 9, y + 8, z, 0.8, 16, 0.8, DARK); B.add(x + 9, y + 8, z, 0.8, 16, 0.8, DARK);
        B.add(x, y + 13, z, 22, 7, 0.6, DARK);
        for (let b = 0; b < 5; b++) this.neon.push(B.add(x - 8 + b * 4, y + 13, z + 0.5, 2.6, 4.6, 0.4, o.neon, 1.5));
        break;
      }
    }
  }
  /** Blink the warning light (1 s period) and flicker the neon (deterministic). */
  update(t: number) {
    const B = this.boxes;
    if (this.blink >= 0) {
      const on = (t % 1.2) < 0.25 ? 1 : 0.02;
      const m = B.mesh, i = this.blink;
      (m.geometry.getAttribute('aEmis') as any).setX(i, 3 * on);
      (m.geometry.getAttribute('aColor') as any).setXYZ(i, 2.5 * on + 0.05, 0.08 * on, 0.05 * on);
      m.geometry.getAttribute('aEmis').needsUpdate = true; m.geometry.getAttribute('aColor').needsUpdate = true;
    }
    if (this.neon.length) {
      const fl = hash(Math.floor(t * 12), 77) < 0.08 ? 0.15 : 1, c = this.neonCol, em = B.mesh.geometry.getAttribute('aEmis') as any;
      this.neon.forEach((i, k) => em.setX(i, (k === 2 && hash(Math.floor(t * 7), 78) < 0.25 ? 0.1 : fl) * 1.8));
      em.needsUpdate = true;
      void c;
    }
    return this;
  }
}
