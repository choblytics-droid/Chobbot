// Verse A3, lines 27-28 — "He's terrified of me, he's shaking with fear. / That's why my name is the only thing
// you hear." Him, small, trembling in the dark; behind him a giant Venmar looms out of the black, only
// her rim light, ear and eyes glowing. Line 28: a ring of voxel equalizer bars driven by the track
// surrounds him and her name circles in light bulbs: it is all he can hear.
import type { Frame, PostOverrides } from '../engine/scene';
import { Stage } from './_stage';
import { Boxes, VoxelChar } from '../engine/voxel';
import { SHADOW } from '../sprites/sprites';
import { glyphCells } from '../engine/pixelfont';
import { slamWord } from '../engine/kinetic';
import { rgba } from '../engine/palette';
import { ease, lerp, prog, pulse, hash, frameIdx, noise1 } from '../engine/util';
import type { Line } from '../engine/lyrics';

const NB = 48, RB = 70;

export default class Fear extends Stage {
  him = new VoxelChar(SHADOW);
  bars = new Boxes(NB + 6 * 35 + 4);
  L26!: Line; L27!: Line;
  name: [number, number, number][] = [];

  build() {
    this.useSky = false;
    this.clearCol = [0.001, 0.001, 0.004];
    const ly = this.ctx.lyrics;
    this.L26 = ly.get('shaking with fear'); this.L27 = ly.get('only thing you hear');
    this.world.add(this.him.group, this.bars.mesh);
    [...'VENMAR'].forEach((ch, li) => {
      const g = glyphCells(ch);
      for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r]![q]) this.name.push([li * 6 + q, 6 - r, li]);
    });
    this.bars.add(0, -1, 0, 600, 1, 600, [0.004, 0.004, 0.008], 0);
    this.bars.owner.look({ rimA: [0, 0, 0], rimB: [0, 0, 0] });
    this.venmar.look({ keyCol: [0.05, 0.05, 0.08], ambTop: [0.01, 0.01, 0.02], ambBot: [0, 0, 0], rimA: [0.2, 1.0, 1.5], rimB: [0.15, 0.7, 1.1] });
  }

  update(f: Frame): PostOverrides {
    const t = f.t, A = this.ctx.audio;
    const k = this.kick(t), sn = this.snare(t), bl = this.bell(t);
    const fi = frameIdx(t);
    // him: trembling (per-frame jitter), glancing around
    const tr = 0.6 + 0.4 * A.env('drums', t);
    this.him.group.visible = true;
    this.him.group.position.set((hash(fi, 1) - 0.5) * 1.6 * tr, 0, (hash(fi, 2) - 0.5) * 1.0 * tr);
    this.him.group.rotation.set(0, Math.sin(t * 2.3) * 0.5, (hash(fi, 3) - 0.5) * 0.08 * tr);
    this.him.group.scale.setScalar(1);
    this.him.fx({ t, glow: 2 + k * 2, glitch: sn * 0.3 });

    // giant Venmar behind, rising from the dark on line 26
    const rise = prog(t, f.start, this.L26.start + 1.2, ease.outCubic);
    this.place(this.venmar, f, [0, lerp(-120, -20, rise), -120], { yaw: 0, scale: 5, energy: 0.5 });
    this.venmar.fx({ t, glow: 1.6 + bl, breath: Math.sin(t * 2) });

    // line 27: equalizer ring + her name in bulbs orbiting
    const eq = prog(t, this.L27.start - 0.2, this.L27.start + 0.3, ease.outBack);
    for (let i = 0; i < NB; i++) {
      const a = (i / NB) * Math.PI * 2;
      const band = i % 3 === 0 ? A.env('bass', t) : i % 3 === 1 ? A.env('mid', t) : A.env('high', t);
      const h = Math.max(0.1, eq * (4 + 60 * band * (0.6 + 0.4 * noise1(t * 6 + i, 3)) + k * 20 * (i % 2)));
      const col: [number, number, number] = i % 2 ? [0.06, 0.3, 0.5] : [0.5, 0.14, 0.03];
      this.bars.set(1 + i, Math.sin(a) * RB, h / 2, Math.cos(a) * RB, 5, h, 5, col, 0.35, [0, a, 0]);
    }
    const nw = 6 * 6;
    this.name.forEach(([q, r, li], i) => {
      const a = -t * 0.8 + (q / nw) * Math.PI * 2 * 0.5;
      const on = (li + Math.floor(f.beat)) % 6 !== 0;
      const R = 110;
      this.bars.set(1 + NB + i, Math.sin(a) * R, 60 + r * 5 - (1 - eq) * 200, Math.cos(a) * R, 4, 4, 4, on ? [0.3, 1.2, 1.8] : [0.03, 0.1, 0.15], on ? 0.8 : 0, [0, a, 0]);
    });

    // camera: low push-in on him with the giant above; line 27 orbit
    if (t < this.L27.start - 0.1) {
      const p = prog(t, f.start, this.L27.start);
      this.look([lerp(30, 12, p), 8, lerp(110, 60, p)], [0, lerp(40, 30, p), -40], { t, fov: 44, hand: 1.5, shake: k * 1.2 });
    } else {
      const p = prog(t, this.L27.start, f.end);
      this.orbit([0, 30, 0], lerp(0.2, 1.8, p), 0.35, lerp(210, 170, p), { t, fov: 44, hand: 1, shake: k });
    }

    const line = t < this.L27.start - 0.05 ? this.L26 : this.L27;
    slamWord(this.c, line, t, { cx: 960, cy: 900, size: 120, color: line === this.L27 ? rgba('cyan', 1) : rgba('bone', 1), context: true, maxW: 1500, jitter: line === this.L26 ? 10 : 0 });

    return {
      ...this.tag(t),
      letterbox: 1,
      bloom: 0.7,
      ca: 2 + k * 4,
      split: sn * 10,
      shake: [(hash(fi, 4) - 0.5) * (k * 10 + 3), (hash(fi, 5) - 0.5) * (k * 10 + 3)],
      zoom: 1 + k * 0.02,
      vignette: 0.75,
      gain: [0.9, 1.0, 1.12],
      contrast: 1.15,
      glitch: sn * 0.1 + pulse(t, this.L27.start, 0.1) * 0.5,
    };
  }
}
