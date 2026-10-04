// Set 2: the train carriage at night, looking at the window. Inside: warm lamps, seat backs, the
// phone propped against the window, filming. Outside, in the same pixel grid: the world
// scrolling past in parallax layers. `scroll` is the train's travel in art px; the town is at the
// start of the line and the farmland after it, so as the train runs the city falls away.
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';
import { ramp, plaster, metal, wood, fabric, slate, vnoise, dither } from '../../../kit/materials';

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
  /** point of view through the window (the hero shots) */
  pov?: boolean;
  /** which train shot: the wide carriage, the city POV, the fields POV (tight, frosty), the phone close-up */
  view?: 'wide' | 'city' | 'fields' | 'phone';
  /** signal bars on the phone's own screen (phone close-up) */
  bars?: number;
}

const WIN = { x0: 20, x1: 250, y0: 112, y1: 300 };
/** The hero shots: a point of view through the window (the window fills the frame), tighter for the fields. */
const WIN_POV = { x0: 8, x1: 262, y0: 26, y1: 392 };
const WIN_TIGHT = { x0: -8, x1: 278, y0: -8, y1: 404 };
let win = WIN;
export const CARRIAGE_WIN = WIN;
/** The phone in the close-up (art px): the scene draws its UI over the screen. */
export const PHONE_CU = { x: 66, y: 150, w: 138, h: 250 };
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
    const FH = ['#121823', '#1a2130', '#222b3c', '#3a4558', '#8b9ab4'];
    for (let y = hy; y < hor + 2; y++) put(x, y, { a: y === hy ? FH[4]! : y === hy + 1 ? FH[3]! : FH[Math.max(0, Math.min(2, dither(1 + (vnoise(wx * 0.15, y * 0.3, 21) - 0.5) * 2.2 - (y - hy) * 0.04 + (y - hy < 4 ? 0.6 : 0), Math.floor(wx), y)))]!, d: 0.97, id: 89 });   // snowy ridge line, forest below
    // the town falling behind: lit windows on the far hill, thinning out with distance
    const town = Math.max(0, 1 - Math.max(0, (o.scroll - cityEnd * 0.7)) / 900);
    if (town > 0 && hashI(Math.floor(wx)) < 0.18 * town) put(x, hy + 2 + Math.floor(hashI(Math.floor(wx) + 3) * 6), { a: '#1a2130', d: 0.97, id: 89, e: '#ffcc80', ei: 2.5 * town });
  }
  // mid: the city blocks first, then hedgerows, trees and a farmhouse now and then
  const mid = o.scroll * 0.4;
  for (let x = x0; x < x1; x++) {
    const wx = x + mid;
    const line = wx / 0.4; // where on the line this column is
    if (line < cityEnd + 60 && st < 0.5) {
      // a back row of towers first (slower, hazier), then the near blocks: varied widths, setbacks,
      // parapets, rooftop tanks and masts, irregular lit windows (warm, a few TV-blue), a street with lamps
      const bwx = x + o.scroll * 0.28, bb = Math.floor(bwx / 30), bbx = bwx - bb * 30, bh = 60 + Math.floor(hashI(bb + 300) * 50);
      if (bbx > 2) for (let y = hor - bh; y < hor - 20; y++) {
        const lit = bbx > 5 && bbx < 27 && Math.floor(bbx) % 3 === 0 && (y - (hor - bh)) % 6 === 3 && hashI(bb * 17 + Math.floor(bbx) * 3 + y) < 0.35;
        put(x, y, { a: y === hor - bh ? '#3c4458' : (Math.floor(bwx) + y) % 7 === 0 ? '#20242f' : '#1b1f29', d: 0.9, id: 85, e: lit ? '#ffd08a' : undefined, ei: lit ? 1.3 : 0 });
      }
      if (bbx > 13 && bbx < 15 && hashI(bb + 301) < 0.4) for (let y = hor - bh - 12; y < hor - bh; y++) put(x, y, { a: '#2a2f3a', d: 0.9, id: 85, e: y === hor - bh - 12 ? '#ff4a3a' : undefined, ei: y === hor - bh - 12 ? 2.5 * (0.5 + 0.5 * Math.sin(o.scroll * 0.05 + bb)) : 0 });
      const b = Math.floor(wx / 26), bx = wx - b * 26, bw = 18 + Math.floor(hashI(b + 7) * 8);
      if (bx >= bw) {
        // the gap between blocks: a lit street running away from the line
        const RD = ['#101318', '#181b22', '#24262d', '#34363e'];
        for (let y = hor - 6; y < hor + 6; y++) {
          const pool = Math.exp(-(((bx - bw - 4) / 3) ** 2)) * (y > hor - 2 ? 1 : 0.4);
          put(x, y, { a: RD[Math.max(0, Math.min(3, dither((y > hor - 2 ? 1.6 : 0.6) + pool * 1.6 + (vnoise(wx * 0.5, y * 0.5, 22) - 0.5) * 1.2, Math.floor(wx), y)))]!, d: 0.82, id: 86, e: y === hor + 1 ? '#ffb45a' : undefined, ei: y === hor + 1 ? 1.2 : 0 });
        }
        continue;
      }
      const h = 30 + Math.floor(hashI(b) * 48), col = P.bld[b % 4]!, top = hor - h;
      const setback = hashI(b + 11) < 0.45 ? 10 + Math.floor(hashI(b + 12) * 10) : 0, sb = bx < 3 || bx > bw - 4;
      const conc = ramp(col, 0.7);
      const fl = 6 + (b % 3);           // floor height per block
      for (let y = top; y < hor + 6; y++) {
        if (sb && y < top + setback) continue;
        const fy = (y - top) % fl, roofEdge = y === top || (sb && y === top + setback), parapet = y === top + 1 || (sb && y === top + setback + 1);
        const wcol = Math.floor((bx - 2) / 4), inWx = (bx - 2) - wcol * 4;
        const win = bx > 1 && bx < bw - 2 && inWx < 2 + (b % 2) && fy > 1 && fy < fl - 2 && y > top + 3 && y < hor - 4;
        const r = hashI(b * 31 + wcol * 7 + Math.floor((y - top) / fl) * 13);
        const lit = win && r < 0.48, tv = lit && r < 0.05;
        const a = roofEdge ? conc[4]! : parapet ? conc[0]! : win ? (lit ? '#3a2e22' : '#11141b') : fy === fl - 1 ? conc[1]! : bx < 1 ? conc[3]! : bx > bw - 2 ? conc[0]! : conc[dither(2 + (vnoise(wx * 0.3, y * 0.3, b) - 0.5) * 1.4, Math.floor(wx), y)]!;
        put(x, y, { a, d: 0.8, id: 81 + (b % 4), n: [bx < 1 ? -0.5 : bx > bw - 2 ? 0.5 : 0, roofEdge ? 0.8 : 0], e: lit ? (tv ? '#8fb4ff' : r < 0.2 ? '#ffd9a0' : P.warm) : undefined, ei: lit ? (tv ? 1.6 : 2.2) : 0 });
      }
      // rooftop: a water tank on legs or a mast with a red light
      const rt = hashI(b + 50);
      if (rt < 0.3 && bx > 5 && bx < 12) for (let y = top - 7; y < top; y++) put(x, y, { a: y > top - 3 ? ((Math.floor(bx) % 3) ? '#14171e' : '#2a2f3a') : y === top - 7 ? '#5a5f6a' : '#3a3d46', d: 0.8, id: 87 });
      if (rt > 0.75 && Math.floor(bx) === 9) for (let y = top - 14; y < top; y++) put(x, y, { a: '#2a2f3a', d: 0.8, id: 87, e: y === top - 14 ? '#ff4a3a' : undefined, ei: y === top - 14 ? 3 : 0 });
      // street level: a lamp in front of every second block
      if (b % 2 === 0 && Math.floor(bx) === 4) for (let y = hor - 10; y < hor + 6; y++) put(x, y, { a: '#1a1c22', d: 0.78, id: 88, e: y === hor - 10 ? '#ffc46b' : undefined, ei: y === hor - 10 ? 5 : 0 });
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
      if (st > 0.5) {
        // the station seen from the train: the building's wall at the back, the platform paving
        // coming toward us, and its edge (tactile strip, yellow line, coping) right below the window
        const bx = x + near * 0.55;
        if (y < hor + 16) {
          const bay = Math.floor(bx / 40), inB = bx - bay * 40;
          const door = inB > 14 && inB < 24 && y > hor + 3, win2 = (inB > 4 && inB < 11 || inB > 28 && inB < 35) && y > hor + 4 && y < hor + 11;
          const brick = (y + (Math.floor(bx / 4) % 2)) % 3 === 0 || Math.floor(bx) % 4 === 0;
          put(x, y, door ? { a: '#2a1d14', d: 0.56, id: 31, e: '#ffcf8a', ei: 1.4 * (1 - (y - hor) / 20) } : win2 ? { a: '#1b1e27', d: 0.56, id: 31, e: '#ffd59a', ei: 1.8 } : { a: brick ? '#4a3a32' : (Math.floor(bx * 0.5 + y) % 5 === 0 ? '#6a5446' : '#5a463b'), d: 0.56, id: 31, n: [0, 0] });
          continue;
        }
        const pu = (y - (hor + 16)) / (y1 - (hor + 16));
        const nearRow = y1 - y;
        if (nearRow <= 3) { put(x, y, { a: nearRow <= 1 ? '#1d1e23' : '#55575e', d: 0.36, id: 30, n: [0, nearRow <= 1 ? -0.4 : 0.6] }); continue; }
        if (nearRow <= 6) { put(x, y, { a: nearRow === 6 ? '#f0d070' : P.yellow, d: 0.37, id: 30, n: [0, 0.9] }); continue; }
        if (nearRow <= 11) { put(x, y, { a: (Math.floor(wx) + y) % 2 === 0 ? '#c9a840' : '#a88a30', d: 0.38, id: 30, n: [0, 0.9] }); continue; }
        const rowH = Math.max(2, Math.round(2 + pu * 7)), slabW = Math.round(8 + pu * 18);
        const ry = Math.floor((y - hor - 16) / rowH), slab = Math.floor((wx + (ry % 2) * slabW * 0.5) / slabW);
        const joint = (y - hor - 16) % rowH === 0 || Math.floor(wx + (ry % 2) * slabW * 0.5) % slabW === 0;
        const tone = hashI(slab * 7 + ry * 13);
        put(x, y, { a: joint ? '#3a3c44' : tone < 0.33 ? '#5a5d65' : tone < 0.66 ? '#64676f' : '#6e7179', d: 0.5 - pu * 0.12, n: [0, 0.9], id: 30 });
        continue;
      }
      const furrow = Math.sin((y - hor) * (0.9 - u * 0.45) * 2.1) > 0.6 && hashI(Math.floor(wx / 37) + y * 3) > 0.25;
      const drift = Math.sin(wx * 0.013 + y * 0.05) * 0.5 + 0.5;
      const far = u < 0.18;
      if (far) {
        // the far fields: soft drifts, a dark hedge line now and then, a few lit farm windows
        const fw = x + near * (0.5 + u * 0.9) * 0.6;
        const hedge = Math.abs(Math.sin(u * 40)) < 0.12 && hashI(Math.floor(fw / 25) + Math.floor(u * 12) * 5) < 0.6;
        const FF = ramp(P.field, 0.5);
        put(x, y, { a: hedge ? '#2a3534' : FF[Math.max(0, Math.min(4, dither(2 + (vnoise(fw * 0.06, y * 0.5, 41) - 0.5) * 1.8 + u * 4, Math.floor(fw), y)))]!, d: 0.75 - u * 0.4, n: [0, 0.9], id: 23 });
        continue;
      }
      // snow over furrows: long soft drifts with blue shadows on their lee side, furrow lines, no speckle
      const SN = ['#7f8fa8', '#9fb0cc', '#b8c5da', '#cdd8ea', '#e4ecf6'];
      const dr = vnoise(wx * 0.015, y * 0.12, 24), lee = vnoise((wx + 6) * 0.015, y * 0.12, 24) - dr;
      const v = 2.2 + (dr - 0.5) * 1.6 - lee * 18 + (drift - 0.5) * 0.5 + (furrow ? -0.9 : 0);
      put(x, y, { a: SN[Math.max(0, Math.min(4, dither(v, Math.floor(wx), y)))]!, d: 0.75 - u * 0.4, n: [0, furrow ? 0.6 : 0.9], id: 23 });
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
    for (let y = hy2 + 6; y < y1; y += 3) for (let x = x0; x < x1; x++) { const wx = x + o.scroll * (0.5 + ((y - hor) / (y1 - hor)) * 0.9); if (hashI(Math.floor(wx / 2) * 3 + y * 7) < 0.025) put(x, y, { a: '#8796b2', d: 0.6 - (y - hor) * 0.001, id: 23 }); }
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
  // through the city the line runs on a viaduct: snowy roofs, chimneys and lit windows right below the
  // track, streaking past at near speed, with lamp-lit streets between the houses (ends where the city ends)
  if (st < 0.5) {
    const RW = ramp('#6a5a4c', 0.6), WIN2 = ['#2a2018', '#ffcf8a'];
    // two rows: smaller roofs further off (slower), the big ones right under the line
    const row = (speed: number, base: number, vary: number, bw: number, wallH: number, d: number, seed: number) => {
      const rs = o.scroll * speed, sc = bw / 36;
      for (let x = x0; x < x1; x++) {
        const wx = x + rs, house = Math.floor(wx / bw) + seed, hx = wx - (house - seed) * bw, hw = Math.round((29 + Math.floor(hashI(house + 70) * 5)) * sc);
        if (o.scroll + ((house - seed) * bw - rs) * 2.5 > cityEnd + 60) continue;      // whole houses drop out where the city ends
        const ridge = base + Math.floor(hashI(house + 71) * vary);
        if (hx >= hw) {
          for (let y = ridge + 4; y < y1; y++) { const pool = Math.exp(-(((y - (ridge + wallH)) / 8) ** 2)); put(x, y, { a: pool > 0.4 ? '#3a3026' : (y + Math.floor(wx)) % 9 === 0 ? '#1e1b18' : '#16141a', d, id: 90, e: pool > 0.4 ? '#ffb45a' : undefined, ei: pool * 0.8 }); }
          continue;
        }
        const top = ridge + Math.round(Math.abs(hx - hw / 2) * 0.55), eave = ridge + Math.round(22 * sc);
        const roof = slate(ramp('#3d3a3f', 0.7), { d, id: 91, tw: 4, th: 3, snow: '#dfe7f2', snowK: 0.8, seed: house, n: [0, 0.8] });
        for (let y = top; y < y1; y++) {
          if (y < eave) { put(x, y, y === top ? { a: '#eef3fa', d, id: 91, n: [0, 0.9] } : roof(Math.floor(wx), y)); continue; }
          if (y === eave) { put(x, y, { a: '#1a1612', d, id: 92 }); continue; }
          const fl = Math.round(16 * sc), wy = (y - eave - 4) % fl, cw = Math.round(11 * sc), wxx = Math.floor(hx) % cw;
          const win = wy >= 0 && wy < Math.round(6 * sc) && wxx >= Math.round(4 * sc) && wxx < Math.round(7 * sc) && hx > 2 && hx < hw - 3;
          const lit = win && hashI(house * 13 + Math.floor(hx / cw) * 5 + Math.floor((y - eave) / fl)) < 0.35;
          put(x, y, win ? { a: WIN2[lit ? 1 : 0]!, d: d + 0.001, id: 92, e: lit ? '#ffcf8a' : undefined, ei: lit ? 1.6 : 0 } : plaster(RW, { d: d + 0.001, id: 92, seed: house })(Math.floor(wx), y));
        }
        if (hashI(house + 72) < 0.6 && hx > 6 * sc && hx < 6 * sc + Math.max(2, 4 * sc)) for (let y = ridge - Math.round(8 * sc); y < ridge + 3; y++) put(x, y, { a: y === ridge - Math.round(8 * sc) ? '#eef3fa' : hx < 7 * sc ? '#5a4a40' : '#3a2f29', d: d - 0.005, id: 93 });
      }
    };
    row(0.75, hor + 6, 8, 20, 14, 0.62, 500);
    row(1.3, hor + 40, 16, 36, 40, 0.46, 0);
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
      for (let y = hor - 30; y < hor + 26; y++) for (let dx = 0; dx < 3; dx++) put(cxp + dx, y, { a: dx === 0 ? '#5a5f6a' : dx === 2 ? '#1a1c22' : (y % 7 === 0 ? '#4a4d56' : '#3a3d46'), d: 0.55, id: 73 });
      if (k % 2 === 0) for (let dx = -8; dx < 9; dx++) for (let dy = 0; dy < 3; dy++) put(cxp + 18 + dx, hor + 13 + dy, { a: dy === 0 ? '#6b4a32' : '#3a2a20', d: 0.54, id: 74 });   // bench
      if (k % 3 === 0) for (let dx = -10; dx < 11; dx++) for (let dy = 0; dy < 6; dy++) put(cxp + dx, hor - 26 + dy, { a: dy === 0 || dy === 5 || Math.abs(dx) === 10 ? '#1c2a4a' : (dy === 2 || dy === 3) && Math.abs(dx) < 7 && dx % 3 !== 0 ? '#e8e2d6' : '#2a3e6a', d: 0.545, id: 75 });   // station name sign (blank glyphs)
    }
  }
  // station lamps (frame 5)
  if (st > 0.5) {
    const lamps = o.scroll * 0.8;
    for (let k = Math.floor(lamps / 70) - 1; k <= Math.floor((lamps + 260) / 70) + 1; k++) {
      const lx = Math.round(k * 70 - lamps + x0);
      for (let y = hor - 30; y < hor - 20; y++) put(lx, y, { a: P.pole, d: 0.55, id: 77 });
      for (let dx = -3; dx <= 3; dx++) put(lx + dx, hor - 31, { a: P.lamp, d: 0.55, id: 77, e: '#ffe7b0', ei: 5 });
    }
  }
}

