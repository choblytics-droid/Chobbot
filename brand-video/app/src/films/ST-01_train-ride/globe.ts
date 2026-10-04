// Frame 10b: the pull-back. From the train's dot on the night side, out over the curve of the globe,
// to one lit window on the other side of the world; a line of light joins them (the stream).
// Pixel art at the art grid, lit city dots, a thin dawn on the limb, the atmosphere's rim.
import type * as THREE from 'three';
import { Scene, type Frame } from '../../engine/scene';
import { FSPass } from '../../engine/gl';
import { AW, AH } from '../../kit/pixel';
import { Overlay } from '../../kit/overlay';
import { clamp, ease } from '../../engine/util';
import { H } from '../../engine/gl';

const FRAG = /* glsl */ `
uniform vec2 art; uniform float t, R, spin, link; uniform vec2 C;
uniform vec3 A, B; // the two points (unit vectors, globe space)
float bayer4(vec2 p) { ivec2 q = ivec2(mod(p, 4.0)); int m[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return (float(m[q.x + q.y * 4]) + 0.5) / 16.0; }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, s, 0, -s, c); }
vec2 proj(vec3 g, mat3 M) { vec3 v = M * g; return C + v.xy * R; }
void main() {
  vec2 ap = floor(vUv * art) + 0.5;
  vec2 d = (ap - C) / R;
  float r2 = dot(d, d);
  mat3 M = rotX(0.35) * rotY(spin);
  vec3 sun = normalize(vec3(-0.9, -0.15, -0.42));
  vec3 c = vec3(0.0);
  // stars
  c += vec3(0.7, 0.8, 1.0) * step(0.997, hash12(floor(ap))) * 0.5;
  if (r2 < 1.0) {
    vec3 n = vec3(d, sqrt(1.0 - r2));
    vec3 g = transpose(M) * n;                      // globe space
    float land = fbm(g * 2.2 + 3.0, 5);
    bool isLand = land > 0.05;
    float day = dot(n, sun);
    vec3 alb = isLand ? mix(vec3(0.10, 0.12, 0.08), vec3(0.16, 0.15, 0.1), sat(land * 3.0)) : vec3(0.02, 0.05, 0.12);
    // night side: ocean and land in moonlight, city lights on land
    vec3 lit = alb * (0.08 + 1.4 * sat(day));
    if (isLand && day < 0.1) {
      // lights at three scales; each shows while its cells are 1–6 art px across (fine at any zoom)
      vec2 ll = vec2(atan(g.z, g.x), asin(g.y));
      float city = 0.0;
      for (int k = 0; k < 3; k++) {
        float L = 60.0 * pow(4.0, float(k)), cpx = R / L;
        float w = smoothstep(0.5, 1.0, cpx) * smoothstep(7.0, 3.5, cpx);
        city += w * step(0.86, hash12(floor(ll * L) + float(k) * 31.0));
      }
      city *= smoothstep(0.05, 0.35, land);
      lit += vec3(1.0, 0.72, 0.38) * min(city, 1.0) * 1.6 * smoothstep(0.1, -0.15, day);
    }
    // dawn on the terminator, and the ocean's glint
    if (!isLand) lit += vec3(1.0, 0.8, 0.6) * pow(sat(dot(reflect(-sun, n), vec3(0, 0, 1))), 40.0) * 0.8;
    // posterise with an ordered dither (pixel art)
    float lv = max(max(lit.r, lit.g), lit.b), bands = 7.0;
    float q = exp2(floor(log2(max(lv, 1e-4)) * bands * 0.5 + bayer4(ap)) / (bands * 0.5));
    c = lit * q / max(lv, 1e-4);
    // the atmosphere at the limb
    c += vec3(0.25, 0.45, 1.0) * pow(1.0 - n.z, 3.0) * 0.6;
  } else {
    float rim = exp(-(sqrt(r2) - 1.0) * R * 0.12);
    c += vec3(0.2, 0.4, 1.0) * rim * 0.35;
  }
  // the link: a great-circle arc from A to B, lifted off the surface, drawn as it grows
  float best = 1e9;
  vec2 prev = vec2(0.0); bool hasPrev = false;
  for (int i = 0; i <= 96; i++) {
    float u = min(float(i) / 96.0, link);
    vec3 p = normalize(mix(A, B, u) + 1e-4);
    p *= 1.0 + 0.16 * sin(u * 3.14159);
    vec3 v = M * p;
    bool hidden = v.z < 0.0 && length(v.xy) < 1.0;   // behind the globe
    vec2 sp = C + v.xy * R;
    if (!hidden && hasPrev) best = min(best, sdSegment(ap, prev, sp));
    prev = sp; hasPrev = !hidden;
    if (float(i) / 96.0 >= link) break;
  }
  c += vec3(1.0, 0.7, 0.3) * (smoothstep(1.6, 0.4, best) * 3.0 + exp(-best * 0.35) * 0.35);
  // the two ends: the train (a warm dot) and the lit window on the other side
  for (int k = 0; k < 2; k++) {
    vec3 v = M * (k == 0 ? A : B);
    if (v.z < 0.0) continue;
    vec2 sp = C + v.xy * R;
    float dd = length(ap - sp);
    float on = k == 0 ? 1.0 : smoothstep(0.85, 1.0, link);
    c += vec3(1.0, 0.8, 0.5) * on * (step(dd, 1.6) * 6.0 + exp(-dd * 0.25) * 0.8);
  }
  fragColor = vec4(c, 1.0);
}`;

export default class Globe extends Scene {
  pass = new FSPass(FRAG, { art: { value: [AW, AH] }, t: { value: 0 }, R: { value: 100 }, spin: { value: 0 }, link: { value: 0 }, C: { value: [AW / 2, AH / 2] }, A: { value: [0, 0, 1] }, B: { value: [0, 0, -1] } });
  ov = new Overlay();
  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const z = ease.inOutCubic(clamp(f.p * 1.15));
    const u = this.pass.u;
    // the two points: the train (north, night side) and the window on the other side of the world
    const a = (lat: number, lon: number): [number, number, number] => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
    const A = a(0.75, -0.75), B = a(-0.4, 1.35);
    // camera: start close on the train's dot (the globe huge), end on the whole globe with both ends in view
    const spin = 0.75 - 0.95 * z, R = 2400 * Math.pow(112 / 2400, z);
    const tilt = 0.35, cs = Math.cos(spin), sn = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
    const vx = cs * A[0] + sn * A[2], vz0 = -sn * A[0] + cs * A[2], vy = ct * A[1] - st * vz0; // M * A (rotX · rotY)
    const end: [number, number] = [AW / 2, AH * 0.45];
    const start: [number, number] = [AW / 2 - vx * R, AH * 0.42 - vy * R];
    u.C!.value = [start[0] + (end[0] - start[0]) * z, start[1] + (end[1] - start[1]) * z];
    u.R!.value = R; u.spin!.value = spin; u.t!.value = f.t;
    u.link!.value = clamp((f.p - 0.25) / 0.6);
    u.A!.value = A; u.B!.value = B;
    this.pass.render(this.ctx.renderer, out);
    this.ov.begin();
    this.ov.title('the other side of the world', 540, H * 0.16, { a: clamp((f.p - 0.35) / 0.15) });
    this.ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.05, vignette: 0.4, bloom: 0.9, halation: 0.4, ca: 1.2 };
  }
}
