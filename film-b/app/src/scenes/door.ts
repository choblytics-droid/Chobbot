// COVER PLATE 1 — "Ferrugem na fenda" (the drop, 4 bars).
// "…oh, I hope he was the WORST / I'm the GHOST in his mind, I'm the beautiful CURSE"
// The cover's rusted door in its stone wall, head-on. The drop lands on "oh": the wall CRACKS
// (a fenda) from the door's corner, ghost light leaking out of the fissure, and it splits further
// on "worst". On "ghost" the ghost slips out through the door's slit and settles on top of the
// wall, like the cover. On "beautiful curse" the rust (ferrugem) spreads off the door and across
// the stones with a glowing front. One framing per bar, hard cuts on the downbeats.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { loadLyrics, type Lyrics } from '../engine/lyrics';
import { clamp, ease, prog, pulse, noise1, lerp } from '../engine/util';
import { beatNo, beatT } from './_kit';
import { lyricBlock, drawGhost, drawWisps, rain } from './_world';

export const WT = 330, GY = 1330, DX = 540, DW = 215, DT = 560;

const FRAG = /* glsl */ `
uniform float t, crack, rust, leak, slit, rattle;
uniform vec3 camv;
const float WT = ${WT}.0, GY = ${GY}.0, DX = ${DX}.0, DW = ${DW}.0, DT = ${DT}.0;

vec3 neonLight(vec2 p) {
  float dm = length((p - vec2(-160.0, 760.0)) / vec2(700.0, 900.0));
  float dc = length((p - vec2(1260.0, 520.0)) / vec2(700.0, 900.0));
  return C_MAGENTA * 0.9 / (1.0 + 6.0 * dm * dm) + C_CYAN * 0.7 / (1.0 + 6.0 * dc * dc);
}

vec3 stone(vec2 p) {
  float rh = 92.0;
  float row = floor((p.y - WT) / rh);
  float off = hash11(row * 7.1 + 3.0) * 160.0;
  float bw = 150.0 + 70.0 * hash11(row * 3.3 + 1.0);
  float col = floor((p.x + off) / bw);
  vec2 lp = vec2(mod(p.x + off, bw), mod(p.y - WT, rh));
  float edge = min(min(lp.x, bw - lp.x), min(lp.y, rh - lp.y)) + 3.0 * snoise(p * 0.04);
  float mortar = smoothstep(2.0, 7.0, edge);
  float h = hash12(vec2(col, row));
  vec3 c = mix(C_STONE, C_STONE2, 0.2 + 0.6 * h) * 1.5;
  c *= 0.7 + 0.45 * (fbm(p * 0.011 + h * 17.0, 3) * 0.5 + 0.5);
  c *= mix(0.22, 1.0, mortar);
  // wet: neon light rakes the stone faces, streaks run down
  float streak = smoothstep(0.35, 0.9, snoise(vec2(p.x * 0.045, p.y * 0.0025 - t * 0.05)));
  c += neonLight(p) * (0.35 + 0.5 * streak) * mortar * (0.6 + 0.6 * h);
  return c;
}

vec3 rustCol(vec2 p) {
  // rust runs down the metal: vertically stretched streaks, softer blotches, fine pitting
  float n = fbm(p * vec2(0.010, 0.0032) + 7.0, 4) * 0.5 + 0.5;
  float n2 = fbm(p * 0.03 + 3.1, 3) * 0.5 + 0.5;
  float pit = hash12(floor(p * 0.5));
  vec3 c = mix(C_RUSTDARK, C_RUST, smoothstep(0.22, 0.85, n * 0.65 + n2 * 0.35));
  c = mix(c, C_RUSTLITE, smoothstep(0.78, 0.97, n2) * 0.3);
  c *= 0.78 + 0.3 * pit;
  return c * 0.95;
}

vec3 door(vec2 p) {
  vec2 q = p - vec2(DX, 0.0);
  vec3 c = rustCol(p);
  for (int i = 0; i < 3; i++) {
    float sy = i == 0 ? DT + 220.0 : i == 1 ? DT + 470.0 : GY - 150.0;
    c *= mix(0.35, 1.0, smoothstep(1.5, 4.5, abs(p.y - sy)));
  }
  float fr = min(DW - abs(q.x), p.y - DT);
  c *= 0.5 + 0.5 * smoothstep(0.0, 26.0, fr);
  // rivets
  vec2 rv = vec2(mod(p.y - DT, 46.0) - 23.0, DW - abs(q.x) - 13.0);
  float rd = length(rv);
  if (p.y > DT + 20.0) c = mix(c, C_RUSTLITE * 0.9, (1.0 - smoothstep(4.0, 6.0, rd)) * 0.8);
  // the slit window: the ghost's light behind it
  if (abs(q.x) < 72.0 && p.y > DT + 78.0 && p.y < DT + 122.0) c = C_NIGHT * 0.3 + (C_CYAN * 0.6 + C_GHOST * 0.8) * slit * 2.2;
  c += neonLight(p) * 0.18;
  return c;
}

// crack distance: a jagged path parameterised by height, grown from its root by 'grow' (0..1)
float crackD(vec2 p, vec2 a, vec2 b, float seed, float grow, out float s) {
  s = (a.y - p.y) / (a.y - b.y);
  if (s < 0.0 || s > grow) return 1e4;
  float x = mix(a.x, b.x, s) + 55.0 * snoise(vec2(p.y * 0.006, seed)) + 18.0 * snoise(vec2(p.y * 0.04, seed + 4.0)) + 7.0 * snoise(vec2(p.y * 0.16, seed + 9.0)) + 2.5 * snoise(vec2(p.y * 0.6, seed + 2.0));
  return abs(p.x - x);
}

vec3 scene(vec2 p) {
  if (p.y < WT) {
    vec3 c = mix(C_NIGHT * 1.2, vec3(0.05, 0.03, 0.12), smoothstep(0.0, WT, p.y));
    c += C_VIOLET * 0.06 * smoothstep(WT - 140.0, WT, p.y);
    return c;
  }
  bool isDoor = abs(p.x - DX) < DW && p.y > DT;
  vec3 c = isDoor ? door(p + vec2(rattle, 0.0)) : stone(p);
  if (!isDoor && abs(p.x - DX) < DW + 30.0 && p.y > DT - 30.0) c *= 0.55; // door frame shadow
  // the curse: rust creeping off the door across the stones, a glowing front
  float m = 1.0 - length((p - vec2(DX, 980.0)) / vec2(620.0, 860.0)) + 0.38 * fbm(p * 0.0055, 4);
  float thr = 1.02 - rust * 1.7;
  if (!isDoor && rust > 0.0) {
    float k = smoothstep(thr - 0.004, thr + 0.02, m);
    c = mix(c, rustCol(p * 1.3 + 40.0) * 0.9, k);
    c += C_RUSTLITE * 2.4 * exp(-abs(m - thr) / 0.012) * step(rust, 0.999) * smoothstep(0.0, 0.05, rust);
  }
  // cracks: dark fissure, ghost light leaking out of it
  float s1, s2, s3;
  float d1 = crackD(p, vec2(DX - DW - 6.0, GY - 60.0), vec2(80.0, WT + 10.0), 1.7, crack, s1);
  float d2 = crackD(p, vec2(DX + DW + 6.0, DT + 140.0), vec2(1010.0, WT + 5.0), 5.3, crack * 1.25 - 0.25, s2);
  float d3 = crackD(p, vec2(DX + 40.0, DT - 4.0), vec2(DX - 90.0, WT + 5.0), 9.1, crack * 1.6 - 0.6, s3);
  float d = min(d1, min(d2, d3));
  float wcr = 1.4 + 2.2 * (1.0 - clamp(min(s1, min(s2, s3)), 0.0, 1.0));
  c = mix(c, C_NIGHT * 0.05, 1.0 - smoothstep(wcr * 0.5, wcr * 1.4, d));
  c += (C_CYAN * 0.55 * exp(-d / 7.0) + C_GHOST * 1.3 * (1.0 - smoothstep(0.0, wcr * 0.45, d))) * leak;
  return c;
}

void main() {
  vec2 sp = vec2(FRAG_PX.x, ${H}.0 - FRAG_PX.y);
  vec2 p = (sp - vec2(${W / 2}.0, ${H / 2}.0)) / camv.z + camv.xy;
  vec3 c;
  if (p.y < GY) c = scene(p);
  else {
    // wet ground: the wall reflected, rippling; cobble texture
    vec2 m = vec2(p.x + 7.0 * sin(p.y * 0.045 + t * 3.0) + 4.0 * snoise(vec2(p.x * 0.02, p.y * 0.05)), 2.0 * GY - p.y);
    float fall = exp(-(p.y - GY) / 380.0);
    vec3 refl = scene(m) * 0.42 * fall;
    float cob = fbm(p * vec2(0.03, 0.09), 3) * 0.5 + 0.5;
    c = C_NIGHT * (1.1 + 0.8 * cob) + refl + neonLight(p) * 0.12;
  }
  fragColor = vec4(c, 1.0);
}`;

