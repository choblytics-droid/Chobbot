// Outro — "Only the bad things… / Keep my name in your mouth… / It's cozy in your head."
// A cozy little room: lamp light, a couch, rain on the window, the TV showing him. Venmar and Quest
// hang out on the couch, bouncing on the final drop. On "cozy in your head" the camera pulls back
// through the window and out: the room floats inside a giant translucent head — his — with his red
// eyes burning above it. Title card, fade to black.
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { Stage } from './_stage';
import { Boxes, VoxelChar, Billboard } from '../engine/voxel';
import { SHADOW, QUEST, drawSprite } from '../sprites/sprites';
import { dialogueBox, karaokeLine } from '../engine/kinetic';
import { drawRain, drawEmbers } from '../engine/world';
import { drawPix, pixWidth } from '../engine/pixelfont';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

const HS = 16; // head scale

export default class Outro extends Stage {
  room = new Boxes(64, { keyDir: [0.6, 0.7, 0.4], keyCol: [1.4, 0.8, 0.4], ambTop: [0.12, 0.08, 0.08], ambBot: [0.04, 0.02, 0.02], rimA: [0.05, 0.1, 0.2], rimB: [0.3, 0.1, 0.02] });
  head = new VoxelChar(SHADOW);
  tv = new Billboard(22, 15, 192, 130, { pixelated: true });
  L32!: Line; L33!: Line; L34!: Line;
  tDrop = 0; tOut = 0; tTitle = 0;

  build() {
    const ly = this.ctx.lyrics;
    this.L32 = ly.get('Only the bad things'); this.L33 = ly.get('name in your mouth'); this.L34 = ly.get('cozy in your head');
    this.tDrop = this.ctx.audio.downbeats.find((d) => d > this.L33.start - 0.3) ?? this.L33.start;
    this.tOut = this.L34.start - 1.2;
    this.tTitle = this.L34.end + 0.2;
    this.world.add(this.room.mesh, this.head.group, this.tv.mesh);
    const wood: [number, number, number] = [0.16, 0.07, 0.03], wall: [number, number, number] = [0.09, 0.05, 0.06];
    this.room.add(0, -1, 0, 140, 2, 100, wood, 0);                 // floor
    this.room.add(0, 40, -50, 140, 82, 2, wall, 0);                // back wall
    this.room.add(-70, 40, 0, 2, 82, 100, wall, 0);                // left wall
    this.room.add(0, 1, 5, 90, 1, 50, [0.22, 0.04, 0.05], 0);      // rug
    this.room.add(0, 6, -20, 80, 12, 24, [0.05, 0.14, 0.3], 0);    // couch seat
    this.room.add(0, 20, -30, 80, 22, 6, [0.04, 0.12, 0.27], 0);   // couch back
    this.room.add(-42, 12, -20, 6, 20, 24, [0.04, 0.12, 0.27], 0); // arms
    this.room.add(42, 12, -20, 6, 20, 24, [0.04, 0.12, 0.27], 0);
    this.room.add(58, 22, -40, 1.5, 44, 1.5, [0.05, 0.05, 0.05], 0); // lamp pole
    this.room.add(58, 46, -40, 12, 8, 12, [2.4, 1.3, 0.5], 1.5);    // shade
    this.room.add(-69, 44, 5, 1, 34, 44, [0.15, 0.4, 0.9], 1.0);    // window (rift light)
    this.room.add(-69, 44, 5, 1.5, 36, 2, [0.03, 0.02, 0.02], 0);   // window cross
    this.room.add(-69, 44, 5, 1.5, 2, 46, [0.03, 0.02, 0.02], 0);
    this.room.add(-52, 8, -44, 26, 16, 10, [0.05, 0.04, 0.04], 0);  // TV stand (back-left corner)
    this.room.add(-52, 25, -46, 26, 18, 5, [0.03, 0.03, 0.03], 0);  // TV
    this.tv.mesh.position.set(-52, 25, -43.4);
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), sn = this.snare(t), bl = this.bell(t);
    const drop = t >= this.tDrop;
    const out = prog(t, this.tOut, this.L34.start + 1.5, ease.inOutCubic);
    this.sky.set({ t, rift: 1.0 + bl * 0.5, pulse: k, clouds: 0.8, stars: 1, top: [0.003, 0.004, 0.02], horizon: [0.03, 0.012, 0.04], glow: [0.1, 0.03, 0.04] });

