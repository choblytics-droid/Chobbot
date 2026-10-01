// Verse A2, lines 9-12 — "He told me everything!… / I'm the ghost in his mind, I'm the beautiful curse. /
// I've heard of you!… keep the legend alive. / I hope I'm the reason he can barely survive!"
// Found footage inside his mind: an endless corridor walled with CRT monitors, camcorder REC overlay.
// The screens go NO SIGNAL -> her face -> LEGEND posters; Venmar drifts through as a hologram ghost;
// finally his HP bar drains while an EKG line races across and he runs off down the corridor.
import * as THREE from 'three';
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { Stage } from './_stage';
import { Boxes, VoxelChar, Billboard } from '../engine/voxel';
import { SHADOW, VENMAR, drawSprite } from '../sprites/sprites';
import { slamWord, karaokeLine } from '../engine/kinetic';
import { drawPix } from '../engine/pixelfont';
import { rgba } from '../engine/palette';
import { F } from '../engine/type';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

const ROWS = 3, COLS = 14, SW = 16, SH = 12, GAP = 2.5, HALF = 26;

export default class Ghost extends Stage {
  tv = new Boxes(ROWS * COLS * 2 + 40);
  screen = new Billboard(SW, SH, 256, 192, { pixelated: true });
  screens: THREE.Mesh[] = [];
  him = new VoxelChar(SHADOW);
  L8!: Line; L9!: Line; L10!: Line; L11!: Line;

