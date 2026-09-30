// COVER PLATE 2 — "Keep the legend alive" (4 bars).
// "yeah, keep the LEGEND ALIVE / I hope I'm the REASON he can BARELY SURVIVE"
// Close on the alley's blade signs in the rain. LEGEND is a tall vertical sign whose letters
// light one by one as the word is sung; ALIVE snaps on beside it. Then SURVIVE: a sign on its
// last legs, buzzing from the moment it's sung, tubes dropping out one by one through the held
// note, sparking, until the ghost drifts past and it dies on the phrase's last beat.
// A new framing on every downbeat.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { loadLyrics, type Lyrics } from '../engine/lyrics';
import { clamp, ease, prog, pulse, noise1, lerp, hash } from '../engine/util';
import { beatNo, beatT, sparkParticles } from './_kit';
import { lyricBlock, drawGhost, drawWisps, rain, ignite, buzz } from './_world';

type SignSpec = { text: string; x: number; y: number; size: number; col: string; vertical: boolean; letter: (i: number, t: number) => number };

export default class Legend extends Scene {
  flat = new Layer2D();
  glow = new Layer2D();
  txt = new Layer2D();
  lb = new LineBatch(6000);
  ly!: Lyrics;
  tw: Record<string, number> = {};

  override async init() {
    this.ly = await loadLyrics();
    const words = this.ly.lines.flatMap((l) => l.words);
    const at = (q: string) => words.find((w) => w.w.toLowerCase().replace(/[^a-z']/g, '') === q && w.start > this.ctx.start - 1.2)!;
    for (const q of ['yeah', 'keep', 'legend', 'alive', 'reason', 'barely', 'survive']) { const w = at(q); this.tw[q] = w.start; this.tw[q + '_end'] = w.end; }
  }

  /** Draw one neon sign: dark box, tube border, letters (vertical stack or a row). */
  sign(s: SignSpec, t: number) {
    const fl = this.flat.ctx, gl = this.glow.ctx;
    const fam = F.archivo(100, 700);
    const letters = s.text.split('');
    const pad = s.size * 0.35;
    const adv = s.size * 1.02;
    const bw = s.vertical ? s.size * 1.15 + pad * 2 : measure(s.text, fam, s.size) * 1.18 + pad * 2;
    const bh = s.vertical ? letters.length * adv + pad * 2 : s.size * 1.1 + pad * 2;
    const x0 = s.x - bw / 2, y0 = s.y;
    // bracket
    fl.fillStyle = rgba('#0B0C1E', 1);
    fl.fillRect(s.x - 8, y0 - 60, 16, 60);
    fl.fillStyle = rgba('#0E0F24', 0.96);
    fl.fillRect(x0, y0, bw, bh);
    const all = letters.reduce((a, _, i) => a + s.letter(i, t), 0) / letters.length;
    gl.strokeStyle = rgba(s.col, 0.2 + 0.8 * all);
    gl.lineWidth = 6;
    gl.strokeRect(x0 + 12, y0 + 12, bw - 24, bh - 24);
    gl.font = font(fam, s.size);
    letters.forEach((ch, i) => {
      const on = s.letter(i, t);
      gl.fillStyle = rgba(s.col, on > 0 ? 0.12 + 0.88 * on : 0.1);
      const cw = measure(ch, fam, s.size);
      if (s.vertical) gl.fillText(ch, s.x - cw / 2, y0 + pad + (i + 0.82) * adv);
      else {
        // proportional advances with open tracking (a narrow I keeps its own width)
        const track = s.size * 0.18;
        const total = measure(s.text, fam, s.size) + track * (letters.length - 1);
        const x = s.x - total / 2 + measure(s.text.slice(0, i), fam, s.size) + track * i;
        gl.fillText(ch, x, y0 + pad + s.size * 0.86);
      }
    });
    return { x0, y0, bw, bh };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, tw = this.tw, end = this.ctx.end;
    const b0 = Math.round(beatNo(au, this.ctx.start));
    const bar = clamp(Math.floor((beatNo(au, t) - b0) / 4 + 1e-4), 0, 3);
    const tb = beatT(au, b0 + 4 * bar);
    const kick = au.hit('kick', t, 0.09);
    clearRT(renderer, out, [0, 0, 0]);
    this.flat.clear(); this.glow.clear();
    const fl = this.flat.ctx, gl = this.glow.ctx;

    // background: the wet brick wall the signs hang off, magenta/cyan wash
    const bg = fl.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, rgba('#1E1A44', 1)); bg.addColorStop(0.5, rgba('#14142E', 1)); bg.addColorStop(1, rgba('#0C0D22', 1));
    fl.fillStyle = bg; fl.fillRect(0, 0, W, H);
    // camera per bar (hard cuts): wide on LEGEND, close on ALIVE, SURVIVE, then the dying sign
    const cams = [
      { x: 540, y: 820, z: 1.02, r: -0.03 },
      { x: 700, y: 640, z: 1.3, r: 0.02 },
      { x: 560, y: 900, z: 1.0, r: -0.015 },
      { x: 560, y: 1150, z: 1.4, r: 0.03 },
    ];
    const cm = cams[bar]!;
    const drift = (t - tb) * 14;
    for (const c of [fl, gl]) { c.save(); c.translate(W / 2, H / 2); c.rotate(cm.r); c.scale(cm.z, cm.z); c.translate(-cm.x, -cm.y + drift); }
    // bricks
    fl.fillStyle = rgba('#0D0E22', 0.55);
    for (let r = -4; r < 30; r++) for (let q = -2; q < 10; q++) {
      const x = q * 150 + (r % 2 ? 75 : 0), y = r * 70;
      fl.fillRect(x, y, 150, 3); fl.fillRect(x, y, 3, 70);
    }
    // wall washes
    const wash = (x: number, y: number, r: number, col: string, a: number) => {
      const g = fl.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
      fl.fillStyle = g; fl.fillRect(x - r, y - r, 2 * r, 2 * r);
    };

    // ---- the signs
    const lt = (t0: number, t1: number, n: number, seed: number) => (i: number, tt: number) => ignite(tt, lerp(t0, t1, i / Math.max(1, n - 1)), seed + i);
    const leg = { text: 'LEGEND', x: 250, y: 150, size: 130, col: 'magenta', vertical: true, letter: lt(tw.keep!, tw.legend_end!, 6, 10) };
    const alive = { text: 'ALIVE', x: 760, y: 250, size: 130, col: 'cyan', vertical: true, letter: (i: number, tt: number) => ignite(tt, tw.alive! + i * 0.035, 20 + i) };
    // SURVIVE: buzzes from its word, tubes die one by one through the held note, all out on the last beat
    const tDie0 = tw.survive! + 0.4, tDie1 = end - 0.45;
    const surv = {
      text: 'SURVIVE', x: 540, y: 1170, size: 118, col: 'magenta', vertical: false,
      letter: (i: number, tt: number) => {
        const on = ignite(tt, tw.survive! + i * 0.02, 30 + i);
        const die = lerp(tDie0, tDie1, hash(i, 77));
        if (tt > die) return 0;
        const bad = 0.12 + 0.75 * prog(tt, tw.survive!, die);
        return on * buzz(tt, bad, 40 + i);
      },
    };
    const reason = { text: 'REASON', x: 975, y: 560, size: 56, col: 'violet', vertical: true, letter: (i: number, tt: number) => ignite(tt, tw.reason! + i * 0.03, 50 + i) * 0.8 };
    const barely = { text: 'BARELY', x: 540, y: 1075, size: 52, col: 'cyan', vertical: false, letter: (i: number, tt: number) => ignite(tt, tw.barely! + i * 0.04, 60 + i) * buzz(tt, 0.35, 61) };
    wash(250, 600, 500, 'magenta', 0.25 * clamp(prog(t, tw.legend!, tw.legend! + 0.4)));
    wash(760, 600, 420, 'cyan', 0.22 * clamp(prog(t, tw.alive!, tw.alive! + 0.2)));
    wash(540, 1250, 520, 'magenta', 0.2 * (t > tw.survive! ? surv.letter(3, t) : 0));
    this.sign(leg, t); this.sign(alive, t); this.sign(reason, t);
    if (t > tw.reason! - 0.6) this.sign(barely, t);
    const sb = bar >= 2 ? this.sign(surv, t) : { x0: 0, y0: 0, bw: 0, bh: 0 };

    // the ghost drifts in from the left during the last bar and passes the dying sign
    if (bar >= 2) {
      const k = ease.inOutCubic(prog(t, tb - (bar === 3 ? 0 : 1.2), end));
      const gx = lerp(-160, 900, k), gy = 1000 + 60 * Math.sin(t * 2.2);
      drawWisps(gl, gx - 40, gy + 110, 60, t, { alpha: 0.4, seed: 9, dir: -1 });
      drawGhost(gl, gx, gy, 72, t, { alpha: 0.95, lean: 0.25 });
    }
    for (const c of [fl, gl]) c.restore();

    this.flat.upload(); this.glow.upload();
    comp.draw(renderer, this.flat.texture, out);
    comp.draw(renderer, this.glow.texture, out, { mode: 'add', tint: [2.4, 2.4, 2.4] });

    // karaoke (screen space)
    const c = this.txt.ctx; this.txt.clear();
    const line = this.ly.lineAt(t, 0.5, 0.3);
    if (line && t < end - 0.2) lyricBlock(c, line, t, W / 2, 1600, { col: line.i % 2 ? 'cyan' : 'magenta', hot: 'ghost', size: 78 });
    this.txt.upload();
    comp.draw(renderer, this.txt.texture, out, { mode: 'add', tint: [2.2, 2.2, 2.2] });

    // sparks off the dying tubes, and rain
    const lb = this.lb; lb.clear();
    if (t > tw.survive!) {
      const toScreen = (x: number, y: number) => {
        const dx = x - cm.x, dy = y - cm.y + drift;
        const cs = Math.cos(cm.r), sn = Math.sin(cm.r);
        return { x: W / 2 + (dx * cs - dy * sn) * cm.z, y: H / 2 + (dx * sn + dy * cs) * cm.z };
      };
      sparkParticles(lb, t, (tt) => (tt > tw.survive! && tt < end - 0.3 && hash(Math.floor(tt * 12), 3) < 0.45 ? toScreen(sb.x0 + sb.bw * hash(Math.floor(tt * 12), 4), sb.y0 + sb.bh * 0.3) : null), { rate: 90, speed: 320, life: 0.5, seed: 17, intensity: 1.2 });
    }
    rain(lb, t, { n: 460, intensity: 0.34, slant: 0.18 });
    lb.render(renderer, out);

    const shake = 8 * pulse(t, tb, 0.05) + 5 * kick;
    return {
      bloom: 1.0, bloomThreshold: 0.75, halation: 0.08, vignette: 0.55, grain: 0.055, ca: 1.3,
      zoom: 1 + 0.02 * kick + 0.03 * pulse(t, tb, 0.07),
      shake: [noise1(t * 60, 21) * shake, noise1(t * 60, 22) * shake],
      exposure: 1 - 0.5 * ease.inCubic(prog(t, end - 0.45, end)),
    };
  }
}


