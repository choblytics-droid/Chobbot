// Set 1: the old town at Christmas, blue hour. Pixel art painted into the G-buffer every frame.
// Layout in art px (270 x 480 in 9:16, y down): sky above ~y 262, the castle on its hill, a row of
// gabled houses, string lights across the square, market huts, the carousel, wet cobbles, and the
// phone on its tripod filming the carousel (no people: the stream is the character).
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';
import { mulberry32 } from '../../../engine/util';
import { ramp, hillside, plaster, stone, slate, wood, snow, mix, dither, vnoise } from '../../../kit/materials';
import { paintCastle, paintPines, CASTLE_SNOW } from './castle';

export interface TownOpts {
  t: number;
  /** camera: art px offsets (parallax: far layers move less) */
  camX?: number; camY?: number;
  /** the carousel's rotation (rad) */
  rot?: number;
  /** 0 = blue hour, 1 = the next morning (lights off, warm low sun) */
  day?: number;
  streamer?: 'tripod' | 'none';
  /** the tripod's x (art px) */
  sx?: number;
}

const GROUND = 405;
export const TOWN_GROUND = GROUND;

// palette (sRGB)
const P = {
  hill: '#18202e', hill2: '#222b3b', tree: '#141b27', stone: '#3d4352', stoneL: '#4d5466',
  slate: '#272b36', slateL: '#343a48', snow: '#dfe7f2', snowS: '#9aa6bb',
  timber: '#3a2a22', glass: '#1b1e27', warm: '#ffc46b', warm2: '#ffb25a', cream: '#efe3c8',
  wood: '#6b4a32', woodL: '#8a603e', woodD: '#4a3222', garland: '#2c4733',
  red: '#a8383a', redD: '#7a2a2c', gold: '#d4a24a', brass: '#b8893f', white: '#ece6da', whiteS: '#c4bfb6',
  cob: '#454956', cobL: '#525765', cobD: '#383b46', hood: '#3a4560', hoodS: '#29324a', hoodL: '#4b5878',
  jeans: '#2b3651', jeansS: '#1f2840', shoe: '#1a1a1f', hand: '#c79a7c', black: '#14161c', metal: '#5c616e',
};
const WALLS = ['#8a6a4f', '#b39b80', '#6f7f95', '#7d3b33', '#4f6650', '#a8865f', '#86707a', '#5f6f7f'];

const HORSE = [
  '.........mm...',
  '........mwwW..',
  '.......mwwwwW.',
  '......mwwwW.WW',
  'm....wwwwwW...',
  'mwwwwwwwwwW...',
  '.wwgrrrgwwW...',
  '.wwwrrrwwwW...',
  '..wwwwwwwW....',
  '..WW....WW....',
  '.w..w..w..w...',
  'w...W..W...w..',
];

