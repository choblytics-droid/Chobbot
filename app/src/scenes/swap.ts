// Break 1 (melodic transition, ~3 bars) — the mic passes from Venmar (singer A) to Quest (singer B).
// A fighting-game select screen: diagonal split background (cyan | orange) with halftone speed pattern,
// Venmar turning on the left pedestal; "PLAYER 2 HAS ENTERED" and Quest slams down on the right; the
// grade swings from cyan to orange; name plates and silly stat bars in pixel font.
import * as THREE from 'three';
import type { Frame, PostOverrides } from '../engine/scene';
import { Stage } from './_stage';
import { FSPass } from '../engine/gl';
import { Boxes } from '../engine/voxel';
import { drawPix, pixWidth } from '../engine/pixelfont';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';

export default class Swap extends Stage {
  bg = new FSPass(/* glsl */ `
    uniform float uTime, uSplit, uKick, uQ;
    void main() {
      vec2 p = FRAG_PX;
      float diag = p.x - 960.0 - (p.y - 540.0) * 0.35 - uSplit;
      vec3 a = C_NAVY * 0.35, b = C_BLOOD * 0.4;
      vec3 col = diag < 0.0 ? a : b;
      // halftone speed dots streaming away from the split
      vec2 g = p / 18.0;
      g.x += (diag < 0.0 ? 1.0 : -1.0) * uTime * 6.0;
      vec2 f = fract(g) - 0.5;
      float r = 0.18 + 0.28 * smoothstep(900.0, 0.0, abs(diag));
      float dotv = smoothstep(r, r - 0.08, length(f));
      col += (diag < 0.0 ? C_CYAN : C_SIGNAL) * dotv * 0.25 * (0.6 + uKick);
      // the split line itself: hot white core
      col += vec3(3.0) * exp(-abs(diag) / 3.0) * uQ + (diag < 0.0 ? C_CYAN : C_SIGNAL) * exp(-abs(diag) / 30.0) * 1.2 * uQ;
      fragColor = vec4(col, 1.0);
    }`, { uTime: { value: 0 }, uSplit: { value: 0 }, uKick: { value: 0 }, uQ: { value: 0 } });
  props = new Boxes(16);
  tQ = 0;

  build() {
    this.world.add(this.props.mesh);
    const au = this.ctx.audio;
    // Quest enters on the downbeat of the 2nd bar of the break
    const db = au.downbeats.filter((d) => d > this.ctx.start + 0.1);
    this.tQ = db[0] ?? this.ctx.start + 1.8;
    const ped: [number, number, number] = [0.02, 0.02, 0.03];
    this.props.add(-40, -6, 0, 34, 12, 34, ped, 0);
    this.props.add(40, -6, 0, 34, 12, 34, ped, 0);
    this.props.add(-40, 0.2, 0, 34.5, 0.6, 34.5, [0.3, 1.4, 2.0], 1.4);
    this.props.add(40, 0.2, 0, 34.5, 0.6, 34.5, [2.4, 0.6, 0.15], 1.4);
  }