    // TV shows him, flickering
    const c2 = this.tv.ctx;
    c2.fillStyle = '#05060a'; c2.fillRect(0, 0, 192, 130);
    drawSprite(c2, SHADOW, 60, 20, 2.3, { blink: (t % 1.9) < 0.1 });
    for (let i = 0; i < 200; i++) { const v = Math.floor(hash(i, frameIdx(t)) * 120); c2.fillStyle = `rgba(${v},${v},${v},0.5)`; c2.fillRect(hash(i, frameIdx(t), 1) * 192, hash(i, frameIdx(t), 2) * 130, 3, 2); }
    this.tv.update();
    this.tv.glow(1.4 + sn);
    // lamp flickers to the kicks after the drop
    this.room.set(9, 58, 46, -40, 12, 8, 12, [2.4, 1.3, 0.5], 1.5 + (drop ? k * 2 : 0));

    // the two on the couch: chilling, then bouncing on the drop
    const hop = drop ? 4 : 0;
    this.place(this.venmar, f, [-18, 12, -18], { yaw: 0.3, scale: 0.9, hop: V2 ? 0 : hop, energy: drop ? 1.5 : 0.5, moveOpts: { amp: drop ? 1.6 : 0.6 } });
    this.place(this.quest, f, [18, 12, -18], { yaw: -0.3, scale: 0.9, hop: V2 ? 0 : hop, energy: drop ? 1.5 : 0.5, moveOpts: { amp: drop ? 1.6 : 0.6 } });
    if (V2) {
      // v2: actually sitting on the couch (legs forward), grooving in their seats
      this.groundY = 12;
      this.act(this.venmar, 'sit', f.start - 1, { dur: 99, slump: 0.15 });
      this.act(this.quest, 'sit', f.start - 1, { dur: 99, slump: 0.05 });
    }

    // his head around the room: invisible inside, revealed as we pull out
    const headA = prog(t, this.tOut + 0.3, this.L34.start + 1.2);
    this.head.group.visible = headA > 0;
    this.head.group.position.set(0, 40 - (31.5 - 8.5) * HS, -40);
    this.head.group.scale.setScalar(HS);
    this.head.fx({ t, alpha: 0.35 * headA, glow: 2 + bl * 2, tint: [0.05, 0.04, 0.1], tintA: 0.2 });

    // camera
    if (t < this.tDrop - 0.05) {
      const p = prog(t, f.start, this.tDrop);
      this.look([lerp(20, 8, p), 26, lerp(120, 90, p)], [0, 20, -20], { t, fov: 38, hand: 1.2 });
    } else if (t < this.tOut) {
      const cuts = Math.floor(f.beat / 2) % 3;
      const setups: [[number, number, number], [number, number, number], number][] = [
        [[0, 24, 80], [0, 22, -20], 40], [[-55, 50, 60], [0, 18, -20], 44], [[40, 16, 60], [-10, 22, -25], 36]];
      const [pos, tgt, fov] = setups[cuts]!;
      this.look(pos, tgt, { t, fov, hand: 1.5, shake: k * 1.2 });
    } else {
      // pull straight back out: room -> head -> sky
      const p = out;
      this.look([lerp(8, 60, p), lerp(26, 300, p), lerp(90, 1400, p)], [0, lerp(20, 150, p), -40], { t, fov: 40, hand: 1 });
    }
    drawRain(this.fx, t, { center: [-120, 50, 5], size: [80, 120, 120], n: 300, speed: 200, alpha: 0.35 });
    if (drop) drawEmbers(this.fx, t, { center: [0, 30, -10], size: [120, 60, 80], n: 90, speed: 10, col: [2.2, 1.2, 0.4], width: 0.35, alpha: 0.6 });

