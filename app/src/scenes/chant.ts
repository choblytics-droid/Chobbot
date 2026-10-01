// The chant — "Bad things! Worst things! Say it again! / Inside his head! Where I've always been!"
// Maximum energy: a hard cut on EVERY beat between four setups (Venmar close / Quest close / both wide /
// him, cornered), each with its own sunburst colour; the shouted words stack up huge; snares flash
// inverted frames, the "again"s crunch into pixelation, speed lines on the kicks.
import * as THREE from 'three';
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { Stage } from './_stage';
import { FSPass } from '../engine/gl';
import { VoxelChar } from '../engine/voxel';
import { SHADOW } from '../sprites/sprites';
import { stackWords } from '../engine/kinetic';
import { drawSpeedLines } from '../engine/world';
import { rgba, LIN } from '../engine/palette';
import { hash, frameIdx, pulse, prog, ease, lerp } from '../engine/util';
import type { Line } from '../engine/lyrics';

export default class Chant extends Stage {
  bg = new FSPass(/* glsl */ `
    uniform float uTime, uKick; uniform vec3 uA, uB; uniform float uRot;
    void main() {
      vec2 p = FRAG_PX - vec2(960.0, 560.0);
      float a = atan(p.y, p.x) + uRot;
      float rays = step(0.5, fract(a / TAU * 18.0));
      float r = length(p) / 1100.0;
      vec3 col = mix(uA, uB, rays) * (1.2 - r) * (0.8 + uKick * 0.8);
      col += uB * exp(-r * 6.0) * 0.8;
      fragColor = vec4(col, 1.0);
    }`, { uTime: { value: 0 }, uKick: { value: 0 }, uA: { value: new THREE.Vector3() }, uB: { value: new THREE.Vector3() }, uRot: { value: 0 } });
  him = new VoxelChar(SHADOW);
  lines: Line[] = [];

  build() {
    const ly = this.ctx.lyrics;
    this.lines = [ly.get('Bad things! Worst'), ly.get('Inside his head')];
    this.world.add(this.him.group);
  }

  override background(out: THREE.WebGLRenderTarget) { this.bg.render(this.ctx.renderer, out); }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), sn = this.snare(t);
    const beat = Math.floor(f.beat);
    const setup = ((beat % 4) + 4) % 4;
    const bt = this.ctx.audio.timeOfBeat(beat);
    const cutK = pulse(t, bt, 0.08);
    const sc = (c: [number, number, number], m: number): [number, number, number] => [c[0] * m, c[1] * m, c[2] * m];
    const pal: [[number, number, number], [number, number, number]][] = [
      [sc(LIN.navy, 0.5), sc(LIN.cyan, 0.5)],
      [sc(LIN.blood, 0.4), sc(LIN.signal, 0.5)],
      [sc(LIN.navy, 0.35), sc(LIN.signal, 0.4)],
      [[0.01, 0.0, 0.0], [0.25, 0.01, 0.015]],
    ];
    const [A, B] = pal[setup]!;
    (this.bg.u.uA!.value as THREE.Vector3).set(...A);
    (this.bg.u.uB!.value as THREE.Vector3).set(...B);
    this.bg.u.uKick!.value = k;
    this.bg.u.uRot!.value = t * 0.4 * (setup % 2 ? -1 : 1) + beat * 0.3;

    this.venmar.group.visible = false; this.quest.group.visible = false; this.him.group.visible = false;
    const punch = 1 + 0.12 * cutK;
    const tilt = (hash(beat, 7) - 0.5) * 0.5;
    if (setup === 0) {
      this.place(this.venmar, f, [0, 0, 0], { yaw: tilt, scale: punch, hop: V2 ? 0 : 3, energy: 1.8, move: 'hiphop', moveOpts: { step: 'bodyrock', amp: 1.3 } });
      this.look([0, 20, 55], [0, 19, 0], { fov: 40, roll: tilt * 0.3, t, shake: k * 1.5 });
    } else if (setup === 1) {
      this.place(this.quest, f, [0, 0, 0], { yaw: tilt, scale: punch, hop: V2 ? 0 : 3, energy: 1.8, sing: true, move: 'hiphop', moveOpts: { step: 'shrug', amp: 1.3 } });
      if (V2) this.act(this.quest, 'accuse', bt - 0.02, { dur: 0.25, side: beat % 2 ? 'L' : 'R' });
      this.look([0, 20, 55], [0, 19, 0], { fov: 40, roll: -tilt * 0.3, t, shake: k * 1.5 });
    } else if (setup === 2) {
      this.place(this.venmar, f, [-18, 0, 0], { yaw: 0.4, scale: punch, hop: V2 ? 0 : 5, energy: 1.8, move: 'hiphop', moveOpts: { step: 'twostep', amp: 1.5 } });
      this.place(this.quest, f, [18, 0, 0], { yaw: -0.4, scale: punch, hop: V2 ? 0 : 5, energy: 1.8, sing: true, move: 'hiphop', moveOpts: { step: 'runningman', amp: 1.5 } });
      this.look([0, 26, 100], [0, 16, 0], { fov: 40, t, shake: k * 1.5 });
    } else {
      this.him.group.visible = true;
      this.him.group.position.set((hash(frameIdx(t), 1) - 0.5) * 2, 0, 0);
      this.him.group.rotation.set(0, tilt, (hash(frameIdx(t), 2) - 0.5) * 0.1);
      this.him.group.scale.setScalar(punch);
      this.him.fx({ t, glow: 3, glitch: 0.3 });
      this.look([0, 30, 50], [0, 18, 0], { fov: 44, roll: 0.15, t, shake: 3 });
    }
    drawSpeedLines(this.fx2d, t, k * 0.8 + cutK * 0.5, { col: setup === 1 ? [2, 0.8, 0.3] : [0.6, 1.6, 2.4], seed: beat });

    // the shouted words stacking, alternating colours
    stackWords(this.c, this.lines, t, { x: setup === 2 ? 960 : setup % 2 ? 480 : 1440, y: 900, size: 210, rot: setup % 2 ? 0.07 : -0.07, colors: [rgba('bone', 1), rgba('gold', 1), rgba('cyan', 1), rgba('signal', 1)], max: 5 });

    const again = this.lines[0]!.words.find((w) => /again/i.test(w.w));
    const crunch = again ? prog(t, again.start, again.start + 0.05) * (1 - prog(t, again.end, again.end + 0.2)) : 0;
    return {
      tag: this.tag(t).tag, tagA: this.tag(t).tagA, tagColor: this.tag(t).tagColor,
      bloom: 0.9,
      ca: 3 + k * 5,
      split: sn * 18 + cutK * 10,
      invert: sn > 0.6 && beat % 2 === 1 ? 0.85 : 0,
      pixelate: crunch > 0 ? lerp(1, 12, crunch) : 0,
      glitch: cutK * 0.3 + crunch * 0.4,
      flash: cutK * 0.2,
      shake: [(hash(frameIdx(t), 3) - 0.5) * k * 16, (hash(frameIdx(t), 4) - 0.5) * k * 16],
      zoom: 1 + k * 0.04 + cutK * 0.05,
      rot: tilt * 0.05,
      contrast: 1.15,
      saturation: 1.2,
      grain: 0.07,
      vignette: 0.5,
      scan: 0.15,
      exposure: 1 + prog(t, f.end - 0.4, f.end, ease.inExpo) * 2,
    };
  }
}
