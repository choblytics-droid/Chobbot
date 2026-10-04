// Set 4: the gaming desk (frame 1b), a year of streaming from one chair. No people: the monitor goes
// dark, the empty chair is turned away, the door stands open on the light outside, and the phone on
// the desk wakes up with LIVE.
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';

const P = {
  wall: '#2a2d3a', wallD: '#22242f', floor: '#3a2f2a', floorL: '#45372f', desk: '#4a3a2e', deskL: '#5a4636', deskD: '#33281f',
  mon: '#141519', monL: '#24262c', key: '#1b1c21', chair: '#2a2c35', chairS: '#1d1e25', chairR: '#b0343a', metal: '#5c616e',
  door: '#5a4a3c', doorL: '#6d5a48', frame: '#3a2f27', poster: '#3b4a6b', snow: '#cdd8ea', plant: '#2f5a3e', mug: '#d8d2c4', black: '#101114',
};

/** k: 0 = the stream room as it was (monitor on), 1 = monitor off, door open, phone live. */
export function paintDesk(pc: PixelCanvas, o: { t: number; k: number }) {
  const { t, k } = o;
  pc.clear();
  // back wall with a faint panel pattern, a poster, the window with snow outside
  for (let y = 0; y < 330; y++) for (let x = 0; x < AW; x++) pc.px(x, y, { a: (x % 46 === 0 || y % 80 === 0) ? P.wallD : P.wall, d: 0.6, id: 1 });
  pc.rect(170, 92, 52, 70, { a: P.poster, d: 0.59, id: 2 });
  pc.rect(176, 100, 40, 40, { a: '#5b6f99', d: 0.59, id: 2 });
  pc.disc(196, 120, 12, { a: '#e0b04a', d: 0.585, id: 2 });
  // window (left): night, snow, a lamp post
  const fr: Mat = { a: P.frame, d: 0.58, id: 3 };
  pc.rect(14, 70, 70, 4, fr); pc.rect(14, 176, 70, 4, fr); pc.rect(14, 70, 4, 110, fr); pc.rect(80, 70, 4, 110, fr);
  for (let y = 74; y < 176; y++) for (let x = 18; x < 80; x++) {
    if (x === 48 || y === 124) { pc.px(x, y, { a: P.frame, d: 0.58, id: 3 }); continue; }
    if (y > 160) pc.px(x, y, { a: P.snow, d: 0.9, id: 4, n: [0, 0.8] });
    else if (y > 146 && y < 161 - Math.round(4 * Math.sin(x * 0.2))) pc.px(x, y, { a: '#1a2130', d: 0.9, id: 4, e: (x * 37) % 11 === 0 && y === 150 ? '#ffcc80' : undefined, ei: 2.2 });
    else pc.erase(x, y); // sky: the physical sky fills it
  }
  // the door (right), opening: a widening strip of warm light
  const open = Math.round(4 + 30 * k);
  pc.rect(222, 120, 48, 210, { a: P.frame, d: 0.58, id: 5 });
  for (let y = 124; y < 330; y++) for (let x = 226; x < 270; x++) {
    // the hallway beyond: a lit wall, a coat on a hook, the light falling off toward the floor
    const coat = x > 246 && x < 258 && y > 170 && y < 230 && !(y < 176 && Math.abs(x - 252) > 2);
    pc.px(x, y, { a: coat ? '#3b4a6b' : '#8a7a66', d: 0.66, id: 5, e: coat ? undefined : '#ffd9a0', ei: coat ? 0 : (0.25 + 1.05 * k) * (1 - (y - 124) / 400) });
  }
  pc.poly([[226 + open, 124], [270, 118], [270, 336], [226 + open, 330]], (x) => ({ a: x < 232 + open ? P.doorL : P.door, d: 0.55, id: 6, n: [-0.5, 0] }));
  // the floor, and the light from the door across it
  for (let y = 330; y < 480; y++) for (let x = 0; x < AW; x++) pc.px(x, y, { a: (y - 330) % 10 === 0 ? P.floor : (Math.floor(x / 30) + Math.floor((y - 330) / 10)) % 2 ? P.floor : P.floorL, d: 0.5 - (y - 330) / 400, n: [0, 0.9], id: 7 });
  // the desk
  pc.rect(10, 270, 210, 8, { a: P.deskL, d: 0.42, id: 10, n: [0, 0.9] });
  pc.rect(10, 278, 210, 6, { a: P.desk, d: 0.42, id: 10 });
  pc.rect(16, 284, 6, 70, { a: P.deskD, d: 0.43, id: 10 });
  pc.rect(208, 284, 6, 70, { a: P.deskD, d: 0.43, id: 10 });
  // the monitor: a game on it, fading out
  pc.rect(60, 176, 110, 66, { a: P.mon, d: 0.44, id: 11 });
  const on = Math.max(0, 1 - k * 1.6);
  for (let y = 180; y < 238; y++) for (let x = 64; x < 166; x++) {
    const sky = y < 210, hill = y > 214 + Math.sin(x * 0.12) * 4;
    const col = sky ? '#4a6fb0' : hill ? '#2e6b4a' : '#7aa6d8';
    pc.px(x, y, { a: P.black, d: 0.44, id: 11, e: col, ei: 1.6 * on });
  }
  pc.rect(108, 242, 14, 18, { a: P.monL, d: 0.45, id: 12 });
  pc.rect(96, 258, 38, 4, { a: P.monL, d: 0.45, id: 12 });
  // keyboard with RGB, mouse, headset, mug, a plant
  pc.rect(70, 262, 74, 7, { a: P.key, d: 0.41, id: 13, n: [0, 0.8] });
  for (let x = 72; x < 142; x += 3) pc.px(x, 264, { a: P.key, d: 0.405, id: 13, e: ['#ff4d6d', '#ffb224', '#4dd2ff', '#9b6bff'][Math.floor(x / 18) % 4], ei: 1.4 * on });
  pc.rect(152, 263, 6, 6, { a: P.key, d: 0.41, id: 14 });
  pc.disc(40, 254, 9, (x, y, dx, dy) => (dy < 0.2 && dx * dx + dy * dy > 0.45 ? { a: '#24252c', d: 0.41, id: 15 } : { a: P.wall, d: 0.6, id: 1 }));
  pc.rect(182, 254, 9, 14, { a: P.mug, d: 0.41, id: 16 });
  pc.rect(196, 248, 12, 20, { a: '#6b4a32', d: 0.41, id: 17 });
  for (let i = 0; i < 9; i++) pc.line(202, 248, 194 + i * 2, 234 + (i % 3) * 3, { a: P.plant, d: 0.41, id: 17 });
  // the phone on the desk, propped up; it wakes with LIVE
  const ph = { x: 26, y: 238 };
  pc.rect(ph.x, ph.y, 14, 26, { a: P.black, d: 0.4, id: 18 });
  pc.rect(ph.x + 1, ph.y + 1, 12, 24, { a: P.black, d: 0.4, id: 18, e: '#ffd9a0', ei: 0.9 * k });
  if (k > 0.5) for (let x = 0; x < 6; x++) for (let y = 0; y < 3; y++) pc.px(ph.x + 3 + x, ph.y + 3 + y, { a: '#b0343a', d: 0.395, id: 19, e: '#ff3b3b', ei: 4 * (Math.sin(t * 6) > -0.3 ? 1 : 0.4) });
  // the empty gaming chair in the foreground, turned toward the door
  const cx = 150, cy = 330;
  // the backrest: rounded top, side bolsters, a headrest cushion
  pc.poly([[cx - 30, cy - 62], [cx - 22, cy - 74], [cx + 18, cy - 78], [cx + 26, cy - 68], [cx + 30, cy + 40], [cx - 30, cy + 44]], (x, y) => ({ a: x < cx - 24 || x > cx + 24 ? P.chairS : P.chair, d: 0.2, id: 20, n: [(x - cx) / 50, y < cy - 66 ? 0.6 : 0.1] }));
  pc.rect(cx - 14, cy - 64, 26, 12, { a: '#33353f', d: 0.198, id: 23, n: [0, 0.4] });
  pc.poly([[cx - 22, cy - 66], [cx - 14, cy - 67], [cx - 10, cy + 38], [cx - 18, cy + 39]], { a: P.chairR, d: 0.195, id: 20 });
  pc.poly([[cx + 6, cy - 69], [cx + 14, cy - 70], [cx + 16, cy + 37], [cx + 8, cy + 37]], { a: P.chairR, d: 0.195, id: 20 });
  pc.rect(cx - 28, cy + 40, 56, 12, { a: P.chairS, d: 0.19, id: 21, n: [0, 0.6] });
  pc.rect(cx - 2, cy + 52, 5, 40, { a: P.metal, d: 0.18, id: 22 });
  for (const dx of [-36, -14, 12, 34]) pc.line(cx, cy + 92, cx + dx, cy + 104, { a: P.metal, d: 0.17, id: 22 });
}

export function deskLights(k: number): Light[] {
  const on = Math.max(0, 1 - k * 1.6);
  return [
    { x: 115, y: 210, d: 0.4, col: '#7aa6d8', i: 2.2 * on, r: 90, shadow: true },
    { x: 250, y: 220, d: 0.56, col: '#ffd9a0', i: 0.6 + 3.2 * k, r: 120, shadow: true },
    { x: 33, y: 250, d: 0.38, col: '#ffd9a0', i: 0.8 * k, r: 26 },
  ];
}
