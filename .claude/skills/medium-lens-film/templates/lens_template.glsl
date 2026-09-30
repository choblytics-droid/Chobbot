// =============================================================================================
// lens_TEMPLATE.glsl — <medium> · the <MEDIUM> universe of <film>
//
// THE OBJECT:   <one specific artefact, era, material, where it lies / hangs, how it is looked at>
// THE PROCESS:  <how the real thing is made>
// THE MOMENT:   <how this medium depicts the shared state: which fields drive what>
// IN-WORLD TEXT:<thesis in the medium's native genre + signature convention + hidden date>
// DEFECTS:      - <trade name> — <look>   (8–15 items, one code block each below)
// CAMERA:       <light on the object, lens effects, motion>
// PALETTE:      <named hex colours>
// FAMILY:       A reproduction | B painterly | C iconographic  — samples per pixel: <k>
//
// Contract: vec3 lens(vec2 fc) -> display sRGB. fc is in [0,1]^2, local to the rectangle the lens is
// drawn in (full frame, a mosaic tile, a window, a flying card). Reads State via makeState(uTime).
// =============================================================================================
// #include "common.glsl"  (hash, noise, fbm, sdf helpers, toSRGB)
// #include "state.glsl"
// vec3 realScene(vec2 uv);  // the photoreal render (families A and B sample it)

// ---- 1. camera on the object: map screen fc to the object's surface coordinates -------------
vec2 objectUV(vec2 fc, out vec3 N, out float onObject) {
  // e.g. a sheet lying on a table, slightly tilted, with a gentle cockle
  vec2 p = (fc - 0.5) * vec2(1.0, 1.0);
  float tilt = 0.06 * sin(uTime * 0.3);
  p.y *= 1.0 + tilt * p.x;                          // cheap perspective
  onObject = step(abs(p.x), 0.46) * step(abs(p.y), 0.47);
  N = normalize(vec3(0.0, 0.0, 1.0));               // replace with the height-field normal (cockle)
  return p + 0.5;
}

// ---- 2. the medium's image of the moment --------------------------------------------------------
vec3 mediumImage(vec2 uv, State s) {
  // A (reproduction): vec3 c = realScene(uv); then pass it through the recording process
  // B (painterly):    loop over neighbouring mark cells; each mark samples realScene at its centre
  // C (iconographic): draw motifs whose size/position come from s.R, s.cy, s.morph (locked composition)
  vec2 capCentre = vec2(0.5, 0.33);                 // LOCKED composition: same in every lens
  float d = length((uv - capCentre) * vec2(1.0, 1.2)) - 0.18 * clamp(s.R / 200.0, 0.2, 1.2);
  return mix(vec3(0.9, 0.85, 0.75), s.Lcol, smoothstep(0.01, -0.01, d));
}

// ---- 3. material & defects — one block per bible item ----------------------------------------
vec3 applyDefects(vec3 c, vec2 uv) {
  // - <defect 1>: …
  // - <defect 2>: …
  return c;
}

// ---- 4. light on the object --------------------------------------------------------------------
vec3 lightObject(vec3 albedo, vec3 N, vec2 fc) {
  vec3 L = normalize(vec3(-0.6, 0.4, 0.7));        // e.g. raking window light
  float diff = 0.35 + 0.65 * max(dot(N, L), 0.0);
  float vig = smoothstep(1.1, 0.3, length(fc - 0.5));
  return albedo * diff * vig;
}

vec3 lens(vec2 fc) {
  State s = makeState(uTime);
  vec3 N; float on;
  vec2 uv = objectUV(fc, N, on);
  vec3 c = mediumImage(uv, s);
  c = applyDefects(c, uv);
  c = lightObject(c, N, fc);
  vec3 background = vec3(0.02);
  return mix(background, c, on);                    // display sRGB (apply toSRGB if working linear)
}
