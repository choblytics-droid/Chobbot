// Verse B1, lines 17-18 — "But every word he speaks is a tribute to my name. / He's playing the victim,
// but I'm the one who owns the game." Inside a game: a glowing grid floor to the horizon; on "name" a
// giant marquee QUEST made of light bulbs rises behind her, bulbs chasing on the beat. "playing the
// victim": he lies on the floor with a fake K.O. halo. "owns the game": PLAYER 2 WINS, PERFECT, a score
// counter racing up, pixel confetti.
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { Stage } from './_stage';
import { Surface } from '../engine/world';
import { Boxes, VoxelChar } from '../engine/voxel';
import { SHADOW } from '../sprites/sprites';
import { glyphCells, drawPix, pixWidth } from '../engine/pixelfont';
import { slamWord } from '../engine/kinetic';
import { rgba } from '../engine/palette';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx, window01 } from '../engine/util';
import type { Line } from '../engine/lyrics';

const WORD = 'QUEST', CELL = 9;

export default class Arcade extends Stage {
  floor = new Surface(6000, { y: 0, base: [0.004, 0.003, 0.01] });
  bulbs = new Boxes(WORD.length * 35 + 64);
  him = new VoxelChar(SHADOW);
  cells: [number, number, number][] = []; // x, y, letter index
  L16!: Line; L17!: Line;
  tName = 0; tVictim = 0; tGame = 0;