export default class Door extends Scene {
  bg = new FSPass(FRAG, {
    t: { value: 0 }, crack: { value: 0 }, rust: { value: 0 }, leak: { value: 0 }, slit: { value: 0 }, rattle: { value: 0 },
    camv: { value: [DX, 960, 1] },
  });
  glow = new Layer2D();
  txt = new Layer2D();
  lb = new LineBatch(3000);
  ly!: Lyrics;
  tw: Record<string, number> = {};

  override async init() {
    this.ly = await loadLyrics();
    const words = this.ly.lines.flatMap((l) => l.words);
    const at = (q: string) => words.find((w) => w.w.toLowerCase().replace(/[^a-z']/g, '') === q && w.start > this.ctx.start - 0.5)!.start;
    for (const q of ['oh', 'worst', 'ghost', 'mind', 'beautiful', 'curse']) this.tw[q] = at(q);
  }

  /** Where the ghost is: behind the slit until "ghost", then up and out onto the wall top by "mind". */
  ghostAt(t: number) {
    const a = this.tw.ghost!, b = this.tw.mind! + 0.5;
    const k = ease.inOutCubic(prog(t, a, b));
    const x = lerp(DX, 790, k) + 12 * Math.sin(t * 1.9) * k;
    const y = lerp(DT + 100, WT - 115, ease.outCubic(prog(t, a, b))) + 10 * Math.sin(t * 2.6) * k;
    const alpha = prog(t, a - 0.05, a + 0.35);
    return { x, y, alpha };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, start = this.ctx.start;
    const b0 = Math.round(beatNo(au, start));
    const bar = clamp(Math.floor((beatNo(au, t) - b0) / 4 + 1e-4), 0, 3);
    const tb = beatT(au, b0 + 4 * bar);
    const kick = au.hit('kick', t, 0.09);
    const tw = this.tw;
    // cracks: burst on the drop, split further on "worst"; light leak breathes with the kick
    const crack = 0.55 * ease.outExpo(prog(t, start, start + 0.3)) + 0.45 * ease.outExpo(prog(t, tw.worst!, tw.worst! + 0.35));
    const leak = (0.5 + 0.9 * kick) * clamp(crack * 3);
    const rust = ease.inOutCubic(prog(t, tw.beautiful!, tw.curse! + 1.6));
    const g = this.ghostAt(t);
    // camera: one framing per bar
    const cams: [number, number, number][] = [[DX, 960, 1], [DX + 60, lerp(900, 760, prog(t, tb, tb + 1.8)), 1.12], [DX, 1010, 1.38], [DX + 20, 900, 1.02]];
    const cm = cams[bar]!;
    const u = this.bg.u;
    u.t!.value = t; u.crack!.value = crack; u.rust!.value = rust; u.leak!.value = leak;
    u.slit!.value = clamp(0.25 + prog(t, tw.ghost! - 0.4, tw.ghost!) - 0.9 * prog(t, tw.mind!, tw.mind! + 0.6)) + 0.3 * kick;
    u.rattle!.value = 5 * kick * Math.sin(t * 90);
    u.camv!.value = cm;
    this.bg.render(renderer, out);

    // ghost + wisps (world space, same camera)
    const gl = this.glow.ctx; this.glow.clear();
    gl.save();
    gl.translate(W / 2, H / 2); gl.scale(cm[2], cm[2]); gl.translate(-cm[0], -cm[1]);
    if (g.alpha > 0) {
      drawWisps(gl, g.x, g.y + 150, 70, t, { alpha: 0.45 * g.alpha, seed: 2, n: 3 });
      drawGhost(gl, g.x, g.y, 80, t, { alpha: g.alpha });
    }
    // smoke curling out of the crack
    if (crack > 0.2) drawWisps(gl, DX - DW - 30, GY - 200, 60, t, { alpha: 0.3 * leak, seed: 7, n: 2, dir: -1 });
    // CURSE, written in rust across the wall above the door as the front passes
    if (rust > 0) {
      const fam = F.archivo(125, 900), size = 190;
      const wd = measure('CURSE', fam, size);
      gl.font = font(fam, size);
      gl.fillStyle = rgba('rust', 0.95 * ease.outCubic(prog(t, tw.curse!, tw.curse! + 0.5)));
      gl.fillText('CURSE', DX - wd / 2, DT - 40);
    }
    gl.restore();
    this.glow.upload();
    comp.draw(renderer, this.glow.texture, out, { mode: 'add', tint: [1.9, 1.9, 1.9] });

    // karaoke (screen space)
    const c = this.txt.ctx; this.txt.clear();
    const line = this.ly.lineAt(t, 0.5, 0.3);
    if (line) lyricBlock(c, line, t, W / 2, 1560, { col: line.i % 2 ? 'cyan' : 'magenta', hot: 'ghost', size: 84 });
    this.txt.upload();
    comp.draw(renderer, this.txt.texture, out, { mode: 'add', tint: [2.3, 2.3, 2.3] });

    const lb = this.lb; lb.clear();
    rain(lb, t, { n: 300, intensity: 0.26 });
    lb.render(renderer, out);

    const shake = 22 * pulse(t, start, 0.07) + 12 * pulse(t, tw.worst!, 0.06) + 7 * kick + 6 * pulse(t, tb, 0.05);
    return {
      bloom: 0.95, bloomThreshold: 0.8, halation: 0.12, vignette: 0.5, grain: 0.055, ca: 1.4 + 2 * kick,
      flash: 1.3 * pulse(t, start, 0.07),
      zoom: 1 + 0.02 * kick,
      shake: [noise1(t * 60, 13) * shake, noise1(t * 60, 14) * shake],
    };
  }
}