export function paintCarriage(pc: PixelCanvas, o: CarriageOpts) {
  pc.clear();
  pc.names = { 70: 'frost', 31: 'station building', 65: 'phone UI', 78: 'hedge row', 79: 'hay bales', 80: 'telegraph poles', 72: 'canopy band', 73: 'canopy column', 74: 'bench', 75: 'station sign', 76: 'fence', 77: 'platform lamps', 9: 'heater grille', 1: 'carriage wall', 2: 'window frame', 3: 'ceiling', 4: 'lamp strip', 5: 'luggage rack', 6: 'bag', 7: 'table', 8: 'cup', 50: 'seat R', 51: 'headrest R', 52: 'seat L', 53: 'headrest L', 63: 'phone', 64: 'phone screen', 23: 'snow field', 21: 'hedges', 22: 'farmhouse', 30: 'platform', 40: 'catenary' };
  for (let k = 20; k < 70; k++) if (!pc.names[k] || pc.names[k] === '') pc.names[k] = k >= 20 && k <= 21 ? pc.names[k] ?? 'city block' : 'city block';
  for (let k = 81; k < 85; k++) pc.names[k] = 'city block'; pc.names[85] = 'back towers'; pc.names[89] = 'far hills'; pc.names[94] = 'aisle floor'; pc.names[95] = 'table post'; pc.names[96] = 'route map'; pc.names[97] = 'blind'; pc.names[98] = 'emergency handle'; pc.names[90] = 'street below'; pc.names[91] = 'roofs below'; pc.names[92] = 'house walls'; pc.names[93] = 'chimneys'; pc.names[86] = 'street'; pc.names[87] = 'rooftop'; pc.names[88] = 'street lamp'; pc.names[21] = 'hedges'; pc.names[22] = 'farmhouse'; pc.names[23] = 'snow field'; pc.names[30] = 'platform'; pc.names[40] = 'catenary';
  const view = o.view ?? (o.pov ? 'city' : 'wide');
  win = view === 'wide' ? WIN : view === 'fields' || view === 'phone' ? WIN_TIGHT : WIN_POV;
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
      if (corner || (!inside && ox + oy > 0 && ox < 5 && oy < 5)) {
        // brushed aluminium: a bevel (lit outer lip, dark inner step), streaks along the frame, the odd scuff
        const AL = ['#1c1c21', '#2b2b30', '#3a3a42', '#4d4e57', '#6a6c76'];
        const w = Math.max(ox, oy), along = ox > oy ? y : x;
        const v = (w >= 4 ? 3.4 : w === 3 ? 2.4 : w === 2 ? 1.6 : 1) + (vnoise(along * 0.08, w, 23) - 0.5) * 1.3 + (hashI(along * 3 + w) < 0.03 ? 1 : 0);
        pc.px(x, y, { a: AL[Math.max(0, Math.min(4, dither(v, x, y)))]!, d: D - 0.01, id: 2, n: [x < x0 ? -0.5 : x >= x1 ? 0.5 : 0, y < y0 ? 0.5 : y >= y1 ? -0.5 : 0] });
      }
      else if (nearCorner) pc.px(x, y, { a: P.rubber, d: D - 0.01, id: 2 });
    }
  
  if (view === 'wide') {
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
  if (view !== 'phone') pc.rect(x0, y1 + 24, 120, 10, (x, y) => ({ a: y === y1 + 24 ? '#7a705f' : (x - x0) % 30 === 0 ? '#2a251f' : (y - y1) % 2 ? '#3a342c' : '#5a5246', d: D - 0.01, id: 9 }));
  if (view !== 'phone') { pc.rect(130, y1 + 1, 7, 9, { a: P.cup, d: D - 0.05, id: 8 }); pc.rect(130, y1 + 4, 7, 2, { a: '#8a5a3a', d: D - 0.05, id: 8 }); }
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
    pc.rect(sx + 8, top + 3, w - 16, 16, (x, y) => (x === sx + Math.floor(w / 2) ? { a: '#b8b0a2', d: 0.07, id: id + 1 } : y === top + 3 ? { a: '#a8a092', d: 0.07, id: id + 1, n: [0, 0.6] } : fabric(ramp(P.head, 0.6), { d: 0.07, id: id + 1, seed: id, n: [0, 0.3] })(x, y)));
  };
  if (view === 'wide') {
    // the aisle floor between the seat backs: ribbed rubber, a table post down to it, the far seat behind
    pc.rect(0, 428, AW, 52, (x, y) => ({ a: (y - 428) % 4 === 0 ? '#16151a' : y < 434 ? '#2e2c30' : (x + y) % 7 === 0 ? '#2a282d' : '#222125', d: D + 0.05, id: 94, n: [0, 0.9] }));
    const PM = ['#22242a', '#3a3d46', '#5f636c', '#8d929c', '#c4c8d0'];
    pc.rect(100, y1 + 18, 4, 110, (x, y) => ({ a: PM[Math.max(0, Math.min(4, dither([3.4, 2.4, 1.6, 0.6][x - 100]! + (vnoise(x, y * 0.15, 41) - 0.5) * 0.9 - (y > 400 ? (y - 400) * 0.03 : 0), x, y)))]!, d: D - 0.035, id: 95, n: [(x - 101.5) / 2, 0] }));
    pc.rect(94, 426, 16, 3, { a: '#3a3d46', d: D - 0.035, id: 95 });
    // a route map over the window: the line, its stops, the next one lit (no names)
    pc.rect(50, 90, 170, 14, (x, y) => ({ a: y === 90 || y === 103 ? '#1a2340' : (x + y) % 5 === 0 ? '#25305a' : '#202a4f', d: D - 0.005, id: 96 }));
    for (let x = 56; x < 214; x++) pc.px(x, 97, { a: '#d9b64a', d: D - 0.006, id: 96 });
    for (let k = 0; k < 8; k++) { const sx = 58 + k * 22; pc.rect(sx - 1, 96, 3, 3, { a: k === 2 ? '#ff6a5a' : '#e8e2d6', d: D - 0.007, id: 96, e: k === 2 ? '#ff4a3a' : undefined, ei: k === 2 ? 3 : 0 }); }
    // the roller blind, rolled up at the top of the window
    pc.rect(x0 + 2, y0 - 9, x1 - x0 - 4, 5, (x, y) => fabric(ramp('#7a6a58', 0.5), { d: D - 0.012, id: 97, seed: 3, n: [0, y === y0 - 9 ? 0.7 : -0.2] })(x, y));
    pc.rect(Math.round((x0 + x1) / 2) - 4, y0 - 4, 8, 3, { a: '#3a3d46', d: D - 0.013, id: 97 });
    // the emergency handle on the wall, right of the window
    pc.rect(256, 170, 10, 16, (x, y) => ({ a: x === 256 || y === 170 ? '#e05a4a' : y === 185 || x === 265 ? '#7a2018' : '#b0343a', d: D - 0.01, id: 98 }));
    pc.rect(259, 175, 4, 6, { a: '#e8e2d6', d: D - 0.011, id: 98 });
    seat(150, 110, 50); seat(-30, 100, 52);
  }
  // the carriage reflected in the glass: the lamp strip and the headrest tops, faint
  const rk = view === 'city' ? 2.2 : 1;
  for (let x = Math.max(0, x0 + 6); x < Math.min(AW, x1 - 6); x++) {
    if (view !== 'wide' && x % 3 !== 0) pc.glow(x, Math.max(2, y0 + 14), '#fff1d0', 0.3 * rk);
    const hr = (x - x0) % 70;
    if (hr > 12 && hr < 40) for (let k = 0; k < (view === 'city' ? 6 : 1); k++) pc.glow(x, y1 - 26 + k + (hr === 13 || hr === 39 ? 1 : 0), '#d8d2c4', 0.12 * rk / (k + 1));
    if (view === 'city' && x > 40 && x < 82) for (let yy = y1 - 120; yy < y1 - 60; yy += 2) pc.glow(x, yy, '#c8d8ff', 0.06);   // the phone's glow, mirrored in the glass
  }
  if (view === 'fields') {
    // frost growing in from the edges of the glass: feathery, brighter at the rim
    for (let y = 0; y < 480; y++) for (let x = 0; x < AW; x++) {
      if (!(x >= x0 && x < x1 && y >= y0 && y < y1)) continue;
      const edge = Math.min(x - Math.max(0, x0), Math.min(AW, x1) - 1 - x, y - Math.max(0, y0), y1 - 1 - y);
      // coverage falls off from the rim; fern-like ridges (ridged noise along two diagonals) give the
      // crystals, thin frost only tints the glass (glow), thick frost is opaque and catches the light
      const reach = 9 + 15 * vnoise(x * 0.04, y * 0.04, 31);
      const cov = (reach - edge) / reach + (vnoise(x * 0.09, y * 0.09, 33) - 0.5) * 0.5;
      if (cov <= 0) continue;
      const r1 = 1 - Math.abs(2 * vnoise((x + y) * 0.16, (x - y) * 0.05, 34) - 1), r2 = 1 - Math.abs(2 * vnoise((x - y) * 0.16, (x + y) * 0.05, 35) - 1);
      const fern = Math.max(r1, r2) ** 3;
      const v = cov * 2.2 + fern * 1.6;
      if (v < 0.7) continue;
      if (v < 1.4) { pc.glow(x, y, '#c8d8ff', 0.25 + fern * 0.5); continue; }
      const FR = ['#7f93b4', '#9fb2d0', '#c4d2e6', '#e4ecf7'];
      pc.px(x, y, { a: FR[Math.max(0, Math.min(3, dither(v - 1.2, x, y)))]!, d: 0.15, id: 70, n: [(r1 - r2) * 0.6, 0.5], e: '#c8d8ff', ei: 0.12 + fern * 0.2 });
    }
  }
  // the phone, propped on the table against the window, filming the view: its screen shows the same
  // world racing past (no people: the stream is the character)
  const ph = o.phone ?? 1;
  if (view === 'phone') {
    const pw = PHONE_CU.w, phh = PHONE_CU.h, px0 = PHONE_CU.x, py0 = PHONE_CU.y;
    // its contact shadow on the sill
    for (let x = -6; x < pw + 6; x++) for (let k = 0; k < 3; k++) pc.px(px0 + x, py0 + phh + k, { a: k === 0 ? '#120f0c' : '#2a231d', d: 0.065, id: 7 });
    // the screen first (it copies the view behind the phone, before the phone covers it)
    pc.screen(x0 + 50, y0 + 140, 150, 260, px0 + 4, py0 + 10, pw - 8, phh - 16, { ei: 1.15, d: 0.058, id: 64 });
    for (let y = 0; y < phh; y++) for (let x = 0; x < pw; x++) {
      if (x >= 4 && x < pw - 4 && y >= 10 && y < phh - 6) continue;
      const cxk = x < 6 ? 6 - x : x > pw - 7 ? x - (pw - 7) : 0, cyk = y < 6 ? 6 - y : y > phh - 7 ? y - (phh - 7) : 0;
      if (cxk * cxk + cyk * cyk > 36) continue;
      pc.px(px0 + x, py0 + y, { a: x === 0 || y === 0 ? '#4a4d56' : x === pw - 1 || y === phh - 1 ? '#0b0c10' : x === 1 || y === 1 ? '#2a2c33' : P.phone, d: 0.06, id: 63 });
    }
    pc.rect(px0 + pw, py0 + 30, 2, 18, { a: '#4a4d56', d: 0.06, id: 63 });                  // side buttons
    pc.rect(px0 + 40, py0 + 4, 12, 3, { a: '#08090c', d: 0.058, id: 63 });                   // speaker
    pc.px(px0 + 56, py0 + 5, { a: '#1a2240', d: 0.058, id: 63, e: '#4a6aff', ei: 0.6 });      // front camera lens
    // the stream's own UI on the phone: LIVE pill, viewer dots, the signal bars going down
    // (the screen's UI, LIVE, viewers and the signal, is drawn crisp by the scene's overlay)
    // the ledge it leans on, lit by the screen
    pc.rect(0, py0 + phh, AW, 480 - py0 - phh, (x, y) => (y === py0 + phh ? { a: '#8a7f6c', d: 0.07, id: 7, n: [0, 0.9] } : wood(ramp(P.table, 0.8), { d: 0.07, id: 7, pw: 3, seed: 4, n: [0, 0.9] })(x, y)));
  } else if (ph > 0) {
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
  if (o.view === 'phone') L.push({ x: 135, y: 280, d: 0.04, col: '#c8d8ff', i: 1.8, r: 90 });
  else if ((o.phone ?? 1) > 0) L.push({ x: 67, y: 290, d: 0.06, col: '#c8d8ff', i: 1.0, r: 24 });
  return L;
}
