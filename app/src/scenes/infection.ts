// Verse B1, lines 13-15 (Quest) — "He's talking loud, he's spreading the infection. / Building a wall,
// seeking his protection. / He tells you I'm toxic, he tells you I'm the end."
// Street level in the rift city. On a rooftop he blasts a megaphone: green sound rings, and a glitch
// infection spreads over the buildings. A brick wall stacks up between them on the beats; neon signs
// flicker on: TOXIC, THE END. Quest walks through it all, unbothered. JRPG dialogue box with her portrait.
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { Stage } from './_stage';
import { City, Surface, drawRain } from '../engine/world';
import { Boxes, VoxelChar, Billboard } from '../engine/voxel';
import { SHADOW, QUEST } from '../sprites/sprites';
import { dialogueBox } from '../engine/kinetic';
import { F, font } from '../engine/type';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

const HX = 60, HY = 150, HZ = -420; // his rooftop

export default class Infection extends Stage {
  city = new City({ seed: 21, count: 260, clear: 190, minH: 80, maxH: 420, groundY: 0 });
  street = new Surface(5000, { y: 0 });
  props = new Boxes(400);
  him = new VoxelChar(SHADOW);
  signs: Billboard[] = [];
  L12!: Line; L13!: Line; L14!: Line;
  brickTimes: number[] = [];

  build() {
    const ly = this.ctx.lyrics, au = this.ctx.audio;
    this.L12 = ly.get('talking loud'); this.L13 = ly.get('Building a wall'); this.L14 = ly.get('tells you I');
    this.world.add(this.city.group, this.street.mesh, this.props.mesh, this.him.group);
    // his tower + megaphone
    this.props.add(HX, HY / 2, HZ, 60, HY, 60, [0.02, 0.018, 0.025], 0);
    // brick schedule: 8 rows on the beats of line 13
    const b0 = Math.ceil(au.beatAt(this.L13.start - 0.1));
    for (let i = 0; i < 8; i++) this.brickTimes.push(au.timeOfBeat(b0 + i));
    // neon signs for line 14
    const mk = (text: string, col: string, w: number) => {
      const b = new Billboard(w, w * 0.3, 512, 154, {});
      const c = b.ctx;
      c.clearRect(0, 0, 512, 154);
      c.font = font(F.archivo(125, 900), 110);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.strokeStyle = col; c.lineWidth = 8;
      c.strokeRect(10, 10, 492, 134);
      c.fillStyle = col;
      c.fillText(text, 256, 82);
      b.update();
      this.world.add(b.mesh);
      return b;
    };
    this.signs.push(mk('TOXIC', '#6dff5a', 90), mk('THE END', '#ff3a2a', 110));
    this.signs[0]!.mesh.position.set(-70, 110, -160); this.signs[0]!.mesh.rotation.y = 0.5;
    this.signs[1]!.mesh.position.set(90, 150, -230); this.signs[1]!.mesh.rotation.y = -0.4;
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), sn = this.snare(t), bl = this.bell(t);
    // infection radius grows through the scene, spreading from his tower
    const infR = lerp(0, 360, prog(t, this.L12.start, f.end, ease.inOutQuad));
    this.sky.set({ t, rift: 0.8, pulse: k, clouds: 0.8, stars: 0.6, top: [0.004, 0.004, 0.018], horizon: [0.05, 0.02, 0.03], glow: [0.2, 0.06, 0.02], riftCol: [1.2, 0.4, 0.08] });
    this.city.set({ t, pulse: k + bl * 0.5, win: 0.6, infect: 1, infectR: infR, infectPos: [HX, 0, HZ], fog: [0.03, 0.014, 0.012], fogNear: 200, fogFar: 1400 });
    this.street.set({ t, pulse: k, wet: 1, reflA: [0.2, 1.0, 0.25], reflB: [1.2, 0.35, 0.08], fog: [0.03, 0.014, 0.012], fogNear: 150, fogFar: 1400 });

    // him on the tower with a megaphone, jerking on the snares
    this.him.group.visible = true;
    this.him.group.position.set(HX, HY, HZ + 10);
    this.him.group.rotation.set(0, 0.3, sn * 0.1);
    this.him.group.scale.setScalar(1.4);
    this.him.fx({ t, glow: 2.5 });
    const mg: [number, number, number] = [0.5, 0.5, 0.55];
    for (let i = 0; i < 4; i++) this.props.set(1 + i, HX + 14 + i * 5, HY + 30, HZ + 14 + i * 5, 4 + i * 3, 4 + i * 3, 5, mg, 0, [0, -0.8, 0]);
    // sound rings from the megaphone on every kick/snare
    const au = this.ctx.audio;
    for (const [et] of au.events('kick', t - 1.2, t + 0.001).concat(au.events('snare', t - 1.2, t + 0.001))) {
      const age = t - et;
      const r = 6 + age * 160;
      const cx = HX + 30 + age * 150 * 0.7, cz = HZ + 30 + age * 150 * 0.7;
      const a = Math.max(0, 1 - age / 1.2);
      let px = 0, py = 0, pz = 0;
      for (let s = 0; s <= 32; s++) {
        const th = (s / 32) * Math.PI * 2;
        const x = cx + Math.cos(th) * r * 0.7, y = HY + 30 + Math.sin(th) * r, z = cz - Math.cos(th) * r * 0.7;
        if (s > 0) this.fx.seg(px, py, pz, x, y, z, 1.2, 0.4, 2.4, 0.4, a);
        px = x; py = y; pz = z;
      }
    }

