// Set 3: the station at night (frame 4). The regional train waits at the platform under the
// canopy. Seen through the stream itself (the phone's camera): no people on screen.
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';

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
  for (let x = -20; x < AW + 20; x++) {
    const hy = 200 - Math.round(10 * Math.sin(x * 0.02) + 5 * Math.sin(x * 0.07));
    for (let y = hy; y < 240; y++) pc.px(x, y, { a: '#1a2130', d: 0.96, id: 2 });
    if ((x * 37) % 23 === 0) pc.px(x, hy + 4 + (x % 5), { a: '#1a2130', d: 0.96, id: 2, e: '#ffcc80', ei: 2.4 });
  }
  // the canopy: roof underside, girders, a row of lamps, the clock and the departure board
  lay(0.5);
  pc.rect(-20, 0, AW + 40, 96, { a: P.canopy, d: 0.48, id: 3, n: [0, -0.7] });
  for (let x = -20; x < AW + 40; x += 30) pc.rect(x, 0, 3, 96, { a: P.girder, d: 0.47, id: 4 });
  pc.rect(-20, 92, AW + 40, 6, { a: P.canopyL, d: 0.47, id: 4, n: [0, -0.4] });
  for (let x = 4; x < AW + 20; x += 56) {
    pc.rect(x, 98, 1, 10, { a: P.girder, d: 0.46, id: 5 });
    pc.rect(x - 7, 108, 15, 3, { a: P.girder, d: 0.46, id: 5 });
    pc.rect(x - 6, 111, 13, 2, { a: P.lamp, d: 0.46, id: 5, e: P.lamp, ei: 5 });
  }
  // departure board: amber dot-matrix
  pc.rect(150, 120, 92, 26, { a: P.board, d: 0.45, id: 6 });
  const msg = [0b11101110, 0b10101010, 0b11101110];
  for (let k = 0; k < 40; k++) for (let r = 0; r < 3; r++) if ((msg[r]! >> (k % 8)) & 1 && (k % 9) < 7) pc.px(154 + k * 2, 125 + r * 3, { a: P.board, d: 0.45, id: 6, e: P.amber, ei: 3 });
  for (let k = 0; k < 28; k++) if ((k * 13) % 7 < 4) pc.px(154 + k * 3, 138, { a: P.board, d: 0.45, id: 6, e: P.amber, ei: 2.4 });
  pc.line(196, 98, 196, 120, { a: P.girder, d: 0.46, id: 6 });
  // clock
  pc.disc(60, 140, 11, (x, y, dx, dy) => ({ a: dx * dx + dy * dy > 0.75 ? P.girder : '#ece6da', d: 0.45, id: 7, e: '#fff4dc', ei: dx * dx + dy * dy > 0.75 ? 0 : 0.6 }));
  pc.line(60, 140, 60, 132, { a: '#1a1a1f', d: 0.44, id: 7 });
  pc.line(60, 140, 65, 142, { a: '#1a1a1f', d: 0.44, id: 7 });
  pc.line(60, 98, 60, 129, { a: P.girder, d: 0.46, id: 7 });

  // the train: a regional double-length carriage alongside the platform
  lay(0.35);
  const top = 236, bot = 372;
  for (let y = top; y < bot; y++)
    for (let x = -20; x < AW + 20; x++) {
      const v = (y - top) / (bot - top);
      const stripe = y > top + 96 && y < top + 106;
      const roofL = y < top + 8;
      pc.px(x, y, { a: roofL ? P.roof : stripe ? (y < top + 98 ? P.stripeD : P.stripe) : v > 0.88 ? '#55524c' : P.body, d: 0.34, id: 10, n: [0, roofL ? 0.6 : 0] });
    }
  // windows (lit) and a door with its own lamp
  for (let x = -16; x < AW + 20; x += 34) {
    if (x > 110 && x < 160) continue;
    pc.rect(x, top + 26, 24, 40, { a: '#14161c', d: 0.34, id: 11 });
    pc.rect(x + 1, top + 27, 22, 38, { a: P.win, d: 0.34, id: 11, e: '#ffe0aa', ei: 1.0 });
    // seat backs and a passenger's head in some windows
    pc.rect(x + 1, top + 52, 22, 13, { a: '#2f3f6b', d: 0.335, id: 11 });
    if ((x / 34 + 3) % 3 === 0) pc.disc(x + 12, top + 50, 5, { a: '#22242c', d: 0.333, id: 11 });
  }
  pc.rect(114, top + 18, 42, bot - top - 22, { a: P.door, d: 0.335, id: 12 });
  pc.rect(116, top + 24, 18, 46, { a: P.win, d: 0.335, id: 12, e: '#ffe0aa', ei: 1.8 });
  pc.rect(136, top + 24, 18, 46, { a: P.win, d: 0.335, id: 12, e: '#ffe0aa', ei: 1.8 });
  pc.rect(134, top + 18, 2, bot - top - 22, { a: '#8a857a', d: 0.33, id: 12 });
  pc.rect(129, top + 10, 12, 4, { a: '#3a3a40', d: 0.33, id: 12, e: '#7dff9a', ei: 3 * (Math.sin(t * 4) > 0 ? 1 : 0.3) });
  // under the train: the dark track bed
  pc.rect(-20, bot, AW + 40, 8, { a: '#1a1a1f', d: 0.33, id: 13 });

  // the platform: paving in perspective, the yellow line, snow at the edge
  lay(0.25);
  let gy = bot + 6, row = 0;
  while (gy < 490) {
    const u = (gy - bot) / 108, rh = Math.max(2, Math.round(2 + u * 6));
    for (let yy = gy; yy < gy + rh; yy++)
      for (let x = -20; x < AW + 20; x++) {
        const edge = row < 2;
        const joint = yy === gy || (x + (row % 2) * 9 + 400) % Math.round(10 + u * 14) === 0;
        const sn = Math.sin(x * 12.9898 + row * 78.233) * 43758.5453, rnd = sn - Math.floor(sn);
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
