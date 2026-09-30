// COVER PLATE 5 — "Toxic" (4 bars; power cut at the break).
// "And he tells you I'm TOXIC, he tells you I'm THE END / BURNING every BRIDGE, LOSING every
// FRIEND / But, but, but every word…"
// Back in the alley, the lyric itself becomes the signs: one neon group per phrase, every word
// igniting on its syllable. TOXIC buzzes and drips; THE END slams; BURNING burns with rust-orange
// embers while a neon bridge burns in from both ends and falls; the letters of FRIEND drop away
// one by one; three BUTs stack on the stutter. At the break the power fails and the alley goes
// dark (only the rain and the ghost's eyes), waiting for the last downbeat.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { loadLyrics, type Lyrics, type Word } from '../engine/lyrics';
import { clamp, ease, prog, pulse, noise1, hash, lerp, TAU } from '../engine/util';
import { beatNo, beatT, sparkParticles } from './_kit';
import { drawAlley, makeFacades, ignite, buzz, drawGhost, rain, lyricBlock, type Sign } from './_world';

export default class Toxic extends Scene {
  flat = new Layer2D();
  glow = new Layer2D();
  lb = new LineBatch(8000);
  ly!: Lyrics;
  w: Record<string, Word> = {};
  facades = makeFacades(8, 70);
  signs: Sign[] = [];
  tBreak = 0;