  override background(out: THREE.WebGLRenderTarget) { this.bg.render(this.ctx.renderer, out); }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), bl = this.bell(t);
    const q = prog(t, this.tQ - 0.25, this.tQ, ease.inQuad); // Quest falling
    const qLand = pulse(t, this.tQ, 0.12);
    // the split slides in from the right at the start, and flares white when Quest lands
    this.bg.u.uTime!.value = t;
    this.bg.u.uSplit!.value = 600 * (1 - prog(t, f.start, f.start + 0.35, ease.outExpo));
    this.bg.u.uKick!.value = k;
    this.bg.u.uQ!.value = t >= this.tQ ? 1 : 0.2;

    // turntables
    this.place(this.venmar, f, [-40, 0, 0], { yaw: 0.4 + Math.sin(t * 1.2) * 0.35, scale: 1, hop: 3, sing: false, energy: 1.2 });
    const qy = t < this.tQ ? lerp(160, 0, q) : 0;
    this.place(this.quest, f, [40, qy, 0], { yaw: -0.4 + Math.sin(t * 1.2 + 1) * 0.35, scale: 1 * (1 + qLand * 0.15), hop: t > this.tQ + 0.3 ? 3 : 0, sing: false, energy: 1.2 });
    this.quest.group.visible = t > this.tQ - 0.25;
    this.quest.group.scale.set(1 + qLand * 0.25, 1 - qLand * 0.2, 1 + qLand * 0.25);
    this.venmar.fx({ t, flash: pulse(t, f.start, 0.1) * 0.8 });
    this.quest.fx({ t, flash: qLand * 0.8 });
    this.look([0, 26, 150], [0, 16, 0], { t, fov: 32, hand: 1, shake: qLand * 4 });

    // UI: name plates, stats, banner
    const c = this.c, fi = frameIdx(t);
    const plate = (x: number, name: string, col: string, stats: [string, number][], a: number, align: 'l' | 'r') => {
      if (a <= 0) return;
      c.save();
      c.globalAlpha = clamp(a);
      const w = pixWidth(name, 10);
      const x0 = align === 'l' ? x : x - w;
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.fillRect(x0 - 20, 150, w + 40, 100);
      drawPix(c, name, x0, 170, 10, col, { shadow: 'rgba(0,0,0,0.8)' });
      stats.forEach(([label, v], i) => {
        const y = 830 + i * 44;
        const lx = align === 'l' ? x : x - 520;
        drawPix(c, label, lx, y, 4, rgba('bone', 0.9));
        c.fillStyle = 'rgba(255,255,255,0.12)';
        c.fillRect(lx + 250, y, 270, 28);
        c.fillStyle = col;
        c.fillRect(lx + 250, y, 270 * v * prog(t, f.start + 0.2 + i * 0.1, f.start + 0.8 + i * 0.1, ease.outCubic), 28);
      });
      c.restore();
    };
    plate(120, 'VENMAR', rgba('cyan', 1), [['SHADOWS', 0.99], ['CURSE', 0.92], ['LEGEND', 1]], prog(t, f.start, f.start + 0.2), 'l');
    plate(1800, 'QUEST', rgba('signal', 1), [['INFECTION', 0.97], ['GAME', 1], ['TRIBUTE', 0.9]], prog(t, this.tQ, this.tQ + 0.15), 'r');
    drawPix(c, 'P1', 120, 110, 5, rgba('cyan', 1));
    if (t > this.tQ) drawPix(c, 'P2', 1800 - pixWidth('P2', 5), 110, 5, rgba('signal', 1));
    // banner
    if (t < this.tQ) {
      if ((fi >> 4) % 2 === 0) drawPix(c, 'INSERT COIN - PLAYER 2', 960 - pixWidth('INSERT COIN - PLAYER 2', 7) / 2, 520, 7, rgba('gold', 1), { shadow: 'rgba(0,0,0,0.8)' });
    } else {
      const s = prog(t, this.tQ, this.tQ + 0.12, ease.outBack);
      c.save();
      c.translate(960, 520);
      c.scale(lerp(2.5, 1, s), lerp(2.5, 1, s));
      c.rotate(-0.06);
      c.font = font(F.archivoItalic(100, 800), 110);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = 'rgba(0,0,0,0.6)';
      c.fillText('PLAYER 2 HAS ENTERED', 8, 8);
      c.fillStyle = rgba('bone', 1);
      c.fillText('PLAYER 2 HAS ENTERED', 0, 0);
      c.restore();
    }

    const warm = prog(t, this.tQ, this.tQ + 0.6);
    return {
      bloom: 0.9,
      ca: 2 + k * 3,
      split: qLand * 30 + k * 4,
      flash: qLand * 0.5 + pulse(t, f.start, 0.08) * 0.5,
      flashColor: [1, 0.6, 0.3],
      shake: [(hash(fi, 1) - 0.5) * qLand * 50, (hash(fi, 2) - 0.5) * qLand * 50],
      zoom: 1 + k * 0.02 + qLand * 0.06,
      gain: [lerp(0.9, 1.1, warm), 1.0, lerp(1.12, 0.92, warm)],
      scan: 0.2,
      dither: 0.15,
      saturation: 1.15,
      glitch: pulse(t, this.tQ, 0.1) * 0.6 + pulse(t, f.end - 0.05, 0.05) * 0.5,
    };
  }
}
