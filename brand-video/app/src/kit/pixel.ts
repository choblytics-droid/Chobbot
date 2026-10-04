// Lit pixel art (the Streamer Stories home look, docs/STYLE_DECK.md).
//
// Sets are painted as real pixel art into a small G-buffer (ART = the frame / PIX), in JS, per frame:
//   albedo   what the pixel is made of (hand-picked palette colours)
//   normal   which way it faces (x right, y up; z toward the camera is implied) + depth (0 near … 1 far)
//   emission what glows (bulbs, windows, screens), HDR via an intensity byte
// Then one GL pass lights every art pixel: a physical dusk sky (single scattering) where nothing is
// painted, sky ambient by normal, point lights with soft screen-space shadows, bounce light from
// every glowing pixel (the emission blurred through mips), posterised with an ordered dither so it
// stays pixel art. A second pass at full resolution upsizes it crisp and adds what pixel art can't
// hold: haze lit by the lights, wet-ground reflections, lit snow, the smooth glow. Post (bloom,
// halation, grain) comes from the engine.
import * as THREE from 'three';
import { FSPass, W, H, makeRT } from '../engine/gl';
import { hexToLinear } from '../engine/util';

/** Screen px per art px (logical). */
export const PIX = 4;
export const AW = Math.round(W / PIX), AH = Math.round(H / PIX);

export interface Mat {
  /** albedo, sRGB hex */
  a: string;
  /** facing (x right, y up), each -1..1; default (0, 0) = straight at the camera */
  n?: [number, number];
  /** depth 0 (near) … 1 (far); default 0.5 */
  d?: number;
  /** emission, sRGB hex, and its intensity (0..8) */
  e?: string;
  ei?: number;
  /** object id (0..255): outlines and bevels appear where ids meet */
  id?: number;
}

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** The G-buffer and a small software rasteriser on it (art px, origin top-left, y down). */
export class PixelCanvas {
  alb = new Uint8Array(AW * AH * 4);
  nrm = new Uint8Array(AW * AH * 4);
  emi = new Uint8Array(AW * AH * 4);
  tex: { alb: THREE.DataTexture; nrm: THREE.DataTexture; emi: THREE.DataTexture };
  /** clip rectangle and a global offset (camera / parallax), art px */
  ox = 0; oy = 0;
  private cache = new Map<string, { a: number[]; n: number[]; e: number[] }>();

  constructor() {
    const mk = (b: Uint8Array) => {
      const t = new THREE.DataTexture(b, AW, AH, THREE.RGBAFormat, THREE.UnsignedByteType);
      t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.flipY = false; t.generateMipmaps = false;
      return t;
    };
    this.tex = { alb: mk(this.alb), nrm: mk(this.nrm), emi: mk(this.emi) };
  }

  clear() { this.alb.fill(0); this.nrm.fill(0); this.emi.fill(0); }
  upload() { for (const t of Object.values(this.tex)) t.needsUpdate = true; }

  private enc(m: Mat) {
    const key = `${m.a}|${m.n}|${m.d}|${m.e}|${m.ei}|${m.id}`;
    let v = this.cache.get(key);
    if (!v) {
      const [r, g, b] = hex(m.a);
      const n = m.n ?? [0, 0], d = m.d ?? 0.5;
      const e = m.e ? hex(m.e) : [0, 0, 0];
      v = {
        a: [r, g, b, m.id ?? 1],
        n: [Math.round((n[0] * 0.5 + 0.5) * 255), Math.round((n[1] * 0.5 + 0.5) * 255), Math.round(d * 255), 255],
        e: [e[0]!, e[1]!, e[2]!, Math.round(((m.ei ?? (m.e ? 1 : 0)) / 8) * 255)],
      };
      this.cache.set(key, v);
    }
    return v;
  }

