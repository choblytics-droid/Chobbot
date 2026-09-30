// Verse A3, lines 29-30 — "I'm proud of the monster he made me to be. / In the prison of his mind, I'm the only
// thing that's free." Street-level worm's-eye view: Venmar, skyscraper-sized, among the towers in a
// lightning storm; roars (mouth open, flash) on "monster". Line 30: prison bars slam down around her,
// and on "free" they burst outward and she takes off into the rift, wings beating.
import type { Frame, PostOverrides } from '../engine/scene';
import { Stage } from './_stage';
import { City, Surface, drawRain, drawEmbers } from '../engine/world';
import { Boxes } from '../engine/voxel';
import { slamWord } from '../engine/kinetic';
import { rgba } from '../engine/palette';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

const NB = 20, RB = 120, S = 9; // bars, ring radius, her scale

export default class Kaiju extends Stage {
  city = new City({ seed: 55, count: 320, clear: 540, minH: 60, maxH: 260, groundY: 0 });
  street = new Surface(6000, { y: 0 });
  bars = new Boxes(NB + 4);
  L28!: Line; L29!: Line;
  tMonster = 0; tFree = 0; tPrison = 0;
  bolts: number[] = [];

  build() {
    const ly = this.ctx.lyrics;
    this.L28 = ly.get('proud of the monster'); this.L29 = ly.get('prison of his mind');
    this.tMonster = this.L28.words.find((w) => /monster/i.test(w.w))!.start;
    this.tPrison = this.L29.words.find((w) => /prison/i.test(w.w))!.start;
    this.tFree = this.L29.words.filter((w) => /free/i.test(w.w)).pop()!.start;
    this.world.add(this.city.group, this.street.mesh, this.bars.mesh);
    this.bolts = this.ctx.audio.events('bell', this.ctx.start, this.ctx.end).filter(([, s]) => s > 0.7).map(([t]) => t);
    this.bars.owner.look({ rimA: [0.2, 0.6, 0.9], rimB: [0.9, 0.3, 0.1] });
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), sn = this.snare(t), bl = this.bell(t);
    const bolt = this.bolts.reduce((m, b) => Math.max(m, pulse(t, b, 0.06)), 0) + pulse(t, this.tMonster, 0.12);
    this.sky.set({ t, rift: 1.2 + bl * 0.5, pulse: k, storm: bolt * 0.9, clouds: 1, stars: 0.3, top: [0.004, 0.004, 0.02], horizon: [0.03, 0.015, 0.05], glow: [0.1, 0.04, 0.06] });
    this.city.set({ t, pulse: k + bolt, win: 0.5, fogNear: 250, fogFar: 1500 });
    this.street.set({ t, pulse: k + bolt, wet: 1 });

    // her: giant, stomping on the kicks; takes off on "free"
    const fly = prog(t, this.tFree, f.end + 0.4, ease.inCubic);
    const roar = t >= this.tMonster - 0.05 && t < this.tMonster + 0.9;
    this.place(this.venmar, f, [0, fly * 900, -40], { yaw: 0.2 + Math.sin(t * 0.5) * 0.15, scale: S, energy: 1.2 + fly * 2 });
    this.venmar.pose({ mouth: roar || this.singing(t).who === 'A' && this.ctx.audio.env('vocal', t) > 0.35, blink: false, flap: Math.sin(t * (fly > 0 ? 22 : 4)) * (0.5 + fly), wag: Math.sin(t * 3) * 0.4 });
    this.venmar.fx({ t, glow: 1.5 + bl, flash: bolt * 0.25 });

