// Set 2: the train carriage at night, looking at the window. Inside: warm lamps, seat backs, the
// phone propped against the window, filming. Outside, in the same pixel grid: the world
// scrolling past in parallax layers. `scroll` is the train's travel in art px; the town is at the
// start of the line and the farmland after it, so as the train runs the city falls away.
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';

export interface CarriageOpts {
  t: number;
  /** travel (art px of the nearest layer) */
  scroll: number;
  /** where the town ends on the line (art px of travel) */
  cityEnd?: number;
  /** the phone in the streamer's hand (0 = lowered) */
  phone?: number;
  /** station platform outside (frame 5): 1 = at the platform */
  station?: number;
}

const WIN = { x0: 20, x1: 250, y0: 112, y1: 300 };
export const CARRIAGE_WIN = WIN;
const P = {
  wall: '#5d5348', wallD: '#4a4239', wallL: '#6f6455', frame: '#2b2b30', frameL: '#44444c', rubber: '#16161a',
  seat: '#2f3f6b', seatD: '#243155', seatL: '#3d5088', pat: '#8a3a3a', head: '#d8d2c4', metal: '#8d929c', metalD: '#5f636c',
  lamp: '#fff1d0', table: '#3a3129', cup: '#e9e2d4',
  hood: '#4a5672', hoodS: '#323b52', hand: '#c79a7c', phone: '#121216',
  snow: '#cdd8ea', snowD: '#9fb0cc', field: '#7f8fa8', hedge: '#1e2a2a', tree: '#18211f', pole: '#2c2f36', farm: '#4d3f37',
  bld: ['#2e3444', '#3a3346', '#2c3a40', '#40362f'], warm: '#ffc46b', plat: '#55585f', platL: '#6a6e76', yellow: '#d9b64a',
};