export function paintTown(pc: PixelCanvas, o: TownOpts) {
  const t = o.t, day = o.day ?? 0, lightsOn = 1 - day;
  const cx = o.camX ?? 0, cy = o.camY ?? 0;
  const lay = (depth: number) => { pc.ox = -cx * (1 - depth); pc.oy = -cy * (1 - depth); };
  pc.clear();
  pc.names = { 2: 'hill', 3: 'hill trees', 4: 'castle', 6: 'castle path', 5: 'cobbles', 60: 'string lights', 70: 'hut L', 71: 'hut M', 72: 'hut R', 80: 'carousel canopy', 81: 'carousel valance', 82: 'carousel drum', 84: 'carousel platform', 91: 'tripod', 92: 'phone', 93: 'phone screen' };
  for (let k = 11; k < 30; k++) pc.names[k] = `house ${k - 10}`;
  const R = mulberry32(7);

  // ---- far: the hill (rock and snow), pines, the castle on its crag with a lit path down
  lay(0.95);
  const hillY = (x: number) => 252 - 18 * Math.exp(-(((x - 200) / 70) ** 2)) - 6 * Math.sin(x * 0.05);
  pc.poly([[-40, 300], [-40, 262], ...Array.from({ length: 73 }, (_, i): [number, number] => [-40 + i * 5, hillY(-40 + i * 5)]), [320, 300]],
    hillside(ramp('#232838', 0.9), CASTLE_SNOW, { d: 0.96, id: 2, ty: hillY, seed: 2 }));
  paintPines(pc, (x) => hillY(x) + 10, R, 0.955, 3, -40, 320, 7, 0.8);
  paintCastle(pc, 205, Math.round(hillY(205) - 1), hillY, t, lightsOn);
  paintPines(pc, (x) => hillY(x) + 22, R, 0.95, 3, -40, 150, 5, 1.1);

  // ---- mid: the row of gabled houses
  lay(0.65);
  let x = -36;
  const HB = 372;
  let hi = 0;
  while (x < AW + 40) {
    const w = 30 + Math.floor(R() * 18), h = 58 + Math.floor(R() * 50);
    const wall = WALLS[hi++ % WALLS.length]!;
    const d = 0.62 + R() * 0.06;
    const id = 10 + hi;
    const top = HB - h;
    // house details come from a hash of the house index (not from R, so the approved layout stays)
    const hh = (k: number) => { const v = Math.sin(hi * 91.7 + k * 37.3) * 43758.5453; return v - Math.floor(v); };
    const WR = ramp(wall, 0.85), TB = ramp('#3a2a22', 0.8), STN = ramp('#8a8476', 0.7), CREAM = '#e2d8c6';
    const timbered = hi % 3 === 1;
    const wallM = plaster(WR, { d, id, gy: HB, ty: top, seed: hi });
    pc.rect(x, top, w, h, wallM);
    // corner quoins and floor ledges (with snow on top and a shadow under)
    for (let y = top; y < HB; y += 4) { const q = (Math.floor((y - top) / 4) % 2) ? 3 : 2; pc.rect(x, y, q, 3, { a: STN[2 + (y % 8 ? 0 : 1)]!, d, id }); pc.rect(x + w - q, y, q, 3, { a: STN[2]!, d, id }); }
    for (let fy = top + 17; fy < HB - 4; fy += 18) {
      pc.rect(x, fy, w, 1, { a: STN[3]!, d, id, n: [0, 0.6] }); pc.rect(x, fy + 1, w, 1, { a: WR[0]!, d, id, n: [0, -0.4] });
      pc.rect(x + 1, fy - 1, w - 2, 1, { a: P.snowS, d, id, n: [0, 0.9] });
    }
    // half-timbering: posts, rails, braces
    if (timbered) {
      const tm = (xx: number, yy: number): Mat => ({ a: TB[(xx + yy) % 5 === 0 ? 1 : 2]!, d, id });
      for (let px0 = x + 3; px0 < x + w - 2; px0 += 9) pc.rect(px0, top, 2, HB - top, tm);
      for (let fy = top + 1; fy < HB; fy += 18) {
        pc.rect(x, fy + 14, w, 2, tm);
        for (let px0 = x + 3; px0 + 9 < x + w - 2; px0 += 18) pc.line(px0 + 2, fy + 14, px0 + 9, fy + 3, { a: TB[1]!, d, id });
      }
    }
    // ground floor down to the square: a wooden shop front, display window, awning, door, lamp
    pc.rect(x, HB, w, GROUND - HB, wood(TB, { d, id, pw: 3, vertical: true, seed: hi }));
    const sw = Math.floor(w * 0.55), sx = x + 3, sy = HB + 9;
    pc.rect(sx - 1, sy - 1, sw + 2, 16, { a: TB[3]!, d, id });
    const shopEi = (0.8 + R() * 0.8) * lightsOn;
    for (let yy = sy; yy < sy + 14; yy++) for (let xx = sx; xx < sx + sw; xx++) {
      const mull = (xx - sx) % 6 === 5;
      const goods = yy > sy + 8 && hh(xx) < 0.6;
      pc.px(xx, yy, mull ? { a: TB[3]!, d, id } : { a: P.glass, d, id, e: goods ? ['#c0392b', '#e8c27a', '#2f6d4a'][(xx * 7) % 3] : P.warm2, ei: shopEi * (goods ? 0.7 : 1 - (yy - sy) * 0.03) });
    }
    // striped awning with snow on top
    const awn = ['#a8383a', '#2f5a6b', '#3d6b3d', '#8a5a2b'][Math.floor(hh(1) * 4)]!;
    for (let k = 0; k < sw + 4; k++) for (let j = 0; j < 4; j++) pc.px(sx - 2 + k, sy - 6 + j, { a: (Math.floor(k / 3) % 2 ? awn : CREAM), d: d - 0.004, id, n: [0, 0.55 - j * 0.2] });
    for (let k = 0; k < sw + 4; k += 3) pc.px(sx - 2 + k, sy - 2, { a: awn, d: d - 0.004, id });
    pc.rect(sx - 2, sy - 7, sw + 4, 1, { a: P.snow, d: d - 0.004, id, n: [0, 0.9] });
    // the door, its frame, a lamp, sometimes a wreath
    const dx0 = x + w - 10;
    pc.rect(dx0 - 1, HB + 8, 8, GROUND - HB - 8, { a: TB[3]!, d, id });
    pc.rect(dx0, HB + 9, 6, GROUND - HB - 9, wood(ramp('#4a2a20', 0.8), { d, id, pw: 2, vertical: true, seed: hi + 3 }));
    pc.px(dx0 + 4, HB + 20, { a: '#d4a24a', d, id });
    pc.rect(dx0 - 3, HB + 10, 1, 3, { a: '#2a2a30', d, id, e: '#ffd08a', ei: 2.6 * lightsOn });
    if (hh(2) < 0.45) { pc.disc(dx0 + 3, HB + 14, 2.4, (xx, yy) => ({ a: (xx + yy) % 2 ? '#2f5a3e' : '#244a33', d: d - 0.003, id })); pc.px(dx0 + 3, HB + 16, { a: '#c0392b', d: d - 0.003, id }); }
    // gable: stepped (plaster with coping stones) or pointed (slate)
    const stepped = R() < 0.5;
    const gh = Math.floor(w * 0.55);
    if (stepped) {
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        const inset = Math.floor((w / 2) * (s / steps));
        pc.rect(x + inset, top - (s + 1) * (gh / steps), w - 2 * inset, gh / steps + 1, wallM);
        const sy0 = Math.round(top - (s + 1) * (gh / steps));
        pc.rect(x + inset, sy0, 3, 2, stone(STN, { d, id, bw: 3, bh: 2, seed: s }));               // coping stones
        pc.rect(x + w - inset - 3, sy0, 3, 2, stone(STN, { d, id, bw: 3, bh: 2, seed: s + 9 }));
        pc.rect(x + inset, sy0 - 1, 3, 1, { a: P.snow, d, id, n: [0, 0.9] });
        pc.rect(x + w - inset - 3, sy0 - 1, 3, 1, { a: P.snow, d, id, n: [0, 0.9] });
      }
      // attic: a round window (sometimes lit) and the hoist beam
      const ax = Math.round(x + w / 2), ay = Math.round(top - gh * 0.45);
      const atticLit = hh(4) < 0.5;
      pc.disc(ax, ay, 2.6, (xx, yy, ddx, ddy) => (ddx * ddx + ddy * ddy > 0.55 ? { a: STN[3]!, d, id } : { a: P.glass, d, id, e: atticLit ? P.warm : undefined, ei: atticLit ? 1.8 * lightsOn : 0 }));
      pc.rect(ax - 1, Math.round(top - gh * 0.85), 3, 2, { a: TB[2]!, d, id });
    } else {
      const SLR = ramp('#2c303c', 0.8), SLD = SLR.map((c) => mix(c, '#0e1018', 0.3));
      pc.poly([[x - 2, top + 1], [x + w / 2, top - gh], [x + w + 2, top + 1]], (px, py) => slate(px < x + w / 2 ? SLR : SLD, { d, id, tw: 4, th: 3, snow: P.snowS, snowK: 0.3, seed: hi, n: [px < x + w / 2 ? -0.5 : 0.5, 0.6] })(px, py));
      // snow on the roof edges
      for (let k = 0; k <= gh; k++) {
        const fx = k / gh;
        pc.px(x - 2 + fx * (w / 2 + 2), top - k, { a: P.snow, d, id, n: [-0.4, 0.8] });
        pc.px(x + w + 2 - fx * (w / 2 + 2), top - k, { a: P.snowS, d, id, n: [0.4, 0.8] });
        pc.px(x - 2 + fx * (w / 2 + 2), top - k + 1, { a: P.snowS, d, id, n: [-0.4, 0.8] });
      }
      if (R() < 0.6) {
        const cxh = Math.round(x + w * 0.7), cyh = Math.round(top - gh * 0.8);
        pc.rect(cxh, cyh, 5, 9, stone(STN, { d: d - 0.002, id, bw: 3, bh: 2, seed: hi + 5 }));
        pc.rect(cxh - 1, cyh - 1, 7, 1, { a: STN[3]!, d: d - 0.002, id }); pc.rect(cxh - 1, cyh - 2, 7, 1, { a: P.snow, d: d - 0.002, id, n: [0, 0.9] });
      }
    }
    // windows: painted frame, shutters, glass (lit: warm with curtains; dark: the sky's reflection), sill with snow
    const cols = w > 40 ? 3 : 2, rows = Math.max(2, Math.floor((h - 20) / 18));
    const shut = ['#2f5a3e', '#2f4a6b', '#7a2a2c', '#3a3a40'][Math.floor(hh(5) * 4)]!;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const ww = 4 + Math.floor(hh(9) * 3), wh = 6 + Math.floor(hh(10) * 3);
        const wx = x + Math.round(((c + 1) * w) / (cols + 1)) - 2, wy = top + 8 + r * 18;
        const lit = R() < 0.55;
        const tint = R() < 0.3 ? P.warm2 : P.warm;
        const ei = lit ? (1.4 + R() * 1.6) * lightsOn : 0;
        pc.rect(wx - 1, wy - 1, ww + 2, wh + 2, { a: CREAM, d, id });
        if (hh(6 + r) < 0.7 && !timbered) for (const sx2 of [wx - 3, wx + ww + 1]) for (let yy = wy - 1; yy < wy + wh + 1; yy++) pc.rect(sx2, yy, 2, 1, { a: (yy - wy) % 2 ? shut : mix(shut, '#000000', 0.3), d, id });
        for (let yy = wy; yy < wy + wh; yy++) for (let xx = wx; xx < wx + ww; xx++) {
          const curtain = lit && (xx === wx || xx === wx + ww - 1) && yy < wy + wh - 1;
          const refl = !lit && xx - wx === yy - wy;
          pc.px(xx, yy, { a: curtain ? '#b07a4a' : refl ? '#3a4a66' : P.glass, d, id, e: lit ? tint : undefined, ei: lit ? ei * (curtain ? 0.45 : 1 - (yy - wy) * 0.06) : 0 });
        }
        pc.rect(wx + 2, wy, 1, wh, { a: CREAM, d, id });
        pc.rect(wx, wy + 3, ww, 1, { a: CREAM, d, id });
        pc.rect(wx - 1, wy + wh + 1, ww + 2, 1, { a: STN[3]!, d, id });
        pc.rect(wx - 1, wy + wh, ww + 2, 1, { a: P.snow, d, id, n: [0, 0.9] });
        if (lit) for (let k = 1; k <= 2; k++) pc.glow(wx + 2, wy + wh + 1 + k, tint, ei * 0.08 / k);
        // a flower box with snow on some houses, rain stains under the sill on others
        if (hh(11) < 0.35 && r < rows - 1) { pc.rect(wx - 1, wy + wh + 2, ww + 2, 2, { a: TB[2]!, d, id }); pc.rect(wx - 1, wy + wh + 1, ww + 2, 1, { a: '#e8eef6', d, id, n: [0, 0.9] }); }
        else if (hh(12) < 0.6) for (let k = 0; k < 3; k++) pc.px(wx + 1 + ((k * 2 + hi) % ww), wy + wh + 2 + k, { a: WR[1]!, d, id });
      }
    x += w + 1;
  }

  // ---- string lights across the square (two catenaries)
  lay(0.55);
  const strand = (y0: number, y1: number, sag: number, phase: number) => {
    for (let sx = -20; sx < AW + 20; sx++) {
      const u = (sx + 20) / (AW + 40);
      const y = y0 + (y1 - y0) * u + sag * 4 * u * (1 - u);
      pc.px(sx, y, { a: sx % 3 ? P.black : '#2a2c33', d: 0.55, id: 60 });
      if ((sx + 400) % 6 === 0) {
        const k = Math.floor((sx + 400) / 6);
        const tw = 0.75 + 0.25 * Math.sin(t * 2.0 + k * 1.7 + phase);
        const col = k % 3 === 0 ? P.warm2 : P.cream;
        pc.px(sx, y + 1, { a: '#4a4d56', d: 0.55, id: 60 });                                  // socket
        pc.px(sx, y + 2, { a: P.cream, d: 0.55, id: 60, e: col, ei: 5 * tw * lightsOn });
      }
    }
  };
  strand(286, 292, 22, 0);
  strand(312, 318, 16, 2);

  // ---- market huts (left of the carousel, and one at the right edge)
  lay(0.45);
  const LOG = ramp('#6b4a32', 0.9), SHG = ramp('#4a3424', 0.9), SNR = ['#7d8aa3', '#a3b1c8', '#c6d2e3', '#dfe7f2', '#f4f8ff'];
  const hut = (hx: number, w: number, id: number, d: number) => {
    const h = 30, top = GROUND - h;
    // log walls: horizontal logs, rounded (lit top, dark underside), end grain at the corners
    pc.rect(hx, top, w, h, (xx, yy) => {
      const ly = (yy - top) % 4;
      const m = wood(LOG, { d, id, pw: 4, vertical: false, seed: id })(xx, yy);
      if (xx - hx < 2 || hx + w - 1 - xx < 2) return { a: ly === 1 ? '#a07a52' : ly === 3 ? LOG[0]! : '#8a6440', d, id };
      return { ...m, n: [0, ly === 0 ? 0.6 : ly === 3 ? -0.5 : 0] };
    });
    // the open counter: a warm interior with shelves of goods, the counter board in front
    const ix = hx + 3, iw = w - 6, iy = top + 6;
    pc.rect(ix, iy, iw, 13, (xx, yy) => {
      const shelf = (yy - iy) === 6;
      return { a: shelf ? '#8a603e' : '#5a3e28', d: d + 0.012, id, e: P.warm2, ei: (shelf ? 0.5 : 0.9 - (yy - iy) * 0.03) * lightsOn };
    });
    for (let k = ix + 1; k < ix + iw - 1; k++) {
      const g = (k * 7 + id * 13) % 6;
      const gc = ['#c0392b', '#e8c27a', '#8e5a2b', '#2f6d4a', '#d9d2c4', '#b8893f'][g]!;
      if (g < 4) pc.px(k, iy + 5, { a: gc, d: d + 0.011, id });                     // jars on the shelf
      if (g < 5 && k % 2) pc.rect(k, iy + 9, 1, 3, { a: gc, d: d + 0.011, id });   // boxes below
    }
    for (let k = hx + 5; k < hx + w - 5; k += 4) {                                  // gingerbread and ornaments hanging from the eave
      const g = (k * 7 + id * 13) % 5;
      const gc = ['#c0392b', '#e8c27a', '#8e5a2b', '#2f6d4a', '#d9d2c4'][g]!;
      if (g % 2 === 0) { pc.line(k + 1, iy, k + 1, iy + 2 + (g % 3), { a: SHG[1]!, d: d + 0.005, id }); pc.rect(k, iy + 3 + (g % 3), 3, 2, { a: gc, d: d + 0.005, id, e: g === 0 ? '#ff6a4a' : undefined, ei: g === 0 ? 0.6 * lightsOn : 0 }); }
    }
    pc.rect(hx + 2, top + 19, w - 4, 3, wood(ramp('#8a603e', 0.8), { d: d - 0.002, id, pw: 3, seed: id + 1, n: [0, 0.7] }));
    pc.rect(hx + 2, top + 22, w - 4, 1, { a: LOG[0]!, d: d - 0.002, id });
    // hanging sign and a lantern at the corner
    pc.rect(hx + w / 2 - 6, top + 23, 12, 4, wood(ramp('#5a3a22', 0.8), { d: d - 0.004, id, pw: 2, seed: id + 2 }));
    for (let k = 0; k < 8; k += 2) pc.px(hx + w / 2 - 4 + k, top + 25, { a: '#e8d6a8', d: d - 0.005, id });
    pc.rect(hx + w - 2, top + 5, 2, 3, { a: '#2a2a30', d: d - 0.006, id, e: '#ffd08a', ei: 3.2 * lightsOn });
    // shingle roof, a thick snow cap with icicles
    pc.poly([[hx - 4, top + 1], [hx + w / 2, top - 14], [hx + w + 4, top + 1]], (px, py) => slate(px < hx + w / 2 ? SHG : SHG.map((c) => mix(c, '#000000', 0.25)), { d, id, tw: 3, th: 2, seed: id, n: [px < hx + w / 2 ? -0.5 : 0.5, 0.6] })(px, py));
    pc.poly([[hx - 5, top + 1], [hx + w / 2, top - 15], [hx + w + 5, top + 1], [hx + w + 5, top - 1], [hx + w / 2, top - 18], [hx - 5, top - 1]], snow(SNR, { d: d - 0.003, id, seed: id }));
    for (let k = hx - 3; k < hx + w + 4; k += 3) { const l = 1 + Math.floor(((k * 13) % 7) / 3); pc.rect(k, top + 2, 1, l, { a: '#dbe8f6', d: d - 0.004, id, n: [0, 0] }); }
    // garland with bulbs along the fascia
    for (let k = 0; k < w + 6; k++) {
      const gy = top + 2 + Math.round(1.5 * Math.sin((k / (w + 6)) * Math.PI * 3) ** 2);
      pc.px(hx - 3 + k, gy, { a: k % 2 ? P.garland : '#3d5c40', d: d - 0.01, id });
      if (k % 4 === 2) pc.px(hx - 3 + k, gy + 1, { a: P.cream, d: d - 0.01, id, e: k % 8 === 2 ? P.red : P.warm, ei: 4 * lightsOn });
    }
    // snow drifted against the base
    for (let k = hx - 3; k < hx + w + 3; k++) { const dh = 1 + Math.round(1.6 * (0.5 + 0.5 * Math.sin(k * 0.6 + id))); pc.rect(k, GROUND - dh, 1, dh, snow(SNR, { d: d - 0.006, id, seed: 3 })); }
  };
  hut(4, 46, 70, 0.46);
  hut(62, 40, 71, 0.47);
  hut(250, 44, 72, 0.46);

  // ---- the carousel
  lay(0.4);
  carousel(pc, 186, o.rot ?? t * 0.6, t, lightsOn);

  // ---- ground: wet cobbles in perspective (rows and stones grow toward the camera), snow at the edges
  lay(0.3);
  let gy = GROUND, row = 0;
  while (gy < 500) {
    const u = (gy - GROUND) / 75;
    const rh = Math.max(2, Math.round(2 + u * 4)), sw = Math.round(5 + u * 9);
    const d = 0.38 - u * 0.36;
    const off = (row % 2) * Math.floor(sw / 2);
    for (let yy = gy; yy < gy + rh; yy++)
      for (let gx = -30; gx < AW + 30; gx++) {
        const stone = Math.floor((gx + off + 600) / sw);
        const hv = Math.sin(stone * 12.9898 + row * 78.233) * 43758.5453, rnd = hv - Math.floor(hv);
        const inX = (gx + off + 600) % sw, inY = yy - gy;
        const joint = inY === 0 || inX === 0;
        // rounded stones: lit in the middle, darker toward the joints
        const cxn = Math.abs(inX - sw / 2) / (sw / 2), cyn = Math.abs(inY - rh / 2) / (rh / 2 + 0.5);
        const round = 1 - Math.max(cxn, cyn);
        // snow lies in drifts: along the edges of the square, at the hut bases, thicker the next morning
        const day = o.day ?? 0;
        const drift = vnoise(gx * (0.07 + day * 0.1), yy * (0.2 + day * 0.2), 21) + Math.max(0, Math.abs(gx - 135) / 135 - 0.45) * 1.4 + (yy < GROUND + 5 ? 0.3 : 0);
        const snowy = day > 0.5 || drift > 0.95;   // the next morning: fresh snow almost everywhere
        // footprints through the snow toward the tripod
        const fp = snowy && Math.abs(gx - (20 + (yy - GROUND) * 0.6)) < 1.5 && (yy % 4 === 0);
        const C = snowy ? [P.snowS, '#c6d2e3', P.snow, '#eef3fa'] : [P.cobD, P.cob, '#4d505c', P.cobL];
        const v = joint ? 0 : 1 + round * 1.6 + (rnd - 0.5) * 0.8;
        pc.px(gx, yy, { a: fp ? '#8a96ad' : C[Math.max(0, Math.min(3, Math.round(v)))]!, d, n: [0, joint ? 0.7 : 0.8 + round * 0.15], id: 5 });
      }
    gy += rh; row++;
  }

  // ---- the phone on its tripod, filming the carousel (no people: the stream is the character)
  lay(0.1);
  if ((o.streamer ?? 'tripod') === 'tripod') phoneOnTripod(pc, o.sx ?? 70, t, o.camX ?? 0);
  pc.ox = 0; pc.oy = 0;
}

