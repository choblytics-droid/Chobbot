// Global post-processing: bloom + halation, chromatic aberration, RGB split, VHS glitch, pixelate,
// colour grade, light leak, tone shoulder, CRT scanlines, Bayer dither, film grain, vignette, fades/flash. Operates on the composited HDR (linear) frame.
import * as THREE from 'three';
import { FSPass, makeRT, W, H, SCALE } from './gl';
import { frameIdx } from './util';

/** The tone shoulder (linear HDR -> 0..1 linear), shared with the engine's sampling error estimate. */
export const SHOULDER_GLSL = /* glsl */ `
vec3 shoulder(vec3 x) {
  // identity below k, smooth exponential shoulder above; very bright values desaturate toward white
  const float k = 0.72;
  vec3 y = mix(x, k + (1.0 - k) * (1.0 - exp(-(x - k) / (1.0 - k))), step(k, x));
  float over = max(max(x.r, x.g), x.b);
  return mix(y, vec3(1.0), smoothstep(2.0, 12.0, over) * 0.85);
}`;

export interface PostParams {
  exposure: number;
  bloom: number; // bloom strength
  bloomThreshold: number; // linear luminance where bloom starts
  bloomKnee: number; // soft knee width
  bloomRadius: number; // 0..1 upsample spread
  halation: number; // red-orange film halation around highlights
  ca: number; // chromatic aberration in px at the frame edge
  grain: number; // grain amplitude (sRGB units), ~0.04-0.1
  vignette: number; // 0..1
  hud: number; // HUD opacity multiplier
  /** 0..1: cinematic letterbox bars (2.39:1). */
  letterbox: number;
  /** 0..1: camcorder REC overlay. */
  rec: number;
  /** Singer tag ('' none), its visibility and accent colour key. */
  tag: string;
  tagA: number;
  tagColor: string;
  fade: number; // fade to black 0..1
  flash: number; // additive bone-white flash 0..1+
  flashColor: [number, number, number]; // linear colour of the flash
  shake: [number, number]; // frame offset in px
  zoom: number; // frame zoom (1 = none), for punch-ins on hits
  rot: number; // frame roll (radians), for dutch-angle kicks
  invert: number; // 0..1 invert
  /** Horizontal RGB split in px (on top of the radial CA): kicks, glitches. */
  split: number;
  /** 0..1 VHS/datamosh block glitch (row tears, block shifts, colour bleed). */
  glitch: number;
  /** 0..1 CRT scanlines + aperture mask. */
  scan: number;
  /** Pixelate block size in logical px (<= 1: off). */
  pixelate: number;
  /** 0..1 ordered (Bayer) dither posterize: the 8-bit/pixel-art grade. */
  dither: number;
  /** Colour grade: gain (multiply), lift (add, linear), saturation, contrast (1 = neutral). */
  gain: [number, number, number];
  lift: [number, number, number];
  saturation: number;
  contrast: number;
  /** 0..1 moving film light leak, and its linear colour. */
  leak: number;
  leakColor: [number, number, number];
}

export const DEFAULT_POST: PostParams = {
  exposure: 1,
  bloom: 0.6,
  bloomThreshold: 0.8,
  bloomKnee: 0.5,
  bloomRadius: 0.75,
  halation: 0.2,
  ca: 1.4,
  grain: 0.05,
  vignette: 0.4,
  hud: 1,
  letterbox: 0,
  rec: 0,
  tag: '',
  tagA: 0,
  tagColor: 'cyan',
  fade: 0,
  flash: 0,
  flashColor: [0.9, 0.86, 0.8],
  shake: [0, 0],
  zoom: 1,
  rot: 0,
  invert: 0,
  split: 0,
  glitch: 0,
  scan: 0,
  pixelate: 0,
  dither: 0,
  gain: [1, 1, 1],
  lift: [0, 0, 0],
  saturation: 1,
  contrast: 1,
  leak: 0,
  leakColor: [1.0, 0.35, 0.08],
};

const MIPS = 6;

export class Post {
  private prefilter: FSPass;
  private down: FSPass;
  private up: FSPass;
  private final: FSPass;
  private finalFrag = '';
  private finalUniforms: Record<string, THREE.IUniform> = {};
  private variants = new Map<string, FSPass>();
  private mips: THREE.WebGLRenderTarget[] = [];
  private ups: THREE.WebGLRenderTarget[] = [];

