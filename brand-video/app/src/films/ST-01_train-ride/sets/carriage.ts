// Set 2: the train carriage at night, looking at the window. Inside: warm lamps, seat backs, the
// phone propped against the window, filming. Outside, in the same pixel grid: the world
// scrolling past in parallax layers. `scroll` is the train's travel in art px; the town is at the
// start of the line and the farmland after it, so as the train runs the city falls away.
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';
import { ramp, plaster, metal, wood, fabric, vnoise, dither } from '../../../kit/materials';

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
  /** point of view through the window (the hero shot) */
  pov?: boolean;
}

const WIN = { x0: 20, x1: 250, y0: 112, y1: 300 };
/** The hero shot: a point of view through the window (the window fills the frame). */
const WIN_POV = { x0: 8, x1: 262, y0: 26, y1: 392 };
let win = WIN;
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
  const { x0, x1, y0, y1 } = win;
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
        // facade: floor lines, a lit roof edge, concrete speckle, a dark joint between blocks
        const fy = (y - (hor - h)) % 8, roofEdge = y === hor - h;
        const conc = ramp(col, 0.6);
        const a = bx === 0 ? '#14171e' : roofEdge ? conc[4]! : fy === 7 ? conc[1]! : conc[dither(2 + (vnoise(wx * 0.3, y * 0.3, b) - 0.5) * 1.4, Math.floor(wx), y)]!;
        put(x, y, { a, d: 0.8, id: 20 + (b % 50), e: lit ? P.warm : undefined, ei: lit ? 2.2 : 0 });
      }
    } else {
      const hh = Math.round(2 + 4 * vnoise(wx * 0.18, 0, 8) + (hashI(Math.floor(wx / 9)) < 0.25 ? 6 + 4 * Math.sin(wx * 0.9) : 0));
      const HG = ['#121b1a', '#1a2624', '#24332f', '#9fb0cc'];
      for (let y = hor - hh; y < hor + 3; y++) {
        const k = y === hor - hh ? 3 : dither(1 + (vnoise(wx * 0.4, y * 0.5, 4) - 0.5) * 2.2, Math.floor(wx), y);
        put(x, y, { a: HG[Math.max(0, Math.min(3, k))]!, d: 0.8, id: 21, n: [0, y === hor - hh ? 0.8 : 0.2] });
      }
      const fh = Math.floor(wx / 140);
      const fx = wx - fh * 140;
      if (hashI(fh + 9) < 0.6 && fx > 60 && fx < 76) {
        for (let y = hor - 14; y < hor; y++) put(x, y, { a: Math.floor(fx) % 3 === 0 ? '#3a2f29' : y === hor - 14 ? '#6a5546' : (y + Math.floor(fx)) % 4 === 0 ? '#5a4a3f' : P.farm, d: 0.79, id: 22 });   // board walls
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
        const tile = (Math.floor(wx / 12) + y) % 2, sn = hashI(Math.floor(wx / 3) * 13 + y) < 0.06;
        const tactile = y > hor + 20 && y < hor + 25 && Math.floor(wx) % 2 === 0 && y % 2 === 0;
        if (tactile) { put(x, y, { a: '#c9a840', d: 0.5 - u * 0.2, n: [0, 0.9], id: 30 }); continue; }
        put(x, y, { a: edge ? (y === hor + 19 ? '#f0d070' : P.yellow) : sn ? P.snowD : tile ? P.plat : (Math.floor(wx) % 12 === 0 ? '#3a3d44' : P.platL), d: 0.5 - u * 0.2, n: [0, 0.9], id: 30 });
        continue;
      }
      const furrow = Math.sin((y - hor) * (0.9 - u * 0.45) * 2.1) > 0.6 && hashI(Math.floor(wx / 37) + y * 3) > 0.25;
      const drift = Math.sin(wx * 0.013 + y * 0.05) * 0.5 + 0.5;
      const far = u < 0.18;
      put(x, y, { a: far ? P.field : furrow ? P.snowD : drift > 0.7 ? P.snow : u > 0.5 && hashI(Math.floor(wx) * 7 + y) < 0.04 ? P.field : '#b8c5da', d: 0.75 - u * 0.4, n: [0, furrow ? 0.6 : 0.9], id: 23 });
    }
  }
  // the farmland, not at the station: stubble rows, a nearer hedge line with gaps, hay bales under snow,
  // telegraph poles and their wires at mid distance (each layer at its own speed)
  if (st < 0.5) {
    const field2 = o.scroll * 0.9, hy2 = hor + Math.round((y1 - hor) * 0.22);
    for (let x = x0; x < x1; x++) {
      const wx = x + field2;
      if (hashI(Math.floor(wx / 30)) < 0.7) for (let y = hy2 - 3 - Math.round(1.5 * Math.sin(wx * 0.5)); y < hy2; y++) put(x, y, { a: y === hy2 - 3 ? '#9fb0cc' : y === hy2 - 2 ? '#2c3c37' : (x + y) % 3 ? '#1a2624' : '#24332f', d: 0.62, id: 78 });
      const bale = Math.floor(wx / 46), bx = wx - bale * 46;
      if (hashI(bale + 40) < 0.45 && bx > 10 && bx < 19) {
        const r = Math.abs(bx - 14.5) / 4.5, h = Math.round(4 * Math.sqrt(Math.max(0, 1 - r * r)));
        for (let y = hy2 + 4 - h; y <= hy2 + 4; y++) put(x, y, { a: y === hy2 + 4 - h ? '#eef3fa' : bx > 15 ? '#8fa0bd' : '#b8c5da', d: 0.6, id: 79, n: [(bx - 14.5) / 5, 0.6] });
      }
    }
    const tel = o.scroll * 1.15;
    for (let k = Math.floor(tel / 64) - 1; k <= Math.floor((tel + 270) / 64) + 1; k++) {
      const tx = Math.round(k * 64 - tel + x0);
      for (let y = hor - 26; y < hy2 + 2; y++) put(tx, y, { a: y === hor - 26 ? '#dfe7f2' : y % 5 === 0 ? '#5a4636' : y % 5 === 2 ? '#241d19' : '#2e2621', d: 0.58, id: 80 });
      for (let dx = -3; dx <= 3; dx++) put(tx + dx, hor - 24, { a: Math.abs(dx) === 3 ? '#9aa0aa' : '#3a2f29', d: 0.58, id: 80 });   // crossarm with insulators
    }
    for (let x = x0; x < x1; x++) { const wx = x + tel; put(x, hor - 22 + Math.round(2 * Math.sin(((wx % 64) / 64) * Math.PI)), { a: '#1a1c22', d: 0.585, id: 80 }); }
    // stubble rows in the snow: dark specks along the furrows
    for (let y = hy2 + 6; y < y1; y += 3) for (let x = x0; x < x1; x++) { const wx = x + o.scroll * (0.5 + ((y - hor) / (y1 - hor)) * 0.9); if (hashI(Math.floor(wx) * 3 + y * 7) < 0.08) put(x, y, { a: '#6f7c96', d: 0.6 - (y - hor) * 0.001, id: 23 }); }
  }
  // a field fence rushing past in the near field (speed you can read), not at the station
  if (st < 0.5) {
    const fence = o.scroll * 1.7, fy = Math.round(hor + (y1 - hor) * 0.55);
    for (let x = x0; x < x1; x++) { put(x, fy, { a: '#3a2f29', d: 0.42, id: 76 }); put(x, fy + 4, { a: '#2e2621', d: 0.42, id: 76 }); }
    for (let k = Math.floor(fence / 24) - 1; k <= Math.floor((fence + 270) / 24) + 1; k++) {
      const fx = Math.round(k * 24 - fence + x0);
      for (let y = fy - 4; y < fy + 12; y++) for (let dx = 0; dx < 2; dx++) put(fx + dx, y, { a: y === fy - 4 ? '#dfe7f2' : dx ? '#3a2f29' : '#5a4636', d: 0.41, id: 76 });
    }
  }
  // the catenary masts flicking past (nearest, fastest)
  const pole = o.scroll * 2.2, gap = o.pov ? 110 : 150;
  for (let k = Math.floor(pole / gap) - 1; k <= Math.floor((pole + 260) / gap) + 1; k++) {
    const px = Math.round(k * gap - pole + x0);
    for (let y = y0; y < y1; y++) for (let dx = 0; dx < 3; dx++) put(px + dx, y, { a: dx === 0 ? '#4a4e58' : dx === 2 ? '#1a1c22' : (y % 9 === 0 ? '#3a3d46' : P.pole), d: 0.3, id: 40, n: [dx < 1 ? -0.6 : 0.4, 0] });
    for (let dx = -40; dx < 6; dx++) put(px + dx, y0 + 16, { a: P.pole, d: 0.3, id: 40 });
  }
  // station furniture (frame 5): canopy columns with the canopy band, benches, name signs
  if (st > 0.5) {
    const mid = o.scroll * 0.8;
    for (let y = hor - 34; y < hor - 30; y++) for (let x = x0; x < x1; x++) put(x, y, { a: y === hor - 34 ? '#4a505e' : y === hor - 31 ? '#15171c' : (Math.floor(x + mid) % 12 === 0 ? '#5a5f6a' : '#22262f'), d: 0.56, id: 72 });
    for (let k = Math.floor(mid / 70) - 1; k <= Math.floor((mid + 260) / 70) + 1; k++) {
      const cxp = Math.round(k * 70 + 35 - mid + x0);
      for (let y = hor - 30; y < hor + 19; y++) for (let dx = 0; dx < 3; dx++) put(cxp + dx, y, { a: dx === 0 ? '#5a5f6a' : dx === 2 ? '#1a1c22' : (y % 7 === 0 ? '#4a4d56' : '#3a3d46'), d: 0.55, id: 73 });
      if (k % 2 === 0) for (let dx = -8; dx < 9; dx++) for (let dy = 0; dy < 3; dy++) put(cxp + 10 + dx, hor + 12 + dy, { a: dy === 0 ? '#6b4a32' : '#3a2a20', d: 0.54, id: 74 });   // bench
      if (k % 3 === 0) for (let dx = -10; dx < 11; dx++) for (let dy = 0; dy < 6; dy++) put(cxp + dx, hor - 26 + dy, { a: dy === 0 || dy === 5 || Math.abs(dx) === 10 ? '#1c2a4a' : (dy === 2 || dy === 3) && Math.abs(dx) < 7 && dx % 3 !== 0 ? '#e8e2d6' : '#2a3e6a', d: 0.545, id: 75 });   // station name sign (blank glyphs)
    }
  }
  // station lamps (frame 5)
  if (st > 0.5) {
    const lamps = o.scroll * 0.8;
    for (let k = Math.floor(lamps / 70) - 1; k <= Math.floor((lamps + 260) / 70) + 1; k++) {
      const lx = Math.round(k * 70 - lamps + x0);
      for (let y = hor - 30; y < hor + 19; y++) put(lx, y, { a: P.pole, d: 0.55, id: 77 });
      for (let dx = -3; dx <= 3; dx++) put(lx + dx, hor - 31, { a: P.lamp, d: 0.55, id: 77, e: '#ffe7b0', ei: 5 });
    }
  }
}