  override async init() {
    this.ly = await loadLyrics();
    const au = this.ctx.audio;
    this.tBreak = au.breaks.find((b) => b > this.ctx.start && b < this.ctx.end) ?? this.ctx.end - 0.45;
    const words = this.ly.lines.flatMap((l) => l.words).filter((w) => w.start > this.ctx.start - 1.2);
    const keys: Record<string, number> = {};
    for (const w of words) {
      const k = w.w.toLowerCase().replace(/[^a-z']/g, '');
      const n = keys[k] = (keys[k] ?? 0) + 1;
      this.w[n > 1 ? `${k}${n}` : k] = w;
    }
    this.signs = [
      { text: 'BAR', x: 1.95, y: 3, z: 12, w: 0.9, h: 2.8, col: 'violet', on: (t) => 0.6 * buzz(t, 0.1, 3) },
      { text: 'ABERTO', x: -1.95, y: 2.5, z: 18, w: 0.9, h: 4.2, col: 'cyan', on: (t) => 0.6 * buzz(t, 0.1, 4) },
    ];
  }

  /** A neon word, centred, fitted to maxW. Returns its box. */
  word(c: CanvasRenderingContext2D, text: string, y: number, o: { fam?: string; size?: number; maxW?: number; col: string; on: number; slam?: number; x?: number }) {
    const fam = o.fam ?? F.archivo(125, 900);
    let size = o.size ?? 220;
    const mw = o.maxW ?? W - 120;
    const w0 = measure(text, fam, size);
    if (w0 > mw) size *= mw / w0;
    const w = measure(text, fam, size);
    const s = o.slam ?? 1;
    const x = o.x ?? W / 2;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.font = font(fam, size);
    c.fillStyle = rgba(o.col, o.on > 0 ? o.on : 0.1);
    c.fillText(text, -w / 2, 0);
    c.restore();
    return { x0: x - (w * s) / 2, x1: x + (w * s) / 2, y, size: size * s, w: w * s };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, end = this.ctx.end, w = this.w;
    const b0 = Math.round(beatNo(au, this.ctx.start));
    const bar = clamp(Math.floor((beatNo(au, t) - b0) / 4 + 1e-4), 0, 3);
    const tb = beatT(au, b0 + 4 * bar);
    const kick = au.hit('kick', t, 0.08);
    const dark = t >= this.tBreak;
    clearRT(renderer, out, [0, 0, 0]);
    this.flat.clear(); this.glow.clear();
    const fl = this.flat.ctx, gl = this.glow.ctx;
    const lb = this.lb; lb.clear();
    const on = (k: string, seed: number) => (w[k] ? ignite(t, w[k]!.start, seed) : 0);
    const sl = (k: string, amt = 0.2) => (w[k] ? 1 + amt * (1 - ease.outExpo(clamp((t - w[k]!.start) / 0.16))) : 1);

    // backdrop: the alley, pushed back into the dark
    const cam = { z: 2 + 0.6 * (t - this.ctx.start), x: 0, y: 1.7, hor: 640, f: 900, roll: 0.01 * Math.sin(t) };
    drawAlley(fl, gl, cam, t, this.facades, dark ? [] : this.signs, { endZ: 60 });
    fl.fillStyle = rgba('night', dark ? 0.9 : 0.62); fl.fillRect(0, 0, W, H);
    gl.fillStyle = rgba('night', 1); gl.globalCompositeOperation = 'destination-out';
    gl.fillStyle = rgba('#000', dark ? 0.95 : 0.6); gl.fillRect(0, 0, W, H);
    gl.globalCompositeOperation = 'source-over';

    if (!dark) {
      if (t < w.he2!.start) {
        // TOXIC: buzzing, with violet drips
        const bx = this.word(gl, 'TOXIC', 960, { col: 'magenta', on: on('toxic', 1) * buzz(t, 0.12, 5), slam: sl('toxic', 0.3), size: 300 });
        this.word(gl, 'I’M', 700, { col: 'ghost', on: on("i'm", 2), size: 110, fam: F.archivo(100, 700) });
        for (let i = 0; i < 12; i++) {
          const x = lerp(bx.x0 + 20, bx.x1 - 20, hash(i, 1)), t0 = w.toxic!.start + 0.1 + hash(i, 2) * 0.4;
          if (t < t0) continue;
          const len = 900 * (t - t0) ** 2 + 20;
          gl.fillStyle = rgba('violet', 0.8);
          gl.fillRect(x - 3, 975, 6, len);
          gl.beginPath(); gl.arc(x, 975 + len, 6, 0, TAU); gl.fill();
        }
      } else if (t < w.burning!.start) {
        this.word(gl, 'HE TELLS YOU', 620, { col: 'ghost', on: Math.min(on('he2', 3), 1), size: 96, fam: F.archivo(100, 700) });
        this.word(gl, 'I’M', 800, { col: 'cyan', on: on("i'm2", 4), size: 120, fam: F.archivo(100, 700) });
        this.word(gl, 'THE', 1000, { col: 'cyan', on: on('the', 5), size: 200 });
        this.word(gl, 'END', 1260, { col: 'cyan', on: on('end', 6), size: 360, slam: sl('end', 0.35) });
      } else if (t < w.losing!.start) {
        // BURNING (embers), EVERY, and a neon bridge burning in from both ends
        const flick = 0.75 + 0.25 * buzz(t, 0.25, 7);
        const bb = this.word(gl, 'BURNING', 640, { col: 'rustLite', on: on('burning', 7) * flick, slam: sl('burning'), size: 230 });
        this.word(gl, 'EVERY', 800, { col: 'ghost', on: on('every', 8), size: 90, fam: F.archivo(100, 700) });
        this.word(gl, 'BRIDGE', 1330, { col: 'cyan', on: on('bridge', 9), size: 200, slam: sl('bridge') });
        if (t > w.burning!.start) sparkParticles(lb, t, (tt) => (tt > w.burning!.start ? { x: lerp(bb.x0, bb.x1, hash(Math.floor(tt * 40), 2)), y: 640 } : null), { rate: 140, speed: 420, gravity: -300, life: 0.7, seed: 23, intensity: 1.1 });
        if (t > w.bridge!.start - 0.1) {
          const n = 48, burnt = prog(t, w.bridge!.start + 0.25, w.losing!.start - 0.1) * (n / 2);
          const fall = 900 * Math.max(0, t - (w.losing!.start - 0.25)) ** 2;
          const ok = (i: number) => Math.min(i, n - i) >= burnt;
          const pt = (i: number) => { const a = Math.PI + (i / n) * Math.PI; return { x: 540 + Math.cos(a) * 420, y: 1110 + Math.sin(a) * 160 + fall }; };
          gl.strokeStyle = rgba('cyan', on('bridge', 10)); gl.lineWidth = 7; gl.lineCap = 'round';
          for (let i = 0; i < n; i++) if (ok(i) && ok(i + 1)) { const a = pt(i), b = pt(i + 1); gl.beginPath(); gl.moveTo(a.x, a.y); gl.lineTo(b.x, b.y); gl.stroke(); if (i % 4 === 0) { gl.beginPath(); gl.moveTo(a.x, a.y); gl.lineTo(a.x, 1130 + fall); gl.stroke(); } }
          gl.beginPath(); gl.moveTo(100, 1130 + fall); gl.lineTo(980, 1130 + fall); gl.stroke();
          for (const s of [-1, 1]) {
            const i = s < 0 ? Math.ceil(burnt) : n - Math.ceil(burnt);
            const p = pt(i);
            if (burnt > 0.2 && burnt < n / 2) sparkParticles(lb, t, (tt) => (tt > w.bridge!.start + 0.25 ? pt(s < 0 ? Math.ceil(prog(tt, w.bridge!.start + 0.25, w.losing!.start - 0.1) * n / 2) : n - Math.ceil(prog(tt, w.bridge!.start + 0.25, w.losing!.start - 0.1) * n / 2)) : null), { rate: 120, speed: 300, life: 0.5, seed: 30 + s });
            void p;
          }
        }
      } else if (t < w.but!.start) {
        this.word(gl, 'LOSING', 700, { col: 'magenta', on: on('losing', 11), slam: sl('losing'), size: 230 });
        this.word(gl, 'EVERY', 860, { col: 'ghost', on: on('every2', 12), size: 90, fam: F.archivo(100, 700) });
        // FRIEND: letters let go one by one
        const fam = F.archivo(125, 900), size = 250;
        const tot = measure('FRIEND', fam, size);
        const x0 = W / 2 - tot / 2;
        const o = on('friend', 13);
        gl.font = font(fam, size);
        'FRIEND'.split('').forEach((ch, i) => {
          const tf = w.friend!.start + 0.28 + i * 0.05;
          const d = Math.max(0, t - tf);
          const x = x0 + measure('FRIEND'.slice(0, i), fam, size);
          gl.save(); gl.translate(x + 60, 1150 + 2600 * d * d); gl.rotate((hash(i, 4) - 0.5) * 6 * d);
          gl.fillStyle = rgba('cyan', o > 0 ? o : 0.1);
          gl.fillText(ch, -60, 0); gl.restore();
        });
      } else if (t < w.every3!.start) {
        (['but', 'but2', 'but3'] as const).forEach((k, i) => {
          if (!w[k] || t < w[k]!.start) return;
          this.word(gl, 'BUT', 620 + i * 300, { col: ['magenta', 'cyan', 'ghost'][i]!, on: on(k, 20 + i), slam: sl(k, 0.4), size: 300 });
        });
      } else {
        this.word(gl, 'EVERY', 820, { col: 'ghost', on: on('every3', 30), size: 150, fam: F.archivo(100, 700) });
        this.word(gl, 'WORD', 1080, { col: 'magenta', on: on('word', 31), slam: sl('word', 0.3), size: 300 });
      }
      // the whole line, small, for reading
      const line = this.ly.lineAt(t, 0.2, 0.2);
      if (line) lyricBlock(gl, line, t, W / 2, 1640, { col: 'ghost', hot: 'magenta', size: 44, dim: 0.22 });
    } else {
      // power cut: only the ghost's eyes
      const k = prog(t, this.tBreak, this.tBreak + 0.15);
      drawGhost(fl, 540, 960, 90, t, { alpha: 0.08 * k });
      gl.fillStyle = rgba('cyan', 0.5 * k);
      for (const s of [-1, 1]) { gl.beginPath(); gl.ellipse(540 + s * 32, 958, 9, 14, 0, 0, TAU); gl.fill(); }
    }

    this.flat.upload(); this.glow.upload();
    comp.draw(renderer, this.flat.texture, out);
    comp.draw(renderer, this.glow.texture, out, { mode: 'add', tint: [2.4, 2.4, 2.4] });
    rain(lb, t, { n: 360, intensity: dark ? 0.12 : 0.28 });
    lb.render(renderer, out);

    const hits = ['toxic', 'end', 'burning', 'bridge', 'losing', 'friend', 'but', 'but2', 'but3', 'word'].reduce((m, k) => Math.max(m, w[k] ? pulse(t, w[k]!.start, 0.06) : 0), 0);
    const shake = 16 * hits + 6 * kick + 5 * pulse(t, tb, 0.05);
    return {
      bloom: 1.0, bloomThreshold: 0.72, halation: 0.1, vignette: 0.6, grain: 0.06, ca: 1.3 + 1.5 * hits,
      zoom: 1 + 0.03 * hits + 0.015 * kick,
      shake: [noise1(t * 60, 51) * shake, noise1(t * 60, 52) * shake],
    };
  }
}