  build() {
    this.useSky = false;
    this.clearCol = [0.001, 0.001, 0.003];
    const ly = this.ctx.lyrics;
    this.L8 = ly.get('He told me everything', 0); this.L9 = ly.get('ghost in his mind'); this.L10 = ly.get('heard of you'); this.L11 = ly.get('barely survive');
    this.world.add(this.tv.mesh, this.him.group);
    // two walls of monitors along -z, floor and ceiling
    for (const side of [-1, 1]) {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const z = -c * (SW + GAP) - 20, y = 8 + r * (SH + GAP);
        this.tv.add(side * (HALF + 2), y, z, 3, SH + 2, SW + 2, [0.02, 0.02, 0.025], 0);
        const m = new THREE.Mesh(this.screen.mesh.geometry, this.screen.mat);
        m.position.set(side * HALF, y, z);
        m.rotation.y = -side * Math.PI / 2;
        this.screens.push(m);
        this.world.add(m);
      }
    }
    this.tv.add(0, -0.5, -COLS * (SW + GAP) / 2, HALF * 2 + 6, 1, COLS * (SW + GAP) + 60, [0.006, 0.006, 0.01], 0);
    this.tv.add(0, 8 + ROWS * (SH + GAP), -COLS * (SW + GAP) / 2, HALF * 2 + 6, 1, COLS * (SW + GAP) + 60, [0.004, 0.004, 0.008], 0);
    // ceiling strip lights
    for (let i = 0; i < 10; i++) this.tv.add(0, 7 + ROWS * (SH + GAP), -i * 28 - 10, 2, 0.5, 12, [2.2, 2.4, 2.8], 1.2);
    this.tv.owner.look({ ambTop: [0.05, 0.06, 0.1], keyCol: [0.3, 0.35, 0.5], fogCol: [0.001, 0.001, 0.004], fogNear: 60, fogFar: 330 });
    this.venmar.look({ fogCol: [0.001, 0.001, 0.004], fogNear: 60, fogFar: 330 });
    this.him.look({ fogCol: [0.001, 0.001, 0.004], fogNear: 80, fogFar: 380 });
  }

  /** What the monitors show, per phase. */
  drawScreen(t: number, phase: number) {
    const c = this.screen.ctx, fi = frameIdx(t);
    c.fillStyle = '#05070c';
    c.fillRect(0, 0, 256, 192);
    if (phase === 0) {
      for (let i = 0; i < 900; i++) { const v = Math.floor(hash(i, fi) * 200); c.fillStyle = `rgb(${v},${v},${v + 20})`; c.fillRect(hash(i, fi, 1) * 256, hash(i, fi, 2) * 192, 4, 3); }
      drawPix(c, 'NO SIGNAL', 128 - 53, 84, 2, '#dfe8ff');
    } else if (phase === 1) {
      drawSprite(c, VENMAR, 128 - 80, 96 - 80, 5, { blink: (t % 1.7) < 0.1 });
      c.fillStyle = 'rgba(67,193,238,0.18)';
      c.fillRect(0, 0, 256, 192);
    } else {
      c.fillStyle = '#e8dcc0';
      c.fillRect(12, 8, 232, 176);
      drawPix(c, 'LEGEND', 128 - 35, 16, 2, '#6a1a08');
      drawSprite(c, VENMAR, 128 - 48, 40, 3);
      drawPix(c, 'ALIVE', 128 - 29, 150, 2, '#6a1a08');
    }
    // scanlines + roll bar
    for (let y = 0; y < 192; y += 3) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, y, 256, 1); }
    const roll = ((t * 60) % 192);
    c.fillStyle = 'rgba(255,255,255,0.06)';
    c.fillRect(0, roll, 256, 18);
    this.screen.update();
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), sn = this.snare(t), bl = this.bell(t);
    const phase = t < this.L9.start - 0.05 ? 0 : t < this.L10.start - 0.05 ? 1 : 2;
    this.drawScreen(t, phase);
    this.screen.glow(1.6 + 1.2 * bl + pulse(t, this.L9.start, 0.1) * 3);

    // ghost Venmar: floats down the corridor toward the camera, flickering; solid for a beat on "curse"
    const curse = this.L9.words.find((w) => /curse/i.test(w.w))!.start;
    const zG = lerp(-240, -30, prog(t, this.L8.start, this.L11.start));
    this.place(this.venmar, f, [Math.sin(t * 0.9) * 6, 6 + Math.sin(t * 2) * 3, zG], { yaw: Math.sin(t * 0.7) * 0.4, scale: 0.9, energy: 1.2, move: 'fly', moveOpts: { h: 0, rate: 1.6 } });
    if (V2) this.act(this.venmar, 'spin', curse - 0.2, { dur: 0.8 });
    const flick = hash(frameIdx(t) >> 1, 5) > 0.15 ? 1 : 0.3;
    const solid = pulse(t, curse, 0.25);
    this.venmar.fx({ t, ghost: clamp(1 - solid), alpha: (phase === 0 ? 0.35 : 0.95) * flick, glitch: sn * 0.15 + pulse(t, this.L9.start, 0.2), glow: 1.2 });

    // him: appears at the far end on the last line and runs away (grows smaller)
    const run = prog(t, this.L11.start - 0.3, f.end);
    this.him.group.visible = run > 0;
    this.him.group.position.set(Math.sin(t * 14) * 1.5, Math.abs(Math.sin(t * 14)) * 2, lerp(-120, -300, run));
    this.him.group.rotation.set(0, 0, Math.sin(t * 14) * 0.15);
    this.him.fx({ t, glow: 3 });

    // camera: handheld dolly down the corridor; on the chorus lines cut between angles every 2 beats
    const dolly = lerp(40, -60, prog(t, f.start, f.end));
    const cutN = Math.floor(f.beat / 2) % 3;
    if (phase === 0 || t > this.L11.start - 0.1) {
      this.look([0, 18, dolly], [0, 16, dolly - 100], { t, hand: 3, fov: 50, shake: k * 0.8 });
    } else if (cutN === 0) {
      this.look([-14, 10, zG + 45], [0, 20, zG], { t, hand: 2, fov: 44, roll: -0.1 });
    } else if (cutN === 1) {
      this.look([16, 30, zG - 50], [0, 14, zG], { t, hand: 2, fov: 46, roll: 0.08 });
    } else {
      this.look([0, 6, zG + 30], [0, 22, zG], { t, hand: 1.5, fov: 56 });
    }

    // typography: found-footage captions (mono) for the quotes; slam on the ghost line
    const cap = this.c;
    if (phase === 0) karaokeLine(cap, this.L8, t, { x: 960, y: 900, size: 44, family: F.mono(500), align: 'center', sung: rgba('bone', 0.95), unsung: rgba('bone', 0.25) });
    else if (phase === 1) slamWord(cap, this.L9, t, { cx: 960, cy: 260, size: 170, color: rgba('bone', 1), context: true, maxW: 1500, jitter: 6 });
    else if (t < this.L11.start - 0.05) karaokeLine(cap, this.L10, t, { x: 960, y: 900, size: 54, family: F.archivo(100, 800), align: 'center', sung: rgba('gold', 1), unsung: rgba('bone', 0.25) });
    else this.survive(t);

    return {
      ...this.tag(t),
      rec: 1,
      scan: 0.35,
      bloom: 0.8,
      ca: 2.4 + k * 3,
      split: sn * 8 + pulse(t, this.L9.start, 0.1) * 30,
      glitch: pulse(t, this.L9.start, 0.15) * 0.8 + sn * 0.12 + pulse(t, this.L10.start, 0.1) * 0.5,
      grain: 0.09,
      vignette: 0.75,
      shake: [(hash(frameIdx(t), 1) - 0.5) * k * 10, (hash(frameIdx(t), 2) - 0.5) * k * 10],
      zoom: 1 + k * 0.02,
      gain: [0.85, 1.0, 1.15],
      saturation: 0.9,
      contrast: 1.15,
    };
  }

  /** "barely survive": his HP bar drains to 1, an EKG trace races across, the line in pixel font. */
  survive(t: number) {
    const c = this.c;
    const p = prog(t, this.L11.start, this.L11.end, ease.outCubic);
    const hp = Math.max(1, Math.round(lerp(100, 1, p)));
    drawPix(c, 'HIM', 160, 200, 5, rgba('#ff2030', 1), { shadow: 'rgba(0,0,0,0.7)' });
    c.fillStyle = 'rgba(0,0,0,0.6)';
    c.fillRect(270, 196, 620, 44);
    c.fillStyle = hp < 20 ? ((frameIdx(t) >> 3) % 2 ? '#ff2030' : '#ffd0d0') : '#3fe03a';
    c.fillRect(276, 202, 608 * (hp / 100), 32);
    drawPix(c, `HP ${hp}/100`, 920, 202, 5, rgba('bone', 1), { shadow: 'rgba(0,0,0,0.7)' });
    // EKG
    const x1 = 1920 * prog(t, this.L11.start, this.L11.start + 2.4);
    const lb = this.fx2d;
    let px = 0, py = 760;
    for (let x = 0; x <= x1; x += 8) {
      const ph = (x % 300) / 300;
      const amp = lerp(1, 0.15, x / 1920);
      const y = 760 - (ph > 0.4 && ph < 0.44 ? 160 * amp : ph > 0.44 && ph < 0.48 ? -90 * amp : ph > 0.6 && ph < 0.7 ? 20 * amp : 0);
      if (x > 0) lb.seg2(px, py, x, y, 3, [0.4, 3.0, 0.5], 1);
      px = x; py = y;
    }
    karaokeLine(c, this.L11, t, { x: 960, y: 930, size: 50, family: F.mono(600), align: 'center', sung: rgba('bone', 1), unsung: rgba('bone', 0.25), upper: true });
  }
}