/** The phone on a tripod, its screen facing us and showing what it films (the carousel). */
export function phoneOnTripod(pc: PixelCanvas, cx: number, t: number, camX = 0) {
  const D = 0.06;
  const metal: Mat = { a: P.metal, d: D, id: 91 }, metalD: Mat = { a: '#3d414a', d: D, id: 91 }, blk: Mat = { a: P.black, d: D - 0.005, id: 92 };
  const metalL: Mat = { a: '#8d929c', d: D, id: 91 }, knob: Mat = { a: '#1d1f24', d: D - 0.002, id: 91 };
  // legs splayed toward the camera (running out of frame), the centre column, the head
  const head = 452;
  for (let k = 0; k < 3; k++) {
    pc.line(cx + k - 1, head + 4, cx - 34 + k, 492, k === 1 ? metalD : metal);
    pc.line(cx + k - 1, head + 4, cx + 30 + k, 492, k === 1 ? metalD : metal);
  }
  pc.rect(cx - 1, head + 4, 3, 30, metalD); pc.rect(cx - 1, head + 4, 1, 30, metalL);
  for (const ky of [head + 14, head + 24]) pc.rect(cx - 3, ky, 7, 2, knob);           // leg locks
  pc.rect(cx - 4, head, 9, 7, metal); pc.rect(cx - 4, head, 9, 1, metalL); pc.rect(cx + 4, head, 1, 7, metalD);
  pc.rect(cx + 5, head + 2, 4, 2, knob);                                              // pan handle
  pc.rect(cx - 5, head - 4, 11, 4, metalD); pc.rect(cx - 5, head - 4, 11, 1, metalL);
  // the clamp and the phone (portrait), screen toward us
  const pw = 30, ph = 54, px0 = cx - pw / 2, py0 = head - 4 - ph;
  pc.rect(px0 - 3, py0 + 18, 3, 16, metalD); pc.rect(px0 + pw, py0 + 18, 3, 16, metalD);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const cxk = x < 2 ? 2 - x : x > pw - 3 ? x - (pw - 3) : 0, cyk = y < 2 ? 2 - y : y > ph - 3 ? y - (ph - 3) : 0;
    if (cxk * cxk + cyk * cyk > 4) continue;
    const rim = x === 0 || y === 0 ? '#3a3d46' : x === pw - 1 || y === ph - 1 ? '#0b0c10' : x === 1 || y === 1 ? '#22242b' : P.black;
    pc.px(px0 + x, py0 + y, { ...blk, a: rim });
  }
  pc.rect(px0 - 1, py0 + 10, 1, 5, { a: '#4a4d56', d: D - 0.004, id: 92 });          // side buttons
  pc.rect(px0 + pw, py0 + 14, 1, 3, { a: '#4a4d56', d: D - 0.004, id: 92 });
  // the screen shows the carousel as the phone sees it
  const cxs = 186 - camX * 0.6; // the carousel's x in the buffer (its layer's parallax)
  pc.screen(cxs - 46, 304, 92, 112, px0 + 2, py0 + 4, pw - 4, ph - 8, { ei: 1.15, d: D - 0.01, id: 93 });
  // LIVE: a red pill with a blinking dot
  const on = Math.sin(t * 6) > -0.3 ? 1 : 0.3;
  pc.rect(px0 + 4, py0 + 6, 9, 4, { a: P.red, d: D - 0.02, id: 94, e: '#ff3b3b', ei: 2.5 });
  pc.rect(px0 + 5, py0 + 7, 2, 2, { a: P.cream, d: D - 0.025, id: 94, e: '#ffffff', ei: 4 * on });
  // the viewer count: three little dots
  for (let k = 0; k < 3; k++) pc.px(px0 + 16 + k * 2, py0 + 8, { a: P.cream, d: D - 0.02, id: 95, e: '#ffffff', ei: 2.5 });
}

