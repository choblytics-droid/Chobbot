// state.glsl — the single source of truth for "the moment", shared by every shot and lens.
// Everything a renderer needs is a pure function of one time parameter tau (seconds since the event).
// Replace the fields with your own moment (a character's leap, a sunrise, a drop in a song…); keep the
// rule: real units, one struct, computed once per frame, read by all files.
precision highp float;

uniform float uTime;   // film time (s)
uniform float uT0;     // film time of the event (s)
uniform vec2  uRes;    // output resolution (px)

struct State {
  float tau;     // age of the event (s)
  float R;       // main radius (m)
  float cy;      // centre height (m)
  vec3  C;       // centre (m)
  float morph;   // 0 = early form, 1 = mature form
  float Tc;      // core temperature (K) -> colour via blackbody
  float Lpk;     // luminous peak (relative), the flash
  float soot;    // 0..1 darkening of the top
  float boil;    // turbulence phase
  vec3  Lcol;    // emission colour (linear)
};

// Approximate blackbody colour (linear RGB, normalised) for 1000–40000 K.
vec3 blackbody(float T) {
  T = clamp(T, 1000.0, 40000.0) / 100.0;
  float r = T <= 66.0 ? 1.0 : clamp(1.2929 * pow(T - 60.0, -0.1332), 0.0, 1.0);
  float g = T <= 66.0 ? clamp(0.3901 * log(T) - 0.6318, 0.0, 1.0) : clamp(1.1299 * pow(T - 60.0, -0.0755), 0.0, 1.0);
  float b = T >= 66.0 ? 1.0 : (T <= 19.0 ? 0.0 : clamp(0.5432 * log(T - 10.0) - 1.1963, 0.0, 1.0));
  return pow(vec3(r, g, b), vec3(2.2));
}

// Example growth laws (tune to reference footage; the point is: physical, smooth, monotonic).
State makeState(float t) {
  State s;
  s.tau   = max(t - uT0, 0.0);
  float a = max(s.tau - 2.0, 0.0);
  s.R     = 150.0 * (1.0 - exp(-1.2 * pow(max(s.tau, 1e-4), 0.7))) + 30.0 * a;   // fast then sub-linear
  s.cy    = 25.0 * (1.0 - smoothstep(0.0, 1.0, s.tau)) + 120.0 * a * a / (a + 2.0); // sinks, then rises
  s.C     = vec3(0.0, s.cy, 0.0);
  s.morph = smoothstep(3.0, 9.0, s.tau);
  s.Tc    = 1500.0 + 7000.0 * exp(-max(s.tau - 0.8, 0.0) / 1.5);                   // cooling
  s.Lpk   = 1000.0 * exp(-s.tau / 0.3) + 25.0 * exp(-s.tau / 4.0);                // flash + tail
  s.soot  = smoothstep(2.5, 8.0, s.tau);
  s.boil  = 0.15 * s.tau;
  s.Lcol  = blackbody(s.Tc * mix(0.97, 0.85, s.soot));
  return s;
}