    // typography
    const c = this.c;
    if (t < this.L33.start - 0.1) dialogueBox(c, this.L32, t, { def: QUEST, accent: 'signal', open: prog(t, f.start, f.start + 0.25), mouth: this.ctx.audio.env('vocal', t) > 0.35 && (frameIdx(t) >> 2) % 2 === 0 });
    else if (t < this.tOut) {
      dialogueBox(c, this.L33, t, { def: QUEST, accent: 'signal', mouth: this.ctx.audio.env('vocal', t) > 0.35 && (frameIdx(t) >> 2) % 2 === 0, alpha: 1 - prog(t, this.L33.end + 1.5, this.L33.end + 1.8) });
    } else if (t < this.tTitle) {
      karaokeLine(c, this.L34, t, { x: 960, y: 930, size: 96, family: F.serif(600, true), align: 'center', sung: rgba('bone', 1), unsung: rgba('bone', 0.2), pop: 10 });
    } else this.title(t);

    return {
      ...(t < this.tTitle ? this.tag(t) : { tagA: 0 }),
      letterbox: t < this.tTitle ? 1 : 0,
      bloom: 0.85,
      ca: 1.6 + k * 2,
      split: drop ? sn * 6 : 0,
      shake: [(hash(frameIdx(t), 1) - 0.5) * (drop ? k * 6 : 0), (hash(frameIdx(t), 2) - 0.5) * (drop ? k * 6 : 0)],
      zoom: 1 + (drop ? k * 0.015 : 0),
      flash: pulse(t, this.tDrop, 0.1) * 0.3 + pulse(t, this.tTitle, 0.1) * 0.4,
      flashColor: [1, 0.7, 0.4],
      gain: [1.06, 1.0, 0.95],
      contrast: 1.08,
      saturation: 1.1,
      leak: 0.1,
      fade: prog(t, f.end - 1.2, f.end - 0.1),
    };
  }

  /** End card. */
  title(t: number) {
    const c = this.c;
    const a = prog(t, this.tTitle, this.tTitle + 0.2, ease.outCubic);
    c.save();
    c.fillStyle = `rgba(3,4,10,${0.8 * a})`;
    c.fillRect(0, 0, 1920, 1080);
    c.globalAlpha = a;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.font = font(F.archivo(125, 900), 150);
    c.fillStyle = rgba('bone', 1);
    c.fillText('FERRUGEM', 960, 420);
    c.fillText('NA FENDA', 960, 560);
    c.font = font(F.mono(600), 34);
    c.letterSpacing = '14px';
    c.fillStyle = rgba('gold', 0.95);
    c.fillText('× COWBELL INFECTION', 960, 640);
    c.restore();
    const n = Math.floor(prog(t, this.tTitle + 0.3, this.tTitle + 1.2) * 14);
    drawPix(c, 'VENMAR', 960 - pixWidth('VENMAR X QUEST', 6) / 2, 740, 6, rgba('cyan', 1), { chars: Math.min(6, n) });
    drawPix(c, 'X', 960 - pixWidth('VENMAR X QUEST', 6) / 2 + pixWidth('VENMAR ', 6), 740, 6, rgba('bone', 0.8), { chars: n > 7 ? 1 : 0 });
    drawPix(c, 'QUEST', 960 - pixWidth('VENMAR X QUEST', 6) / 2 + pixWidth('VENMAR X ', 6), 740, 6, rgba('signal', 1), { chars: Math.max(0, n - 9) });
    const px = 7;
    drawSprite(c, (this.venmar.def), 960 - 520, 700 - 16 * px + 40, px, { alpha: a, blink: (t % 2) < 0.1 });
    drawSprite(c, QUEST, 960 + 520 - 32 * px, 700 - 16 * px + 40, px, { alpha: a, flip: true, blink: (t % 2.4) < 0.1 });
  }
}