    // prison bars: slam down on "prison", burst outward on "free"
    const down = prog(t, this.tPrison - 0.1, this.tPrison + 0.12, ease.inQuad);
    const burst = prog(t, this.tFree - 0.05, this.tFree + 0.8, ease.outCubic);
    for (let i = 0; i < NB; i++) {
      const a = (i / NB) * Math.PI * 2;
      const r = RB + burst * 400 * (0.6 + hash(i) * 0.8);
      const y = 170 + (1 - down) * 500 + burst * (200 * hash(i, 2) - 60);
      if (down <= 0) { this.bars.hide(i); continue; }
      this.bars.set(i, Math.sin(a) * r, y, -40 + Math.cos(a) * r, 8, 340, 8, [0.05, 0.05, 0.06], 0, [burst * (hash(i, 3) - 0.5) * 3, a, burst * (hash(i, 4) - 0.5) * 3]);
    }
    for (let j = 0; j < 2; j++) {
      if (down <= 0 || burst > 0.02) { this.bars.hide(NB + j); continue; }
      this.bars.set(NB + j, 0, j === 0 ? 20 + (1 - down) * 500 : 330 + (1 - down) * 500, -40, RB * 2 + 10, 8, RB * 2 + 10, [0.04, 0.04, 0.05], 0);
    }

    // camera: worm's-eye from the street; roar close-up; prison wide; free: tilt up after her
    if (t < this.tMonster - 0.1) {
      const p = prog(t, f.start, this.tMonster);
      this.look([lerp(-140, -90, p), 6, 380], [0, 150, -40], { t, fov: 50, hand: 2, shake: k * 3 });
    } else if (t < this.L29.start - 0.1) {
      this.look([-90, 140, 300], [0, 220, -40], { t, fov: 40, hand: 1.5, shake: pulse(t, this.tMonster, 0.3) * 10 + k * 2 });
    } else if (t < this.tFree - 0.1) {
      const p = prog(t, this.L29.start, this.tFree);
      this.orbit([0, 140, -40], lerp(0.6, 1.3, p), 0.05, 480, { t, fov: 44, hand: 1.5, shake: k * 2 + pulse(t, this.tPrison + 0.1, 0.2) * 8 });
    } else {
      const p = prog(t, this.tFree, f.end, ease.inOutCubic);
      this.look([80, 20, 360], [0, lerp(200, 200 + fly * 900, 0.9), -40], { t, fov: lerp(46, 60, p), hand: 1.5, shake: pulse(t, this.tFree, 0.3) * 12 });
    }

    drawRain(this.fx, t, { center: [this.cam.position.x, this.cam.position.y + 60, this.cam.position.z - 120], size: [320, 300, 300], n: 1300, speed: 280, alpha: 0.35, len: 12, width: 0.3 });
    if (fly > 0) drawEmbers(this.fx, t, { center: [0, fly * 900 - 20, -40], size: [160, 200, 60], n: 150, speed: 90, col: [0.5, 2.0, 3.0], width: 1.2 });
    // lightning bolts down to the towers on the strongest cowbells
    for (const b of this.bolts) {
      const a = 1 - clamp((t - b) / 0.12);
      if (t < b || a <= 0) continue;
      let x = (hash(b, 1) - 0.5) * 900, y = 900;
      const z = -500 - hash(b, 2) * 300;
      for (let s = 0; s < 14; s++) {
        const nx = x + (hash(b, s, 3) - 0.5) * 70, ny = y - 60;
        this.fx.seg(x, y, z, nx, ny, z, 3, 2.0, 2.2, 3.0, a);
        x = nx; y = ny;
      }
    }

    const line = t < this.L29.start - 0.05 ? this.L28 : this.L29;
    slamWord(this.c, line, t, { cx: 960, cy: 880, size: 130, color: /free/i.test(line.text) && t >= this.tFree ? rgba('cyan', 1) : rgba('bone', 1), context: true, maxW: 1500 });

    return {
      ...this.tag(t),
      letterbox: 1,
      bloom: 0.9,
      ca: 2 + k * 3,
      split: sn * 6 + pulse(t, this.tFree, 0.1) * 30,
      flash: bolt * 0.35 + pulse(t, this.tFree, 0.1) * 0.5,
      flashColor: [0.7, 0.8, 1.0],
      shake: [(hash(frameIdx(t), 1) - 0.5) * k * 12, (hash(frameIdx(t), 2) - 0.5) * k * 12],
      zoom: 1 + k * 0.025,
      gain: [0.92, 1.0, 1.1],
      contrast: 1.12,
      saturation: 1.1,
      glitch: pulse(t, this.tFree, 0.12) * 0.6,
    };
  }
}