export function paintCarriage(pc: PixelCanvas, o: CarriageOpts) {
  pc.clear();
  pc.names = { 78: 'hedge row', 79: 'hay bales', 80: 'telegraph poles', 72: 'canopy band', 73: 'canopy column', 74: 'bench', 75: 'station sign', 76: 'fence', 77: 'platform lamps', 9: 'heater grille', 1: 'carriage wall', 2: 'window frame', 3: 'ceiling', 4: 'lamp strip', 5: 'luggage rack', 6: 'bag', 7: 'table', 8: 'cup', 50: 'seat R', 51: 'headrest R', 52: 'seat L', 53: 'headrest L', 63: 'phone', 64: 'phone screen', 23: 'snow field', 21: 'hedges', 22: 'farmhouse', 30: 'platform', 40: 'catenary' };
  for (let k = 20; k < 70; k++) if (!pc.names[k] || pc.names[k] === '') pc.names[k] = k >= 20 && k <= 21 ? pc.names[k] ?? 'city block' : 'city block';
  pc.names[21] = 'hedges'; pc.names[22] = 'farmhouse'; pc.names[23] = 'snow field'; pc.names[30] = 'platform'; pc.names[40] = 'catenary';
  win = o.pov ? WIN_POV : WIN;
  outside(pc, o);
  const { x0, x1, y0, y1 } = win;
  const D = 0.2;
  // the wall around the window (everything outside the window rect), with panels
  for (let y = 0; y < 480; y++)
    for (let x = 0; x < AW; x++) {
      const inW = x >= x0 && x < x1 && y >= y0 && y < y1;
      const rx = Math.min(x - x0, x1 - 1 - x), ry = Math.min(y - y0, y1 - 1 - y);
      const corner = inW && rx < 8 && ry < 8 && (8 - rx) ** 2 + (8 - ry) ** 2 > 64;
      if (inW && !corner) continue;
      const seam = y % 64 === 0 || x % 90 === 0, lip = y % 64 === 1 || x % 90 === 1;
      pc.px(x, y, seam ? { a: P.wallD, d: D, id: 1 } : lip ? { a: '#837766', d: D, id: 1 } : plaster(ramp(y < 60 ? P.wallL : P.wall, 0.5), { d: D, id: 1, seed: 7 })(x, y));
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
  
  if (!o.pov) {
  // ceiling: lamp strip and the luggage rack
  // ceiling panels with air vents
  pc.rect(0, 0, AW, 22, (x, y) => {
    const vent = y > 6 && y < 14 && x % 60 > 20 && x % 60 < 40 && y % 2 === 0;
    return vent ? { a: '#1f1b17', d: D + 0.02, id: 3 } : metal(ramp('#3d362f', 0.6), { d: D + 0.02, id: 3, pw: 60, ph: 22, rivets: false, seed: 9 })(x, y);
  });
  // the lamp strip: a diffuser in segments
  pc.rect(9, 25, AW - 18, 6, (x, y) => ({ a: y === 25 || y === 30 ? '#8d929c' : '#5f636c', d: D + 0.001, id: 4 }));
  pc.rect(10, 26, AW - 20, 4, (x, y) => ({ a: P.lamp, d: D, id: 4, e: P.lamp, ei: x % 30 === 0 ? 1.2 : 3.5 - (y - 26) * 0.4 }));
  // the luggage rack: round bars (lit top, dark underside), brackets
  for (let x = 0; x < AW; x++) { pc.px(x, 70, { a: x % 3 ? P.metal : '#b8bcc4', d: D - 0.02, id: 5, n: [0, 0.6] }); pc.px(x, 71, { a: P.metalD, d: D - 0.02, id: 5 }); }
  pc.rect(0, 74, AW, 2, (x, y) => ({ a: y === 74 ? '#b8bcc4' : '#40444c', d: D - 0.02, id: 5, n: [0, y === 74 ? 0.6 : -0.4] }));
  for (let x = 6; x < AW; x += 40) pc.rect(x, 70, 2, 14, (xx) => ({ a: xx === x ? '#8d929c' : '#3a3d46', d: D - 0.02, id: 5 }));
  // a bag on the rack
  // a leather bag on the rack: stitched seams, a zip, the handle, soft shading
  const BG = ramp('#6b3b2e', 0.8);
  pc.rect(170, 52, 40, 18, (x, y) => {
    const seam = (x === 172 || x === 207) && y % 2 === 0, zip = y === 54 && x > 174 && x < 206;
    const v = 2 + (vnoise(x * 0.15, y * 0.15, 6) - 0.5) * 1.2 - (y - 52) * 0.05 - (x > 203 ? 0.8 : 0);
    return { a: zip ? '#b8893f' : seam ? BG[3]! : BG[Math.max(0, Math.min(4, dither(v, x, y)))]!, d: D - 0.03, id: 6, n: [(x - 190) / 25, 0.3] };
  });
  for (let x = 178; x < 202; x++) pc.px(x, 49 + Math.round(2 * Math.abs((x - 190) / 12) ** 2), { a: BG[1]!, d: D - 0.031, id: 6 });
  }
  // table under the window with a paper cup
  pc.rect(x0 - 6, y1 + 10, 150, 6, (x, y) => (y === y1 + 10 ? { a: '#6a5a46', d: D - 0.04, id: 7, n: [0, 0.9] } : wood(ramp(P.table, 0.8), { d: D - 0.04, id: 7, pw: 3, seed: 4, n: [0, 0.9] })(x, y)));
  pc.rect(x0 - 6, y1 + 16, 150, 2, { a: '#241e19', d: D - 0.04, id: 7 });
  // the heater grille under the table
  pc.rect(x0, y1 + 24, 120, 10, (x, y) => ({ a: y === y1 + 24 ? '#7a705f' : (x - x0) % 30 === 0 ? '#2a251f' : (y - y1) % 2 ? '#3a342c' : '#5a5246', d: D - 0.01, id: 9 }));
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
        const pat = (x + y) % 8 === 0 || (x - y + 800) % 8 === 0 || ((x + y) % 2 === 0 && vnoise(x * 0.2, y * 0.2, 3) > 0.7);
        pc.px(x, y, { a: r < 2 ? P.seatD : pat ? P.pat : (x + 2 * y) % 5 === 0 ? P.seatL : P.seat, d: 0.08, id, n: [x - sx < 4 ? -0.6 : sx + w - 1 - x < 4 ? 0.6 : 0, y - top < 4 ? 0.6 : 0] });
      }
    // headrest cover: woven cotton, a centre seam, darker where it folds over the top
    pc.rect(sx + 8, top + 3, w - 16, 16, (x, y) => (x === sx + Math.floor(w / 2) ? { a: '#b8b0a2', d: 0.07, id: id + 1 } : y === top + 3 ? { a: '#a8a092', d: 0.07, id: id + 1, n: [0, 0.6] } : fabric(ramp(P.head, 0.35), { d: 0.07, id: id + 1, seed: id, n: [0, 0.3] })(x, y)));
  };
  if (!o.pov) { seat(150, 110, 50); seat(-30, 100, 52); }
  // the carriage reflected in the glass: the lamp strip and the headrest tops, faint
  for (let x = x0 + 6; x < x1 - 6; x++) {
    if (o.pov && x % 3 !== 0) pc.glow(x, y0 + 14, '#fff1d0', 0.3);
    const hr = (x - x0) % 70;
    if (hr > 12 && hr < 40) pc.glow(x, y1 - 26 + (hr === 13 || hr === 39 ? 1 : 0), '#d8d2c4', 0.12);
  }
  // the phone, propped on the table against the window, filming the view: its screen shows the same
  // world racing past (no people: the stream is the character)
  const ph = o.phone ?? 1;
  if (ph > 0) {
    const pw = 30, phh = 52, px0 = 52, py0 = y1 + 10 - phh + Math.round((1 - ph) * 60);
    const blk: Mat = { a: P.phone, d: 0.1, id: 63 };
    const rimC = (x: number, y: number) => (x === 0 || y === 0 ? '#3a3d46' : x === pw - 1 || y === phh - 1 ? '#0b0c10' : x === 1 || y === 1 ? '#24262d' : P.phone);
    for (let y = 0; y < phh; y++) for (let x = 0; x < pw; x++) {
      const corner = (x < 2 || x > pw - 3) && (y < 2 || y > phh - 3) && !(x === 1 && y === 1) && !(x === pw - 2 && y === 1) && !(x === 1 && y === phh - 2) && !(x === pw - 2 && y === phh - 2);
      if (!corner) pc.px(px0 + x, py0 + y, { ...blk, a: rimC(x, y) });
    }
    pc.screen(px0 + 40, y0 + 30, 100, y1 - y0 - 34, px0 + 2, py0 + 4, pw - 4, phh - 8, { ei: 1.2, d: 0.095, id: 64 });
    pc.px(px0 + 4, py0 + 6, { a: '#b0343a', d: 0.09, id: 65, e: '#ff3b3b', ei: 7 });
    pc.px(px0 + 5, py0 + 6, { a: '#b0343a', d: 0.09, id: 65, e: '#ff3b3b', ei: 7 });
    // a little stand behind it
    pc.rect(px0 + 8, py0 + phh - 2, 14, 2, { a: P.metalD, d: 0.105, id: 66 });
  }
  // reflection of the lamp strip on the glass (wide shots)
  if (!o.pov) for (let x = x0 + 10; x < x1 - 10; x++) if (x % 3 !== 0) pc.glow(x, y0 + 9, '#fff1d0', 0.35);
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
