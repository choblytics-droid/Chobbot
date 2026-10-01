// Verse B2, lines 19-20 — "You look at me like you've seen a ghost. / He hates the thing he fears the most."
// A ring of tall mirrors around Quest in a dark hall. Each mirror holds her reflection (a dimmed copy
// placed behind the glass). On "ghost" one reflection is Venmar, as a hologram. On line 20 the
// reflections turn, one by one on the beats, into him — red eyes in every mirror.
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { Stage } from './_stage';
import { Boxes, VoxelChar } from '../engine/voxel';
import { QUEST, SHADOW, VENMAR } from '../sprites/sprites';
import { slamWord } from '../engine/kinetic';
import { rgba } from '../engine/palette';
import { drawEmbers } from '../engine/world';
import { ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

const M = 8, R = 90;

export default class Mirror extends Stage {
  frames = new Boxes(M * 5 + 4);
  refl: VoxelChar[] = [];
  shade: VoxelChar[] = [];
  ghostV = new VoxelChar(VENMAR);
  L18!: Line; L19!: Line;
  tGhost = 0;
  turnT: number[] = [];

  build() {
    this.useSky = false;
    this.clearCol = [0.002, 0.003, 0.008];
    const ly = this.ctx.lyrics, au = this.ctx.audio;
    this.L18 = ly.get('seen a ghost'); this.L19 = ly.get('fears the most');
    this.tGhost = this.L18.words.find((w) => /ghost/i.test(w.w))!.start;
    const b0 = Math.ceil(au.beatAt(this.L19.start - 0.05));
    for (let i = 0; i < M; i++) this.turnT.push(au.timeOfBeat(b0 + Math.floor(i * 0.9)));
    this.world.add(this.frames.mesh, this.ghostV.group);
    for (let i = 0; i < M; i++) {
      const a = (i / M) * Math.PI * 2;
      const q = new VoxelChar(QUEST), s = new VoxelChar(SHADOW);
      this.refl.push(q); this.shade.push(s);
      this.world.add(q.group, s.group);
      // mirror: dark glass slab with a glowing frame
      const x = Math.sin(a) * R, z = Math.cos(a) * R;
      // frame posts (the glass itself is implied: the reflection stands right behind it)
      this.frames.add(x + Math.cos(a) * 26, 45, z - Math.sin(a) * 26, 2, 92, 2, [0.4, 1.6, 2.2], 1.2, [0, a, 0]);
      this.frames.add(x - Math.cos(a) * 26, 45, z + Math.sin(a) * 26, 2, 92, 2, [0.4, 1.6, 2.2], 1.2, [0, a, 0]);
      this.frames.add(x, 91, z, 54, 2, 2, [0.4, 1.6, 2.2], 1.2, [0, a, 0]);
      this.frames.add(x, -1, z, 54, 2, 2, [0.4, 1.6, 2.2], 1.2, [0, a, 0]);
    }
    this.frames.add(0, -2, 0, 400, 1, 400, [0.004, 0.004, 0.008], 0);
    this.frames.owner.look({ rimA: [0, 0, 0], rimB: [0, 0, 0], keyCol: [0.2, 0.2, 0.3], ambTop: [0.02, 0.02, 0.04] });
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), bl = this.bell(t);
    this.place(this.quest, f, [0, 0, 0], { yaw: t * 0.25, scale: 1, energy: 0.7, move: V2 ? 'idle' : undefined });
    if (V2) { this.groundY = 0; this.act(this.quest, 'recoil', this.tGhost); this.act(this.quest, 'accuse', this.L19.start + 0.2, { dur: 1.2, side: 'R' }); }
    const fi = frameIdx(t);
    // reflections: mirrored copies just behind each mirror, facing out of it
    for (let i = 0; i < M; i++) {
      const a = (i / M) * Math.PI * 2;
      const d = R + 22;
      const q = this.refl[i]!, s = this.shade[i]!;
      const turned = t >= this.turnT[i]!;
      const isGhost = i === 0 && t >= this.tGhost - 0.05 && t < this.L19.start;
      q.group.visible = !turned && !isGhost;
      s.group.visible = turned;
      for (const ch of [q, s]) {
        ch.group.position.set(Math.sin(a) * d, 0, Math.cos(a) * d);
        ch.group.rotation.set(0, a + Math.PI + Math.sin(t * 0.25 + i) * 0.2, 0);
        ch.group.scale.set(-1, 1, 1);
      }
      q.pose({ blink: (t + i * 0.37) % 3 < 0.1, wag: Math.sin(f.beat * Math.PI + i) * 0.3 });
      q.fx({ t, tint: [0.1, 0.25, 0.45], tintA: 0.45, alpha: 0.85, glow: 0.5 });
      const fl = t < this.turnT[i]! + 0.2 ? (hash(fi, i) > 0.5 ? 1 : 0.3) : 1;
      s.fx({ t, glow: 3 * fl, flash: pulse(t, this.turnT[i]!, 0.08) * 0.6 });
      if (i === 0) {
        this.ghostV.group.visible = isGhost;
        this.ghostV.group.position.copy(q.group.position);
        this.ghostV.group.rotation.copy(q.group.rotation);
        this.ghostV.group.scale.set(-1, 1, 1);
        this.ghostV.pose({ blink: false, flap: Math.sin(f.beat * Math.PI) * 0.5 });
        this.ghostV.fx({ t, ghost: 1, alpha: hash(fi >> 1, 9) > 0.2 ? 0.95 : 0.4, glitch: pulse(t, this.tGhost, 0.2) });
      }
    }

    // camera: slow orbit inside the ring, pointing past Quest at the mirrors; snap to the ghost mirror on "ghost"
    if (t >= this.tGhost - 0.05 && t < this.L19.start - 0.1) {
      const p = prog(t, this.tGhost, this.L19.start, ease.outCubic);
      this.look([Math.sin(Math.PI) * 30, 22, Math.cos(Math.PI) * 30], [0, lerp(18, 20, p), R + 10], { t, fov: lerp(34, 30, p), hand: 1 });
    } else {
      const yaw = lerp(0.5, 2.6, prog(t, f.start, f.end));
      this.orbit([0, 18, 0], yaw, 0.12, 55, { t, fov: 48, hand: 1.5, shake: k * 0.5 });
    }
    drawEmbers(this.fx, t, { center: [0, 40, 0], size: [160, 80, 160], n: 100, speed: 4, col: [0.6, 0.8, 1.2], width: 0.3, alpha: 0.4 });

    const line = t < this.L19.start - 0.05 ? this.L18 : this.L19;
    slamWord(this.c, line, t, { cx: 960, cy: 880, size: 110, color: line === this.L19 ? rgba('#ff3040', 1) : rgba('bone', 1), context: true, maxW: 1500, italic: true });

    return {
      ...this.tag(t),
      letterbox: 1,
      bloom: 0.8,
      ca: 1.6 + k * 2,
      vignette: 0.7,
      glitch: pulse(t, this.tGhost, 0.12) * 0.5 + this.turnT.reduce((m, x) => Math.max(m, pulse(t, x, 0.06)), 0) * 0.3,
      shake: [(hash(fi, 1) - 0.5) * k * 5, (hash(fi, 2) - 0.5) * k * 5],
      gain: [0.95, 1.0, 1.1],
      contrast: 1.12,
      saturation: 1.05,
      zoom: 1 + bl * 0.01,
    };
  }
}
