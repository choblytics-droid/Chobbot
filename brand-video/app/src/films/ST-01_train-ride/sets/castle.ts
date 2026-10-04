// The castle on the hill (town set, far layer). Built to the QA-2 rubric: stone courses with per-block
// tone, round towers shaded as cylinders, slate cones, crenellations, arrow slits, a lit gate, arched
// lit windows with spill, ledges, snow on every ledge, a rock foundation that follows the hill, a lit
// path down, a waving flag.
import { PixelCanvas, type Mat } from '../../../kit/pixel';
import { ramp, stone, slate, snow, mix } from '../../../kit/materials';

const ST = ramp('#686676', 0.9);      // stone: cool grey
const STW = ramp('#6e675c', 0.9);     // warmer stone for the keep
const SL = ramp('#353a4a', 0.8);      // slate
const SN = ['#6f7c96', '#98a6be', '#c2cede', '#dde5f0', '#f4f8ff'];
const ROCK = ramp('#3b3d46', 1);
const D = 0.9, ID = 4;

export function paintCastle(pc: PixelCanvas, cx: number, base: number, hillY: (x: number) => number, t: number, on: number) {
  const m = (a: string, n: [number, number] = [0, 0], d = D): Mat => ({ a, n, d, id: ID });
  const warm = (ei: number): Mat => ({ a: '#1b1e27', d: D - 0.002, id: ID, e: '#ffc46b', ei: ei * on });

  // ---- rock foundation following the hill: the castle sits on its crag
  pc.poly([[cx - 52, hillY(cx - 52) + 2], [cx - 46, base + 1], [cx + 46, base + 1], [cx + 54, hillY(cx + 54) + 2], [cx + 30, hillY(cx + 30) + 6], [cx - 30, hillY(cx - 30) + 6]],
    stone(ROCK, { d: D + 0.01, id: ID, bw: 9, bh: 4, seed: 41, n: [0, 0.3] }));

  // ---- curtain wall with crenellations, wall walk shadow, arrow slits, the gate
  const w0 = cx - 40, w1 = cx + 40, wt = base - 22;
  pc.rect(w0, wt, w1 - w0, base - wt + 1, stone(ST, { d: D, id: ID, bw: 5, bh: 3, seed: 1, ox: w0, oy: wt }));
  pc.rect(w0, wt, w1 - w0, 1, m(ST[0]!));                                   // the wall walk's shadow line
  for (let x = w0; x < w1; x += 5) {
    pc.rect(x, wt - 4, 3, 4, stone(ST, { d: D - 0.001, id: ID, bw: 3, bh: 2, seed: 2, ox: x, oy: wt - 4 }));
    pc.rect(x, wt - 5, 3, 1, m(SN[3]!, [0, 0.9]));                          // snow on each merlon
    pc.px(x + 2, wt - 1, m(ST[0]!));
  }
  for (let x = w0 + 6; x < w1 - 4; x += 11) if (Math.abs(x - (cx - 6)) > 7) { pc.rect(x, wt + 6, 1, 5, m('#14161c')); pc.px(x, wt + 5, m(ST[3]!)); }
  // gate: arch with a portcullis and warm light behind it
  const gx = cx - 10, gw = 9, gh = 12;
  for (let y = base - gh; y <= base; y++) for (let x = gx; x < gx + gw; x++) {
    const dx = x + 0.5 - (gx + gw / 2), arch = y < base - gh + 4 && dx * dx / ((gw / 2) ** 2) + ((base - gh + 4 - y) / 4) ** 2 > 1;
    if (arch) continue;
    const grid = (x - gx) % 2 === 0 || (y - base) % 3 === 0;
    pc.px(x, y, grid ? m('#24252c') : { a: '#2a1d14', d: D - 0.003, id: ID, e: '#ffb25a', ei: 1.6 * on });
  }
  for (let x = gx - 1; x <= gx + gw; x++) pc.px(x, base - gh - 1 + (Math.abs(x - (gx + gw / 2 - 0.5)) > 3 ? 2 : 0), m(ST[4]!));   // voussoirs
  // snow drifted against the wall foot
  for (let x = w0 - 4; x < w1 + 4; x++) { const h = 1 + Math.round(1.5 * (0.5 + 0.5 * Math.sin(x * 0.7))); pc.rect(x, base - h + 1, 1, h, m(SN[2 + (x % 3 === 0 ? 1 : 0)]!, [0, 0.9], D - 0.004)); }

  // ---- the keep: tall, warm stone, ledges, arched lit windows, parapet, pyramid roof, flag
  const k0 = cx - 15, k1 = cx + 15, kt = base - 66;
  pc.rect(k0, kt, k1 - k0, base - 22 - kt, stone(STW, { d: D + 0.004, id: ID, bw: 6, bh: 3, seed: 3, ox: k0, oy: kt, n: [0, 0] }));
  // shade the keep's right third (it turns away from the sky's glow)
  for (let y = kt; y < base - 22; y++) pc.rect(k1 - 6, y, 6, 1, (x) => ({ ...stone(STW, { d: D + 0.004, id: ID, bw: 6, bh: 3, seed: 3, ox: k0, oy: kt })(x, y), n: [0.55, 0] }));
  for (const ly of [kt + 18, kt + 32]) {                                      // string courses
    pc.rect(k0 - 1, ly, k1 - k0 + 2, 1, m(STW[4]!, [0, 0.6], D + 0.003));
    pc.rect(k0 - 1, ly + 1, k1 - k0 + 2, 1, m(STW[0]!, [0, -0.4], D + 0.003));
    pc.rect(k0 - 1, ly - 1, k1 - k0 + 2, 1, m(SN[3]!, [0, 0.9], D + 0.002));
  }
  const archWin = (x: number, y: number, w: number, h: number, lit: number) => {
    pc.rect(x - 1, y - 1, w + 2, h + 2, m(STW[4]!, [0, 0], D + 0.003));
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (yy === y && (xx === x || xx === x + w - 1)) continue;             // round the top corners
      pc.px(xx, yy, lit > 0 ? warm(lit) : m('#14161c'));
    }
    if (w >= 3) pc.rect(x + Math.floor(w / 2), y + 1, 1, h - 1, m('#2b2016'));    // mullion
    pc.rect(x - 1, y + h, w + 2, 1, m(SN[3]!, [0, 0.9], D + 0.002));          // snow on the sill
    if (lit > 0) for (let k = 1; k <= 3; k++) pc.glow(x + Math.floor(w / 2), y + h + 1 + k, '#ffb25a', lit * 0.18 / k);
  };
  archWin(cx - 9, kt + 8, 3, 6, 2.4); archWin(cx + 6, kt + 8, 3, 6, 0);
  archWin(cx - 9, kt + 22, 3, 6, 2.0); archWin(cx + 6, kt + 22, 3, 6, 2.6);
  archWin(cx - 2, kt + 36, 4, 7, 2.8);
  // parapet with machicolations
  pc.rect(k0 - 2, kt - 3, k1 - k0 + 4, 3, stone(STW, { d: D + 0.003, id: ID, bw: 4, bh: 3, seed: 5, ox: k0, oy: kt - 3 }));
  for (let x = k0 - 2; x < k1 + 2; x += 3) pc.px(x, kt, m(STW[0]!));
  for (let x = k0 - 2; x < k1 + 2; x += 4) { pc.rect(x, kt - 6, 2, 3, m(STW[3]!)); pc.px(x, kt - 7, m(SN[4]!, [0, 0.9])); }
  // pyramid roof: slate, left face lit, right face in shade, snow along the eaves and the ridge
  const ry = kt - 6, rh = 22;
  pc.poly([[k0 - 3, ry], [cx, ry - rh], [k1 + 3, ry]], (x, y) => {
    const left = x < cx;
    return slate(left ? SL : SL.map((c) => mix(c, '#0e1018', 0.35)), { d: D + 0.002, id: ID, tw: 3, th: 2, snow: SN[3], snowK: 0.35, seed: 7, n: [left ? -0.55 : 0.55, 0.6] })(x, y);
  });
  for (let x = k0 - 3; x <= k1 + 3; x++) pc.px(x, ry - 1, m(SN[x % 2 ? 3 : 4]!, [0, 0.9], D + 0.001));
  pc.line(cx, ry - rh, cx, ry - 2, m(SL[4]!, [0, 0.7], D + 0.001));
  // flag pole and a waving flag
  pc.line(cx, ry - rh - 9, cx, ry - rh, m('#2a2a30'));
  for (let i = 0; i < 9; i++) {
    const wave = Math.round(Math.sin(t * 5 - i * 0.7) * 1.2);
    for (let j = 0; j < 4 - Math.floor(i / 4); j++) pc.px(cx + 1 + i, ry - rh - 9 + j + wave * (i / 8), m(j === 0 ? '#c2453f' : '#9d2f2f', [0, 0], D - 0.004));
  }

  // ---- round towers at the wall's ends (cylinders: facing turns across the width)
  const tower = (tc: number, tw: number, top: number, seed: number) => {
    const r = tw / 2;
    for (let y = top; y <= base; y++) for (let x = Math.round(tc - r); x < Math.round(tc + r); x++) {
      const u = (x + 0.5 - tc) / r;
      const s = stone(ST, { d: D - 0.006, id: ID, bw: 4, bh: 3, seed, ox: Math.round(tc - r), oy: top })(x, y);
      pc.px(x, y, { ...s, n: [u * 0.95, 0] });
    }
    // corbelled band and crenellations
    pc.rect(Math.round(tc - r) - 1, top - 2, tw + 2, 2, (x) => ({ a: ST[x % 2 ? 1 : 3]!, d: D - 0.007, id: ID, n: [((x + 0.5 - tc) / r) * 0.9, -0.3] }));
    for (let x = Math.round(tc - r) - 1; x < Math.round(tc + r) + 1; x += 3) { pc.rect(x, top - 4, 2, 2, m(ST[3]!, [((x - tc) / r) * 0.9, 0], D - 0.007)); }
    // arrow slits and one lit window
    pc.rect(Math.round(tc) - 1, top + 6, 1, 4, m('#14161c', [0, 0], D - 0.007));
    pc.rect(Math.round(tc), base - 14, 2, 3, warm(2.2));
    // conical roof: slate with cone shading, snow at the eaves
    const ch = Math.round(tw * 1.25);
    pc.poly([[tc - r - 2, top - 4], [tc, top - 4 - ch], [tc + r + 2, top - 4]], (x, y) => {
      const u = (x + 0.5 - tc) / (r + 2);
      return slate(SL, { d: D - 0.008, id: ID, tw: 3, th: 2, snow: SN[3], snowK: 0.25, seed: seed + 1, n: [u * 0.85, 0.55] })(x, y);
    });
    for (let x = Math.round(tc - r - 2); x <= Math.round(tc + r + 2); x++) pc.px(x, top - 5, m(SN[3 + (x % 2)]!, [0, 0.9], D - 0.009));
    pc.line(tc, top - 4 - ch - 4, tc, top - 4 - ch, m('#2a2a30', [0, 0], D - 0.009));
  };
  tower(w0 - 2, 14, base - 40, 11);
  tower(w1 + 2, 12, base - 34, 13);

  // ---- the path down the hill to the town, with lamps
  let px0 = gx + 4, py0 = base + 1;
  for (let seg = 0; seg < 5; seg++) {
    const dir = seg % 2 ? 1 : -1, len = 14 + seg * 3;
    for (let k = 0; k < len; k++) {
      const x = px0 + dir * k, y = Math.max(py0 + Math.floor(k / 4), hillY(x) + 1);
      pc.px(x, y, { a: SN[1]!, d: D + 0.02, id: 6, n: [0, 0.8] });
      if (k === len - 1) pc.px(x, y - 1, { a: '#2a2a30', d: D + 0.019, id: 6, e: '#ffd08a', ei: 3 * on });
    }
    px0 += dir * len; py0 += Math.floor(len / 4) + 2;
  }
}

