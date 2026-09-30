// COVER PLATE 3 — "The puddle" (instrumental, 4 bars; time stops at the break).
// Looking straight down at the alley floor: a rain puddle holds the reflection of everything
// above it: the walls closing in, the lit signs from the last plate (mirror-written), the ghost
// peering down. The percussion is the rain: every kick drops a heavy drop in the middle, every
// cowbell hit a small one somewhere across the water, and the rings ripple the reflection.
// At the break the drops freeze in the air and the rings stop; the next line
// ("He's talking loud…") arrives over the stillness.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { loadLyrics, type Lyrics } from '../engine/lyrics';
import { clamp, ease, prog, pulse, noise1, hash, lerp } from '../engine/util';
import { beatNo, beatT } from './_kit';
import { lyricBlock, drawGhost, drawWisps, buzz } from './_world';

const NR = 40;

const FRAG = /* glsl */ `
uniform sampler2D refl;
uniform vec4 rip[${NR}];
uniform float t;
uniform vec4 camv; // centre x, y, zoom, rotation

void main() {
  vec2 sp = vec2(FRAG_PX.x, ${H}.0 - FRAG_PX.y);
  vec2 q = (sp - vec2(${W / 2}.0, ${H / 2}.0)) / camv.z;
  float cr = cos(camv.w), sr = sin(camv.w);
  vec2 p = vec2(q.x * cr - q.y * sr, q.x * sr + q.y * cr) + camv.xy;
  // ripples: travelling rings, each a damped wave packet
  vec2 disp = vec2(0.0);
  float crest = 0.0;
  for (int i = 0; i < ${NR}; i++) {
    vec4 r = rip[i];
    if (r.w <= 0.0) continue;
    vec2 d = p - r.xy;
    float dist = length(d);
    float front = 330.0 * r.z * (0.6 + 0.4 * r.w);
    float env = exp(-abs(dist - front) / (22.0 + 30.0 * r.z)) * exp(-r.z * 1.4) * r.w;
    float wv = sin((dist - front) * 0.09) * env;
    disp += d / max(dist, 1.0) * wv * 26.0;
    crest += max(0.0, wv);
  }
  // the puddle's outline
  float m = 1.0 - length((p - vec2(540.0, 900.0)) / vec2(560.0, 820.0)) + 0.3 * fbm(p * 0.002, 3);
  float inP = smoothstep(0.30, 0.34, m);
  // asphalt
  float n = fbm(p * 0.02, 4) * 0.5 + 0.5, g = hash12(floor(p * 0.7));
  vec3 asph = C_NIGHT * (1.3 + 1.2 * n) * (0.8 + 0.4 * g);
  asph += C_MAGENTA * 0.05 * smoothstep(0.6, 0.9, fbm(p * 0.004 + 9.0, 3));
  // reflection (texture drawn in the plate's space, y down)
  vec2 uv = (p + disp) / vec2(${W}.0, ${H}.0);
  vec3 rc = texture(refl, vec2(uv.x, 1.0 - uv.y)).rgb;
  vec3 water = rc * 0.95 + C_NIGHT * 0.4 + C_GHOST * crest * 0.35;
  float rim = exp(-abs(m - 0.32) / 0.02);
  vec3 c = mix(asph + C_GHOST * crest * 0.05, water, inP) + mix(C_CYAN, C_MAGENTA, 0.5 + 0.5 * sin(p.y * 0.004)) * rim * 0.07;
  fragColor = vec4(c, 1.0);
}`;

export default class Puddle extends Scene {
  refl = new Layer2D();
  txt = new Layer2D();
  lb = new LineBatch(4000);
  pass!: FSPass;
  ly!: Lyrics;
  drops: { t: number; x: number; y: number; a: number }[] = [];
  tBreak = 0;

  override async init() {
    this.ly = await loadLyrics();
    const au = this.ctx.audio;
    const s = this.ctx.start, e = this.ctx.end;
    this.tBreak = au.breaks.find((b) => b > s && b < e) ?? e - 0.9;
    // kicks: heavy drops near the middle; cowbell: light drops across the water; plus a drizzle
    for (const [t, st] of au.events('kick', s - 1.5, e)) this.drops.push({ t, x: 540 + (hash(t * 100, 1) - 0.5) * 260, y: 900 + (hash(t * 100, 2) - 0.5) * 380, a: 0.8 + 0.4 * st });
    for (const [t, st] of au.events('bell', s - 1.5, e)) this.drops.push({ t, x: 160 + hash(t * 100, 3) * 760, y: 300 + hash(t * 100, 4) * 1200, a: 0.35 + 0.3 * st });
    for (let i = 0; i < 70; i++) { const t = s - 1.5 + (i / 70) * (e - s + 1.5); this.drops.push({ t: t + hash(i, 9) * 0.1, x: hash(i, 5) * W, y: hash(i, 6) * H, a: 0.15 }); }
    this.drops.sort((a, b) => a.t - b.t);
    this.pass = new FSPass(FRAG, { refl: { value: this.refl.texture }, rip: { value: new Float32Array(NR * 4) }, t: { value: 0 }, camv: { value: [540, 960, 1, 0] } });
  }

