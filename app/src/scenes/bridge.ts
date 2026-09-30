// Verse B1, line 16 — "Burning every bridge, losing every friend."
// A long plank bridge across the rift (the "fenda"): molten light far below. Quest walks across while
// the planks behind her ignite one by one and drop into the glow; on "friend" the little figures waiting
// on the far side dissolve into sparks. Side-on tracking shot, then a swing behind her.
import type { Frame, PostOverrides } from '../engine/scene';
import { Stage } from './_stage';
import { Boxes, VoxelChar } from '../engine/voxel';
import { VENMAR } from '../sprites/sprites';
import { drawEmbers } from '../engine/world';
import { karaokeLine } from '../engine/kinetic';
import { rgba } from '../engine/palette';
import { F } from '../engine/type';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

const N = 40, PW = 7; // planks, plank pitch

export default class Bridge extends Stage {
  planks = new Boxes(N * 3 + 20);
  friends: VoxelChar[] = [];
  L!: Line;
  tFriend = 0;

  build() {
    this.L = this.ctx.lyrics.get('Burning every bridge');
    this.tFriend = this.L.words.filter((w) => /friend/i.test(w.w)).pop()!.start;
    this.world.add(this.planks.mesh);
    // friends: small grey look-alikes on the far end (a greyed Venmar sprite, tiny)
    for (let i = 0; i < 4; i++) {
      const v = new VoxelChar(VENMAR);
      this.friends.push(v);
      this.world.add(v.group);
    }
    this.planks.owner.look({ keyDir: [0, -1, 0.2], keyCol: [2.2, 0.7, 0.2], ambTop: [0.03, 0.03, 0.06], ambBot: [0.3, 0.08, 0.02] });
    this.quest.look({ keyDir: [0.2, -0.8, 0.4], keyCol: [1.6, 0.6, 0.2], ambTop: [0.1, 0.1, 0.18], ambBot: [0.35, 0.1, 0.03] });
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), bl = this.bell(t);
    this.sky.set({ t, rift: 1.4 + bl * 0.4, pulse: k, clouds: 1, stars: 0.5, top: [0.003, 0.003, 0.016], horizon: [0.07, 0.02, 0.012], glow: [0.18, 0.05, 0.02], riftCol: [1.3, 0.4, 0.08], riftAngle: -0.2 });

    // Quest walks from x=-110 to +40 over the line
    const walk = prog(t, f.start, f.end);
    const qx = lerp(-100, 60, walk);
    // the fire front follows ~20 units behind her
    const fire = qx - 22;
    for (let i = 0; i < N; i++) {
      const x = -140 + i * PW;
      const burnT = clamp((fire - x) / 30); // 0 unburnt .. 1 fully burnt
      const drop = Math.max(0, burnT - 0.6) / 0.4;
      const y = -drop * drop * 120;
      const glow = burnT > 0 ? Math.min(1, burnT * 2) : 0;
      const col: [number, number, number] = [lerp(0.08, 1.8, glow), lerp(0.04, 0.35, glow), lerp(0.02, 0.05, glow)];
      this.planks.set(i, x, y - 1, 0, PW - 0.8, 2, 24, col, glow * 1.5, [drop * 0.8 * (hash(i, 1) - 0.5), 0, drop * 1.2 * (hash(i, 2) - 0.5)]);
      // rails
      this.planks.set(N + i, x, y + 8, -12, PW, 1, 1, [0.05, 0.03, 0.02], glow, [0, 0, drop * 0.5]);
      this.planks.set(2 * N + i, x, y + 8, 12, PW, 1, 1, [0.05, 0.03, 0.02], glow, [0, 0, -drop * 0.5]);
      if (glow > 0 && drop < 0.6) drawEmbers(this.fx, t, { center: [x, 10 + y, 0], size: [PW, 22, 22], n: 14, speed: 40, seed: i, width: 0.6, col: [3.2, 0.8, 0.15] });
    }
    // molten glow far below (a huge emissive slab)
    this.planks.set(3 * N, 0, -260, 0, 2000, 2, 400, [1.2, 0.25, 0.04], 2.0);

    this.place(this.quest, f, [qx, 0, 0], { yaw: Math.PI / 2 - 0.75, scale: 0.9, hop: 1.5, energy: 1.2 });

    // friends: wait on the far end, dissolve into sparks on "friend"
    const fd = prog(t, this.tFriend - 0.05, this.tFriend + 1.2, ease.inCubic);
    this.friends.forEach((v, i) => {
      v.group.visible = true;
      v.group.position.set(135 + i * 12, 0, -8 + i * 5);
      v.group.rotation.set(0, -Math.PI / 2 + (hash(i) - 0.5) * 0.6, 0);
      v.group.scale.setScalar(0.45);
      v.pose({ blink: (t + i) % 3 < 0.1 });
      v.fx({ t, tint: [0.12, 0.12, 0.14], tintA: 0.85, dissolve: fd, dissolveDir: [1, 0.6, 0] });
    });
    this.planks.set(3 * N + 1, 160, -1, 0, 80, 2, 40, [0.05, 0.04, 0.04], 0);

    // camera: side-on dolly tracking her, then swing behind as the friends dissolve
    if (t < this.tFriend - 0.3) {
      this.look([qx + 20, 22, 150], [qx + 20, 10, 0], { t, fov: 36, hand: 1.5, shake: k * 0.8 });
    } else {
      const p = prog(t, this.tFriend - 0.3, f.end, ease.inOutCubic);
      this.look([lerp(qx + 20, qx - 60, p), lerp(22, 30, p), lerp(150, 30, p)], [lerp(qx + 20, 150, p), 10, 0], { t, fov: 38, hand: 1.5 });
    }

    karaokeLine(this.c, this.L, t, { x: 960, y: 200, size: 84, family: F.archivo(112, 900), align: 'center', sung: rgba('ember', 1), unsung: rgba('bone', 0.25), maxW: 1700, upper: true });

    return {
      ...this.tag(t),
      letterbox: 1,
      bloom: 0.8,
      halation: 0.3,
      ca: 1.8 + k * 3,
      shake: [(hash(frameIdx(t), 1) - 0.5) * k * 8, (hash(frameIdx(t), 2) - 0.5) * k * 8],
      zoom: 1 + k * 0.015,
      gain: [1.12, 0.98, 0.86],
      contrast: 1.12,
      saturation: 1.2,
      leak: 0.12,
      flash: pulse(t, this.tFriend, 0.1) * 0.2,
      flashColor: [1, 0.5, 0.2],
    };
  }
}