/** Pine trees on the hill: three tones per tree, snow on the tiers, two rows. */
export function paintPines(pc: PixelCanvas, hillY: (x: number) => number, rnd: () => number, d: number, id: number, from: number, to: number, step: number, scale: number) {
  const G = ['#0f1716', '#162120', '#1f2d2a', '#2c3c37'];
  for (let x = from; x < to; x += step + Math.floor(rnd() * step)) {
    const h = Math.round((7 + rnd() * 8) * scale), w = Math.round(h * 0.55), y0 = hillY(x) + 4;
    for (let k = 0; k < h; k++) {
      const y = y0 - k, tier = Math.floor(k / Math.max(2, Math.round(h / 4)));
      const half = Math.max(0, Math.round((w / 2) * (1 - k / h) + (k % 3 === 0 ? 1 : 0) - tier * 0.2));
      for (let dx = -half; dx <= half; dx++) {
        const lit = dx < 0 ? 2 : dx > half * 0.4 ? 0 : 1;
        const tip = dx === -half || dx === half;
        pc.px(x + dx, y, { a: k % 3 === 0 && tip ? '#c6d2e3' : G[lit + (k > h * 0.7 ? 1 : 0)]!, d, id, n: [dx / Math.max(1, half) * 0.7, 0.3] });
      }
    }
    pc.px(x, y0 + 1, { a: '#2a1f18', d, id });
  }
}

export { SN as CASTLE_SNOW, ROCK as CASTLE_ROCK };