  build() {
    const ly = this.ctx.lyrics;
    this.L16 = ly.get('tribute to my name'); this.L17 = ly.get('owns the game');
    const w = (l: Line, q: RegExp) => l.words.filter((x) => q.test(x.w)).pop()!.start;
    this.tName = w(this.L16, /name/i); this.tVictim = w(this.L17, /victim/i); this.tGame = w(this.L17, /game/i);
    this.world.add(this.floor.mesh, this.bulbs.mesh, this.him.group);
    const totalW = WORD.length * 6 * CELL - CELL;
    [...WORD].forEach((ch, li) => {
      const g = glyphCells(ch);
      for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r]![q]) this.cells.push([-totalW / 2 + (li * 6 + q) * CELL, (6 - r) * CELL, li]);
    });
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), sn = this.snare(t), bl = this.bell(t);
    this.sky.set({ t, rift: 0.6, pulse: k, clouds: 0, stars: 1.5, moon: 0, top: [0.002, 0.0, 0.012], horizon: [0.05, 0.01, 0.03], glow: [0.2, 0.03, 0.03] });
    this.floor.set({ t, grid: 1, pulse: k, wet: 0.4, gridCol: [1.2, 0.22, 0.05], reflA: [1.0, 0.2, 0.05], reflB: [0.3, 0.1, 0.4], fog: [0.06, 0.01, 0.03], fogNear: 100, fogFar: 1600 });

    // marquee: letters rise out of the floor from "name", bulbs chase along the beat
    const rise = prog(t, this.tName - 0.1, this.tName + 0.5, ease.outBack);
    const chase = Math.floor(f.beat * 2);
    this.cells.forEach(([x, y, li], i) => {
      const on = (i + chase) % 4 !== 0;
      const col: [number, number, number] = on ? [3.0, 1.2, 0.25] : [0.4, 0.12, 0.03];
      const lr = prog(rise, li * 0.08, li * 0.08 + 0.6);
      this.bulbs.set(i, x, 30 + y - (1 - lr) * 120, -260, CELL * 0.8, CELL * 0.8, CELL * 0.8, col, on ? 1.5 + bl : 0.2);
    });
    const base = this.cells.length;
    // cabinet frame around the letters
    this.bulbs.set(base, 0, 20 - (1 - rise) * 120, -266, WORD.length * 6 * CELL + 30, 6, 8, [0.05, 0.02, 0.03], 0);
    this.bulbs.set(base + 1, 0, 30 + 7 * CELL + 6 - (1 - rise) * 120, -266, WORD.length * 6 * CELL + 30, 6, 8, [0.05, 0.02, 0.03], 0);

    // him: lying down (playing the victim) with a spinning star halo, from "victim"
    const v = prog(t, this.tVictim - 0.15, this.tVictim + 0.1, ease.outBack);
    this.him.group.visible = t > this.L17.start - 0.1;
    this.him.group.position.set(55, 3, -40);
    this.him.group.rotation.set(-Math.PI / 2 * v, 0.4, 0);
    this.him.group.scale.setScalar(1);
    this.him.fx({ t, glow: 2 });
    for (let s = 0; s < 3; s++) {
      const a = t * 4 + (s / 3) * Math.PI * 2;
      if (v > 0.5) this.bulbs.set(base + 2 + s, 55 + Math.cos(a) * 10, 10, -40 - 30 + Math.sin(a) * 10, 2.5, 2.5, 2.5, [2.5, 2.0, 0.3], 1.5, [0, a, a]);
      else this.bulbs.hide(base + 2 + s);
    }

    // camera: low orbit, slower in the name line, then a hero push on the game
    const yaw = lerp(0.9, -0.6, prog(t, f.start, f.end, ease.inOutQuad));
    if (t < this.L17.start - 0.1) this.orbit([0, 30, -60], yaw, 0.12, lerp(220, 180, prog(t, f.start, this.L17.start)), { t, fov: 42, hand: 1.5, shake: k * 0.6 });
    else if (t < this.tGame - 0.1) this.orbit([30, 10, -20], yaw + 0.8, 0.25, 120, { t, fov: 40, hand: 1.2 });
    else this.orbit([0, 18, 0], 0.15, 0.02, lerp(80, 60, prog(t, this.tGame, f.end)), { t, fov: 40, hand: 1, shake: pulse(t, this.tGame, 0.2) * 3 });

    const toCam = Math.atan2(this.cam.position.x, this.cam.position.z);
    this.place(this.quest, f, [0, 0, 0], { yaw: toCam * 0.7 + Math.sin(t * 0.8) * 0.2, scale: 1, hop: V2 ? 0 : t > this.tGame ? 5 : 2, energy: 1.3, move: 'hiphop', moveOpts: { amp: 1.2, variant: 2 } });
    if (V2) {
      // dancing on the grid; stance on "name"; points at the fake K.O. on "victim"; victory jump on "game"
      this.groundY = 0;
      this.act(this.quest, 'stance', this.tName, { dur: 1.2 });
      this.act(this.quest, 'accuse', this.tVictim, { dur: 1.0, side: 'R' });
      // turn so the pointing arm aims at the fake K.O. (in profile to the camera), then back
      const aim = window01(t, this.tVictim - 0.2, this.tVictim + 1.3, 0.2, 0.3);
      this.quest.group.rotation.y = lerp(this.quest.group.rotation.y, 0.6, aim);
      this.act(this.quest, 'jump', this.tGame - 0.16, { h: 14, air: 0.55 });
    }

    // UI: arcade HUD
    const c = this.c, fi = frameIdx(t);
    const score = Math.floor(lerp(0, 999999, prog(t, f.start, f.end, ease.inQuad)));
    drawPix(c, '1UP', 120, 70, 5, rgba('bone', (fi >> 4) % 2 ? 1 : 0.4));
    drawPix(c, String(score).padStart(7, '0'), 120, 115, 6, rgba('bone', 1));
    drawPix(c, 'HI-SCORE', 960 - pixWidth('HI-SCORE', 5) / 2, 70, 5, rgba('signal', 1));
    drawPix(c, 'QUEST', 960 - pixWidth('QUEST', 6) / 2, 115, 6, rgba('bone', 1));
    drawPix(c, 'CREDIT 99', 1800 - pixWidth('CREDIT 99', 5), 70, 5, rgba('bone', 0.8));
    if (t < this.L17.start - 0.05) slamWord(c, this.L16, t, { cx: 960, cy: 850, size: 120, color: rgba('bone', 1), context: true, maxW: 1400 });
    else if (t < this.tGame - 0.05) {
      slamWord(c, this.L17, t, { cx: 960, cy: 850, size: 120, color: rgba('bone', 1), context: true, maxW: 1400 });
      if (v > 0.5) drawPix(c, 'K.O.?', 1320, 420, 10, rgba('#ff2030', 1), { shadow: 'rgba(0,0,0,0.8)', wave: 1, t });
    } else {
      const w = prog(t, this.tGame, this.tGame + 0.15, ease.outBack);
      c.save();
      c.translate(960, 420);
      c.scale(lerp(3, 1, w), lerp(3, 1, w));
      drawPix(c, 'PLAYER 2 WINS', -pixWidth('PLAYER 2 WINS', 12) / 2, -42, 12, rgba('gold', 1), { shadow: 'rgba(60,10,0,0.9)', wave: 1, t });
      c.restore();
      if ((fi >> 3) % 2 === 0) drawPix(c, 'PERFECT', 960 - pixWidth('PERFECT', 8) / 2, 560, 8, rgba('bone', 1), { shadow: 'rgba(0,0,0,0.8)' });
      // confetti
      for (let i = 0; i < 90; i++) {
        const age = t - this.tGame;
        const x = 960 + (hash(i, 1) - 0.5) * 1800 + Math.sin(age * 3 + i) * 30;
        const y = -40 + (age * (300 + hash(i, 2) * 400)) % 1200;
        c.fillStyle = [rgba('signal', 1), rgba('gold', 1), rgba('cyan', 1), rgba('bone', 1)][i % 4]!;
        c.fillRect(Math.round(x / 6) * 6, Math.round(y / 6) * 6, 12, 12);
      }
    }

    return {
      tagA: 0,
      bloom: 0.9,
      ca: 2 + k * 3,
      split: sn * 6 + pulse(t, this.tGame, 0.1) * 20,
      flash: pulse(t, this.tGame, 0.08) * 0.5 + pulse(t, this.tName, 0.08) * 0.3,
      flashColor: [1, 0.6, 0.2],
      shake: [(hash(fi, 1) - 0.5) * k * 6, (hash(fi, 2) - 0.5) * k * 6],
      zoom: 1 + k * 0.02,
      scan: 0.3,
      dither: 0.12,
      gain: [1.12, 0.98, 0.92],
      saturation: 1.2,
      contrast: 1.1,
      glitch: pulse(t, this.tVictim, 0.1) * 0.4,
    };
  }
}

