// Verse A1, lines 5-6 — "He's building a fortress, he's blocking the door. / But he's thinking about me more
// than ever before!" Rusted walls erupt around him on every kick, a door slab slams shut; then, over
// the fortress, a skyscraper-sized hologram of Venmar rises: what he's really thinking about.
import type { Frame, PostOverrides } from '../engine/scene';
import { Stage } from './_stage';
import { City, Surface, drawRain, drawEmbers } from '../engine/world';
import { Boxes, VoxelChar } from '../engine/voxel';
import { SHADOW, VENMAR } from '../sprites/sprites';
import { slamWord } from '../engine/kinetic';
import { rgba } from '../engine/palette';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx, mulberry32 } from '../engine/util';
import type { Line } from '../engine/lyrics';

interface Wall { x: number; z: number; w: number; d: number; h: number; t: number; rot: number }

export default class Fortress extends Stage {
  city = new City({ seed: 11, count: 200, clear: 500, minH: 60, maxH: 380 });
  ground = new Surface(6000, { y: 0, rust: 0.6 });
  walls = new Boxes(260);
  him = new VoxelChar(SHADOW);
  holo = new VoxelChar(VENMAR);
  plan: Wall[] = [];
  L4!: Line; L5!: Line;
  door = 0;

  build() {
    const ly = this.ctx.lyrics, au = this.ctx.audio;
    this.L4 = ly.get('building a fortress'); this.L5 = ly.get('thinking about me');
    this.city.group.position.y = 0;
    this.world.add(this.city.group, this.ground.mesh, this.walls.mesh, this.him.group, this.holo.group);
    // walls rise on the kicks of line 4 (and the beats if kicks are sparse): a ring of towers and wall segments
    let times = au.events('kick', this.L4.start - 0.3, this.L5.start).map(([t]) => t);
    if (times.length < 10) times = Array.from({ length: 16 }, (_, i) => lerp(this.L4.start - 0.2, this.L5.start - 0.3, i / 15));
    const rnd = mulberry32(5);
    const R = 90;
    const N = 44;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const isTower = i % 4 === 0;
      const ti = times[Math.min(times.length - 1, Math.floor((i / N) * times.length))]! + (i % 2) * 0.05;
      this.plan.push({ x: Math.cos(a) * R, z: Math.sin(a) * R, w: isTower ? 22 : 16, d: isTower ? 22 : 10, h: isTower ? 110 + rnd() * 40 : 60 + rnd() * 20, t: ti, rot: -a });
    }
    // inner keep
    for (let i = 0; i < 6; i++) this.plan.push({ x: (rnd() - 0.5) * 60, z: (rnd() - 0.5) * 60 - 20, w: 18 + rnd() * 10, d: 18 + rnd() * 10, h: 70 + rnd() * 70, t: times[Math.min(times.length - 1, 4 + i * 2)]!, rot: rnd() });
    this.door = this.L4.words.find((w) => /door/i.test(w.w))!.start;
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), bl = this.bell(t), sn = this.snare(t);
    this.sky.set({ t, rift: 1.0 + bl * 0.4, pulse: k, clouds: 0.6, stars: 1, top: [0.002, 0.004, 0.02], horizon: [0.025, 0.012, 0.05], glow: [0.1, 0.03, 0.05] });
    this.city.set({ t, pulse: k, win: 0.5, fogNear: 300, fogFar: 1800 });
    this.ground.set({ t, pulse: k, wet: 0.8, fogNear: 200, fogFar: 1800, reflA: [0.1, 0.5, 0.9], reflB: [0.9, 0.25, 0.06] });

    // walls: rise with an overshoot, dust at the base while rising
    const rust: [number, number, number] = [0.12, 0.035, 0.012], iron: [number, number, number] = [0.03, 0.03, 0.04];
    this.plan.forEach((w, i) => {
      const p = prog(t, w.t, w.t + 0.35, (x) => ease.outBack(x, 1.4));
      const h = Math.max(0.01, w.h * p);
      this.walls.set(i, w.x, h / 2 - (1 - p) * 4, w.z - 300, w.w, h, w.d, i % 3 === 0 ? iron : rust, 0, [0, w.rot, 0]);
      if (p > 0 && p < 1) drawEmbers(this.fx, t, { center: [w.x, 3, w.z - 300], size: [w.w, 8, w.d], n: 16, speed: 30, col: [1.2, 0.5, 0.2], seed: i, width: 0.8 });
      // glowing seam at the top of each tower
      if (p > 0.5 && w.w > 20) this.fx.seg(w.x - w.w / 2, h + 0.5, w.z - 300 + w.d / 2 + 0.2, w.x + w.w / 2, h + 0.5, w.z - 300 + w.d / 2 + 0.2, 0.9, 2.8, 0.6, 0.15, 1);
    });
    // the door: a slab slamming down in front (toward the camera) on "door"
    const dp = prog(t, this.door - 0.12, this.door + 0.05, ease.inQuad);
    const dh = 60;
    this.walls.set(this.plan.length, 0, dh / 2 + (1 - dp) * 80, -300 + 92, 30, dh, 6, [0.05, 0.02, 0.01], 0);
    this.walls.set(this.plan.length + 1, 0, dh + 2 + (1 - dp) * 80, -300 + 95.5, 32, 1.2, 1.2, [3, 0.5, 0.1], 1.5);

    // him inside, pacing
    this.him.group.visible = true;
    this.him.group.position.set(Math.sin(t * 1.3) * 12, 0, -300 + 10);
    this.him.group.rotation.set(0, Math.sin(t * 1.3) > 0 ? -0.6 : 0.6, 0);
    this.him.group.scale.setScalar(1.2);
    this.him.fx({ t, glow: 2 });

    // Venmar on a rooftop edge in the foreground
    this.place(this.venmar, f, [-30, 60, 60], { yaw: Math.PI + 0.35, scale: 1 });
    this.walls.set(this.plan.length + 2, -30, 30, 60, 60, 60, 40, [0.012, 0.012, 0.018], 0);
    this.walls.set(this.plan.length + 3, -30, 60.3, 80, 60, 0.6, 0.6, [0.3, 1.4, 2.0], 1.2);

    // hologram: rises over the fortress on line 5 (ghost shader, huge, slightly flickering)
    const hp = prog(t, this.L5.start - 0.3, this.L5.start + 1.2, ease.outCubic);
    this.holo.group.visible = hp > 0;
    if (hp > 0) {
      const flick = hash(frameIdx(t) >> 1, 4) > 0.12 ? 1 : 0.4;
      this.holo.group.position.set(0, 60 + (1 - hp) * -120, -380);
      this.holo.group.scale.setScalar(9);
      this.holo.group.rotation.set(0, Math.sin(t * 0.6) * 0.15, 0);
      this.holo.pose({ blink: (t % 2.4) < 0.12, mouth: false, flap: Math.sin(f.beat * Math.PI) * 0.5 });
      this.holo.fx({ t, ghost: 1, alpha: hp * flick * 0.9, glitch: pulse(t, this.L5.start, 0.2) + sn * 0.3, glow: 2 });
    }

    // camera: behind Venmar, over her shoulder at the fortress; on line 5, crane up to frame the hologram
    const s5 = this.L5.start - 0.2;
    if (t < s5) {
      const p = prog(t, f.start, s5, ease.inOutQuad);
      this.look([lerp(-70, -40, p), lerp(95, 85, p), lerp(170, 130, p)], [0, lerp(30, 45, p), -300], { t, hand: 1.5, fov: 40, shake: k * 1.5 });
    } else {
      const p = prog(t, s5, f.end, ease.inOutCubic);
      this.look([lerp(-40, 10, p), lerp(85, 55, p), lerp(130, 150, p)], [0, lerp(60, 170, p), -340], { t, hand: 1.2, fov: lerp(40, 50, p), shake: k });
    }

    drawRain(this.fx, t, { center: [this.cam.position.x, this.cam.position.y - 20, this.cam.position.z - 80], size: [240, 200, 240], n: 1100, speed: 250, alpha: 0.4 });

    const line = t < this.L5.start - 0.05 ? this.L4 : this.L5;
    slamWord(this.c, line, t, { cx: 960, cy: 250, size: 150, color: line === this.L5 ? rgba('cyan', 1) : rgba('bone', 1), context: true, maxW: 1500 });

    return {
      ...this.tag(t),
      letterbox: 1,
      bloom: 0.8,
      ca: 1.6 + k * 2.5,
      split: k * 4 + pulse(t, this.door, 0.1) * 20,
      shake: [(hash(frameIdx(t), 1) - 0.5) * (k * 8 + pulse(t, this.door, 0.12) * 40), (hash(frameIdx(t), 2) - 0.5) * (k * 8 + pulse(t, this.door, 0.12) * 40)],
      flash: pulse(t, this.door, 0.05) * 0.3,
      flashColor: [1, 0.5, 0.2],
      zoom: 1 + k * 0.015,
      gain: [0.92, 1.0, 1.1],
      contrast: 1.08,
      saturation: 1.1,
      glitch: pulse(t, this.L5.start, 0.12) * 0.5,
    };
  }
}