  /** Set one pixel (row 0 = top). */
  px(x: number, y: number, m: Mat) {
    x = Math.round(x + this.ox); y = Math.round(y + this.oy);
    if (x < 0 || y < 0 || x >= AW || y >= AH) return;
    const v = this.enc(m);
    const i = ((AH - 1 - y) * AW + x) * 4; // stored bottom-up for GL
    this.alb.set(v.a, i); this.nrm.set(v.n, i); this.emi.set(v.e, i);
  }
  /** Add emission only (a glow on top of what is there). */
  glow(x: number, y: number, e: string, ei: number) {
    x = Math.round(x + this.ox); y = Math.round(y + this.oy);
    if (x < 0 || y < 0 || x >= AW || y >= AH) return;
    const i = ((AH - 1 - y) * AW + x) * 4, c = hex(e);
    this.emi[i] = c[0]; this.emi[i + 1] = c[1]; this.emi[i + 2] = c[2]; this.emi[i + 3] = Math.round((ei / 8) * 255);
  }
  rect(x: number, y: number, w: number, h: number, m: Mat) {
    const x0 = Math.round(x), y0 = Math.round(y), x1 = Math.round(x + w), y1 = Math.round(y + h);
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.px(xx, yy, m);
  }
  /** Filled polygon (scanline, pixel centres). */
  poly(pts: [number, number][], m: Mat | ((x: number, y: number) => Mat)) {
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + 0.5, xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!, b = pts[(i + 1) % pts.length]!;
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]!); x < Math.round(xs[k + 1]!); x++) this.px(x, y, typeof m === 'function' ? m(x, y) : m);
    }
  }
  disc(cx: number, cy: number, r: number, m: Mat | ((x: number, y: number, dx: number, dy: number) => Mat)) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) this.px(x, y, typeof m === 'function' ? m(x, y, dx / r, dy / r) : m);
      }
  }
  /** Bresenham line. */
  line(x0: number, y0: number, x1: number, y1: number, m: Mat) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, m);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /**
   * A hand-drawn sprite: rows of characters, one per pixel; each character maps to a material
   * ('.' and ' ' are transparent). `flip` mirrors it. (x, y) is the top-left corner.
   */
  sprite(rows: string[], x: number, y: number, pal: Record<string, Mat>, flip = false) {
    const w = Math.max(...rows.map((r) => r.length));
    rows.forEach((r, j) => {
      for (let i = 0; i < r.length; i++) {
        const ch = r[i]!;
        if (ch === '.' || ch === ' ') continue;
        const m = pal[ch];
        if (m) this.px(x + (flip ? w - 1 - i : i), y + j, m);
      }
    });
  }
}

/** A point light: position in art px (x, y) and depth like the materials; colour sRGB hex × intensity. */
export interface Light { x: number; y: number; d: number; z?: number; col: string; i: number; r: number; shadow?: boolean }

const MAXL = 24;

