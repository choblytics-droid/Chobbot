// Set 1: the old town at Christmas, blue hour. Pixel art painted into the G-buffer every frame.
// Layout in art px (270 x 480 in 9:16, y down): sky above ~y 262, the castle on its hill, a row of
// gabled houses, string lights across the square, market huts, the carousel, wet cobbles, and the
// phone on its tripod filming the carousel (no people: the stream is the character).
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';
import { mulberry32 } from '../../../engine/util';

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
  '........wW..',
  '.......wwwW.',
  '......wwwWWm',
  'wwwwwwwwwW..',
  'wwrrrwwwwW..',
  '.wwrrwwwwW..',
  '.wwwwwwww...',
  '.w.w...w.w..',
  'w..w...w..w.',
];

export function paintTown(pc: PixelCanvas, o: TownOpts) {
  const t = o.t, day = o.day ?? 0, lightsOn = 1 - day;
  const cx = o.camX ?? 0, cy = o.camY ?? 0;
  const lay = (depth: number) => { pc.ox = -cx * (1 - depth); pc.oy = -cy * (1 - depth); };
  pc.clear();
  pc.names = { 2: 'hill', 3: 'hill trees', 4: 'castle', 5: 'cobbles', 60: 'string lights', 70: 'hut L', 71: 'hut M', 72: 'hut R', 80: 'carousel canopy', 81: 'carousel valance', 82: 'carousel drum', 84: 'carousel platform', 91: 'tripod', 92: 'phone', 93: 'phone screen' };
  for (let k = 11; k < 30; k++) pc.names[k] = `house ${k - 10}`;
  const R = mulberry32(7);

  // ---- far: hills, trees, the castle
  lay(0.95);
  const hillY = (x: number) => 252 - 18 * Math.exp(-(((x - 200) / 70) ** 2)) - 6 * Math.sin(x * 0.05);
  pc.poly([[-40, 300], [-40, 262], ...Array.from({ length: 36 }, (_, i): [number, number] => [-40 + i * 10, hillY(-40 + i * 10)]), [320, 300]], { a: P.hill, d: 0.96, n: [0, 0.3], id: 2 });
  for (let x = -40; x < 320; x += 3) {
    const h = 4 + Math.floor(R() * 6);
    const y = hillY(x) + 6;
    pc.poly([[x - 2, y], [x + 0.5, y - h], [x + 3, y]], { a: P.tree, d: 0.94, id: 3 });
  }
  // the castle: keep, towers, wall, a few lit windows
  const cm = (a: string, n: [number, number] = [0, 0]): Mat => ({ a, d: 0.9, n, id: 4 });
  const base = hillY(205) - 2;
  pc.rect(168, base - 26, 74, 28, cm(P.stone));
  for (let x = 168; x < 242; x += 4) pc.rect(x, base - 29, 2, 3, cm(P.stone));
  pc.rect(184, base - 56, 24, 32, cm(P.stoneL));
  pc.poly([[182, base - 56], [196, base - 74], [210, base - 56]], cm(P.slate, [0, 0.6]));
  pc.rect(214, base - 46, 12, 22, cm(P.stone));
  pc.poly([[212, base - 46], [220, base - 60], [228, base - 46]], cm(P.slate, [0.4, 0.6]));
  pc.rect(170, base - 40, 10, 16, cm(P.stone));
  pc.poly([[168, base - 40], [175, base - 50], [182, base - 40]], cm(P.slate, [-0.4, 0.6]));
  pc.line(196, base - 74, 196, base - 82, cm(P.stoneL));
  pc.rect(197, base - 82, 4, 2, { a: P.red, d: 0.9, id: 4 });
  for (const [wx, wy] of [[192, base - 48], [200, base - 48], [192, base - 38], [218, base - 38], [174, base - 33], [230, base - 18], [186, base - 16]] as const)
    pc.rect(wx, wy, 2, 3, { a: P.glass, d: 0.9, id: 4, e: P.warm, ei: 2.2 * lightsOn });

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
    const wm: Mat = { a: wall, d, id };
    pc.rect(x, top, w, h, wm);
    // ground floor down to the square: a shop front with a door and a lit display
    pc.rect(x, HB, w, GROUND - HB, { a: P.timber, d, id });
    pc.rect(x + 2, HB + 4, w - 4, 1, { a: P.snow, d, id, n: [0, 0.9] });
    pc.rect(x + 3, HB + 8, Math.floor(w * 0.55), 14, { a: P.glass, d, id, e: P.warm2, ei: (0.8 + R() * 0.8) * lightsOn });
    pc.rect(x + w - 10, HB + 9, 6, GROUND - HB - 9, { a: '#2a1d18', d, id });
    // gable: stepped or pointed
    const stepped = R() < 0.5;
    const gh = Math.floor(w * 0.55);
    if (stepped) {
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        const inset = Math.floor((w / 2) * (s / steps));
        pc.rect(x + inset, top - (s + 1) * (gh / steps), w - 2 * inset, gh / steps + 1, wm);
        pc.rect(x + inset, top - (s + 1) * (gh / steps) - 1, 3, 2, { a: P.snow, d, id, n: [0, 0.9] });
        pc.rect(x + w - inset - 3, top - (s + 1) * (gh / steps) - 1, 3, 2, { a: P.snow, d, id, n: [0, 0.9] });
      }
    } else {
      pc.poly([[x - 2, top + 1], [x + w / 2, top - gh], [x + w + 2, top + 1]], (px) => ({ a: px < x + w / 2 ? P.slate : P.slateL, d, id, n: [px < x + w / 2 ? -0.5 : 0.5, 0.6] }));
      // snow on the roof edge
      for (let k = 0; k <= gh; k++) {
        const fx = k / gh;
        pc.px(x - 2 + fx * (w / 2 + 2), top - k, { a: P.snow, d, id, n: [-0.4, 0.8] });
        pc.px(x + w + 2 - fx * (w / 2 + 2), top - k, { a: P.snowS, d, id, n: [0.4, 0.8] });
        pc.px(x - 2 + fx * (w / 2 + 2), top - k + 1, { a: P.snowS, d, id, n: [-0.4, 0.8] });
      }
      if (R() < 0.6) pc.rect(x + w * 0.7, top - gh * 0.8, 4, 8, { a: P.stone, d, id });
    }
    // windows
    const cols = w > 40 ? 3 : 2, rows = Math.max(2, Math.floor((h - 20) / 18));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const ww = 5, wh = 7;
        const wx = x + Math.round(((c + 1) * w) / (cols + 1)) - 2, wy = top + 8 + r * 18;
        const lit = R() < 0.55;
        const tint = R() < 0.3 ? P.warm2 : P.warm;
        pc.rect(wx - 1, wy - 1, ww + 2, wh + 2, { a: P.timber, d, id });
        pc.rect(wx, wy, ww, wh, { a: P.glass, d, id, e: lit ? tint : undefined, ei: lit ? (1.4 + R() * 1.6) * lightsOn : 0 });
        pc.rect(wx + 2, wy, 1, wh, { a: P.timber, d, id });
        pc.rect(wx, wy + 3, ww, 1, { a: P.timber, d, id });
        pc.rect(wx - 1, wy + wh + 1, ww + 2, 1, { a: P.snow, d, id, n: [0, 0.9] });
      }
    x += w + 1;
  }

  // ---- string lights across the square (two catenaries)
  lay(0.55);
  const strand = (y0: number, y1: number, sag: number, phase: number) => {
    for (let sx = -20; sx < AW + 20; sx++) {
      const u = (sx + 20) / (AW + 40);
      const y = y0 + (y1 - y0) * u + sag * 4 * u * (1 - u);
      pc.px(sx, y, { a: P.black, d: 0.55, id: 60 });
      if ((sx + 400) % 6 === 0) {
        const k = Math.floor((sx + 400) / 6);
        const tw = 0.75 + 0.25 * Math.sin(t * 2.0 + k * 1.7 + phase);
        const col = k % 3 === 0 ? P.warm2 : P.cream;
        pc.px(sx, y + 1, { a: P.cream, d: 0.55, id: 60, e: col, ei: 5 * tw * lightsOn });
      }
    }
  };
  strand(286, 292, 22, 0);
  strand(312, 318, 16, 2);

  // ---- market huts (left of the carousel, and one at the right edge)
  lay(0.45);
  const hut = (hx: number, w: number, id: number, d: number) => {
    const h = 30, top = GROUND - h;
    pc.rect(hx, top, w, h, (p => p)({ a: P.wood, d, id }));
    for (let k = 0; k < w; k += 4) pc.rect(hx + k, top, 1, h, { a: P.woodD, d, id });
    // the open counter, glowing
    pc.rect(hx + 3, top + 6, w - 6, 13, { a: '#6a4a30', d: d + 0.01, id, e: P.warm2, ei: 0.9 * lightsOn });
    // goods on the counter and hanging from the eave: jars, ornaments, gingerbread hearts
    for (let k = hx + 5; k < hx + w - 5; k += 4) {
      const g = (k * 7 + id * 13) % 5;
      const gc = ['#c0392b', '#e8c27a', '#8e5a2b', '#2f6d4a', '#d9d2c4'][g]!;
      pc.rect(k, top + 15, 2, 4, { a: gc, d, id, n: [0, 0.2] });
      if (g % 2 === 0) { pc.line(k + 1, top + 6, k + 1, top + 8 + (g % 3), { a: P.woodD, d, id }); pc.rect(k, top + 9 + (g % 3), 3, 2, { a: gc, d, id, e: g === 0 ? '#ff6a4a' : undefined, ei: g === 0 ? 0.6 * lightsOn : 0 }); }
    }
    pc.rect(hx + 3, top + 6, w - 6, 1, { a: P.woodD, d, id });
    pc.rect(hx + 2, top + 19, w - 4, 3, { a: P.woodL, d, id, n: [0, 0.7] });
    // roof with snow
    pc.poly([[hx - 4, top + 1], [hx + w / 2, top - 14], [hx + w + 4, top + 1]], (px) => ({ a: px < hx + w / 2 ? P.woodD : P.wood, d, id, n: [px < hx + w / 2 ? -0.5 : 0.5, 0.6] }));
    pc.poly([[hx - 4, top + 1], [hx + w / 2, top - 14], [hx + w + 4, top + 1], [hx + w + 4, top - 1], [hx + w / 2, top - 16], [hx - 4, top - 1]], { a: P.snow, d, id, n: [0, 0.9] });
    // garland with bulbs along the fascia
    for (let k = 0; k < w + 6; k++) {
      const gy = top + 2 + Math.round(1.5 * Math.sin((k / (w + 6)) * Math.PI * 3) ** 2);
      pc.px(hx - 3 + k, gy, { a: P.garland, d: d - 0.01, id });
      if (k % 4 === 2) pc.px(hx - 3 + k, gy + 1, { a: P.cream, d: d - 0.01, id, e: k % 8 === 2 ? P.red : P.warm, ei: 4 * lightsOn });
    }
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
        const joint = yy === gy || (gx + off + 600) % sw === 0;
        const edgeSnow = Math.max(0, Math.abs(gx - 135) / 135 - 0.5) * 2 * (1 - u * 0.7);
        const snowy = rnd < 0.01 + edgeSnow * 0.25;
        const top = yy === gy + 1 && !joint; // a lit upper lip on each stone
        pc.px(gx, yy, { a: snowy ? (joint ? P.snowS : P.snow) : joint ? P.cobD : top ? P.cobL : rnd < 0.5 ? P.cob : '#4d505c', d, n: [0, top ? 0.95 : 0.8], id: 5 });
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
  // legs splayed toward the camera (running out of frame), the centre column, the head
  const head = 452;
  for (let k = 0; k < 3; k++) {
    pc.line(cx + k - 1, head + 4, cx - 34 + k, 492, k === 1 ? metalD : metal);
    pc.line(cx + k - 1, head + 4, cx + 30 + k, 492, k === 1 ? metalD : metal);
  }
  pc.rect(cx - 1, head + 4, 3, 30, metalD);
  pc.rect(cx - 4, head, 9, 7, metal);
  pc.rect(cx - 5, head - 4, 11, 4, metalD);
  // the clamp and the phone (portrait), screen toward us
  const pw = 30, ph = 54, px0 = cx - pw / 2, py0 = head - 4 - ph;
  pc.rect(px0 - 3, py0 + 18, 3, 16, metalD); pc.rect(px0 + pw, py0 + 18, 3, 16, metalD);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const cxk = x < 2 ? 2 - x : x > pw - 3 ? x - (pw - 3) : 0, cyk = y < 2 ? 2 - y : y > ph - 3 ? y - (ph - 3) : 0;
    if (cxk * cxk + cyk * cyk <= 4) pc.px(px0 + x, py0 + y, blk);
  }
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
    const stripe = Math.floor(((a + rot) / Math.PI) * 8 + 100) % 2;
    return { a: stripe ? P.red : P.cream, d: D - 0.01 * Math.cos(a), n: [u * 0.7, 0.55], id: 80 };
  });
  // the scalloped valance with a bulb on every scallop
  for (let x = cx - rx; x <= cx + rx; x++) {
    const k = x - (cx - rx);
    const sc = Math.round(2.5 * Math.sin(((k % 9) / 9) * Math.PI));
    for (let y = valY; y < valY + 4 + sc; y++) pc.px(x, y, { a: Math.floor(k / 9) % 2 ? P.gold : P.redD, d: D, n: [((x - cx) / rx) * 0.6, 0], id: 81 });
    if (k % 9 === 4) {
      const chase = 0.55 + 0.45 * Math.max(0, Math.sin(t * 5 - k * 0.35));
      pc.px(x, valY + 5 + sc, { a: P.cream, d: D - 0.01, id: 81, e: P.cream, ei: 7 * chase * on });
    }
  }
  // finial and pennant
  pc.rect(cx - 1, top - 14, 3, 9, { a: P.gold, d: D, id: 80 });
  pc.poly([[cx + 2, top - 14], [cx + 11, top - 12 + Math.sin(t * 3)], [cx + 2, top - 10]], { a: P.red, d: D, id: 80 });
  // the centre drum: mirrored panels with a warm glow
  pc.rect(cx - 12, valY + 4, 25, platY - valY - 6, { a: '#3a2a2a', d: D + 0.04, id: 82 });
  for (let k = 0; k < 4; k++) pc.rect(cx - 10 + k * 6, valY + 9, 4, 22, { a: '#2a2026', d: D + 0.04, id: 82, e: '#ffb870', ei: 1.1 * on });
  pc.rect(cx - 12, valY + 36, 25, 2, { a: P.gold, d: D + 0.04, id: 82 });
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
    pc.sprite(HORSE, Math.round(hx - 6), valY + 22 + bob, {
      w: { a: P.white, d, id: 83 + i }, W: { a: P.whiteS, d, id: 83 + i }, r: { a: P.red, d, id: 83 + i }, m: { a: P.gold, d, id: 83 + i },
    }, flip);
  }
  // the platform with a rim of bulbs
  pc.poly([[cx - rx - 2, platY - 2], [cx + rx + 2, platY - 2], [cx + rx - 2, platY + 5], [cx - rx + 2, platY + 5]], { a: '#5a3a2a', d: D - 0.02, n: [0, 0.5], id: 84 });
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