function carousel(pc: PixelCanvas, cx: number, rot: number, t: number, on: number) {
  const top = 318, valY = 352, platY = 402, rx = 54;
  const D = 0.4;
  // the cone canopy, red and cream stripes that turn with the ride
  pc.poly([[cx, top - 6], [cx - rx, valY], [cx + rx, valY]], (x, y) => {
    const u = (x + 0.5 - cx) / (rx * ((y - (top - 6)) / (valY - top + 6)) + 1e-3);
    const a = Math.asin(Math.max(-1, Math.min(1, u)));
    const sp = ((a + rot) / Math.PI) * 8 + 100, stripe = Math.floor(sp) % 2, inS = sp - Math.floor(sp);
    // fabric: each panel sags between the ribs (lighter in the middle), a gold rib between panels
    const vr = (y - (top - 6)) / (valY - top + 6);
    if (inS < 0.07 && vr > 0.15) return { a: P.gold, d: D - 0.01 * Math.cos(a), n: [u * 0.7, 0.55], id: 80 };
    const sag = Math.sin(inS * Math.PI) * 1.2 + vr * 0.4;
    const RR = stripe ? ['#6e1f22', '#8a2a2c', '#a8383a', '#c24a46', '#d8625a'] : ['#b8a888', '#d0c2a2', '#e8dcc0', '#f3ead6', '#fff7e6'];
    return { a: RR[dither(1.3 + sag, x, y)]!, d: D - 0.01 * Math.cos(a), n: [u * 0.7, 0.55], id: 80 };
  });
  // the scalloped valance with a bulb on every scallop
  for (let x = cx - rx; x <= cx + rx; x++) {
    const k = x - (cx - rx);
    const sc = Math.round(2.5 * Math.sin(((k % 9) / 9) * Math.PI));
    const gold = Math.floor(k / 9) % 2;
    for (let y = valY; y < valY + 4 + sc; y++) {
      const top0 = y === valY, edge = y === valY + 3 + sc;
      const a = gold ? (top0 ? '#f0cf7a' : edge ? '#9a7430' : P.gold) : (top0 ? '#a8383a' : edge ? '#4e1a1c' : P.redD);
      pc.px(x, y, { a, d: D, n: [((x - cx) / rx) * 0.6, top0 ? 0.5 : 0], id: 81 });
    }
    if (k % 9 === 0) pc.rect(x, valY + 4 + sc, 1, 3, { a: '#d4a24a', d: D - 0.005, id: 81 });   // tassels
    if (k % 9 === 4) {
      const chase = 0.55 + 0.45 * Math.max(0, Math.sin(t * 5 - k * 0.35));
      pc.px(x, valY + 5 + sc, { a: P.cream, d: D - 0.01, id: 81, e: P.cream, ei: 7 * chase * on });
    }
  }
  // finial and pennant
  pc.rect(cx - 1, top - 14, 3, 9, { a: P.gold, d: D, id: 80 });
  pc.poly([[cx + 2, top - 14], [cx + 11, top - 12 + Math.sin(t * 3)], [cx + 2, top - 10]], { a: P.red, d: D, id: 80 });
  // the centre drum: mirrored panels with a warm glow
  // the centre drum: painted panels in gold frames, mirrors that catch the bulbs
  pc.rect(cx - 12, valY + 4, 25, platY - valY - 6, (x, y) => ({ a: ['#3a2a2a', '#4a3030', '#2f2222'][(x + y) % 3]!, d: D + 0.04, id: 82 }));
  for (let k = 0; k < 4; k++) {
    const px0 = cx - 10 + k * 6;
    pc.rect(px0 - 1, valY + 8, 6, 24, { a: P.gold, d: D + 0.039, id: 82 });
    pc.rect(px0, valY + 9, 4, 22, (x, y) => ({ a: '#2a2026', d: D + 0.038, id: 82, e: (y + k) % 7 === 0 ? '#fff0c8' : '#ffb870', ei: ((y + k) % 7 === 0 ? 1.4 : 0.55 - (y - valY - 9) * 0.012) * on }));
  }
  pc.rect(cx - 12, valY + 36, 25, 2, { a: P.gold, d: D + 0.04, id: 82 });
  pc.rect(cx - 12, valY + 5, 25, 1, { a: P.gold, d: D + 0.04, id: 82 });
  // poles and horses: 8 around the ride, back ones dimmer and higher in depth
  for (let i = 0; i < 8; i++) {
    const a = rot + (i / 8) * Math.PI * 2;
    const front = Math.cos(a);
    if (front < -0.2) continue;
    const hx = cx + Math.sin(a) * (rx - 8);
    const bob = Math.round(3 * Math.sin(t * 2.4 + i * 1.3));
    const d = D - 0.03 * front;
    pc.rect(hx, valY + 4, 1, platY - valY - 6, { a: P.brass, d, id: 83 + i, n: [Math.sin(a), 0] });
    const flip = Math.cos(a + Math.PI / 2) < 0;
    pc.sprite(HORSE, Math.round(hx - 7), valY + 20 + bob, {
      w: { a: P.white, d, id: 83 + i }, W: { a: P.whiteS, d, id: 83 + i }, r: { a: P.red, d, id: 83 + i }, m: { a: P.gold, d, id: 83 + i }, g: { a: '#d4a24a', d, id: 83 + i },
    }, flip);
  }
  // the platform with a rim of bulbs
  pc.poly([[cx - rx - 2, platY - 2], [cx + rx + 2, platY - 2], [cx + rx - 2, platY + 5], [cx - rx + 2, platY + 5]], (x, y) => ({ ...wood(ramp('#5a3a2a', 0.9), { d: D - 0.02, id: 84, pw: 2, seed: 8 })(x + Math.round(rot * 20), y), n: [0, y < platY + 1 ? 0.6 : -0.2] }));
  pc.rect(cx - rx, platY - 3, rx * 2 + 1, 2, { a: P.gold, d: D - 0.03, id: 84 });
  for (let x = cx - rx + 2; x < cx + rx; x += 5) {
    const chase = 0.55 + 0.45 * Math.max(0, Math.sin(t * 5 + x * 0.3));
    pc.px(x, platY + 1, { a: P.cream, d: D - 0.03, id: 84, e: P.cream, ei: 6 * chase * on });
  }
}

