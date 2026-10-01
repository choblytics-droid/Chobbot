// Verse A1, lines 1-4 — "He's running his mouth… rusty knife… evil, toxic… why is he obsessed with me?"
// Venmar on a rusted rooftop in the rain, the rift burning across the sky. "Him" (the hooded shadow)
// runs along the far rooftops. Shots: crane down from the rift -> face close-up + knife slash ->
// 180° orbit while his accusations get stamped around her -> push-in on the shrug.
import * as THREE from 'three';
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { Stage, type V3 } from './_stage';
import { City, Surface, makeRoof, drawRain, drawEmbers } from '../engine/world';
import { VoxelChar } from '../engine/voxel';
import { SHADOW } from '../sprites/sprites';
import { karaokeLine, slamWord } from '../engine/kinetic';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

export default class Run extends Stage {
  city = new City({ seed: 3, count: 240, clear: 90 });
  street = new Surface(5000, { y: -140 });
  roof = makeRoof(140, 110, 0, { rust: 1 });
  him = new VoxelChar(SHADOW);
  L0!: Line; L1!: Line; L2!: Line; L3!: Line;

  build() {
    this.city.group.position.y = -60;
    this.world.add(this.city.group, this.street.mesh, this.roof.group, this.him.group);
    const ly = this.ctx.lyrics;
    this.L0 = ly.get('running his mouth'); this.L1 = ly.get('rusty knife'); this.L2 = ly.get('evil'); this.L3 = ly.get('so bad');
  }

  update(f: Frame): PostOverrides {
    const t = f.t, A = this.ctx.audio;
    const k = this.kick(t), sn = this.snare(t), bl = this.bell(t);
    const knife = this.L1.words.find((w) => /knife/i.test(w.w))!;
    const kt = knife.start;
    this.sky.set({ t, rift: 0.9 + 0.3 * bl, pulse: k * 0.6, storm: pulse(t, kt, 0.1) * 0.5 + pulse(t, this.L3.start, 0.2) * 0.25, clouds: 0.7, stars: 1,
      top: [0.002, 0.004, 0.022], horizon: [0.03, 0.014, 0.05], glow: [0.16, 0.035, 0.03] });
    this.city.set({ t, pulse: k, win: 0.55, fogNear: 200, fogFar: 1300 });
    this.street.set({ t, pulse: k });
    this.roof.top.set({ t, wet: 1, pulse: k, fogNear: 300, fogFar: 2000 });

    // Venmar centre of the roof; "him" far away on a lower roof, running (bob) along x
    const vpos: V3 = [0, 0, 0];
    this.place(this.venmar, f, vpos, { yaw: 0, scale: 1, energy: 0.8 + k * 0.5, move: 'idle' });
    if (V2) {
      this.groundY = 0;
      // flinch on the knife slash; brush the accusations off (shoulder bounce) through the stamps
      this.act(this.venmar, 'recoil', kt);
      this.act(this.venmar, 'hiphop', this.L2.start - 0.1, { step: 'shrug', amp: 0.8, dur: this.L3.start - this.L2.start, fade: 0.3 });
    }
    const runX = lerp(-420, 420, prog(t, this.L0.start - 1, this.L2.start + 1));
    this.him.group.visible = t < this.L3.start;
    this.him.group.position.set(runX, -40 + Math.abs(Math.sin(t * 11)) * 5, -520);
    this.him.group.rotation.set(0, Math.PI / 2, Math.sin(t * 11) * 0.12);
    this.him.group.scale.setScalar(1.3);
    this.him.pose({ blink: false });
    this.him.fx({ t, glow: 1.5 });

    const wf: PostOverrides = { ...this.tag(t), letterbox: 1, grain: 0.06 };
    const shotB = this.L1.start - 0.1, shotC = this.L2.start - 0.1, shotD = this.L3.start - 0.1;
    if (t < shotB) {
      // crane down from the sky onto her back, the runner in frame beyond
      // tilt down from the rift onto her back, while craning down
      const p = prog(t, f.start, shotB, ease.inOutCubic);
      const tilt = prog(t, f.start, f.start + 2.2, ease.inOutCubic);
      this.look([lerp(-30, -14, p), lerp(90, 30, p), lerp(120, 62, p)], [0, lerp(260, 14, tilt), lerp(-600, -60, tilt)], { t, hand: 2, fov: 42 });
      this.venmar.group.rotation.y = Math.PI; // facing the city
      this.lyricBottom(t, this.L0);
    } else if (t < shotC) {
      // low close-up, slow push; slash on "knife"
      const p = prog(t, shotB, shotC);
      this.look([lerp(-26, -18, p), 9, lerp(52, 40, p)], [0, 19, 0], { t, hand: 1.2, fov: 34, roll: -0.08 });
      this.lyricBottom(t, this.L1);
      const s = prog(t, kt - 0.02, kt + 0.12, ease.outExpo);
      if (t > kt - 0.02 && t < kt + 0.5) {
        const fade = 1 - prog(t, kt + 0.12, kt + 0.5);
        const x0 = lerp(-200, 2100, s), y0 = lerp(1150, -80, s);
        this.fx2d.seg2(-200, 1150, x0, y0, 10 * fade + 2, [4, 3.6, 3.2], fade);
        this.fx2d.seg2(-200, 1150, x0, y0, 40 * fade, [2.5, 0.5, 0.15], fade * 0.5);
      }
    } else if (t < shotD) {
      // 180° orbit; his words get stamped around her in red
      const p = prog(t, shotC, shotD, ease.inOutQuad);
      this.orbit([0, 16, 0], lerp(-0.6, Math.PI - 0.5, p), 0.12, 72, { t, hand: 1.5, fov: 38 });
      this.stamps(t);
    } else {
      // push-in on the shrug: "why is he obsessed with me?"
      const p = prog(t, shotD, f.end, ease.outCubic);
      this.orbit([0, 21, 0], 0.25, 0.02, lerp(62, 40, p), { t, hand: 0.8, fov: 36 });
      if (V2) this.act(this.venmar, 'hiphop', shotD, { step: 'shrug', amp: 1.4 });
      this.venmar.parts.wingL?.rotation.set(0, 0.9, 0.9);
      this.venmar.parts.wingR?.rotation.set(0, -0.9, -0.9);
      slamWord(this.c, this.L3, t, { cx: 960, cy: 250, size: 130, color: rgba('bone', 1), context: true, maxW: 1500 });
    }

    // rain + roof-edge embers
    drawRain(this.fx, t, { center: [this.cam.position.x, this.cam.position.y, this.cam.position.z - 60], size: [220, 180, 200], n: 1400, speed: 240, len: 8, width: 0.16, alpha: 0.45 });
    drawEmbers(this.fx, t, { center: [0, 20, -40], size: [160, 60, 40], n: 60, speed: 12, width: 0.4 });

    return {
      ...wf,
      bloom: 0.75,
      ca: 1.6 + k * 2,
      split: pulse(t, kt, 0.08) * 18 + k * 2,
      glitch: pulse(t, kt, 0.07) * 0.45,
      flash: pulse(t, kt, 0.04) * 0.25 + pulse(t, f.start, 0.08) * 0.3,
      flashColor: [1.0, 0.45, 0.2],
      shake: [pulse(t, kt, 0.1) * 30 * (hash(frameIdx(t), 7) - 0.5), pulse(t, kt, 0.1) * 30 * (hash(frameIdx(t), 8) - 0.5)],
      zoom: 1 + k * 0.012 + sn * 0.008,
      gain: [0.95, 1.0, 1.08],
      lift: [0.0, 0.002, 0.006],
      contrast: 1.08,
      saturation: 1.1,
    };
  }

