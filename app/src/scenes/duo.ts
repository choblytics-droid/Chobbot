// Break 2 (melodic transition, ~4 bars) — both of them, together, on the highest rooftop under the rift.
// A full 360° orbit that speeds up into the drop, both hopping on the beats (wings flapping, tail wagging),
// lightning on the cowbells, the title card "VENMAR × QUEST" slammed on the bar lines.
import type { Frame, PostOverrides } from '../engine/scene';
import { V2 } from '../config';
import { RoofProps, drawSplashes } from '../engine/dressing';
import { Stage } from './_stage';
import { City, Surface, makeRoof, drawEmbers } from '../engine/world';
import { F, font } from '../engine/type';
import { rgba } from '../engine/palette';
import { drawPix, pixWidth } from '../engine/pixelfont';
import { ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';

export default class Duo extends Stage {
  city = new City({ seed: 44, count: 320, clear: 110, minH: 40, maxH: 300, groundY: -300 });
  street = new Surface(6000, { y: -300 });
  roof = makeRoof(110, 110, 0, { rust: 1 });
  bars: number[] = [];

  dress = V2 ? new RoofProps(110, 110, 0, { seed: 8, keep: [[0, 0, 36]], neon: [2.4, 0.3, 1.6] }) : null;

  build() {
    if (this.dress) this.world.add(this.dress.boxes.mesh);
    this.world.add(this.city.group, this.street.mesh, this.roof.group);
    this.bars = this.ctx.audio.downbeats.filter((d) => d >= this.ctx.start - 0.05 && d < this.ctx.end);
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), bl = this.bell(t), sn = this.snare(t);
    const p = prog(t, f.start, f.end);
    this.sky.set({ t, rift: 1.3 + bl * 0.6, pulse: k + bl, storm: bl * 0.35, clouds: 1, stars: 1, top: [0.003, 0.004, 0.02], horizon: [0.04, 0.016, 0.05], glow: [0.14, 0.04, 0.05] });
    this.city.set({ t, pulse: k + bl, win: 0.7, fogNear: 300, fogFar: 1800 });
    this.street.set({ t, pulse: k });
    this.roof.top.set({ t, wet: 0.9, pulse: k });

    const barIdx = this.bars.filter((b) => b <= t).length;
    // v2: both dance the hip-hop routine, in canon (different variants), spin + freeze on the phrase end
    this.place(this.venmar, f, [-20, 0, 0], { yaw: 0.35, scale: 1, hop: V2 ? 0 : 6, energy: 1.5, sing: false, move: 'hiphop', moveOpts: { amp: 1.1, variant: 0 } });
    this.place(this.quest, f, [20, 0, 0], { yaw: -0.35, scale: 1, hop: V2 ? 0 : 6, energy: 1.5, sing: false, move: 'hiphop', moveOpts: { amp: 1.1, variant: 1 } });
    if (V2) this.groundY = 0;

    // orbit: accelerating (ease-in) full turn, rising slightly
    const yaw = lerp(-0.4, Math.PI * 2 - 0.4, ease.inOutCubic(p));
    this.orbit([0, 18, 0], yaw, lerp(0.05, 0.28, p), lerp(120, 90, p), { t, fov: 42, hand: 1, shake: k * 0.8 });
    this.dress?.update(t);
    drawEmbers(this.fx, t, { center: [0, 30, 0], size: [200, 80, 200], n: 160, speed: 25, width: 0.45, col: [2.4, 0.9, 0.3] });
    drawEmbers(this.fx, t, { center: [0, 30, 0], size: [200, 80, 200], n: 100, speed: 20, width: 0.4, col: [0.4, 1.6, 2.6], seed: 9 });

    // title slams on the bar lines: VENMAR / × / QUEST / VENMAR × QUEST
    const c = this.c;
    const lastBar = this.bars[barIdx - 1] ?? f.start;
    const s = prog(t, lastBar, lastBar + 0.12, ease.outBack);
    const words = ['VENMAR', '×', 'QUEST', 'VENMAR × QUEST'];
    const w = words[Math.min(words.length - 1, Math.max(0, barIdx - 1))]!;
    const col = w === 'VENMAR' ? rgba('cyan', 1) : w === 'QUEST' ? rgba('signal', 1) : rgba('bone', 1);
    c.save();
    c.translate(960, 540 + (w.length > 8 ? 360 : 330));
    c.scale(lerp(1.8, 1, s), lerp(1.8, 1, s));
    c.font = font(F.archivo(125, 900), w.length > 8 ? 120 : 160);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.globalAlpha = Math.min(1, s * 2);
    c.fillStyle = col;
    c.fillText(w, 0, 0);
    c.restore();
    const sub = 'THE GHOST AND THE INFECTION';
    drawPix(c, sub, 960 - pixWidth(sub, 4) / 2, 170, 4, rgba('bone', 0.7), { chars: Math.floor(prog(t, f.start + 0.3, f.start + 1.5) * sub.length) });

    return {
      letterbox: 1,
      bloom: 0.9,
      ca: 2 + k * 3,
      split: sn * 6 + pulse(t, lastBar, 0.08) * 16,
      flash: pulse(t, lastBar, 0.06) * 0.35 + bl * 0.1,
      flashColor: [0.9, 0.8, 1.0],
      shake: [(hash(frameIdx(t), 1) - 0.5) * k * 8, (hash(frameIdx(t), 2) - 0.5) * k * 8],
      zoom: 1 + k * 0.02,
      rot: Math.sin(p * Math.PI) * 0.03,
      contrast: 1.1,
      saturation: 1.15,
      glitch: pulse(t, f.end - 0.08, 0.05) * 0.8,
    };
  }
}
