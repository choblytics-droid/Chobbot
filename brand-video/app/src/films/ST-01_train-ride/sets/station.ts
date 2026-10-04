// Set 3: the station at night (frame 4). The regional train waits at the platform under the
// canopy. Seen through the stream itself (the phone's camera): no people on screen.
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';
import { ramp, hillside, metal, stone, mix, vnoise } from '../../../kit/materials';
import { paintPines, CASTLE_SNOW } from './castle';
import { mulberry32 } from '../../../engine/util';

const P = {
  canopy: '#2b2f3a', canopyL: '#3a3f4c', girder: '#1f2229', lamp: '#fff1d0',
  body: '#d9d4c8', bodyS: '#b4aea2', stripe: '#b0343a', stripeD: '#86282d', roof: '#7b808a', win: '#20242c', door: '#c8c2b5',
  plat: '#5a5d65', platL: '#6a6e76', platD: '#4a4d55', yellow: '#d9b64a', snow: '#dfe7f2', snowS: '#9aa6bb', rail: '#3a3a40',
  board: '#101216', amber: '#ffb24a', 
};

export function paintStation(pc: PixelCanvas, o: { t: number; camX?: number }) {
  const t = o.t;
  pc.clear();
  pc.names = { 2: 'hills', 3: 'canopy', 4: 'girders', 5: 'lamps', 6: 'departure board', 7: 'clock', 10: 'train body', 11: 'train windows', 12: 'train door', 13: 'track bed', 14: 'platform' };
  const lay = (d: number) => { pc.ox = -(o.camX ?? 0) * (1 - d); };

  // far: a hill and a few town lights under the sky (seen past the canopy's edge)
  lay(0.95);
  const hy = (x: number) => 214 - Math.round(7 * Math.sin(x * 0.02) + 4 * Math.sin(x * 0.07));   // kept low: the lyric sits above its snowy crest
  const HR = ramp('#232838', 0.9);
  for (let x = -20; x < AW + 20; x++) {
    for (let y = hy(x); y < 240; y++) pc.px(x, y, hillside(HR, CASTLE_SNOW, { d: 0.96, id: 2, ty: hy, seed: 5 })(x, y));
    if ((x * 37) % 23 === 0) pc.px(x, hy(x) + 6 + (x % 5), { a: '#1a2130', d: 0.96, id: 2, e: '#ffcc80', ei: 2.4 });
  }
  paintPines(pc, (x) => hy(x) + 8, mulberry32(3), 0.955, 2, -20, AW + 20, 9, 0.7);
  // the canopy: roof underside, girders, a row of lamps, the clock and the departure board
  lay(0.5);
  // corrugated underside: ribs running across, lit edge and shadow per rib, grime toward the edge
  const CR = ramp('#2f3440', 0.8), GR = ramp('#262a33', 0.8);
  pc.rect(-20, 0, AW + 40, 96, (x, y) => {
    const rib = y % 6;
    let v = rib === 0 ? 3 : rib === 5 ? 0 : 2;
    v += (vnoise(x * 0.05, y * 0.1, 3) - 0.5) * 0.8 - (y > 80 ? 0.5 : 0);
    return { a: CR[Math.max(0, Math.min(4, Math.round(v)))]!, d: 0.48, id: 3, n: [0, rib === 0 ? -0.2 : -0.7] };
  });
  // I-beam girders with rivets, diagonal bracing between them
  for (let x = -20; x < AW + 40; x += 30) {
    pc.rect(x, 0, 4, 96, (xx, yy) => ({ a: xx - x === 0 ? GR[3]! : xx - x === 3 ? GR[0]! : (yy % 6 === 3 && xx - x === 1) ? GR[4]! : GR[2]!, d: 0.47, id: 4, n: [xx - x === 0 ? -0.5 : xx - x === 3 ? 0.5 : 0, 0] }));
    pc.line(x + 4, 90, x + 29, 66, { a: GR[1]!, d: 0.475, id: 4 }); pc.line(x + 4, 89, x + 29, 65, { a: GR[3]!, d: 0.475, id: 4 });
  }
  pc.rect(-20, 92, AW + 40, 6, (x, y) => ({ a: y === 92 ? GR[4]! : y === 97 ? GR[0]! : (x % 8 === 0 ? GR[4]! : GR[2]!), d: 0.47, id: 4, n: [0, y === 92 ? 0.4 : -0.4] }));
  for (let x = -20; x < AW + 40; x++) if ((x * 7) % 5 < 3) pc.px(x, 91, { a: (x % 3) ? P.snow : P.snowS, d: 0.469, id: 4, n: [0, 0.9] });   // snow on the canopy edge
  for (let x = 4; x < AW + 20; x += 56) {
    pc.rect(x, 98, 1, 10, { a: GR[2]!, d: 0.46, id: 5 });
    pc.rect(x - 7, 107, 15, 4, (xx, yy) => ({ a: yy === 107 ? GR[4]! : xx === x - 7 || xx === x + 7 ? GR[0]! : GR[2]!, d: 0.46, id: 5, n: [0, yy === 107 ? 0.5 : -0.3] }));
    pc.rect(x - 6, 111, 13, 2, { a: P.lamp, d: 0.46, id: 5, e: P.lamp, ei: 5 });
    pc.rect(x - 5, 113, 11, 1, { a: '#e8dcc0', d: 0.46, id: 5, e: P.lamp, ei: 1.5 });
  }
  // departure board: amber dot-matrix
  pc.rect(148, 118, 96, 30, (x, y) => ({ a: y === 118 || x === 148 ? '#4a4d56' : y === 147 || x === 243 ? '#16171c' : '#2a2c33', d: 0.451, id: 6 }));
  pc.rect(150, 120, 92, 26, (x, y) => ({ a: (x + y) % 2 ? P.board : '#0c0d10', d: 0.45, id: 6 }));
  pc.line(152, 121, 166, 121, { a: '#2a2e3a', d: 0.449, id: 6 });
  const amber = (x: number, y: number, k = 3) => pc.px(x, y, { a: P.board, d: 0.45, id: 6, e: P.amber, ei: k });
  const TRAIN = ['.####.', '#.##.#', '######', '.#..#.'];
  for (let line = 0; line < 2; line++) {
    const by = 124 + line * 10, dim = line ? 2.2 : 3.2;
    TRAIN.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') amber(154 + i, by + j, dim); }));
    for (let i = 0; i < 4; i++) amber(163 + i, by + 2, dim); amber(166, by + 1, dim); amber(166, by + 3, dim);   // arrow
    let x = 171, k = line * 5 + 1;
    while (x < 236) { const w = 3 + ((k * 7) % 4) * 2; for (let i = 0; i < w && x + i < 238; i += 2) for (let j = 0; j < 5; j++) if (((i + j + k) % 3) !== 0) amber(x + i, by + j - 1, dim); x += w + 3; k++; }
  }
  pc.line(196, 98, 196, 120, { a: P.girder, d: 0.46, id: 6 });
  // clock: case ring first, then the face
  pc.disc(60, 140, 12.5, (x, y, dx, dy) => ({ a: dy < 0 ? '#6a6d76' : '#2a2c33', d: 0.452, id: 7, n: [dx * 0.8, -dy * 0.8] }));
  pc.disc(60, 140, 11, (x, y, dx, dy) => {
    const r2 = dx * dx + dy * dy, ang = Math.atan2(dy, dx), tick = r2 > 0.55 && r2 < 0.72 && Math.abs(((ang / (Math.PI / 6)) % 1 + 1) % 1 - 0.5) > 0.38;
    if (r2 > 0.75) return { a: dy < 0 ? '#5a5d66' : GR[1]!, d: 0.45, id: 7, n: [dx * 0.7, -dy * 0.7] };
    return { a: tick ? '#2a2a30' : '#ece6da', d: 0.45, id: 7, e: tick ? undefined : '#fff4dc', ei: tick ? 0 : 0.22 - r2 * 0.1 };
  });
  pc.line(60, 140, 60, 132, { a: '#1a1a1f', d: 0.44, id: 7 });
  pc.line(60, 140, 65, 142, { a: '#1a1a1f', d: 0.44, id: 7 });
  pc.line(60, 98, 60, 129, { a: P.girder, d: 0.46, id: 7 });
  pc.rect(57, 126, 7, 3, (x, y) => ({ a: y === 126 ? '#5a5d66' : '#2a2c33', d: 0.455, id: 7 }));   // bracket


  // the train: a regional double-length carriage alongside the platform
  lay(0.35);
  const top = 236, bot = 372;
  for (let y = top; y < bot; y++)
    for (let x = -20; x < AW + 20; x++) {
      const v = (y - top) / (bot - top);
      const stripe = y > top + 96 && y < top + 106;
      const roofL = y < top + 8;
      const body = metal(ramp(P.body, 0.6), { d: 0.34, id: 10, pw: 34, ph: 200, gy: bot - 18, seed: 2 })(x + 17, y);
      const m = roofL ? { a: ramp(P.roof, 0.7)[y % 2 ? 2 : 3]!, d: 0.34, id: 10, n: [0, 0.6] as [number, number] }
        : stripe ? { a: y === top + 97 ? '#d0505a' : y < top + 99 ? P.stripeD : P.stripe, d: 0.34, id: 10 }
        : v > 0.88 ? { a: ramp('#55524c', 0.7)[(x + y) % 3 + 1]!, d: 0.34, id: 10 } : body;
      pc.px(x, y, m);
    }
  for (let x = -12; x < AW + 20; x += 46) { pc.rect(x, top - 4, 14, 4, (xx, yy) => ({ a: yy === top - 4 ? '#9aa0aa' : (xx % 2 ? '#6b707a' : '#5a5f68'), d: 0.341, id: 10, n: [0, 0.6] })); pc.rect(x, top - 5, 14, 1, { a: P.snow, d: 0.341, id: 10, n: [0, 0.9] }); }
  // windows (lit) and a door with its own lamp
  for (let x = -16; x < AW + 20; x += 34) {
    if (x > 110 && x < 160) continue;
    pc.rect(x - 1, top + 25, 26, 42, (xx, yy) => ({ a: yy === top + 25 || xx === x - 1 ? '#3a3d46' : '#0f1014', d: 0.34, id: 11 }));
    // the lit interior seen through the glass: ceiling lamp, luggage rack, the far wall, seat backs; a reflection streak on the glass
    for (let yy = top + 27; yy < top + 65; yy++) for (let xx = x + 1; xx < x + 23; xx++) {
      const ly = yy - top - 27, lx = xx - x - 1;
      let a = P.win, e = '#ffe0aa', ei = 1.0 - ly * 0.012;
      if (ly < 2) { a = '#e8dcc0'; e = '#fff1d0'; ei = 2.2; }                                   // lamp strip
      else if (ly === 8) { a = '#8d929c'; ei = 0.3; }                                          // luggage rack
      else if (ly > 9 && ly < 24 && lx % 11 === 3) { a = '#4a3a2a'; ei = 0.35; }              // window posts on the far side
      else if (ly >= 24) { const pat = (xx + yy) % 6 === 0; a = pat ? '#8a3a3a' : ly === 24 ? '#d8d2c4' : '#2f3f6b'; e = '#ffe0aa'; ei = ly === 24 ? 0.6 : 0.25; }   // seat backs, headrest covers
      if (Math.abs(lx - ly * 0.6 - 6) < 1.2) ei += 0.5;                                         // reflection on the glass
      pc.px(xx, yy, { a, d: 0.34, id: 11, e, ei });
    }
    if ((x / 34 + 3) % 3 === 0) pc.disc(x + 12, top + 50, 5, (xx, yy, dx) => ({ a: dx < -0.3 ? '#2c2e36' : '#1c1d23', d: 0.333, id: 11 }));   // a blank passenger, seen from behind
  }
  pc.rect(114, top + 18, 42, bot - top - 22, { a: P.door, d: 0.335, id: 12 });
  for (const gx0 of [116, 136]) pc.rect(gx0, top + 24, 18, 46, (xx, yy) => {
    const ly = yy - top - 24, lx = xx - gx0;
    const frame = lx === 0 || lx === 17 || ly === 0 || ly === 45;
    if (frame) return { a: '#3a3d46', d: 0.335, id: 12 };
    let ei = 1.8 - ly * 0.02 + (Math.abs(lx - ly * 0.5 - 3) < 1.2 ? 0.6 : 0);
    const handrail = lx === 9 && ly > 6;
    return { a: handrail ? '#b8bcc4' : P.win, d: 0.335, id: 12, e: handrail ? undefined : '#ffe0aa', ei: handrail ? 0 : ei };
  });
  pc.rect(134, top + 18, 2, bot - top - 22, { a: '#8a857a', d: 0.33, id: 12 });
  pc.rect(114, top + 18, 42, 1, { a: '#e8e2d6', d: 0.334, id: 12 }); pc.rect(114, bot - 5, 42, 1, { a: '#6f6a60', d: 0.334, id: 12 });
  pc.rect(130, top + 50, 2, 10, { a: '#3a3d46', d: 0.332, id: 12 }); pc.rect(138, top + 50, 2, 10, { a: '#3a3d46', d: 0.332, id: 12 });   // handles
  pc.rect(112, bot - 4, 46, 3, (xx, yy) => ({ a: yy === bot - 4 ? '#9aa0aa' : '#4a4d56', d: 0.331, id: 12, n: [0, 0.6] }));            // step
  pc.rect(129, top + 10, 12, 4, { a: '#3a3a40', d: 0.33, id: 12, e: '#7dff9a', ei: 3 * (Math.sin(t * 4) > 0 ? 1 : 0.3) });
  // under the train: the dark track bed
  pc.rect(-20, bot, AW + 40, 8, (x, y) => { const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; const r = h - Math.floor(h); return { a: r < 0.3 ? '#2a2a30' : r < 0.6 ? '#1a1a1f' : r < 0.9 ? '#22232a' : '#3a3b42', d: 0.333, id: 13 }; });
  // bogies and wheels under the body
  for (let x = 0; x < AW + 20; x += 120) for (const wx of [x + 10, x + 26]) {
    pc.disc(wx, bot + 1, 5, (xx, yy, dx, dy) => ({ a: dx * dx + dy * dy < 0.25 ? '#4a4d56' : dy < -0.3 ? '#3a3d46' : '#1b1c21', d: 0.332, id: 13 }));
  }

  // the platform: paving in perspective, the yellow line, snow at the edge
  lay(0.25);
  let gy = bot + 6, row = 0;
  while (gy < 490) {
    const u = (gy - bot) / 108, rh = Math.max(2, Math.round(2 + u * 6));
    for (let yy = gy; yy < gy + rh; yy++)
      for (let x = -20; x < AW + 20; x++) {
        const edge = row < 2;
        const joint = yy === gy || (x + (row % 2) * 9 + 400) % Math.round(10 + u * 14) === 0;
        const slab = Math.floor((x + (row % 2) * 9 + 400) / Math.round(10 + u * 14));
        const sn = Math.sin(slab * 12.9898 + row * 78.233) * 43758.5453, rnd = sn - Math.floor(sn);
        pc.px(x, yy, { a: edge ? (row === 0 ? P.snow : P.yellow) : joint ? P.platD : rnd < 0.06 ? P.snowS : rnd < 0.5 ? P.plat : P.platL, d: 0.3 - u * 0.25, n: [0, 0.9], id: 14 });
      }
    gy += rh; row++;
  }

  pc.ox = 0;
}

export function stationLights(t: number): Light[] {
  const L: Light[] = [];
  for (let x = 4; x < AW + 20; x += 56) L.push({ x, y: 116, d: 0.44, col: '#ffe9c0', i: 1.6, r: 60, shadow: x < 140 });
  L.push({ x: 135, y: 290, d: 0.3, col: '#ffe0aa', i: 1.2, r: 60 });
  return L;
}