export function townLights(o: TownOpts): Light[] {
  const on = 1 - (o.day ?? 0), t = o.t;
  const cxs = -(o.camX ?? 0) * 0.6;
  const fl = (k: number) => 0.92 + 0.08 * Math.sin(t * 7.1 + k) * Math.sin(t * 4.3 + k * 2);
  const L: Light[] = [
    { x: 186 + cxs, y: 380, d: 0.36, col: '#ffcf8f', i: 3.2 * on * fl(1), r: 70, shadow: true },
    { x: 186 + cxs, y: 356, d: 0.38, col: '#fff0c8', i: 2.0 * on, r: 40 },
    { x: 27 + cxs, y: 388, d: 0.42, col: '#ffad5a', i: 2.0 * on * fl(2), r: 28, shadow: true },
    { x: 82 + cxs, y: 388, d: 0.43, col: '#ffad5a', i: 1.8 * on * fl(3), r: 26, shadow: true },
    { x: 270 + cxs, y: 388, d: 0.42, col: '#ffad5a', i: 1.8 * on, r: 26 },
    { x: 40 + cxs, y: 300, d: 0.54, col: '#ffe2a8', i: 0.7 * on, r: 50 },
    { x: 135 + cxs, y: 306, d: 0.54, col: '#ffe2a8', i: 0.7 * on, r: 50 },
    { x: 230 + cxs, y: 300, d: 0.54, col: '#ffe2a8', i: 0.7 * on, r: 50 },
    { x: 135 + cxs, y: 326, d: 0.54, col: '#ffd08a', i: 0.6 * on, r: 46 },
  ];
  if ((o.streamer ?? 'tripod') === 'tripod') L.push({ x: o.sx ?? 70, y: 420, d: 0.02, col: '#ffd9a8', i: 1.0, r: 26 });
  return L;
}
