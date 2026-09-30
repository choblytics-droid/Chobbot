// Verse A3, lines 25-26 — "Destroy my contact, delete every trace. / But you still see my features in every face."
// A retro pixel OS: the CONTACTS window with Venmar's card; the cursor clicks DELETE on "destroy", a
// "DELETE EVERY TRACE?" dialog, YES on "delete", a progress bar fills to "trace" — and she pixel-dissolves.
// Line 26: in the void her voxels fly back together; on "every face" a mosaic of strangers' faces flips,
// tile by tile, into hers.
import type { Frame, PostOverrides } from '../engine/scene';
import { Stage } from './_stage';
import { drawSprite, VENMAR } from '../sprites/sprites';
import { drawPix, pixWidth } from '../engine/pixelfont';
import { karaokeLine } from '../engine/kinetic';
import { drawEmbers } from '../engine/world';
import { rgba } from '../engine/palette';
import { F } from '../engine/type';
import { ease, lerp, prog, pulse, hash, frameIdx } from '../engine/util';
import type { Line } from '../engine/lyrics';

export default class Delete extends Stage {
  L24!: Line; L25!: Line;
  tDestroy = 0; tDelete = 0; tTrace = 0; tFace = 0;

  build() {
    this.useSky = false;
    this.clearCol = [0.002, 0.003, 0.01];
    const ly = this.ctx.lyrics;
    this.L24 = ly.get('Destroy my contact'); this.L25 = ly.get('features in every face');
    const w = (l: Line, q: RegExp) => l.words.find((x) => q.test(x.w))!.start;
    this.tDestroy = w(this.L24, /destroy/i); this.tDelete = w(this.L24, /delete/i); this.tTrace = w(this.L24, /trace/i); this.tFace = w(this.L25, /every/i);
  }

  update(f: Frame): PostOverrides {
    const t = f.t;
    const k = this.kick(t), sn = this.snare(t);
    const phase2 = t >= this.L25.start - 0.15;
    // --- 3D: Venmar reassembling in the void (line 25), dissolved before
    const re = prog(t, this.L25.start - 0.15, this.tFace - 0.1, ease.outCubic);
    this.place(this.venmar, f, [0, 0, 0], { yaw: Math.sin(t * 0.5) * 0.3, scale: 1, energy: 1 });
    this.venmar.group.visible = phase2;
    this.venmar.fx({ t, dissolve: 1 - re, dissolveDir: [0, 0.4, 0.3], glow: 1.5 + (1 - re) * 2, flash: pulse(t, this.tFace - 0.1, 0.1) * 0.6 });
    this.orbit([0, 17, 0], lerp(-0.4, 0.3, re), 0.08, lerp(110, 60, re), { t, fov: 40, hand: 1, shake: k * 0.5 });
    if (phase2) drawEmbers(this.fx, t, { center: [0, 20, 0], size: [120, 60, 120], n: 120, speed: 8, width: 0.4, col: [0.4, 1.6, 2.6] });

    const c = this.c;
    if (!phase2) this.os(t);
    else {
      this.mosaic(t);
      karaokeLine(c, this.L25, t, { x: 960, y: 1000, size: 60, family: F.archivo(100, 800), align: 'center', sung: rgba('cyan', 1), unsung: rgba('bone', 0.28), maxW: 1700 });
    }

    const dis = phase2 ? 0 : prog(t, this.tTrace, this.tTrace + 0.5);
    return {
      ...this.tag(t),
      bloom: 0.8,
      ca: 1.6 + k * 2,
      scan: phase2 ? 0.1 : 0.4,
      dither: phase2 ? 0 : 0.25,
      pixelate: phase2 ? 0 : 1 + dis * 24,
      glitch: pulse(t, this.tDestroy, 0.1) * 0.4 + pulse(t, this.tDelete, 0.1) * 0.5 + dis * 0.6 + sn * 0.05,
      split: sn * 5,
      flash: pulse(t, this.tFace - 0.1, 0.08) * 0.35,
      flashColor: [0.6, 0.9, 1.0],
      shake: [(hash(frameIdx(t), 1) - 0.5) * k * 5, (hash(frameIdx(t), 2) - 0.5) * k * 5],
      gain: [0.92, 1.0, 1.1],
      contrast: 1.08,
    };
  }