  constructor() {
    // the bloom pyramid stays at the logical resolution at every output scale (same radii, same look)
    // pyramid from quarter resolution: bloom is blurry anyway, and the half-res levels were the most
    // expensive passes in a software (SwiftShader) render
    let w = W >> 2, h = H >> 2;
    for (let i = 0; i < MIPS; i++) {
      this.mips.push(makeRT(Math.max(2, w), Math.max(2, h), { depthBuffer: false, pxScale: Math.min(1, SCALE) }));
      this.ups.push(makeRT(Math.max(2, w), Math.max(2, h), { depthBuffer: false, pxScale: Math.min(1, SCALE) }));
      w >>= 1; h >>= 1;
    }
    this.prefilter = new FSPass(/* glsl */ `
      uniform sampler2D src; uniform vec2 texel; uniform float threshold, knee;
      void main() {
        // 4-tap box downsample + soft threshold on luminance
        vec3 c = vec3(0.0);
${SCALE <= 1 ? `        c += texture(src, vUv + texel * vec2(-1, -1)).rgb; c += texture(src, vUv + texel * vec2(1, -1)).rgb;
        c += texture(src, vUv + texel * vec2(-1, 1)).rgb;  c += texture(src, vUv + texel * vec2(1, 1)).rgb;
        c *= 0.25;` : `        // output scale > 1: the same 4x4-logical-px box from a SCALE x larger source, as 2x2-texel bilinear taps
        const int N = ${SCALE * 2};
        for (int j = 0; j < N; j++) for (int i = 0; i < N; i++)
          c += texture(src, vUv + texel * (vec2(float(i), float(j)) * 2.0 - float(N - 1)) / PX_SCALE).rgb;
        c /= float(N * N);`}
        c = min(c, vec3(40.0));
        float l = max(c.r, max(c.g, c.b));
        float rq = clamp(l - threshold + knee, 0.0, 2.0 * knee);
        rq = rq * rq / (4.0 * knee + 1e-5);
        float w = max(rq, l - threshold) / max(l, 1e-5);
        fragColor = vec4(c * w, 1.0);
      }`, { src: { value: null }, texel: { value: new THREE.Vector2() }, threshold: { value: 1 }, knee: { value: 0.5 } });
    this.down = new FSPass(/* glsl */ `
      uniform sampler2D src; uniform vec2 texel;
      void main() {
        // 13-tap downsample (Jimenez 2014)
        vec3 a = texture(src, vUv + texel * vec2(-2, -2)).rgb, b = texture(src, vUv + texel * vec2(0, -2)).rgb, c = texture(src, vUv + texel * vec2(2, -2)).rgb;
        vec3 d = texture(src, vUv + texel * vec2(-1, -1)).rgb, e = texture(src, vUv + texel * vec2(1, -1)).rgb;
        vec3 f = texture(src, vUv + texel * vec2(-2, 0)).rgb, g = texture(src, vUv).rgb, h = texture(src, vUv + texel * vec2(2, 0)).rgb;
        vec3 i = texture(src, vUv + texel * vec2(-1, 1)).rgb, j = texture(src, vUv + texel * vec2(1, 1)).rgb;
        vec3 k = texture(src, vUv + texel * vec2(-2, 2)).rgb, l = texture(src, vUv + texel * vec2(0, 2)).rgb, m = texture(src, vUv + texel * vec2(2, 2)).rgb;
        vec3 o = (d + e + i + j) * 0.125 + (a + b + g + f) * 0.03125 + (b + c + h + g) * 0.03125 + (f + g + l + k) * 0.03125 + (g + h + m + l) * 0.03125;
        fragColor = vec4(o, 1.0);
      }`, { src: { value: null }, texel: { value: new THREE.Vector2() } });
    this.up = new FSPass(/* glsl */ `
      uniform sampler2D src; uniform sampler2D prev; uniform vec2 texel; uniform float radius;
      void main() {
        // 9-tap tent upsample of the smaller level, added to this level
        vec2 o = texel * radius;
        vec3 s = texture(src, vUv - o).rgb + 2.0 * texture(src, vUv + vec2(0, -o.y)).rgb + texture(src, vUv + vec2(o.x, -o.y)).rgb
          + 2.0 * texture(src, vUv + vec2(-o.x, 0)).rgb + 4.0 * texture(src, vUv).rgb + 2.0 * texture(src, vUv + vec2(o.x, 0)).rgb
          + texture(src, vUv + vec2(-o.x, o.y)).rgb + 2.0 * texture(src, vUv + vec2(0, o.y)).rgb + texture(src, vUv + o).rgb;
        fragColor = vec4(texture(prev, vUv).rgb + s / 16.0, 1.0);
      }`, { src: { value: null }, prev: { value: null }, texel: { value: new THREE.Vector2() }, radius: { value: 1 } });
    this.finalFrag = `
      uniform sampler2D src; uniform sampler2D bloomTex; uniform sampler2D haloTex; uniform sampler2D hudTex;
      uniform float exposure, bloom, halation, ca, grain, vignette, hud, fade, flash, time, zoom, invert, rot;
      uniform float split, glitch, scan, pixelate, dither, saturation, contrast, leak, fidx, letterbox;
      uniform vec3 flashColor, gain, lift, leakColor;
      uniform vec2 shake; uniform vec2 res;
      ${SHOULDER_GLSL}
      float bayer4(vec2 p) {
        ivec2 q = ivec2(mod(p, 4.0));
        int i = q.x + q.y * 4;
        int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
        return (float(m[i]) + 0.5) / 16.0;
      }
      void main() {
        vec2 dc0 = vUv - 0.5;
        vec2 asp = vec2(res.x / res.y, 1.0);
        vec2 uv = (rot2(rot) * (dc0 * asp)) / asp / zoom + 0.5 - shake / res;
        // pixelate (logical px blocks)
#ifdef FX_PIX
        vec2 bpx = vec2(pixelate) / res; uv = (floor(uv / bpx) + 0.5) * bpx;
#endif
        // VHS / datamosh glitch: horizontal tears per band, block shifts
        float gshift = 0.0;
#ifdef FX_GLITCH
        {
          float band = floor(uv.y * res.y / (6.0 + 40.0 * hash11(fidx * 1.7)));
          float r1 = hash12(vec2(band, fidx));
          gshift += step(1.0 - glitch * 0.55, r1) * (hash12(vec2(band * 3.1, fidx + 7.0)) - 0.5) * 0.12 * glitch;
          vec2 blk = floor(uv * vec2(16.0, 9.0) * (1.0 + floor(hash11(fidx) * 3.0)));
          float r2 = hash12(blk + fidx * 13.0);
          if (r2 > 1.0 - glitch * 0.25) uv += (hash22(blk + fidx) - 0.5) * 0.06 * glitch;
          uv.x += sin(uv.y * 900.0 + fidx * 3.0) * 0.0006 * glitch;
          uv.x += gshift;
        }
#endif
        vec2 dc = uv - 0.5;
        float r2 = dot(dc * asp, dc * asp);
        vec2 off = dc * r2 * ca / res.x * 4.0 + vec2((split + glitch * 14.0 * abs(gshift) * 40.0) / res.x, 0.0);
        // nearest texel fetches: filtered float-texture sampling is very slow in a software renderer, and
        // at 1:1 the scene is sampled on its own pixel grid anyway (CA offsets are only a few px)
        ivec2 srcSize = textureSize(src, 0);
        vec2 sz = vec2(srcSize);
        ivec2 lim = srcSize - 1;
        vec3 col;
        col.r = texelFetch(src, clamp(ivec2((uv + off) * sz), ivec2(0), lim), 0).r;
        col.g = texelFetch(src, clamp(ivec2(uv * sz), ivec2(0), lim), 0).g;
        col.b = texelFetch(src, clamp(ivec2((uv - off) * sz), ivec2(0), lim), 0).b;
        vec3 bl = texture(bloomTex, uv).rgb;
        vec3 ha = texture(haloTex, uv).rgb;
        col += bl * bloom;
        col += vec3(1.0, 0.18, 0.04) * luma(ha) * halation;
        col *= exposure;
        // grade (linear): gain / lift / saturation / contrast around mid-grey
#ifdef FX_GRADE
        col = col * gain + lift;
        float lc = luma(col);
        col = max(mix(vec3(lc), col, saturation), 0.0);
        col = 0.18 * pow(col / 0.18 + 1e-6, vec3(contrast));
#endif
        // light leak: a warm blob drifting along the left/top edge
#ifdef FX_LEAK
        {
          vec2 lp = vec2(-0.1 + 0.25 * sin(time * 0.37), 0.8 + 0.3 * sin(time * 0.23));
          float ld = length((vUv - lp) * asp);
          col += leakColor * leak * exp(-ld * ld * 3.0);
        }
#endif
        col = shoulder(col);
#ifdef FX_INVERT
        col = mix(col, vec3(0.8515) - col * 0.84, invert);
#endif
        col += flashColor * flash;
        float v = smoothstep(0.95, 0.25, length(dc0 * vec2(1.0, 0.8)));
        col *= mix(1.0, v, vignette);
        col *= (1.0 - fade);
        vec3 s = toSRGB(sat(col));
        // CRT: scanlines every 3 logical px + slot mask
#ifdef FX_SCAN
        {
          float sl = 0.5 + 0.5 * cos(FRAG_PX.y * TAU / 3.0);
          s *= 1.0 - scan * 0.38 * sl;
          int sx = int(mod(FRAG_PX.x, 3.0));
          vec3 mask = sx == 0 ? vec3(1.0, 0.8, 0.8) : sx == 1 ? vec3(0.8, 1.0, 0.8) : vec3(0.8, 0.8, 1.0);
          s *= mix(vec3(1.0), mask * 1.12, scan * 0.6);
        }
#endif
        // ordered dither posterize (the pixel-art grade)
#ifdef FX_DITHER
        {
          float lv = mix(64.0, 7.0, dither);
          vec2 dp = pixelate > 1.0 ? floor(FRAG_PX / pixelate) : floor(FRAG_PX / 2.0);
          s = floor(s * lv + bayer4(dp)) / lv;
        }
#endif
${SCALE <= 1 ? `        float g1 = hash12(gl_FragCoord.xy + fract(time * 13.37) * 1000.0) - 0.5;
        float g2 = hash12(floor(gl_FragCoord.xy / 2.0) + fract(time * 7.13) * 1000.0) - 0.5;` : `        float g1 = (hash12(gl_FragCoord.xy + fract(time * 13.37) * 1000.0) - 0.5) * PX_SCALE;
        float g2 = hash12(floor(FRAG_PX / 2.0) + fract(time * 7.13) * 1000.0) - 0.5;`}
        float lm = luma(s);
        float amt = grain * (0.55 + 1.2 * lm * (1.0 - lm));
        s += (g1 * 0.6 + g2 * 0.4) * amt;
        s += (hash12(gl_FragCoord.xy * 1.37 + time) - 0.5) / 255.0; // dither
        // letterbox bars (2.39:1 -> 138 logical px each), then the HUD on top, crisp
        float lb = 138.0 * letterbox;
        float yb = vUv.y * res.y;
        float bar = step(yb, lb) + step(res.y - lb, yb);
        s = mix(s, vec3(0.004) + (g1 * 0.6 + g2 * 0.4) * 0.012, sat(bar));
        vec4 h = texture(hudTex, vUv);
        s = mix(s, toSRGB(h.rgb / max(h.a, 1e-4)), h.a * hud);
        fragColor = vec4(sat(s), 1.0);
      }`;
    this.finalUniforms = {
      src: { value: null }, bloomTex: { value: null }, haloTex: { value: null }, hudTex: { value: null },
      exposure: { value: 1 }, bloom: { value: 0.5 }, halation: { value: 0.2 }, ca: { value: 1 }, grain: { value: 0.05 },
      vignette: { value: 0.3 }, hud: { value: 1 }, fade: { value: 0 }, flash: { value: 0 }, time: { value: 0 },
      zoom: { value: 1 }, rot: { value: 0 }, invert: { value: 0 }, shake: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(W, H) },
      split: { value: 0 }, glitch: { value: 0 }, scan: { value: 0 }, pixelate: { value: 0 }, dither: { value: 0 },
      saturation: { value: 1 }, contrast: { value: 1 }, leak: { value: 0 }, fidx: { value: 0 }, letterbox: { value: 0 },
      flashColor: { value: new THREE.Vector3() }, gain: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3() },
      leakColor: { value: new THREE.Vector3() },
    };
    this.final = this.variant('');
  }

  /** The final pass compiled with only the features in use (a software GPU runs every branch). */
  private variant(key: string) {
    let p = this.variants.get(key);
    if (!p) {
      const defs = key.split(',').filter(Boolean).map((k) => `#define ${k}`).join('\n');
      p = new FSPass(defs + '\n' + this.finalFrag, this.finalUniforms);
      this.variants.set(key, p);
    }
    return p;
  }

  /** Apply the chain: src (HDR linear) -> out (sRGB 8-bit target or screen). */
  render(renderer: THREE.WebGLRenderer, src: THREE.Texture, hud: THREE.Texture, out: THREE.WebGLRenderTarget | null, p: PostParams, time: number) {
    // bloom pyramid
    this.prefilter.u.src!.value = src;
    (this.prefilter.u.texel!.value as THREE.Vector2).set(1.5 / (W * Math.min(1, SCALE)), 1.5 / (H * Math.min(1, SCALE)));
    this.prefilter.u.threshold!.value = p.bloomThreshold;
    this.prefilter.u.knee!.value = p.bloomKnee;
    this.prefilter.render(renderer, this.mips[0]!);
    for (let i = 1; i < MIPS; i++) {
      const s = this.mips[i - 1]!;
      this.down.u.src!.value = s.texture;
      (this.down.u.texel!.value as THREE.Vector2).set(1 / s.width, 1 / s.height);
      this.down.render(renderer, this.mips[i]!);
    }
    // upsample: ups[i] = mips[i] + up(ups[i+1])
    let prevTex = this.mips[MIPS - 1]!.texture;
    for (let i = MIPS - 2; i >= 0; i--) {
      const small = i === MIPS - 2 ? this.mips[MIPS - 1]! : this.ups[i + 1]!;
      this.up.u.src!.value = prevTex;
      this.up.u.prev!.value = this.mips[i]!.texture;
      (this.up.u.texel!.value as THREE.Vector2).set(1 / small.width, 1 / small.height);
      this.up.u.radius!.value = 0.5 + p.bloomRadius;
      this.up.render(renderer, this.ups[i]!);
      prevTex = this.ups[i]!.texture;
    }
    const flags: string[] = [];
    if (p.pixelate > 1) flags.push('FX_PIX');
    if (p.glitch > 0) flags.push('FX_GLITCH');
    if (p.gain.some((x) => x !== 1) || p.lift.some((x) => x !== 0) || p.saturation !== 1 || p.contrast !== 1) flags.push('FX_GRADE');
    if (p.leak > 0) flags.push('FX_LEAK');
    if (p.invert > 0) flags.push('FX_INVERT');
    if (p.scan > 0) flags.push('FX_SCAN');
    if (p.dither > 0) flags.push('FX_DITHER');
    this.final = this.variant(flags.join(','));
    const f = this.final.u;
    f.src!.value = src;
    f.bloomTex!.value = this.ups[0]!.texture;
    f.haloTex!.value = this.ups[2]!.texture;
    f.hudTex!.value = hud;
    f.exposure!.value = p.exposure;
    f.bloom!.value = p.bloom / 2.6; // pyramid sums ~MIPS levels; normalize
    f.halation!.value = p.halation;
    f.ca!.value = p.ca;
    f.grain!.value = p.grain;
    f.vignette!.value = p.vignette;
    f.hud!.value = p.hud;
    f.fade!.value = p.fade;
    f.flash!.value = p.flash;
    f.time!.value = time;
    f.zoom!.value = p.zoom;
    f.invert!.value = p.invert;
    f.rot!.value = p.rot;
    f.split!.value = p.split;
    f.glitch!.value = p.glitch;
    f.scan!.value = p.scan;
    f.pixelate!.value = p.pixelate;
    f.dither!.value = p.dither;
    f.saturation!.value = p.saturation;
    f.contrast!.value = p.contrast;
    f.leak!.value = p.leak;
    f.letterbox!.value = p.letterbox;
    f.fidx!.value = frameIdx(time) % 997;
    (f.flashColor!.value as THREE.Vector3).set(...p.flashColor);
    (f.gain!.value as THREE.Vector3).set(...p.gain);
    (f.lift!.value as THREE.Vector3).set(...p.lift);
    (f.leakColor!.value as THREE.Vector3).set(...p.leakColor);
    (f.shake!.value as THREE.Vector2).set(p.shake[0], p.shake[1]);
    this.final.render(renderer, out);
  }
}