  lyricBottom(t: number, l: Line) {
    karaokeLine(this.c, l, t, { x: 110, y: 1080 - 138 - 44, size: 64, family: F.archivo(100, 800), sung: rgba('bone', 1), unsung: rgba('bone', 0.3), maxW: 1700 });
  }

  /** His accusations ('EVIL', 'TOXIC', 'HURTS PEOPLE') slam in as tilted red stamps as they are sung. */
  stamps(t: number) {
    const c = this.c;
    const words = this.L2.words;
    const slots: [number, number, number][] = [[520, 330, -0.18], [1400, 300, 0.12], [480, 760, 0.1], [1450, 740, -0.14], [960, 200, -0.04], [960, 860, 0.06]];
    let si = 0;
    for (const w of words) {
      const clean = w.w.replace(/[“”"!,]/g, '').toUpperCase();
      if (!/EVIL|TOXIC|HURTS|PEOPLE|TOO/.test(clean)) continue;
      const [x, y, r] = slots[si++ % slots.length]!;
      if (t < w.start) continue;
      const k = prog(t, w.start, w.start + 0.1, ease.outBack);
      const s = lerp(2.2, 1, k);
      c.save();
      c.translate(x, y);
      c.rotate(r);
      c.scale(s, s);
      c.globalAlpha = clamp(k * 1.5);
      c.font = font(F.archivo(125, 900), 120);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const tw = c.measureText(clean).width;
      c.strokeStyle = rgba('#ff2030', 0.95);
      c.lineWidth = 10;
      c.strokeRect(-tw / 2 - 30, -80, tw + 60, 160);
      c.fillStyle = rgba('#ff2030', 0.95);
      c.fillText(clean, 0, 6);
      c.restore();
    }
    // the line itself, small, as the "quote"
    karaokeLine(this.c, this.L2, t, { x: 960, y: 1080 - 138 - 50, size: 48, family: F.mono(500), align: 'center', sung: rgba('bone', 0.95), unsung: rgba('bone', 0.3) });
  }
}
