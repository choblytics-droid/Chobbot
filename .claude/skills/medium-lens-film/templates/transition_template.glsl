// transition_template.glsl — material transitions between two lenses. k: 0 -> 1 over the transition.
// Rule: use the physics of one of the two media, and align the bright feature of A with B's key feature.
vec3 lensA(vec2 fc);
vec3 lensB(vec2 fc);
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }

// Burn hole from a point (ukiyo-e -> stained glass): a noisy radius grows from the fireball core;
// a thin glowing charred rim; the incoming lens is revealed inside.
vec3 transBurn(vec2 fc, float k, vec2 origin) {
  float r = length((fc - origin) * vec2(1.0, 1.3));
  float edge = k * 1.4 + 0.08 * (vnoise(fc * 12.0) - 0.5) + 0.04 * (vnoise(fc * 40.0) - 0.5);
  float inside = step(r, edge);
  float rim = smoothstep(0.03, 0.0, abs(r - edge));
  float char_ = smoothstep(0.09, 0.0, r - edge) * (1.0 - inside);
  vec3 c = mix(lensA(fc) * (1.0 - 0.8 * char_), lensB(fc), inside);
  return c + vec3(2.0, 0.7, 0.15) * rim;           // hot rim (let bloom take it)
}

// Ink bleed (ink -> porcelain): an organic blob grows from a seed; edges darker (tide line).
vec3 transBleed(vec2 fc, float k, vec2 origin, vec3 inkColor) {
  float r = length(fc - origin);
  float n = 0.5 * vnoise(fc * 6.0) + 0.25 * vnoise(fc * 18.0) + 0.125 * vnoise(fc * 50.0);
  float front = k * 1.3 + 0.18 * (n - 0.4);
  float inside = smoothstep(front + 0.01, front - 0.01, r);
  float tide = smoothstep(0.02, 0.0, abs(r - front));
  vec3 a = lensA(fc) * (1.0 - 0.6 * tide) + inkColor * tide * 0.6;
  return mix(a, lensB(fc), inside);
}

// Shatter (cave -> mural beneath): Voronoi shards, each falls with its own delay and rotation.
vec3 transShatter(vec2 fc, float k) {
  vec2 g = fc * 7.0, id = floor(g), best = id; float md = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = id + vec2(i, j); vec2 p = c + vec2(hash21(c), hash21(c + 7.1));
    float d = length(g - p); if (d < md) { md = d; best = c; }
  }
  float delay = hash21(best) * 0.5 + length(best / 7.0 - vec2(0.5, 0.33)) * 0.6; // from the dome outward
  float fall = clamp((k - delay) / 0.4, 0.0, 1.0);
  vec2 off = vec2(0.0, fall * fall * 1.2);          // shard falls (sample A from its old place)
  vec2 src = fc - off;
  return fall < 1.0 && src.y > 0.0 ? lensA(src) * (1.0 - 0.3 * fall) : lensB(fc);
}

// Printing (key block first, then colour blocks): reveal each colour layer of B on its own beat.
// Implement inside lens B with a 'printStage' uniform: 0 = key line only … N = all blocks.