const hashI = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** The outside world at travel `s` (window column x maps to line position s*k + x). */
function outside(pc: PixelCanvas, o: CarriageOpts) {
  const { x0, x1, y0, y1 } = WIN;
  const hor = 222;
  const cityEnd = o.cityEnd ?? 400;
  const inWin = (x: number, y: number) => x >= x0 && x < x1 && y >= y0 && y < y1;
  const put = (x: number, y: number, m: Mat) => { if (inWin(x, y)) pc.px(x, y, m); };
  const st = o.station ?? 0;

  // far: distant hills, and the town's lights on them while we are still near it
  const far = o.scroll * 0.12;
  for (let x = x0; x < x1; x++) {
    const wx = x + far;
    const hy = hor - 8 - Math.round(6 * Math.sin(wx * 0.021) + 4 * Math.sin(wx * 0.057));
    for (let y = hy; y < hor + 2; y++) put(x, y, { a: '#1a2130', d: 0.97, id: 2 });
    // the town falling behind: lit windows on the far hill, thinning out with distance
    const town = Math.max(0, 1 - Math.max(0, (o.scroll - cityEnd * 0.7)) / 900);
    if (town > 0 && hashI(Math.floor(wx)) < 0.18 * town) put(x, hy + 2 + Math.floor(hashI(Math.floor(wx) + 3) * 6), { a: '#1a2130', d: 0.97, id: 2, e: '#ffcc80', ei: 2.5 * town });
  }
  // mid: the city blocks first, then hedgerows, trees and a farmhouse now and then
  const mid = o.scroll * 0.4;
  for (let x = x0; x < x1; x++) {
    const wx = x + mid;
    const line = wx / 0.4; // where on the line this column is
    if (line < cityEnd + 60 && st < 0.5) {
      const b = Math.floor(wx / 22), bx = wx - b * 22;
      const h = 30 + Math.floor(hashI(b) * 45), col = P.bld[b % 4]!;
      for (let y = hor - h; y < hor + 6; y++) {
        const win = bx > 3 && bx < 19 && (bx % 5) < 3 && ((y - (hor - h)) % 8) > 2 && ((y - (hor - h)) % 8) < 6 && y < hor - 3;
        const lit = win && hashI(b * 31 + Math.floor(bx / 5) * 7 + Math.floor((y - (hor - h)) / 8)) < 0.5;
        put(x, y, { a: bx === 0 ? '#20242e' : col, d: 0.8, id: 20 + (b % 50), e: lit ? P.warm : undefined, ei: lit ? 2.2 : 0 });
      }
    } else {
      const hh = Math.round(3 + 2 * Math.sin(wx * 0.3) + (hashI(Math.floor(wx / 9)) < 0.25 ? 6 + 4 * Math.sin(wx * 0.9) : 0));
      for (let y = hor - hh; y < hor + 3; y++) put(x, y, { a: P.hedge, d: 0.8, id: 21 });
      const fh = Math.floor(wx / 140);
      const fx = wx - fh * 140;
      if (hashI(fh + 9) < 0.6 && fx > 60 && fx < 76) {
        for (let y = hor - 14; y < hor; y++) put(x, y, { a: P.farm, d: 0.79, id: 22 });
        if (fx > 63 && fx < 67) for (let y = hor - 10; y < hor - 6; y++) put(x, y, { a: P.farm, d: 0.79, id: 22, e: P.warm, ei: 2.4 });
        const roof = hor - 14 - Math.round(7 - Math.abs(fx - 68) * 0.9);
        for (let y = roof; y < hor - 14; y++) put(x, y, { a: P.snow, d: 0.79, id: 22, n: [0, 0.8] });
      }
    }
  }
  // near: snowy field rows, or the platform at a station
  const near = o.scroll;
  for (let y = hor + 2; y < y1; y++) {
    const u = (y - hor) / (y1 - hor);
    for (let x = x0; x < x1; x++) {
      const wx = x + near * (0.5 + u * 0.9);
      if (st > 0.5 && y > hor + 18) {
        const edge = y === hor + 19 || y === hor + 20;
        put(x, y, { a: edge ? P.yellow : (Math.floor(wx / 12) + y) % 2 ? P.plat : P.platL, d: 0.5 - u * 0.2, n: [0, 0.9], id: 30 });
        continue;
      }
      const furrow = Math.sin((y - hor) * (0.9 - u * 0.45) * 2.1) > 0.6 && hashI(Math.floor(wx / 37) + y * 3) > 0.25;
      const drift = Math.sin(wx * 0.013 + y * 0.05) * 0.5 + 0.5;
      const far = u < 0.18;
      put(x, y, { a: far ? P.field : furrow ? P.snowD : drift > 0.7 ? P.snow : u > 0.5 && hashI(Math.floor(wx) * 7 + y) < 0.04 ? P.field : '#b8c5da', d: 0.75 - u * 0.4, n: [0, furrow ? 0.6 : 0.9], id: 23 });
    }
  }
  // the catenary masts flicking past (nearest, fastest)
  const pole = o.scroll * 2.2;
  for (let k = Math.floor(pole / 150) - 1; k <= Math.floor((pole + 260) / 150) + 1; k++) {
    const px = Math.round(k * 150 - pole + x0);
    for (let y = y0; y < y1; y++) for (let dx = 0; dx < 3; dx++) put(px + dx, y, { a: P.pole, d: 0.3, id: 40, n: [dx < 1 ? -0.6 : 0.4, 0] });
    for (let dx = -40; dx < 6; dx++) put(px + dx, y0 + 16, { a: P.pole, d: 0.3, id: 40 });
  }
  // station lamps (frame 5)
  if (st > 0.5) {
    const lamps = o.scroll * 0.8;
    for (let k = Math.floor(lamps / 70) - 1; k <= Math.floor((lamps + 260) / 70) + 1; k++) {
      const lx = Math.round(k * 70 - lamps + x0);
      for (let y = hor - 30; y < hor + 19; y++) put(lx, y, { a: P.pole, d: 0.55, id: 41 });
      for (let dx = -3; dx <= 3; dx++) put(lx + dx, hor - 31, { a: P.lamp, d: 0.55, id: 41, e: '#ffe7b0', ei: 5 });
    }
  }
}

