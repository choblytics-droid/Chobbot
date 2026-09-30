// mosaic.glsl — draw any lens into any rectangle. The contract (local fc) makes grids, walls of cards,
// windows of a building and split screens the same operation.
// Declare each lens under a unique name (lens_cave, lens_ink, …) and dispatch by id.
vec3 lensById(int id, vec2 fc);   // generated: switch over all lenses

// n x m grid; each tile is a slightly rotated "card" with a drop shadow; tile ids from a list.
vec3 mosaic(vec2 fc, vec2 grid, float t, float seed) {
  vec2 g = fc * grid;
  vec2 cell = floor(g);
  vec2 local = fract(g) - 0.5;
  float h = fract(sin(dot(cell + seed, vec2(12.9898, 78.233))) * 43758.5453);
  float ang = (h - 0.5) * 0.12;                       // card tilt
  mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec2 q = R * local / 0.9;                            // 10% margin
  float inside = step(abs(q.x), 0.5) * step(abs(q.y), 0.5);
  float shadow = smoothstep(0.62, 0.45, max(abs(q.x + 0.03), abs(q.y - 0.03)));
  int id = int(mod(cell.x + cell.y * grid.x + floor(seed), 28.0));
  vec3 col = inside > 0.5 ? lensById(id, q + 0.5) : vec3(0.02) * (1.0 - 0.6 * shadow);
  return col;
}
