// Verse B2, lines 21-24 — "He told me everything! – Yeah, I bet he did. / I hope it was the worst, I hope
// nothing stayed hid. / I hope he painted me as dark as the night. / Because I'm the ghost in his head,
// stealing his light." Quest perched on a rooftop edge over the lit city. On "painted me as dark" a
// huge black brush stroke sweeps the frame and the world comes back night-black (only the rift and his
// red eyes). On "stealing his light" every lit window streams into her as light trails; she blazes.
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { Stage } from './_stage';
import { City, Surface, makeRoof, drawRain } from '../engine/world';
import { dialogueBox, slamWord } from '../engine/kinetic';
import { QUEST } from '../sprites/sprites';
import { rgba } from '../engine/palette';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

export default class Night extends Stage {
  city = new City({ seed: 33, count: 300, clear: 120, minH: 60, maxH: 460, groundY: -200 });
  street = new Surface(6000, { y: -200 });
  roof = makeRoof(90, 70, 0);
  L20!: Line; L21!: Line; L22!: Line; L23!: Line;
  tDark = 0; tSteal = 0;
  lights: [number, number, number][] = [];

  build() {
    const ly = this.ctx.lyrics;
    this.L20 = ly.get('I bet he did'); this.L21 = ly.get('nothing stayed hid'); this.L22 = ly.get('dark as the night'); this.L23 = ly.get('stealing his light');
    this.tDark = this.L22.words.find((w) => /dark/i.test(w.w))!.start;
    this.tSteal = this.L23.words.find((w) => /stealing/i.test(w.w))!.start;
    this.world.add(this.city.group, this.street.mesh, this.roof.group);
    // light sources for the steal: random points on building faces around
    for (let i = 0; i < 260; i++) {
      const a = hash(i, 1) * Math.PI * 2, r = 180 + hash(i, 2) * 700;
      this.lights.push([Math.cos(a) * r, -150 + hash(i, 3) * 400, Math.sin(a) * r - 200]);
    }
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), sn = this.snare(t), bl = this.bell(t);
    const dark = prog(t, this.tDark + 0.25, this.tDark + 0.5);
    const steal = prog(t, this.tSteal, this.L23.end, ease.inOutQuad);
    this.sky.set({ t, rift: lerp(0.9, 0.6, dark) + bl * 0.3, pulse: k, clouds: lerp(0.9, 0.2, dark), stars: lerp(0.5, 1.5, dark),
      top: [0.003, 0.004, 0.02], horizon: [0.04 * (1 - dark * 0.8), 0.015 * (1 - dark * 0.8), 0.04 * (1 - dark * 0.8)], glow: [0.18 * (1 - dark), 0.05 * (1 - dark), 0.03] });
    this.city.set({ t, pulse: k * (1 - dark), win: lerp(0.65, -2.4, Math.max(dark * 0.3, steal)), fogNear: 250, fogFar: 1600, fog: [0.02 * (1 - dark), 0.01 * (1 - dark), 0.025 * (1 - dark * 0.7)] });
    this.street.set({ t, pulse: k, wet: 1 - dark * 0.7 });
    this.roof.top.set({ t, wet: 0.6 });

    // Quest on the roof edge, swinging her tail; glows as she steals the light
    this.place(this.quest, f, [0, 0, 20], { yaw: Math.PI + 0.3 + Math.sin(t * 0.4) * 0.15, scale: 1, energy: 0.8, move: V2 ? 'idle' : undefined });
    if (V2) {
      // perched on the roof edge, legs over; she rises and folds her arms on "stealing his light"
      this.groundY = 0;
      this.act(this.quest, 'sit', f.start - 1, { dur: this.tSteal - f.start + 0.6, slump: 0.25 });
      this.act(this.quest, 'stance', this.tSteal + 0.3, { dur: 9 });
    }
    this.quest.fx({ t, glow: 1 + steal * 3, flash: steal * 0.25 + pulse(t, this.L23.end, 0.3) * 0.6 });

    // light trails: lit windows streaming into her
    if (steal > 0) {
      const target: [number, number, number] = [0, 16, 20];
      this.lights.forEach(([x, y, z], i) => {
        const s = clamp(steal * 1.6 - hash(i, 7) * 0.6);
        if (s <= 0) return;
        const e = ease.inCubic(s);
        const hx = lerp(x, target[0], e), hy = lerp(y, target[1], e), hz = lerp(z, target[2], e);
        const tl = 0.08;
        const e2 = ease.inCubic(Math.max(0, s - tl));
        const tx = lerp(x, target[0], e2), ty = lerp(y, target[1], e2), tz = lerp(z, target[2], e2);
        const col: [number, number, number] = hash(i, 4) > 0.3 ? [3.0, 1.1, 0.3] : [0.5, 1.8, 2.8];
        this.fx.seg(tx, ty, tz, hx, hy, hz, 1.2 + 1.5 * hash(i, 5), col[0], col[1], col[2], 1 - s * 0.5);
      });
    }