const LIGHT_FRAG = /* glsl */ `
uniform sampler2D alb, nrm, emi;
uniform vec2 art;                 // AW, AH
uniform vec4 lp[${MAXL}];         // x, y (art px, y up), depth, radius
uniform vec4 lc[${MAXL}];         // linear colour * intensity, shadow flag in w
uniform int nl;
uniform float sunEl, sunAz, skyExp, ambient, bands, night, clouds, t, starsK;
uniform vec3 ambTint;
uniform vec2 horizon;              // art y of the horizon (y up), and the sky's vertical field (art px per radian)

const float ZS = 160.0;            // art px per unit of depth

// ---- physical sky: single scattering (Rayleigh + Mie), after the classic Nishita integration
const float RE = 6360e3, RA = 6420e3;
const vec3 BR = vec3(5.5e-6, 13.0e-6, 22.4e-6);
const float BM = 21e-6, HR = 7994.0, HM = 1200.0;
vec2 rsi(vec3 o, vec3 d, float r) {
  float b = dot(o, d), c = dot(o, o) - r * r, h = b * b - c;
  if (h < 0.0) return vec2(1e9, -1e9);
  h = sqrt(h); return vec2(-b - h, -b + h);
}
vec3 skyCol(vec3 dir, vec3 sun) {
  vec3 o = vec3(0.0, RE + 2.0, 0.0);
  vec2 p = rsi(o, dir, RA);
  float tmax = p.y;
  vec2 g = rsi(o, dir, RE);
  if (g.x > 0.0) tmax = min(tmax, g.x);
  const int N = 12, M = 6;
  float ds = tmax / float(N), odR = 0.0, odM = 0.0;
  vec3 sR = vec3(0.0), sM = vec3(0.0);
  float mu = dot(dir, sun);
  float pR = 3.0 / (16.0 * 3.14159) * (1.0 + mu * mu);
  float gg = 0.76;
  float pM = 3.0 / (8.0 * 3.14159) * ((1.0 - gg * gg) * (1.0 + mu * mu)) / ((2.0 + gg * gg) * pow(1.0 + gg * gg - 2.0 * gg * mu, 1.5));
  for (int i = 0; i < N; i++) {
    vec3 x = o + dir * (float(i) + 0.5) * ds;
    float hgt = length(x) - RE;
    float hr = exp(-hgt / HR) * ds, hm = exp(-hgt / HM) * ds;
    odR += hr; odM += hm;
    vec2 ls = rsi(x, sun, RA);
    float dl = ls.y / float(M), lR = 0.0, lM = 0.0;
    bool ok = true;
    for (int j = 0; j < M; j++) {
      vec3 y = x + sun * (float(j) + 0.5) * dl;
      float h2 = length(y) - RE;
      if (h2 < 0.0) { ok = false; break; }
      lR += exp(-h2 / HR) * dl; lM += exp(-h2 / HM) * dl;
    }
    if (ok) {
      vec3 tau = BR * (odR + lR) + BM * 1.1 * (odM + lM);
      vec3 att = exp(-tau);
      sR += att * hr; sM += att * hm;
    }
  }
  return 20.0 * (sR * BR * pR + sM * BM * pM);
}

float bayer4(vec2 p) {
  ivec2 q = ivec2(mod(p, 4.0));
  int i = q.x + q.y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[i]) + 0.5) / 16.0;
}
// posterise a light level into bands with an ordered dither (keeps the pixel-art look)
float post(float x, vec2 p) {
  if (bands <= 0.0) return x;
  float l = log2(max(x, 1e-4)) * bands * 0.5;
  return exp2((floor(l + bayer4(p)) ) / (bands * 0.5));
}

vec3 sunDir() { return normalize(vec3(sin(sunAz) * cos(sunEl), sin(sunEl), -cos(sunAz) * cos(sunEl))); }

vec3 skyAt(vec2 ap) {
  float el = (ap.y - horizon.x) / horizon.y;
  float az = (ap.x - art.x * 0.5) / horizon.y;
  vec3 dir = normalize(vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el)));
  vec3 s = sunDir();
  vec3 c = skyCol(normalize(vec3(dir.x, max(dir.y, 0.002), dir.z)), s) * skyExp;
  // clouds: a thin layer of flat lit bands, undersides warm from the low sun
  if (clouds > 0.0 && dir.y > 0.0) {
    vec2 cp = dir.xz / max(dir.y, 0.03) * 0.9 + vec2(t * 0.01, 0.0);
    float n = fbm(cp * vec2(0.55, 1.6), 5) * 0.5 + 0.5;
    float cov = smoothstep(0.52, 0.72, n) * clouds * smoothstep(0.0, 0.08, dir.y) * smoothstep(0.75, 0.25, dir.y);
    vec3 under = skyCol(normalize(vec3(s.x, 0.02, s.z)), s) * skyExp * 1.6;
    vec3 top = c * 0.55;
    float lit = sat(fbm(cp * vec2(0.55, 1.6) + vec2(0.0, -0.08), 4) * 0.5 + 0.5 - n + 0.55);
    c = mix(c, mix(top, under, lit), cov);
  }
  // stars, where the sky is dark enough
  float st = step(0.9975, hash12(floor(ap))) * smoothstep(0.05, 0.6, dir.y) * starsK;
  c += vec3(0.8, 0.85, 1.0) * st * 0.35 * (0.3 + 0.7 * hash12(floor(ap) + 7.0)) * (0.7 + 0.3 * sin(t * 3.0 + hash12(floor(ap)) * 40.0));
  return c;
}

void main() {
  vec2 ap = floor(vUv * art);       // art pixel (y up)
  vec4 A = texture(alb, (ap + 0.5) / art);
  vec4 N = texture(nrm, (ap + 0.5) / art);
  vec4 E = texture(emi, (ap + 0.5) / art);
  vec3 em = toLinear(E.rgb) * E.a * 8.0;
  if (N.a < 0.5) {
    vec3 c = skyAt(ap);
    c = vec3(post(c.r, ap), post(c.g, ap), post(c.b, ap));
    fragColor = vec4(c, 0.0);
    return;
  }
  vec3 al = toLinear(A.rgb);
  vec2 n2 = N.rg * 2.0 - 1.0;
  vec3 n = normalize(vec3(n2, sqrt(max(0.0, 1.0 - dot(n2, n2))) + 0.25));
  float d = N.b;
  vec3 P = vec3(ap + 0.5, -d * ZS);

  // bevel: a pixel at the edge of a nearer object tilts outward (rim light, readable silhouettes)
  float id = A.a * 255.0;
  float edge = 0.0;
  for (int k = 0; k < 4; k++) {
    vec2 o = k == 0 ? vec2(1, 0) : k == 1 ? vec2(-1, 0) : k == 2 ? vec2(0, 1) : vec2(0, -1);
    vec4 Ao = texture(alb, (ap + o + 0.5) / art), No = texture(nrm, (ap + o + 0.5) / art);
    if (No.a < 0.5 || No.b > d + 0.02 || abs(Ao.a * 255.0 - id) > 0.5) { n = normalize(n + vec3(o, 0.0) * 0.55); if (No.a < 0.5 || No.b > d + 0.02) edge = 1.0; }
  }

  // sky ambient by facing, plus the sky's horizon glow on surfaces that face it
  vec3 s = sunDir();
  vec3 zen = skyCol(vec3(0.0, 1.0, 0.0), s) * skyExp;
  vec3 hor = skyCol(normalize(vec3(s.x, 0.05, s.z)), s) * skyExp;
  vec3 amb = mix(zen * 0.35, zen, n.y * 0.5 + 0.5) * ambient * ambTint;
  amb += hor * 0.25 * ambient * sat(dot(n.xz, normalize(s.xz)) * 0.5 + 0.5) * (1.0 - abs(n.y));
  vec3 lit = amb;
  // direct sun (day shots): a warm key from the sun's side, soft
  if (sunEl > 0.0) {
    vec3 sc = skyCol(normalize(s + vec3(0.0, 0.02, 0.0)), s) * skyExp * 0.004;
    sc = normalize(sc + 1e-4) * min(length(sc), 1.0) * 2.2;
    lit += sc * sat(dot(n, normalize(vec3(s.x, s.y + 0.25, 0.6))) * 0.8 + 0.2) * smoothstep(0.0, 0.04, sunEl);
  }

  for (int i = 0; i < ${MAXL}; i++) {
    if (i >= nl) break;
    vec3 L = vec3(lp[i].xy, -lp[i].z * ZS + 6.0) - P;
    float dist = length(L);
    vec3 l = L / dist;
    float att = 1.0 / (1.0 + dist * dist / (lp[i].w * lp[i].w)) * smoothstep(lp[i].w * 6.0, lp[i].w * 2.0, dist);
    float ndl = sat(dot(n, l) * 0.8 + 0.2);
    float sh = 1.0;
    if (lc[i].w > 0.5) {
      // soft screen-space shadow: march toward the light over nearer pixels
      vec2 dir2 = lp[i].xy - P.xy;
      float len2 = min(length(dir2), 48.0);
      vec2 st2 = normalize(dir2 + 1e-4);
      float occ = 0.0;
      for (int k = 1; k <= 12; k++) {
        vec2 q = ap + 0.5 + st2 * (float(k) / 12.0) * len2;
        vec4 Nq = texture(nrm, q / art);
        if (Nq.a > 0.5 && Nq.b < d - 0.015 && Nq.b > lp[i].z - 0.05) occ += 1.0 / 6.0;
      }
      sh = 1.0 - sat(occ);
    }
    // back light: a light behind an object rims its silhouette
    float rim = edge * sat(-l.z * 1.5) * sat(dot(normalize(n.xy + 1e-4), normalize(l.xy + 1e-4)) * 0.7 + 0.3);
    lit += lc[i].rgb * att * (ndl * sh + rim * 2.5);
  }
  // bounce: light from every glowing pixel, blurred (emission mips)
  vec3 b = textureLod(emi, vUv, 2.0).rgb * textureLod(emi, vUv, 2.0).a + textureLod(emi, vUv, 3.5).rgb * textureLod(emi, vUv, 3.5).a * 1.5 + textureLod(emi, vUv, 5.0).rgb * textureLod(emi, vUv, 5.0).a * 2.0;
  lit += toLinear(b) * 9.0;
  float lv = max(max(lit.r, lit.g), lit.b);
  lit *= post(lv, ap) / max(lv, 1e-4);
  vec3 c = al * lit + em;
  fragColor = vec4(c, 1.0 - d);    // alpha: nearness (for the haze)
}`;