  /** The retro OS desktop for line 24. */
  os(t: number) {
    const c = this.c;
    // desktop
    c.fillStyle = '#0d2b3a';
    c.fillRect(0, 0, 1920, 1080);
    for (let y = 0; y < 1080; y += 6) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, y, 1920, 2); }
    // taskbar
    c.fillStyle = '#c9c3b6'; c.fillRect(0, 1020, 1920, 60);
    c.fillStyle = '#1a1a22'; c.fillRect(0, 1020, 1920, 3);
    drawPix(c, 'START', 30, 1036, 4, '#1a1a22');
    drawPix(c, 'RIFT OS 2.6', 1640, 1036, 4, '#1a1a22');
    // window
    const win = (x: number, y: number, w: number, h: number, title: string) => {
      c.fillStyle = '#1a1a22'; c.fillRect(x + 10, y + 10, w, h);
      c.fillStyle = '#e6e0d2'; c.fillRect(x, y, w, h);
      c.fillStyle = '#16264f'; c.fillRect(x + 6, y + 6, w - 12, 44);
      drawPix(c, title, x + 22, y + 16, 4, '#f3eee4');
      c.fillStyle = '#b32a14'; c.fillRect(x + w - 50, y + 12, 32, 32);
      drawPix(c, 'X', x + w - 44, y + 17, 4, '#f3eee4');
    };
    const btn = (x: number, y: number, w: number, label: string, hot: boolean) => {
      c.fillStyle = hot ? '#ff5a1c' : '#c9c3b6'; c.fillRect(x, y, w, 56);
      c.fillStyle = '#1a1a22'; c.fillRect(x, y + 52, w, 4); c.fillRect(x + w - 4, y, 4, 56);
      drawPix(c, label, x + (w - pixWidth(label, 5)) / 2, y + 12, 5, '#1a1a22');
    };
    const X = 360, Y = 170;
    win(X, Y, 760, 560, 'CONTACTS');
    c.fillStyle = '#f7f2e8'; c.fillRect(X + 30, Y + 80, 700, 330);
    const gone = prog(t, this.tTrace, this.tTrace + 0.45);
    if (gone < 1) drawSprite(c, VENMAR, X + 50, Y + 100, 9, { alpha: 1 - gone, blink: (t % 2.3) < 0.1 });
    drawPix(c, 'VENMAR', X + 370, Y + 120, 7, '#16264f');
    drawPix(c, 'LUPUS ET VULPES', X + 370, Y + 190, 3, '#444');
    drawPix(c, 'STATUS: GHOST', X + 370, Y + 230, 3, '#2c8fd1');
    drawPix(c, 'IN HIS HEAD: 24/7', X + 370, Y + 260, 3, '#b32a14');
    btn(X + 30, Y + 460, 220, 'DELETE', t >= this.tDestroy - 0.3 && t < this.tDestroy + 0.25);
    btn(X + 280, Y + 460, 220, 'BLOCK', false);
    // dialog after "destroy"
    let cx = 1500, cy = 900;
    if (t >= this.tDestroy + 0.15) {
      const dx = 820, dy = 380;
      win(dx, dy, 700, 330, 'WARNING');
      drawPix(c, 'DELETE EVERY TRACE?', dx + 40, dy + 90, 5, '#1a1a22');
      btn(dx + 60, dy + 220, 250, 'YES', t >= this.tDelete - 0.2 && t < this.tDelete + 0.2);
      btn(dx + 390, dy + 220, 250, 'NO', false);
      if (t >= this.tDelete + 0.1) {
        // progress bar replaces the text
        c.fillStyle = '#e6e0d2'; c.fillRect(dx + 30, dy + 70, 640, 130);
        const pr = prog(t, this.tDelete + 0.1, this.tTrace + 0.1, ease.inOutQuad);
        drawPix(c, `DELETING... ${Math.floor(pr * 100)}%`, dx + 40, dy + 90, 5, '#1a1a22');
        c.fillStyle = '#1a1a22'; c.fillRect(dx + 40, dy + 140, 620, 40);
        c.fillStyle = '#43c1ee'; c.fillRect(dx + 46, dy + 146, 608 * pr, 28);
      }
      // cursor path: to YES for "delete"
      const p = prog(t, this.tDestroy + 0.2, this.tDelete - 0.1, ease.inOutCubic);
      cx = lerp(X + 140, dx + 185, p); cy = lerp(Y + 488, dy + 248, p);
    } else {
      const p = prog(t, this.ctx.start, this.tDestroy - 0.1, ease.inOutCubic);
      cx = lerp(1500, X + 140, p); cy = lerp(900, Y + 488, p);
    }
    // cursor (pixel arrow)
    const arrow = ['1', '11', '121', '1221', '12221', '122221', '1222221', '12222221', '122211', '1211', '11'];
    arrow.forEach((row, r) => [...row].forEach((ch, q) => { c.fillStyle = ch === '1' ? '#000' : '#fff'; c.fillRect(cx + q * 5, cy + r * 5, 5, 5); }));
    // lyric as a system notification
    karaokeLine(c, this.L24, t, { x: 960, y: 110, size: 44, family: F.mono(600), align: 'center', sung: rgba('bone', 1), unsung: rgba('bone', 0.3), upper: true, maxW: 1600 });
  }

  /** A mosaic of strangers' faces flipping into Venmar's, tile by tile from the centre. */
  mosaic(t: number) {
    const c = this.c;
    const on = prog(t, this.tFace - 0.1, this.tFace + 0.1);
    if (on <= 0) return;
    const cols = 12, rows = 6, sz = 150;
    const x0 = (1920 - cols * sz) / 2, y0 = (1080 - rows * sz) / 2 - 40;
    c.save();
    c.globalAlpha = on * 0.92;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const d = Math.hypot(q - cols / 2 + 0.5, r - rows / 2 + 0.5);
      const flip = t > this.tFace + 0.1 + d * 0.12;
      const x = x0 + q * sz, y = y0 + r * sz;
      c.fillStyle = '#05060f';
      c.fillRect(x, y, sz - 6, sz - 6);
      if (flip) drawSprite(c, VENMAR, x + 7, y + 4, 4.2, { blink: (t + q * 0.3 + r) % 2.5 < 0.1 });
      else {
        // a random stranger: skin, hair, eyes, mouth on a 12x12 grid
        const s = 11;
        const skin = ['#f2c6a0', '#c68a5e', '#8d5a3b', '#e9b48a', '#5e3a24'][Math.floor(hash(q, r, 1) * 5)]!;
        const hair = ['#1a1410', '#6b3b1c', '#d8b04a', '#2a2a40', '#b32a14'][Math.floor(hash(q, r, 2) * 5)]!;
        c.fillStyle = skin; c.fillRect(x + 2 * s, y + 3 * s, 9 * s, 9 * s);
        c.fillStyle = hair; c.fillRect(x + 2 * s, y + 2 * s, 9 * s, 2 * s + Math.floor(hash(q, r, 3) * 2) * s);
        c.fillStyle = '#111'; c.fillRect(x + 4 * s, y + 6 * s, s, s); c.fillRect(x + 8 * s, y + 6 * s, s, s);
        c.fillRect(x + 5 * s, y + 9 * s, 3 * s, s * 0.6);
      }
    }
    c.restore();
  }
}