  /** The mirror world, as seen in the water (drawn in plate space). */
  drawReflection(t: number, tr: number) {
    const c = this.refl.ctx; this.refl.clear();
    const sky = c.createRadialGradient(540, 900, 0, 540, 900, 900);
    sky.addColorStop(0, rgba('#3A2C7A', 1)); sky.addColorStop(0.6, rgba('#1A1840', 1)); sky.addColorStop(1, rgba('night', 1));
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    // the walls, rising toward a strip of sky
    c.fillStyle = rgba('#0C0D22', 1);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(400, 700); c.lineTo(400, 1150); c.lineTo(0, H); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(W, 0); c.lineTo(680, 700); c.lineTo(680, 1150); c.lineTo(W, H); c.closePath(); c.fill();
    // lit windows on the walls
    for (let i = 0; i < 40; i++) {
      const side = i % 2 ? 1 : -1, u = hash(i, 1), v = hash(i, 2);
      if (hash(i, 3) > 0.45) continue;
      const x = side < 0 ? lerp(40, 360, u) : lerp(W - 40, 720, u);
      const y = lerp(120 + u * 500, H - 120 - u * 500, v);
      c.fillStyle = rgba(hash(i, 4) > 0.5 ? 'magenta' : 'violet', 0.55);
      c.fillRect(x - 12, y - 16, 24 * (1 - u * 0.6), 32 * (1 - u * 0.4));
    }
    // mirror-written signs
    const sign = (text: string, x: number, y: number, size: number, col: string, on: number, rot: number) => {
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(-1, 1);
      const fam = F.archivo(100, 700);
      c.font = font(fam, size);
      const w = measure(text, fam, size);
      c.fillStyle = rgba('#0E0F24', 0.9); c.fillRect(-w / 2 - 24, -size * 0.95, w + 48, size * 1.3);
      c.fillStyle = rgba(col, 0.15 + 0.85 * on);
      c.fillText(text, -w / 2, 0);
      c.strokeStyle = rgba(col, 0.2 + 0.7 * on); c.lineWidth = 5;
      c.strokeRect(-w / 2 - 14, -size * 0.85, w + 28, size * 1.1);
      c.restore();
    };
    sign('LEGEND', 230, 560, 92, 'magenta', 1, -1.1);
    sign('ALIVE', 860, 620, 90, 'cyan', 1, 1.15);
    sign('ABERTO', 240, 1380, 80, 'cyan', buzz(t, 0.1, 5), -1.9);
    sign('SHADOWS', 850, 1320, 76, 'magenta', 1, 1.9);
    // the ghost, peering down into the water
    const gy = 880 + 14 * Math.sin(tr * 2.1);
    drawWisps(c, 560, gy + 90, 55, tr, { alpha: 0.45, seed: 5, dir: 1 });
    drawGhost(c, 560, gy - 60, 88, tr, { alpha: 0.95 });
    this.refl.upload();
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, end = this.ctx.end;
    const tr = Math.min(t, this.tBreak); // time stops at the break
    const b0 = Math.round(beatNo(au, this.ctx.start));
    const bar = clamp(Math.floor((beatNo(au, t) - b0) / 4 + 1e-4), 0, 3);
    const tb = beatT(au, b0 + 4 * bar);
    this.drawReflection(t, tr);
    // active ripples
    const rip = this.pass.u.rip!.value as Float32Array;
    const act = this.drops.filter((d) => d.t <= tr && tr - d.t < 2.2).slice(-NR);
    for (let i = 0; i < NR; i++) {
      const d = act[i];
      rip[i * 4] = d?.x ?? 0; rip[i * 4 + 1] = d?.y ?? 0; rip[i * 4 + 2] = d ? tr - d.t : 0; rip[i * 4 + 3] = d?.a ?? 0;
    }
    const cams: [number, number, number, number][] = [
      [540, 960, 1, 0],
      [540, 940, 1.1, lerp(-0.05, 0.25, prog(t, tb, tb + 1.8))],
      [560, 880, 1.7, 0.3],
      [540, 960, lerp(1.0, 1.25, ease.inOutCubic(prog(t, tb, end))), -0.08],
    ];
    this.pass.u.camv!.value = cams[bar]!;
    this.pass.u.t!.value = tr;
    this.pass.render(renderer, out);

    // frozen / falling drops (streaks) above the water, rain feel
    const lb = this.lb; lb.clear();
    for (let i = 0; i < 160; i++) {
      const x = hash(i, 11) * W, y0 = hash(i, 12) * H;
      const speed = 90 + 60 * hash(i, 13);
      const fz = t >= this.tBreak;
      const y = (y0 + tr * speed) % H;
      const len = fz ? 3 : 14;
      lb.seg2(x, y, x + 1, y - len, fz ? 3.2 : 1.6, [0.35, 0.4, 0.6], fz ? 0.9 : 0.35);
    }
    lb.render(renderer, out);

    // karaoke (the next verse arrives over the stillness)
    const c = this.txt.ctx; this.txt.clear();
    const line = this.ly.lineAt(t, 0.6, 0.3);
    if (line) lyricBlock(c, line, t, W / 2, 1600, { col: line.i % 2 ? 'cyan' : 'magenta', hot: 'ghost', size: 84 });
    this.txt.upload();
    comp.draw(renderer, this.txt.texture, out, { mode: 'add', tint: [2.2, 2.2, 2.2] });

    const kick = t < this.tBreak ? au.hit('kick', t, 0.08) : 0;
    const shake = 6 * pulse(t, tb, 0.05) + 5 * kick;
    return {
      bloom: 0.95, bloomThreshold: 0.72, halation: 0.08, vignette: 0.6, grain: 0.055, ca: 1.2,
      zoom: 1 + 0.02 * kick,
      shake: [noise1(t * 60, 31) * shake, noise1(t * 60, 32) * shake],
      flash: 0.5 * pulse(t, this.ctx.start, 0.06),
    };
  }
}