const COMPOSE_FRAG = /* glsl */ `
uniform sampler2D litT, emiT, nrmT;
uniform vec2 art, cam;             // cam: sub-art-pixel offset (smooth camera on crisp pixels)
uniform float t, haze, snow, wet, groundY, hazeWarm;
uniform vec3 hazeCol;
void main() {
  vec2 px = vUv * art + cam;        // art px space (y up)
  vec2 cell = floor(px);
  vec4 L = texture(litT, (cell + 0.5) / art);
  vec3 c = L.rgb;
  float near = L.a;
  vec4 N = texture(nrmT, (cell + 0.5) / art);
  // wet ground: mirror what glows above the ground line (blurred), broken up by the stones
  if (wet > 0.0 && N.a > 0.5 && px.y < groundY && N.g > 0.85) {
    float below = groundY - px.y;
    float my = groundY + below * 0.9;
    vec2 u = vec2((px.x + (hash12(floor(px * vec2(0.25, 1.0))) - 0.5) * 2.0) / art.x, my / art.y);
    vec4 r1 = textureLod(emiT, u, 1.5), r2 = textureLod(emiT, u + vec2(0.0, 3.0 / art.y), 3.0);
    vec3 r = toLinear(r1.rgb) * r1.a * 8.0 * 0.6 + toLinear(r2.rgb) * r2.a * 8.0 * 0.8;
    c += r * wet * (0.55 + 0.45 * hash12(cell)) * exp(-below / 70.0);
  }
  // haze: in-scattered light from everything that glows, thicker with distance
  vec2 uv = px / art;
  vec4 e1 = textureLod(emiT, uv, 4.0), e2 = textureLod(emiT, uv, 6.0), e3 = textureLod(emiT, uv, 7.5);
  vec3 glow = toLinear(e1.rgb) * e1.a * 1.0 + toLinear(e2.rgb) * e2.a * 1.8 + toLinear(e3.rgb) * e3.a * 2.5;
  float fog = (0.55 + 0.45 * fbm(vec3(uv * vec2(3.0, 5.0), t * 0.06), 4)) * haze;
  c += glow * 14.0 * fog * (0.35 + 0.65 * (1.0 - near));
  c += hazeCol * fog * (1.0 - near) * 0.6;
  // snow: art-pixel flakes, lit by the light around them
  if (snow > 0.0) {
    for (int k = 0; k < 3; k++) {
      float sc = 1.0 + float(k) * 0.6;
      vec2 q = px / sc + vec2(sin(t * 0.7 + float(k)) * 3.0 + t * 1.5, t * (6.0 + float(k) * 3.0));
      vec2 g = floor(q);
      float h = hash12(g + float(k) * 17.0);
      if (h > 1.0 - 0.012 * snow) {
        vec3 around = toLinear(e1.rgb) * e1.a * 30.0 + toLinear(e2.rgb) * e2.a * 20.0 + hazeCol * 1.5;
        c += around * (0.5 + 0.5 * sc / 2.2) * 0.6;
      }
    }
  }
  fragColor = vec4(c, 1.0);
}`;

