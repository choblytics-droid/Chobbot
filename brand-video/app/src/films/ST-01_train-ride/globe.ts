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
uniform vec2 art; uniform float t, R, spin, link, expo, tilt; uniform vec2 C;
uniform vec3 A, B; // the two points (unit vectors, globe space)
float bayer4(vec2 p) { ivec2 q = ivec2(mod(p, 4.0)); int m[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return (float(m[q.x + q.y * 4]) + 0.5) / 16.0; }
// the continents, approximated by ellipses in latitude/longitude (degrees), with a ragged coast
float ell(vec2 ll, vec2 c, vec2 r) { vec2 d = (ll - c) / r; return 1.0 - dot(d, d); }
float landAt(vec3 g) {
  vec2 ll = vec2(degrees(asin(clamp(g.y, -1.0, 1.0))), degrees(atan(g.x, g.z)));
  float m = -1.0;
  // North America, Alaska, Central America, Canada, Greenland
  m = max(m, ell(ll, vec2(45.0, -100.0), vec2(16.0, 28.0))); m = max(m, ell(ll, vec2(63.0, -150.0), vec2(7.0, 14.0)));
  m = max(m, ell(ll, vec2(22.0, -100.0), vec2(8.0, 8.0))); m = max(m, ell(ll, vec2(12.0, -86.0), vec2(5.0, 5.0)));
  m = max(m, ell(ll, vec2(64.0, -100.0), vec2(9.0, 30.0))); m = max(m, ell(ll, vec2(72.0, -40.0), vec2(9.0, 13.0)));
  m = min(m, -ell(ll, vec2(60.0, -86.0), vec2(5.0, 7.0)) * 0.5 + 0.5 * m);
  // South America
  m = max(m, ell(ll, vec2(-8.0, -58.0), vec2(16.0, 14.0))); m = max(m, ell(ll, vec2(-34.0, -66.0), vec2(16.0, 6.0))); m = max(m, ell(ll, vec2(5.0, -68.0), vec2(7.0, 10.0)));
  // Europe, Scandinavia, Iberia, Britain, Italy
  m = max(m, ell(ll, vec2(50.0, 18.0), vec2(8.0, 18.0))); m = max(m, ell(ll, vec2(63.0, 16.0), vec2(7.0, 8.0)));
  m = max(m, ell(ll, vec2(40.0, -4.0), vec2(4.5, 6.0))); m = max(m, ell(ll, vec2(54.0, -3.0), vec2(4.0, 2.6))); m = max(m, ell(ll, vec2(42.5, 13.0), vec2(4.0, 2.2)));
  // Africa, the Horn, Arabia, Madagascar
  m = max(m, ell(ll, vec2(10.0, 18.0), vec2(17.0, 24.0))); m = max(m, ell(ll, vec2(-16.0, 25.0), vec2(17.0, 12.0)));
  m = max(m, ell(ll, vec2(9.0, 45.0), vec2(5.0, 6.0))); m = max(m, ell(ll, vec2(24.0, 46.0), vec2(8.0, 9.0))); m = max(m, ell(ll, vec2(-19.0, 47.0), vec2(6.0, 2.2)));
  // Asia, India, Southeast Asia, Kamchatka, Japan, Indonesia, Australia, New Zealand
  m = max(m, ell(ll, vec2(58.0, 95.0), vec2(13.0, 48.0))); m = max(m, ell(ll, vec2(38.0, 100.0), vec2(13.0, 26.0)));
  m = max(m, ell(ll, vec2(21.0, 78.0), vec2(9.0, 7.0))); m = max(m, ell(ll, vec2(15.0, 102.0), vec2(8.0, 5.0)));
  m = max(m, ell(ll, vec2(57.0, 160.0), vec2(6.0, 5.0))); m = max(m, ell(ll, vec2(36.0, 138.0), vec2(6.0, 2.4)));
  m = max(m, ell(ll, vec2(-2.0, 113.0), vec2(3.5, 14.0))); m = max(m, ell(ll, vec2(-25.0, 134.0), vec2(10.0, 17.0))); m = max(m, ell(ll, vec2(-42.0, 173.0), vec2(5.0, 2.5)));
  // Antarctica
  m = max(m, (-68.0 - ll.x) / 6.0);
  return m + fbm(g * 9.0, 5) * 0.55 + fbm(g * 23.0, 3) * 0.18;   // ragged coasts, bays, islands
}
// where people live: brighter regions
float dense(vec3 g) {
  vec2 ll = vec2(degrees(asin(clamp(g.y, -1.0, 1.0))), degrees(atan(g.x, g.z)));
  return sat(ell(ll, vec2(42.0, -82.0), vec2(10.0, 16.0))) + sat(ell(ll, vec2(49.0, 10.0), vec2(9.0, 16.0))) + sat(ell(ll, vec2(25.0, 80.0), vec2(9.0, 9.0))) + sat(ell(ll, vec2(32.0, 115.0), vec2(9.0, 12.0))) + sat(ell(ll, vec2(36.0, 138.0), vec2(5.0, 4.0))) + 0.25;
}
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, s, 0, -s, c); }
vec2 proj(vec3 g, mat3 M) { vec3 v = M * g; return C + v.xy * R; }
void main() {
  vec2 ap = floor(vUv * art) + 0.5;
  vec2 d = (ap - C) / R;
  float r2 = dot(d, d);
  mat3 M = rotX(tilt) * rotY(spin);
  vec3 sun = normalize(vec3(0.6, -0.2, -0.77));   // night over the train's side; day on the far side of the world
  vec3 c = vec3(0.0);
  // stars
  c += vec3(0.7, 0.8, 1.0) * step(0.997, hash12(floor(ap))) * 0.5;
  if (r2 < 1.0) {
    vec3 n = vec3(d, sqrt(1.0 - r2));
    vec3 g = transpose(M) * n;                      // globe space
    float land = landAt(g);
    bool isLand = land > 0.0;
    float day = dot(n, sun);
    // terrain: lowland, forest and ridges at two scales (it holds up in the close-up), snow in the north
    float tr = fbm(g * 70.0, 4), tr2 = fbm(g * 260.0, 3) * 0.6 + fbm(g * 1100.0, 3) * 0.4;
    vec3 alb = isLand ? mix(vec3(0.07, 0.10, 0.06), vec3(0.19, 0.16, 0.11), sat(land * 1.6 + tr * 0.9)) * (0.8 + 0.5 * tr2)
                      : vec3(0.015, 0.04, 0.10) * (0.85 + 0.3 * fbm(g * 120.0, 2)) + vec3(0.0, 0.02, 0.03) * sat(0.25 - land * 3.0);   // shelf water by the coast
    if (isLand && g.y > 0.8 + tr * 0.08) alb = mix(alb, vec3(0.5, 0.56, 0.66) * (0.85 + 0.3 * tr2), 0.8);   // winter snow in the far north
    if (isLand && abs(fbm(g * 22.0, 4)) < 0.009) alb = vec3(0.02, 0.05, 0.09);                              // rivers
    if (isLand && abs(g.y) > 0.92) alb = vec3(0.55, 0.6, 0.68);   // polar ice
    // night side: ocean and land in moonlight, city lights on land
    vec3 lit = alb * (0.08 + 1.4 * sat(day));
    if (isLand && day < 0.3) {
      // lights at three scales; each shows while its cells are 1–6 art px across (fine at any zoom)
      vec2 ll = vec2(atan(g.z, g.x), asin(g.y));
      float city = 0.0;
      for (int k = 0; k < 3; k++) {
        float L = 60.0 * pow(4.0, float(k)), cpx = R / L;
        float w = smoothstep(0.5, 1.0, cpx) * smoothstep(7.0, 3.5, cpx);
        city += w * step(0.86 + float(k) * 0.05, hash12(floor(ll * L) + float(k) * 31.0));
      }
      // lights crowd the coasts and the dense regions; interiors stay dark
      float coast = landAt(normalize(g + vec3(0.02, 0.0, 0.0))) < 0.0 || landAt(normalize(g - vec3(0.02, 0.0, 0.0))) < 0.0 || landAt(normalize(g + vec3(0.0, 0.02, 0.0))) < 0.0 || landAt(normalize(g + vec3(0.0, 0.0, 0.02))) < 0.0 ? 1.0 : 0.0;
      float home = exp(-distance(g, A) * 14.0);   // the train's own region: towns along the line
      city *= step(-0.8, g.y);   // nobody lives on the ice
      city *= (0.3 + coast * 0.7 + home * 3.0) * min(dense(g) + home, 1.6) * step(0.45, hash12(floor(ll * 9.0) + 3.0) + coast * 0.6 + home);
      lit += vec3(1.0, 0.72, 0.38) * min(city, 1.0) * 1.6 * smoothstep(0.3, 0.0, day);
    }
    // clouds: thin, drifting, catching moonlight and the glow of the cities below
    float cl = sat(fbm(g * vec3(5.0, 14.0, 5.0) + vec3(t * 0.01, 0.0, 0.0), 5) * 1.6 - 0.25);   // banded along the latitudes
    cl = floor(cl * 3.0 + bayer4(ap) * 0.9) / 3.0;   // pixel cloud: three flat steps
    lit = mix(lit, vec3(0.06, 0.07, 0.09) * (0.3 + 1.2 * sat(day + 0.2)) + lit * 0.45, cl * 0.55);
    // dawn on the terminator, and the ocean's glint
    if (!isLand) lit += vec3(1.0, 0.8, 0.6) * pow(sat(dot(reflect(-sun, n), vec3(0, 0, 1))), 60.0) * 0.25;
    // posterise with an ordered dither (pixel art)
    lit *= expo;
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
    p *= 1.0 + 0.2 * sin(u * 3.14159);   // a high arc: it leaves the surface and comes back down
    vec3 v = M * p;
    bool hidden = v.z < 0.0 && length(v.xy) < 1.0;   // behind the globe
    vec2 sp = C + v.xy * R;
    if (!hidden && hasPrev) best = min(best, sdSegment(ap, prev, sp));
    prev = sp; hasPrev = !hidden;
    if (float(i) / 96.0 >= link) break;
  }
  c += vec3(1.0, 0.7, 0.3) * (smoothstep(1.6, 0.4, best) * 3.0 + exp(-best * 0.35) * 0.35 + exp(-best * 0.08) * 0.12);
  // the two ends: the train (a warm dot) and the lit window on the other side
  for (int k = 0; k < 2; k++) {
    vec3 v = M * (k == 0 ? A : B);
    if (v.z < 0.0) continue;
    vec2 sp = C + v.xy * R;
    float dd = length(ap - sp);
    float on = k == 0 ? 1.0 : smoothstep(0.85, 1.0, link);
    float pulse = 0.5 + 0.5 * sin(t * 6.0 + float(k) * 2.0);
    c += vec3(1.0, 0.8, 0.5) * on * (step(dd, 1.6) * 6.0 + exp(-dd * 0.25) * 0.8 + step(abs(dd - 3.0 - pulse * 2.5), 0.5) * 1.6 * (1.0 - pulse));
  }
  fragColor = vec4(c, 1.0);
}`;

export default class Globe extends Scene {
  pass = new FSPass(FRAG, { art: { value: [AW, AH] }, t: { value: 0 }, R: { value: 100 }, spin: { value: 0 }, link: { value: 0 }, expo: { value: 1 }, tilt: { value: 0.35 }, C: { value: [AW / 2, AH / 2] }, A: { value: [0, 0, 1] }, B: { value: [0, 0, -1] } });
  ov = new Overlay();
  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const z = ease.inOutCubic(clamp(f.p * 1.15));
    const u = this.pass.u;
    // the two points: the train (north, night side) and the window on the other side of the world
    const a = (lat: number, lon: number): [number, number, number] => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
    // (map positions are illustrative: the post names neither place; the town set reads as Europe)
    const A = a(0.86, 0.25), B = a(-0.62, 2.35);
    // camera: start close on the train's dot near the globe's edge (the curve and the air show above it),
    // end on the whole globe with both ends in view, left of the buttons column
    // the end view looks at the link's plane face on (from a little south), so the arc reads as a curve
    const spin = -1.555 + 0.955 * z, R = 900 * Math.pow(96 / 900, z);
    const tilt = 0.35 - 0.85 * z;
    u.tilt!.value = tilt;
    const cs = Math.cos(spin), sn = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
    const vx = cs * A[0] + sn * A[2], vz0 = -sn * A[0] + cs * A[2], vy = ct * A[1] - st * vz0; // M * A (rotX · rotY)
    const end: [number, number] = [AW * 0.37, AH * 0.45];   // the arc bulges right: keep it left of the buttons column
    const start: [number, number] = [AW * 0.55 - vx * R, AH * 0.4 - vy * R];
    u.C!.value = [start[0] + (end[0] - start[0]) * z, start[1] + (end[1] - start[1]) * z];
    u.expo!.value = 1.9 - 0.9 * z;
    u.R!.value = R; u.spin!.value = spin; u.t!.value = f.t;
    u.link!.value = clamp((f.p - 0.2) / 0.48);   // the link lands while the end marker is in view
    u.A!.value = A; u.B!.value = B;
    this.pass.render(this.ctx.renderer, out);
    this.ov.begin();
    this.ov.title('the other side of the world', 540, H * 0.16, { a: clamp((f.p - 0.35) / 0.15) });
    this.ov.draw(this.ctx.renderer, this.ctx.comp, out);
    return { grain: 0.05, vignette: 0.4, bloom: 0.9, halation: 0.4, ca: 1.2 };
  }
}