    // brick wall stacking between the street and his tower on line 13 (stays after)
    let bi = 10;
    this.brickTimes.forEach((bt, row) => {
      const p = prog(t, bt - 0.05, bt + 0.12, ease.outBack);
      for (let j = 0; j < 12; j++) {
        const x = -66 + j * 12 + (row % 2) * 6;
        const drop = (1 - p) * 60;
        if (p <= 0) { this.props.hide(bi++); continue; }
        this.props.set(bi++, x, 3 + row * 6 + drop, -110, 11.4, 5.6, 8, hash(row, j) > 0.8 ? [0.2, 0.05, 0.02] : [0.13, 0.035, 0.015], 0);
      }
    });

    // signs flicker on with their words on line 14
    const toxic = this.L14.words.find((w) => /toxic/i.test(w.w))!.start;
    const endW = this.L14.words.filter((w) => /end/i.test(w.w)).pop()!.start;
    const fl = (t0: number) => (t < t0 ? 0 : t < t0 + 0.25 ? (hash(frameIdx(t), t0) > 0.5 ? 1 : 0.1) : 1);
    this.signs[0]!.glow(2.2 * fl(toxic) + 0.02);
    this.signs[1]!.glow(2.4 * fl(endW) + 0.02);

    // Quest walks down the street toward camera
    const walk = prog(t, f.start, f.end);
    const qz = lerp(-60, 30, walk);
    this.place(this.quest, f, [0, 0, qz], { yaw: 0, scale: 1, hop: V2 ? 0 : 2.5, energy: 1.1, move: 'walk', moveOpts: { rate: 1.1, amp: 1.3 } });
    if (V2) {
      // a slow swaggering walk; she calls him out on "toxic" and squares up on "end"
      this.groundY = 0;
      this.act(this.quest, 'accuse', toxic - 0.05, { dur: 0.8, side: 'L' });
      this.act(this.quest, 'stance', endW, { dur: 4 });
      for (const w of this.L13.words.filter((x) => /wall|protection/i.test(x.w))) this.act(this.quest, 'punch', w.start - 0.14, { side: /wall/i.test(w.w) ? 'R' : 'L' });
    }
    this.quest.look({ rimA: [0.3, 1.8, 0.4], rimB: [2.2, 0.6, 0.15] });

    // camera: low street tracking shot; line 13 side view of the wall; line 14 low hero angle
    if (t < this.L13.start - 0.1) {
      this.look([lerp(-20, 10, walk * 3), 10, qz + 70], [HX * 0.5, 60, HZ * 0.5], { t, fov: 44, hand: 2, shake: k * 0.6 });
    } else if (t < this.L14.start - 0.1) {
      const p = prog(t, this.L13.start, this.L14.start);
      if (V2) this.look([lerp(75, 62, p), 20, qz + 45], [-4, 20, (qz - 110) / 2], { t, fov: 46, hand: 1.5 });
      else this.look([lerp(120, 100, p), 26, -30], [0, 24, -110], { t, fov: 44, hand: 1.5 });
    } else {
      this.look([-18, 4, qz + 44], [0, 30, qz - 20], { t, fov: 42, hand: 1.2, roll: 0.06 });
    }

    drawRain(this.fx, t, { center: [this.cam.position.x, this.cam.position.y + 40, this.cam.position.z - 60], size: [200, 160, 200], n: 900, speed: 250, alpha: 0.35, col: [0.4, 0.45, 0.4] });

    const line = t < this.L13.start - 0.05 ? this.L12 : t < this.L14.start - 0.05 ? this.L13 : this.L14;
    dialogueBox(this.c, line, t, { def: QUEST, accent: 'signal', open: prog(t, f.start, f.start + 0.25), mouth: this.ctx.audio.env('vocal', t) > 0.35 && (frameIdx(t) >> 2) % 2 === 0, y: 1080 - 230 - 60 });

    return {
      ...this.tag(t),
      bloom: 0.85,
      ca: 1.8 + k * 3,
      split: sn * 6,
      glitch: 0.06 + sn * 0.15 + pulse(t, toxic, 0.1) * 0.5 + pulse(t, endW, 0.1) * 0.5,
      shake: [(hash(frameIdx(t), 1) - 0.5) * k * 6, (hash(frameIdx(t), 2) - 0.5) * k * 6],
      zoom: 1 + k * 0.015,
      gain: [1.1, 1.0, 0.9],
      contrast: 1.1,
      saturation: 1.15,
      leak: 0.15,
      scan: 0.1,
      grain: 0.06,
    };
  }
}