/** The two GL passes and their render targets. */
export class PixelLight {
  litRT = makeRT(AW, AH, { pxScale: 1, depthBuffer: false, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.NearestFilter, generateMipmaps: true });
  light = new FSPass(LIGHT_FRAG, {
    alb: { value: null }, nrm: { value: null }, emi: { value: null }, art: { value: [AW, AH] },
    lp: { value: Array.from({ length: MAXL }, () => new THREE.Vector4()) }, lc: { value: Array.from({ length: MAXL }, () => new THREE.Vector4()) }, nl: { value: 0 },
    sunEl: { value: -0.05 }, sunAz: { value: -1.2 }, skyExp: { value: 1 }, ambient: { value: 1 }, ambTint: { value: [1, 1, 1] }, bands: { value: 10 }, night: { value: 0 },
    clouds: { value: 0.6 }, t: { value: 0 }, starsK: { value: 1 }, horizon: { value: [AH * 0.45, 300] },
  });
  compose = new FSPass(COMPOSE_FRAG, {
    litT: { value: null }, emiT: { value: null }, nrmT: { value: null }, art: { value: [AW, AH] }, cam: { value: [0, 0] },
    t: { value: 0 }, haze: { value: 0.5 }, snow: { value: 1 }, wet: { value: 0.5 }, groundY: { value: 80 }, hazeWarm: { value: 0 }, hazeCol: { value: [0.02, 0.03, 0.06] },
  });

