// Rig lab (not in the video): ?lab=1 replaces the timeline with this scene. Time encodes the cell:
//   t in [0,4): turnaround (front, 3/4, side, back) of both characters, rest pose
//   t = 10 + 3*k + p: move k of LAB_MOVES at phase p (0,1,2)
// Render it with: bun scripts/render.ts sheet --lab 1 --rig v2 --times 0.5,1.5,... --cols 4
import type { Frame, PostOverrides } from '../engine/scene';
import { Stage } from './_stage';
import { Boxes, type VoxelChar } from '../engine/voxel';
import type { Layer, MoveOpts } from '../engine/moves';

const B1 = 1 / 2.2 + 1e-4; // one lab beat (s)
export const LAB_MOVES: { name: string; label: string; who: 'both' | 'A' | 'B'; o?: MoveOpts; o3?: MoveOpts; at: [number, number, number] }[] = [
  { name: 'idle', label: 'idle / breathe / blink', who: 'both', at: [0.6, 1.9, 2.9] },
  { name: 'walk', label: 'walk', who: 'both', at: [0.0, 0.15, 0.3] },
  { name: 'run', label: 'run', who: 'both', at: [0.0, 0.1, 0.19] },
  { name: 'jump', label: 'jump: crouch / apex / land', who: 'both', o: { h: 10, air: 0.5 }, at: [0.15, 0.42, 0.7] },
  { name: 'turn', label: 'turn (head leads)', who: 'both', o: { angle: Math.PI / 2, dur: 0.45 }, at: [0.1, 0.22, 0.5] },
  { name: 'accuse', label: 'point / accuse', who: 'both', o: { dur: 1 }, at: [0.08, 0.2, 0.9] },
  { name: 'punch', label: 'punch: wind-up / strike / recover', who: 'both', at: [0.13, 0.24, 0.55] },
  { name: 'groove', label: 'dance groove (beat 1 / & / 2)', who: 'both', o: { amp: 1.4 }, at: [0.0, 0.25, B1] },
  { name: 'sit', label: 'sit down / sit / slump', who: 'both', o: { dur: 3, slump: 0 }, o3: { dur: 3, slump: 1 }, at: [0.2, 1.2, 1.5] },
  { name: 'fly', label: 'Venmar flight: wing beats', who: 'A', o: { h: 8 }, at: [0.8, 0.9, 1.0] },
  { name: 'swipe', label: 'Quest tail swipe', who: 'B', at: [0.16, 0.3, 0.5] },
  { name: 'sing', label: 'mouth on vocal / blink', who: 'both', at: [0.0, 1.0, 2.0] },
  // hip-hop set (k = 12..): lab beat = 2.2/s, so B1 s = one beat; phases on the beat / & / next beat
  ...['twostep', 'bodyrock', 'wop', 'cabbage', 'runningman', 'shrug'].map((st) => ({ name: 'hiphop', label: `hip-hop: ${st}`, who: 'both' as const, o: { step: st, amp: 1.2 }, at: [B1 * 4, B1 * 4.5, B1 * 5] as [number, number, number] })),
  { name: 'hiphop', label: 'hip-hop: spin (beat 15 of the phrase)', who: 'both', o: { amp: 1.2 }, at: [B1 * 14.2, B1 * 14.5, B1 * 14.8] },
  { name: 'hiphop', label: 'hip-hop: b-boy freeze (beat 16)', who: 'both', o: { amp: 1.2 }, at: [B1 * 15.05, B1 * 15.2, B1 * 15.8] },
];

export default class Lab extends Stage {
  floor = new Boxes(4);

  build() {
    this.useSky = false;
    this.clearCol = [0.03, 0.035, 0.06];
    this.floor.add(0, -1, 0, 400, 2, 200, [0.012, 0.012, 0.018]);
    this.world.add(this.floor.mesh);
    this.groundY = 0;
  }

  private pose(ch: VoxelChar, layers: Layer[], T: number, o: { sing?: number; seed: number }) {
    ch.cx = { beat: (t) => t * 2.2, bar: (t) => (t * 2.2) / 4, vocal: () => o.sing ?? 0, seed: o.seed, sing: (o.sing ?? 0) > 0, energy: 1 };
    ch.layers = layers;
    if (ch.sculpt) ch.applyRig(T);
    else ch.pose({ blink: false, mouth: (o.sing ?? 0) > 0.5 });
  }

  update(f: Frame): PostOverrides {
    const t = f.t, V = this.venmar, Q = this.quest;
    V.group.visible = Q.group.visible = true;
    const c = this.c;
    c.font = 'bold 64px monospace'; c.fillStyle = '#e8e8e8';
    if (t < 4) {
      const i = Math.floor(t), yaw = [0, Math.PI / 4, Math.PI / 2, Math.PI][i]!;
      for (const [ch, x, seed] of [[V, -20, 0], [Q, 20, 5]] as const) {
        this.pose(ch, [], 0.5, { seed });
        ch.group.position.set(x, 0, 0);
        ch.group.rotation.set(0, yaw, 0);
        ch.group.scale.setScalar(1);
      }
      this.look([0, 22, 150], [0, 17, 0], { fov: 24 });
      c.fillText(['FRONT', '3/4', 'SIDE', 'BACK'][i]!, 40, 90);
      return { tagA: 0 };
    }
    const k = Math.floor((t - 10) / 3), p = Math.floor(t - 10) - k * 3;
    const M = LAB_MOVES[Math.max(0, Math.min(LAB_MOVES.length - 1, k))]!;
    const lt = M.at[p]!, T = M.name === 'hiphop' ? lt + (16 * 10) / 2.2 : 100 + lt;
    const layers: Layer[] = M.name === 'sing' || M.name === 'idle' ? [{ name: 'idle', t0: -1e9, o: {} }] : [{ name: 'idle', t0: -1e9, o: { amp: 0.3 } }, { name: M.name, t0: M.name === 'groove' || M.name === 'hiphop' || M.name === 'walk' || M.name === 'run' || M.name === 'fly' ? -1e9 : 100, o: (p === 2 && M.o3) || M.o || {} }];
    const both: [VoxelChar, number, number, boolean][] = M.who === 'A' ? [[V, 0, 0, true], [Q, 0, 5, false]] : M.who === 'B' ? [[Q, 0, 5, true], [V, 0, 0, false]] : [[V, -19, 0, true], [Q, 19, 5, true]];
    for (const [ch, x, seed, on] of both) {
      ch.group.visible = on;
      if (!on) continue;
      // idle phases land on a blink (seeded) for the middle frame; sing: closed / open / blink
      const sing = M.name === 'sing' ? [0, 1, 0][p]! : 0;
      const TT = M.name === 'sing' && p === 2 ? (seed === 0 ? 3.1 : 5.4) + 0.05 - seed * 1.3 + 3.1 * 10 : T;
      this.pose(ch, layers, TT, { sing, seed });
      ch.group.position.set(x, 0, 0);
      ch.group.rotation.set(0, M.name === 'turn' ? 0 : 0.5 * (x <= 0 ? 1 : -1) * (M.who === 'both' ? 1 : 0.8), 0);
      ch.group.scale.setScalar(1);
    }
    this.look([0, 24, 118], [0, 20, 0], { fov: 26 });
    c.fillText(`${M.label}  [${p + 1}/3]`, 40, 90);
    return { tagA: 0 };
  }
}
