// The streamer's room: the recurring set of the Pain → Need → Function series.
// One fullscreen pass, all procedural: a back wall lit by the monitor, a window whose blinds cut god
// rays through the haze, the desk with keyboard and mouse, the monitor with a game on it, and the
// streamer in the foreground from behind (hoodie, headset), rim-lit by whatever lights the room.
//
// Two lights carry the story: the cold monitor (frost) is the pain, the companion (signal) is the
// answer. `warm` blends the room's grade between them; `comp` is the companion's position and power.
//
// World space: px, y down, origin at the monitor's centre. The camera (cx, cy, zoom) maps it to the
// frame, so the same room works in 9:16 and 16:9 (the world is wider than either frame).
import type * as THREE from 'three';
import { FSPass, W, H } from '../engine/gl';

export const MON = { w: 860, h: 500 }; // monitor screen size (world px)
export const HEAD = { x: -190, y: 720 }; // the back of the streamer's head

const FRAG = /* glsl */ `
uniform float t, warm, compI, screenB, kick, lapse, focus, day, glitch;
uniform vec3 cam;          // world x, y at frame centre; zoom
uniform vec2 comp;         // companion position (world)
const vec2 MONH = vec2(${MON.w / 2}.0, ${MON.h / 2}.0);
const vec2 HEADC = vec2(${HEAD.x}.0, ${HEAD.y}.0);

float sdEllipse(vec2 p, vec2 r) { float k = length(p / r); return (k - 1.0) * min(r.x, r.y); }
float smin2(float a, float b, float k) { float h = sat(0.5 + 0.5 * (b - a) / k); return mix(b, a, h) - k * h * (1.0 - h); }

// ---------------------------------------------------------------- the streamer (from behind)
float sdStreamer(vec2 p) {
  vec2 q = p - HEADC;
  float head = sdEllipse(q, vec2(172.0, 200.0));
  float hood = sdEllipse(q - vec2(10.0, 250.0), vec2(250.0, 150.0));
  float body = sdEllipse(q - vec2(40.0, 620.0), vec2(560.0, 420.0));
  float d = smin2(head, hood, 70.0);
  d = smin2(d, body, 120.0);
  // headset: band over the top, ear cups on both sides
  float band = abs(length(q - vec2(0.0, 18.0)) - 196.0) - 13.0;
  band = max(band, q.y - 10.0);
  float cupL = sdEllipse(q - vec2(-178.0, 40.0), vec2(42.0, 78.0));
  float cupR = sdEllipse(q - vec2(176.0, 40.0), vec2(40.0, 76.0));
  d = min(d, min(band, min(cupL, cupR)));
  return d;
}
// headset parts only (for their sheen)
float sdHeadset(vec2 p) {
  vec2 q = p - HEADC;
  float band = abs(length(q - vec2(0.0, 18.0)) - 196.0) - 13.0;
  band = max(band, q.y - 10.0);
  return min(band, min(sdEllipse(q - vec2(-178.0, 40.0), vec2(42.0, 78.0)), sdEllipse(q - vec2(176.0, 40.0), vec2(40.0, 76.0))));
}

// ---------------------------------------------------------------- the game on the monitor
vec3 game(vec2 uv) { // uv in [0,1]^2, y up
  float sc = t * 0.06;
  vec3 sky = mix(vec3(0.03, 0.05, 0.09), vec3(0.16, 0.22, 0.32), uv.y);
  vec3 c = sky;
  // three parallax ridges
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = uv.x * (1.4 + fi) + sc * (0.5 + fi * 0.8) + fi * 3.7;
    float hgt = 0.62 - fi * 0.16 + 0.10 * snoise(vec2(x * 1.3, fi)) + 0.04 * snoise(vec2(x * 5.0, fi + 9.0));
    float m = smoothstep(hgt + 0.004, hgt - 0.004, uv.y);
    c = mix(c, vec3(0.02, 0.03, 0.05) + vec3(0.05, 0.07, 0.1) * (2.0 - fi) * 0.5, m);
  }
  // the player: a small bright figure hopping across the near ridge, a boss shape ahead
  float px = 0.32 + 0.02 * sin(t * 1.3);
  float py = 0.30 + 0.06 * abs(sin(t * 3.1));
  float pl = 1.0 - smoothstep(0.0, 0.004, max(abs(uv.x - px) - 0.012, abs(uv.y - py) - 0.022));
  c += vec3(0.9, 0.95, 1.0) * pl * 1.6;
  float boss = 1.0 - smoothstep(0.0, 0.01, length((uv - vec2(0.74, 0.36)) * vec2(1.0, 1.3)) - 0.09 - 0.01 * sin(t * 6.0));
  c = mix(c, vec3(0.5, 0.08, 0.1) * (0.7 + 0.3 * sin(t * 9.0)), boss * 0.85);
  // HUD: health bars
  float hb = step(abs(uv.y - 0.93), 0.012) * step(0.04, uv.x) * step(uv.x, 0.04 + 0.22 * (0.7 + 0.1 * sin(t * 0.7)));
  c = mix(c, vec3(0.85, 0.9, 0.95), hb * 0.8);
  float bb = step(abs(uv.y - 0.93), 0.012) * step(0.56, uv.x) * step(uv.x, 0.96);
  c = mix(c, vec3(0.6, 0.12, 0.12), bb * 0.75);
  // the LED panel: sub-pixel stripes and row gaps, visible in close-ups
  vec2 g = uv * vec2(${MON.w}.0, ${MON.h}.0) / 2.2;
  float stripe = 0.82 + 0.18 * cos(fract(g.x) * TAU);
  c *= stripe * (0.9 + 0.1 * step(0.15, fract(g.y)));
  return c;
}

// ---------------------------------------------------------------- lights
// distance to the monitor's screen rectangle (0 inside)
float dScreen(vec2 p) { vec2 d = abs(p) - MONH; return length(max(d, 0.0)); }
vec3 monitorLight(vec2 p, float spread) {
  float d = dScreen(p);
  float fl = 1.0 + 0.05 * sin(t * 13.0) * sin(t * 7.3) + 0.25 * lapse * sin(t * 40.0);
  vec3 col = mix(C_FROST, mix(C_FROST, C_BONE, 0.35), day);
  return col * screenB * fl / (1.0 + pow(d / spread, 2.0));
}
vec3 compLight(vec2 p, float spread) {
  float d = length(p - comp);
  return C_SIGNAL * compI / (1.0 + pow(d / spread, 2.0));
}

void main() {
  vec2 sp = vec2(FRAG_PX.x, ${H}.0 - FRAG_PX.y);
  vec2 p = (sp - vec2(${W / 2}.0, ${H / 2}.0)) / cam.z + cam.xy;
  // the glitch: horizontal slices shift (spam, the pain)
  if (glitch > 0.0) {
    float row = floor(sp.y / 38.0);
    float on = step(1.0 - glitch * 0.5, hash11(row * 13.1 + floor(t * 24.0)));
    p.x += on * (hash11(row + floor(t * 24.0) * 3.0) - 0.5) * 120.0 * glitch;
  }

  // ---- back wall: acoustic panels, lit by the monitor and the companion
  vec2 wp = p;
  float panel = smoothstep(0.0, 3.0, abs(fract(wp.x / 210.0) - 0.5) * 210.0 - 2.0);
  float grain = fbm(wp * 0.004, 3) * 0.5 + 0.5;
  vec3 wall = C_STEEL * (0.18 + 0.12 * grain) * mix(0.6, 1.0, panel);
  wall += monitorLight(p, 520.0) * 0.55 * (0.7 + 0.3 * grain);
  wall += compLight(p, 380.0) * 0.6 * (0.7 + 0.3 * grain);
  // window (left) with blinds: cold moonlight, warm daylight in the time-lapse
  vec2 wq = p - vec2(-820.0, -230.0);
  float win = step(abs(wq.x), 170.0) * step(abs(wq.y), 300.0);
  float slat = step(0.42, fract(wq.y / 34.0));
  vec3 winCol = mix(C_FROST * 0.45, C_EMBER * 1.4, day);
  vec3 c = mix(wall, winCol * slat + C_NIGHT * (1.0 - slat), win);

  // ---- desk, keyboard, mouse
  if (p.y > 400.0) {
    float top = smoothstep(400.0, 404.0, p.y) * (1.0 - smoothstep(560.0, 566.0, p.y));
    vec3 desk = C_INK2 * 0.6 + monitorLight(p, 300.0) * 0.35 * top + compLight(p, 300.0) * 0.5 * top;
    // the monitor's reflection on the desk top
    vec2 rp = vec2(p.x, 2.0 * 400.0 - p.y + 40.0);
    if (abs(rp.x) < MONH.x && abs(rp.y) < MONH.y) desk += game(vec2(rp.x / (2.0 * MONH.x) + 0.5, 0.5 - rp.y / (2.0 * MONH.y))) * 0.12 * top * screenB;
    // keyboard: a slab with a faint grid of key light
    vec2 kq = p - vec2(150.0, 470.0);
    float kb = sdBox(kq, vec2(250.0, 38.0)) - 8.0;
    vec2 kg = fract(kq / vec2(26.0, 25.0)) - 0.5;
    float keys = smoothstep(0.42, 0.3, max(abs(kg.x), abs(kg.y)));
    vec3 kcol = C_INK * 0.4 + (monitorLight(p, 200.0) * 0.25 + compLight(p, 200.0) * 0.8) * keys;
    desk = mix(desk, kcol, smoothstep(1.5, -1.5, kb));
    float mouse = sdEllipse(p - vec2(480.0, 478.0), vec2(30.0, 44.0));
    desk = mix(desk, C_INK * 0.5 + monitorLight(p, 160.0) * 0.4, smoothstep(1.5, -1.5, mouse));
    float front = smoothstep(560.0, 566.0, p.y);
    desk = mix(desk, C_INK * 0.25, front);
    c = desk;
  }

  // ---- monitor: stand, bezel, screen
  float stand = max(sdBox(p - vec2(0.0, 330.0), vec2(26.0, 80.0)), 0.0 - 1.0);
  c = mix(c, C_INK2 * 0.5 + monitorLight(p, 120.0) * 0.08, smoothstep(1.5, -1.5, sdBox(p - vec2(0.0, 330.0), vec2(26.0, 80.0))));
  c = mix(c, C_INK2 * 0.5, smoothstep(1.5, -1.5, sdBox(p - vec2(0.0, 404.0), vec2(150.0, 8.0)) - 4.0));
  float bez = sdBox(p, MONH + 16.0) - 10.0;
  c = mix(c, C_INK * 0.6 + vec3(0.02) * smoothstep(-16.0, -10.0, bez), smoothstep(1.5, -1.5, bez));
  if (abs(p.x) < MONH.x && abs(p.y) < MONH.y) {
    vec2 uv = vec2(p.x / (2.0 * MONH.x) + 0.5, 0.5 - p.y / (2.0 * MONH.y));
    vec3 g = game(uv);
    // time-lapse: the screen cycles through other streams
    g = mix(g, g.bgr * (0.6 + 0.6 * hash11(floor(t * 12.0))), lapse * step(0.5, hash11(floor(t * 12.0) + 3.0)));
    c = g * screenB * 1.25;
    c += compLight(p, 260.0) * 0.15;
  }

  // ---- haze: drifting volume lit by the monitor, the companion and the window's shafts
  float hz = fbm(vec3(p * 0.0022, t * 0.05), 4) * 0.5 + 0.5;
  hz = 0.35 + 0.65 * hz;
  vec3 haze = monitorLight(p, 700.0) * 0.16 * hz + compLight(p, 520.0) * 0.32 * hz;
  // god rays: shafts from the window slats, slanting down to the right
  vec2 rq = p - vec2(-820.0, -230.0);
  float along = rq.x * 0.62 + rq.y * 0.78;
  float across = rq.x * 0.78 - rq.y * 0.62;
  float inBeam = step(0.0, along) * smoothstep(1400.0, 200.0, along) * smoothstep(320.0, 200.0, abs(across + along * 0.12));
  float slats = step(0.45, fract((across + along * 0.12) / 34.0 + 0.3));
  haze += mix(C_FROST * 0.06, C_EMBER * 0.10, day) * inBeam * slats * hz;
  c += haze;

  // ---- the streamer: near-black silhouette, rim light from the monitor and the companion
  float ds = sdStreamer(p);
  float soft = mix(2.0, 26.0, focus) / cam.z;        // foreground defocus
  float m = smoothstep(soft, -soft, ds);
  if (m > 0.0) {
    float e = 2.0;
    vec2 n = normalize(vec2(sdStreamer(p + vec2(e, 0.0)) - sdStreamer(p - vec2(e, 0.0)), sdStreamer(p + vec2(0.0, e)) - sdStreamer(p - vec2(0.0, e))) + 1e-5);
    vec2 toMon = normalize(clamp(p, -MONH, MONH) - p + 1e-3);
    vec2 toComp = normalize(comp - p + 1e-3);
    float edge = exp(ds / (10.0 + soft));                 // 1 at the outline, falling inside
    float fuzz = 0.75 + 0.5 * snoise(vec2(atan(p.y - HEADC.y, p.x - HEADC.x) * 40.0, 0.0)); // hoodie fibres / hair
    vec3 rim = monitorLight(p, 900.0) * pow(sat(dot(n, toMon)), 2.0) * 1.6
             + compLight(p, 700.0) * pow(sat(dot(n, toComp)), 1.5) * 2.4;
    vec3 body = C_INK * 0.35 + rim * edge * fuzz;
    // headset sheen
    float hs = smoothstep(1.5, -1.5, sdHeadset(p));
    body += hs * (monitorLight(p, 600.0) * 0.18 + compLight(p, 500.0) * 0.35) * (0.5 + 0.5 * n.y * -1.0);
    c = mix(c, body, m);
  }

  // grade: cold → warm
  float l = luma(c);
  c = mix(c, mix(c, vec3(l) * vec3(0.85, 0.95, 1.12), 0.35), 1.0 - warm);
  c = mix(c, c * vec3(1.08, 1.0, 0.9), warm);
  fragColor = vec4(c, 1.0);
}`;

export class Room {
  pass = new FSPass(FRAG, {
    t: { value: 0 }, warm: { value: 0 }, compI: { value: 0 }, screenB: { value: 1 }, kick: { value: 0 },
    lapse: { value: 0 }, focus: { value: 0.5 }, day: { value: 0 }, glitch: { value: 0 },
    cam: { value: [0, 350, 1] }, comp: { value: [0, 0] },
  });

  set(v: Partial<{ t: number; warm: number; compI: number; screenB: number; kick: number; lapse: number; focus: number; day: number; glitch: number; cam: [number, number, number]; comp: [number, number] }>) {
    for (const [k, x] of Object.entries(v)) this.pass.u[k]!.value = x;
  }

  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget) { this.pass.render(renderer, out); }
}

/** World → frame px for a camera (cx, cy, zoom). */
export const toScreen = (cam: [number, number, number], x: number, y: number) => ({ x: (x - cam[0]) * cam[2] + W / 2, y: (y - cam[1]) * cam[2] + H / 2 });
/** Frame px → world for a camera. */
export const toWorld = (cam: [number, number, number], x: number, y: number) => ({ x: (x - W / 2) / cam[2] + cam[0], y: (y - H / 2) / cam[2] + cam[1] });