  constructor(public pc: PixelCanvas) {
    // the emission is sampled through mips for bounce light and haze: give it mipmaps and smooth filtering
    const e = pc.tex.emi;
    e.generateMipmaps = true; e.minFilter = THREE.LinearMipmapLinearFilter; e.magFilter = THREE.LinearFilter;
  }

  /** Light the G-buffer and compose into `out` (full res, HDR linear). */
  render(r: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, o: {
    lights: Light[]; t: number; sunEl?: number; sunAz?: number; skyExp?: number; ambient?: number; ambTint?: [number, number, number]; bands?: number; clouds?: number; stars?: number;
    horizonY?: number; fov?: number; haze?: number; snow?: number; wet?: number; groundY?: number; hazeCol?: [number, number, number]; cam?: [number, number];
  }) {
    const u = this.light.u, pc = this.pc;
    pc.upload();
    u.alb!.value = pc.tex.alb; u.nrm!.value = pc.tex.nrm; u.emi!.value = pc.tex.emi;
    const ls = o.lights.slice(0, MAXL);
    ls.forEach((l, i) => {
      (u.lp!.value as THREE.Vector4[])[i]!.set(l.x, AH - l.y, l.d, l.r);
      const c = hexToLinear(l.col);
      (u.lc!.value as THREE.Vector4[])[i]!.set(c[0] * l.i, c[1] * l.i, c[2] * l.i, l.shadow ? 1 : 0);
    });
    u.nl!.value = ls.length;
    u.t!.value = o.t;
    u.sunEl!.value = o.sunEl ?? -0.05; u.sunAz!.value = o.sunAz ?? -1.2; u.skyExp!.value = o.skyExp ?? 1;
    u.ambient!.value = o.ambient ?? 1; u.ambTint!.value = o.ambTint ?? [1, 1, 1]; u.bands!.value = o.bands ?? 10;
    u.clouds!.value = o.clouds ?? 0.6; u.starsK!.value = o.stars ?? 1;
    u.horizon!.value = [AH - (o.horizonY ?? AH * 0.55), o.fov ?? 300];
    this.light.render(r, this.litRT);
    const c = this.compose.u;
    c.litT!.value = this.litRT.texture; c.emiT!.value = pc.tex.emi; c.nrmT!.value = pc.tex.nrm;
    c.t!.value = o.t; c.haze!.value = o.haze ?? 0.5; c.snow!.value = o.snow ?? 0; c.wet!.value = o.wet ?? 0;
    c.groundY!.value = AH - (o.groundY ?? AH * 0.83); c.hazeCol!.value = o.hazeCol ?? [0.02, 0.03, 0.06]; c.cam!.value = o.cam ?? [0, 0];
    this.compose.render(r, out);
  }
}