    // camera: behind her over the city, slow push; dark: pull back wide; steal: circle to her face
    if (t < this.tDark) {
      const p = prog(t, f.start, this.tDark);
      this.look([lerp(-40, -25, p), lerp(40, 34, p), lerp(110, 85, p)], [0, lerp(10, 20, p), -400], { t, fov: 40, hand: 1.5, shake: k * 0.5 });
    } else if (t < this.tSteal - 0.1) {
      const p = prog(t, this.tDark, this.tSteal);
      this.look([lerp(60, 90, p), 70, lerp(160, 200, p)], [0, 10, -100], { t, fov: 44, hand: 1.2 });
    } else {
      const p = prog(t, this.tSteal, f.end, ease.inOutCubic);
      this.orbit([0, 16, 20], lerp(0.9, Math.PI - 0.3, p) + Math.PI, 0.1, lerp(130, 60, p), { t, fov: 40, hand: 1, shake: steal * 2 });
    }
    drawRain(this.fx, t, { center: [this.cam.position.x, this.cam.position.y, this.cam.position.z - 50], size: [180, 150, 180], n: 700, speed: 240, alpha: 0.3 * (1 - dark) + 0.05 });

    // typography: dialogue box for the two first lines, slams for the last two; the brush stroke on "dark"
    const c = this.c;
    if (t < this.L22.start - 0.1) {
      const line = t < this.L21.start - 0.05 ? this.L20 : this.L21;
      dialogueBox(c, line, t, { def: QUEST, accent: 'signal', open: prog(t, f.start, f.start + 0.25), mouth: this.ctx.audio.env('vocal', t) > 0.35 && (frameIdx(t) >> 2) % 2 === 0 });
    } else {
      const line = t < this.L23.start - 0.05 ? this.L22 : this.L23;
      slamWord(c, line, t, { cx: 960, cy: 260, size: 150, color: line === this.L23 ? rgba('ember', 1) : rgba('bone', 1), context: true, maxW: 1500 });
    }
    this.brush(t);

    return {
      ...this.tag(t),
      letterbox: 1,
      bloom: 0.8 + steal * 0.5,
      ca: 1.6 + k * 2,
      split: sn * 4,
      shake: [(hash(frameIdx(t), 1) - 0.5) * (k * 5 + steal * 6), (hash(frameIdx(t), 2) - 0.5) * (k * 5 + steal * 6)],
      zoom: 1 + k * 0.012,
      flash: pulse(t, this.L23.end, 0.25) * 0.8,
      flashColor: [1.0, 0.6, 0.25],
      gain: [1.08, 1.0, 0.92],
      contrast: 1.1 + dark * 0.1,
      saturation: 1.1,
      glitch: pulse(t, this.tDark + 0.4, 0.08) * 0.4,
    };
  }

  /** A giant dry-brush stroke of ink crossing the frame on "dark", then peeling away. */
  brush(t: number) {
    const a = prog(t, this.tDark - 0.05, this.tDark + 0.35, ease.inOutCubic);
    const out = prog(t, this.tDark + 0.4, this.tDark + 0.8, ease.inCubic);
    if (a <= 0 || out >= 1) return;
    const c = this.c;
    c.save();
    c.globalAlpha = 1 - out;
    const x1 = lerp(-300, 2300, a);
    for (let i = 0; i < 70; i++) {
      const y = 540 + (i - 35) * 26 + Math.sin(i * 1.7) * 10;
      const w = 30 + hash(i, 3) * 12;
      const start = -300 + hash(i, 1) * 200;
      const end = x1 - hash(i, 2) * 260;
      if (end <= start) continue;
      c.fillStyle = `rgba(2,2,6,${0.85 + 0.15 * hash(i, 4)})`;
      c.beginPath();
      c.moveTo(start, y - w / 2 + (start - 960) * -0.12);
      c.lineTo(end, y - w / 2 + (end - 960) * -0.12 + Math.sin(end * 0.01 + i) * 6);
      c.lineTo(end - 20, y + w / 2 + (end - 960) * -0.12);
      c.lineTo(start, y + w / 2 + (start - 960) * -0.12);
      c.fill();
    }
    c.restore();
  }
}