export function paintCarriage(pc: PixelCanvas, o: CarriageOpts) {
  pc.clear();
  outside(pc, o);
  const { x0, x1, y0, y1 } = WIN;
  const D = 0.2;
  // the wall around the window (everything outside the window rect), with panels
  for (let y = 0; y < 480; y++)
    for (let x = 0; x < AW; x++) {
      const inW = x >= x0 && x < x1 && y >= y0 && y < y1;
      const rx = Math.min(x - x0, x1 - 1 - x), ry = Math.min(y - y0, y1 - 1 - y);
      const corner = inW && rx < 8 && ry < 8 && (8 - rx) ** 2 + (8 - ry) ** 2 > 64;
      if (inW && !corner) continue;
      const seam = y % 64 === 0 || x % 90 === 0;
      pc.px(x, y, { a: seam ? P.wallD : y < 60 ? P.wallL : P.wall, d: D, id: 1 });
    }
  // the window frame: rubber seal + aluminium, rounded corners
  for (let y = y0 - 4; y < y1 + 4; y++)
    for (let x = x0 - 4; x < x1 + 4; x++) {
      const ox = Math.max(x0 - x, x - (x1 - 1), 0), oy = Math.max(y0 - y, y - (y1 - 1), 0);
      const inside = x >= x0 && x < x1 && y >= y0 && y < y1;
      const rx = Math.min(x - x0, x1 - 1 - x), ry = Math.min(y - y0, y1 - 1 - y);
      const corner = inside && rx < 8 && ry < 8 && (8 - rx) ** 2 + (8 - ry) ** 2 > 64;
      const nearCorner = inside && rx < 9 && ry < 9 && (8 - rx) ** 2 + (8 - ry) ** 2 > 49 && !corner;
      if (corner || (!inside && ox + oy > 0 && ox < 5 && oy < 5)) pc.px(x, y, { a: ox + oy > 2 ? P.frameL : P.frame, d: D - 0.01, id: 2, n: [x < x0 ? -0.5 : x >= x1 ? 0.5 : 0, y < y0 ? 0.5 : y >= y1 ? -0.5 : 0] });
      else if (nearCorner) pc.px(x, y, { a: P.rubber, d: D - 0.01, id: 2 });
    }
  
  // ceiling: lamp strip and the luggage rack
  pc.rect(0, 0, AW, 22, { a: '#3d362f', d: D + 0.02, id: 3 });
  pc.rect(10, 26, AW - 20, 4, { a: P.lamp, d: D, id: 4, e: P.lamp, ei: 3.5 });
  for (let x = 0; x < AW; x += 3) pc.px(x, 70, { a: P.metal, d: D - 0.02, id: 5 });
  pc.rect(0, 74, AW, 2, { a: P.metalD, d: D - 0.02, id: 5 });
  for (let x = 6; x < AW; x += 40) pc.rect(x, 70, 2, 14, { a: P.metalD, d: D - 0.02, id: 5 });
  // a bag on the rack
  pc.rect(170, 52, 40, 18, { a: '#6b3b2e', d: D - 0.03, id: 6, n: [0, 0.3] });
  pc.rect(176, 48, 28, 4, { a: '#4d2a21', d: D - 0.03, id: 6 });
  // table under the window with a paper cup
  pc.rect(x0 - 6, y1 + 10, 150, 6, { a: P.table, d: D - 0.04, id: 7, n: [0, 0.9] });
  pc.rect(x0 - 6, y1 + 16, 150, 2, { a: '#241e19', d: D - 0.04, id: 7 });
  pc.rect(130, y1 + 1, 7, 9, { a: P.cup, d: D - 0.05, id: 8 });
  pc.rect(130, y1 + 4, 7, 2, { a: '#8a5a3a', d: D - 0.05, id: 8 });
  // seat backs in the foreground: moquette with a pattern, white headrest covers
  const seat = (sx: number, w: number, id: number) => {
    const top = 352;
    for (let y = top; y < 480; y++)
      for (let x = sx; x < sx + w; x++) {
        const r = Math.min(x - sx, sx + w - 1 - x, y - top);
        if (r < 0) continue;
        const cornerCut = y - top < 6 && Math.min(x - sx, sx + w - 1 - x) < 6 && (6 - Math.min(x - sx, sx + w - 1 - x)) ** 2 + (6 - (y - top)) ** 2 > 36;
        if (cornerCut) continue;
        const pat = (x + y) % 8 === 0 || (x - y + 800) % 8 === 0;
        pc.px(x, y, { a: r < 2 ? P.seatD : pat ? P.pat : (x + 2 * y) % 5 === 0 ? P.seatL : P.seat, d: 0.08, id, n: [x - sx < 4 ? -0.6 : sx + w - 1 - x < 4 ? 0.6 : 0, y - top < 4 ? 0.6 : 0] });
      }
    pc.rect(sx + 8, top + 3, w - 16, 16, { a: P.head, d: 0.07, id: id + 1, n: [0, 0.3] });
  };
  seat(150, 110, 50);
  seat(-30, 100, 52);
  // the phone, propped on the table against the window, filming the view: its screen shows the same
  // world racing past (no people: the stream is the character)
  const ph = o.phone ?? 1;
  if (ph > 0) {
    const pw = 30, phh = 52, px0 = 52, py0 = y1 + 10 - phh + Math.round((1 - ph) * 60);
    const blk: Mat = { a: P.phone, d: 0.1, id: 63 };
    for (let y = 0; y < phh; y++) for (let x = 0; x < pw; x++) {
      const corner = (x < 2 || x > pw - 3) && (y < 2 || y > phh - 3) && !(x === 1 && y === 1) && !(x === pw - 2 && y === 1) && !(x === 1 && y === phh - 2) && !(x === pw - 2 && y === phh - 2);
      if (!corner) pc.px(px0 + x, py0 + y, blk);
    }
    pc.screen(px0 + 40, y0 + 30, 100, y1 - y0 - 34, px0 + 2, py0 + 4, pw - 4, phh - 8, { ei: 1.2, d: 0.095, id: 64 });
    pc.px(px0 + 4, py0 + 6, { a: '#b0343a', d: 0.09, id: 65, e: '#ff3b3b', ei: 7 });
    pc.px(px0 + 5, py0 + 6, { a: '#b0343a', d: 0.09, id: 65, e: '#ff3b3b', ei: 7 });
    // a little stand behind it
    pc.rect(px0 + 8, py0 + phh - 2, 14, 2, { a: P.metalD, d: 0.105, id: 66 });
  }
  // reflections on the glass: the lamp strip and a soft bloom of the interior
  for (let x = x0 + 10; x < x1 - 10; x++) if (x % 3 !== 0) pc.glow(x, y0 + 9, '#fff1d0', 0.35);
}

export function carriageLights(o: CarriageOpts): Light[] {
  const L: Light[] = [];
  for (let x = 30; x < AW; x += 70) L.push({ x, y: 30, d: 0.18, col: '#ffe2b0', i: 1.4, r: 90 });
  // a warm reading light over the table
  L.push({ x: 40, y: 250, d: 0.02, col: '#ffcf96', i: 1.2, r: 80 });
  // the window: cool night light falling in
  L.push({ x: 140, y: 210, d: 0.32, col: '#8fa6d0', i: 1.6, r: 110 });
  if ((o.phone ?? 1) > 0) L.push({ x: 67, y: 290, d: 0.06, col: '#c8d8ff', i: 1.0, r: 24 });
  return L;
}
