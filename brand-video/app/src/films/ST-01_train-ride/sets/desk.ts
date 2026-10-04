// Set 4: the gaming desk (frame 1b), a year of streaming from one chair. No people: the monitor goes
// dark, the empty chair is turned away, the door stands open on the light outside, and the phone on
// the desk wakes up with LIVE.
import { PixelCanvas, type Light, type Mat, AW } from '../../../kit/pixel';
import { ramp, plaster, wood, snow, mix, vnoise, dither } from '../../../kit/materials';

const P = {
  wall: '#2a2d3a', wallD: '#22242f', floor: '#3a2f2a', floorL: '#45372f', desk: '#4a3a2e', deskL: '#5a4636', deskD: '#33281f',
  mon: '#141519', monL: '#24262c', key: '#1b1c21', chair: '#3c4050', chairS: '#262833', chairR: '#b0343a', metal: '#5c616e',
  door: '#5a4a3c', doorL: '#6d5a48', frame: '#3a2f27', poster: '#3b4a6b', snow: '#cdd8ea', plant: '#2f5a3e', mug: '#d8d2c4', black: '#101114',
};

/** k: 0 = the stream room as it was (monitor on), 1 = monitor off, door open, phone live. */
export function paintDesk(pc: PixelCanvas, o: { t: number; k: number }) {
  const { t, k } = o;
  pc.clear();
  pc.names = { 1: 'back wall', 2: 'poster', 3: 'window frame', 4: 'outside', 5: 'hallway', 6: 'door', 7: 'floor', 10: 'desk', 11: 'monitor', 12: 'monitor stand', 13: 'keyboard', 17: 'plant', 18: 'phone', 20: 'chair back', 21: 'chair seat', 22: 'chair base', 23: 'headrest', 24: 'rug', 14: 'mouse', 15: 'headset', 16: 'mug' };
  // back wall: painted plaster with a skirting board; the poster in a frame
  const WR = ramp(P.wall, 0.6);
  pc.rect(0, 0, AW, 330, plaster(WR, { d: 0.6, id: 1, gy: 322, seed: 4 }));
  pc.rect(0, 322, AW, 8, (x, y) => ({ a: y === 322 ? '#4a4d5c' : y === 329 ? '#15161c' : '#2f3240', d: 0.599, id: 1, n: [0, y === 322 ? 0.6 : 0] }));
  pc.rect(168, 90, 56, 74, (x, y) => ({ a: x === 168 || y === 90 ? '#4a3a2a' : x === 223 || y === 163 ? '#1f1812' : '#33281f', d: 0.59, id: 2 }));
  pc.rect(172, 94, 48, 66, (x, y) => {
    // a pixel landscape print: sky, sun, hills, a title strip
    const sky = y < 128, hill = y > 122 + Math.round(5 * Math.sin((x - 172) * 0.2)), sun = (x - 205) ** 2 + (y - 112) ** 2 < 60;
    const a = y > 150 ? (x % 4 < 2 && y === 154 ? '#c9c2b4' : '#e8e2d6') : sun ? '#f0c060' : hill ? (y % 3 ? '#2f5a4a' : '#3d6b56') : sky ? (y < 110 ? '#4a6fb0' : '#7a9fd0') : '#2f5a4a';
    return { a, d: 0.589, id: 2 };
  });
  // window (left): a frame with depth (lit inner lip, dark outer edge), night and snow outside
  const FR = ramp(P.frame, 0.7);
  const frame = (x: number, y: number, w: number, h: number) => pc.rect(x, y, w, h, (xx, yy) => ({ a: (xx === x || yy === y) ? FR[4]! : (xx === x + w - 1 || yy === y + h - 1) ? FR[0]! : FR[2]!, d: 0.58, id: 3 }));
  frame(14, 70, 70, 4); frame(14, 176, 70, 4); frame(14, 70, 4, 110); frame(80, 70, 4, 110);
  pc.rect(10, 180, 78, 4, (xx, yy) => ({ a: yy === 180 ? '#5a5d6a' : '#2a2c36', d: 0.579, id: 3, n: [0, 0.8] }));   // sill
  for (let y = 74; y < 176; y++) for (let x = 18; x < 80; x++) {
    if (x === 48 || y === 124) { pc.px(x, y, { a: x === 48 ? FR[3]! : FR[1]!, d: 0.58, id: 3 }); continue; }
    const house = x > 22 && x < 44 && y > 112 && y < 162, roof = x > 19 && x < 47 && y > 100 && y <= 112 && Math.abs(x - 33) < (y - 100) * 1.2 + 2;
    const lamp = (x === 64 && y > 120 && y < 164) || (x >= 62 && x <= 66 && y >= 118 && y <= 120);
    if (y > 160) pc.px(x, y, snow(['#7d8aa3', '#a3b1c8', '#c6d2e3', '#dfe7f2', '#f4f8ff'], { d: 0.9, id: 4, seed: 2 })(x, y));
    else if (lamp) pc.px(x, y, { a: '#2a2c33', d: 0.88, id: 4, e: y <= 120 ? '#ffd08a' : undefined, ei: y <= 120 ? 4 : 0 });
    else if (roof) pc.px(x, y, { a: Math.abs(x - 33) > (y - 100) * 1.2 ? '#dfe7f2' : (x + y) % 3 ? '#2a2f3c' : '#353b4a', d: 0.89, id: 4, n: [x < 33 ? -0.5 : 0.5, 0.6] });
    else if (house) { const win = (x > 27 && x < 32 || x > 35 && x < 40) && y > 122 && y < 130; pc.px(x, y, { a: win ? '#1b1e27' : (x + y) % 4 === 0 ? '#5a5048' : '#4a4038', d: 0.89, id: 4, e: win ? '#ffc46b' : undefined, ei: win ? 2.2 : 0 }); }
    else if (y > 146 && y < 161 - Math.round(4 * Math.sin(x * 0.2))) pc.px(x, y, { a: (x + y) % 3 ? '#1a2130' : '#232b3d', d: 0.9, id: 4 });
    else pc.erase(x, y); // sky: the physical sky fills it
  }
  for (const [fx, fy, sx, sy] of [[18, 74, 1, 1], [79, 74, -1, 1], [18, 175, 1, -1], [79, 175, -1, -1]] as const)
    for (let k = 0; k < 9; k++) for (let j = 0; j < 9 - k; j++) if ((k * 7 + j * 3) % 5 < 3) pc.px(fx + sx * k, fy + sy * j, { a: '#c6d2e3', d: 0.579, id: 3, e: '#c6d8ff', ei: 0.15 });
  // the doorway (right): a lit hallway with patterned wallpaper, a coat on a hook, a light switch
  const open = Math.round(4 + 30 * k);
  pc.rect(222, 120, 48, 210, (xx, yy) => ({ a: xx === 222 || yy === 120 ? FR[4]! : FR[1]!, d: 0.58, id: 5 }));
  for (let y = 124; y < 330; y++) for (let x = 226; x < 270; x++) {
    const coat = x > 246 && x < 258 && y > 170 && y < 230 && !(y < 176 && Math.abs(x - 252) > 2);
    const paper = (x + Math.floor(y / 6) * 3) % 7 === 0 && y % 6 < 3;
    const base = y > 316;
    const a = coat ? (x === 252 || y % 9 === 0 ? '#2c3a56' : '#3b4a6b') : base ? '#5a4a3a' : paper ? '#9a8870' : '#8a7a66';
    pc.px(x, y, { a, d: 0.66, id: 5, e: coat ? undefined : '#ffd9a0', ei: coat ? 0 : (0.25 + 1.05 * k) * (1 - (y - 124) / 400) });
  }
  pc.rect(229, 200, 3, 5, { a: '#d8d2c4', d: 0.655, id: 5 });
  // the door leaf: panelled wood, swinging open
  pc.poly([[226 + open, 124], [270, 118], [270, 336], [226 + open, 330]], (x, y) => {
    const lx = x - (226 + open), panel = (y > 140 && y < 220) || (y > 236 && y < 316);
    const edge = lx < 2 ? 'L' : '';
    const wd = wood(ramp(P.door, 0.7), { d: 0.55, id: 6, pw: 4, vertical: true, seed: 2, n: [-0.5, 0] })(x, y);
    return edge ? { a: P.doorL, d: 0.55, id: 6, n: [-0.8, 0] } : panel && lx > 5 ? { ...wd, a: mix(wd.a, '#000000', 0.18) } : wd;
  });
  pc.rect(230 + open, 226, 3, 3, { a: '#d4a24a', d: 0.548, id: 6 });                      // handle
  // the floor: wooden planks in perspective, grain, and the door's light across it
  pc.rect(0, 330, AW, 150, (x, y) => ({ ...wood(ramp(P.floorL, 0.8), { d: 0.5 - (y - 330) / 400, id: 7, pw: 5 + Math.floor((y - 330) / 30), vertical: false, seed: 5 })(x, y), n: [0, 0.9] }));
  // a rug under the chair
  pc.poly([[60, 420], [240, 420], [262, 476], [40, 476]], (x, y) => ({ a: y < 423 || y > 472 ? '#c8a878' : (y - 420) % 8 < 1 || x % 16 === 0 ? '#4a2c2c' : (x + y) % 7 === 0 ? '#8a5048' : (x + y) % 2 ? '#6a3a36' : '#5e3430', d: 0.205, id: 24, n: [0, 0.9] }));
  // the desk: wood top with a lit front edge, a drawer unit, legs, a cable tray
  const DW = ramp(P.desk, 0.8);
  pc.rect(10, 270, 210, 8, (x, y) => (y === 270 ? { a: DW[4]!, d: 0.42, id: 10, n: [0, 0.9] } : wood(DW, { d: 0.42, id: 10, pw: 8, seed: 3, n: [0, 0.9] })(x, y)));
  pc.rect(10, 278, 210, 6, (x, y) => ({ a: y === 278 ? DW[1]! : DW[2]!, d: 0.42, id: 10 }));
  pc.rect(16, 284, 6, 70, (x) => ({ a: x === 16 ? DW[2]! : DW[0]!, d: 0.43, id: 10 }));
  pc.rect(208, 284, 6, 70, (x) => ({ a: x === 208 ? DW[2]! : DW[0]!, d: 0.43, id: 10 }));
  pc.rect(160, 284, 46, 40, (x, y) => ({ a: (y - 284) % 13 === 0 ? DW[0]! : (y - 284) % 13 === 1 ? DW[3]! : (x === 183 && (y - 284) % 13 === 6) ? '#b8bcc4' : DW[2]!, d: 0.425, id: 10 }));
  pc.rect(40, 286, 100, 3, (x, y) => ({ a: y === 286 ? '#3a3d46' : '#1b1c21', d: 0.43, id: 10 }));
  // the monitor: bezel with a lit top edge, a webcam, the game on screen fading out
  pc.rect(60, 176, 110, 66, (x, y) => ({ a: y === 176 || x === 60 ? '#3a3d46' : y === 241 || x === 169 ? '#0b0c10' : P.mon, d: 0.44, id: 11 }));
  pc.rect(111, 173, 8, 3, { a: '#24262d', d: 0.439, id: 11 }); pc.px(115, 174, { a: '#1a1a1f', d: 0.438, id: 11, e: '#7dd3ff', ei: 0.8 });
  const on = Math.max(0, 1 - k * 1.6);
  // the game on screen: a night platformer level (cave, platforms, a coin, the player sprite) with a HUD
  for (let y = 180; y < 238; y++) for (let x = 64; x < 166; x++) {
    const lx = x - 64, ly = y - 180;
    // an original night platformer: sky, a moon, hills and pines, violet stone tiles with glowing moss,
    // floating teal stones, a lantern, a crystal, gems, a slime and a small hooded hero, the HUD on top
    let col = ly < 18 ? '#141a36' : ly < 30 ? '#1d2448' : '#262c52';
    if ((lx * 37 + ly * 91) % 113 === 0 && ly < 22) col = '#c8d4f0';                            // a few stars
    if ((lx - 84) ** 2 + (ly - 11) ** 2 < 10) col = '#f0e6c0';                                 // the moon
    const hill = 38 - Math.round(6 * Math.sin(lx * 0.09) + 3 * Math.sin(lx * 0.23));
    if (ly >= hill) col = '#1e3a3a';
    if (ly >= hill + 2 && (lx + ly) % 7 === 0) col = '#24464a';
    if (ly >= 44 - ((lx * 5) % 7 < 3 ? 3 : 0) && ly < 50) col = '#173028';                   // pines
    const ground = ly >= 50;
    if (ground) col = (ly - 50) % 4 === 0 || ((lx + ((ly - 50) >> 2) * 5) % 8 === 0) ? '#231a33' : ly === 50 ? '#8a7ab8' : (lx + ly) % 5 === 0 ? '#4a3d6a' : '#5a4a80';   // violet stone tiles
    if (ly === 49 && lx % 5 < 2) col = '#6ae0c8';                                              // glowing moss
    const ledge = (x0: number, x1: number, yy: number) => lx >= x0 && lx < x1 && ly >= yy && ly < yy + 4;
    if (ledge(10, 34, 36) || ledge(56, 76, 28)) col = ly === 36 || ly === 28 ? '#9ad8e8' : lx % 6 === 0 ? '#1e3a4a' : '#3a6a7a';   // floating teal stone
    if (lx >= 40 && lx < 44 && ly >= 35 && ly < 40) col = ly === 35 ? '#3a2a1a' : (lx === 41 || lx === 42) && ly > 36 ? '#ffe9a0' : '#c88a3a';   // a hanging lantern
    if (lx >= 88 && lx < 96 && ly >= 50 - Math.max(0, 10 - Math.abs(lx - 91.5) * 2.4) && ly < 50) col = lx < 91 ? '#e88af0' : '#a04ab8';   // a crystal
    for (const cx of [58, 64, 70]) if (Math.abs(lx - cx) + Math.abs(ly - 22) < 2) col = Math.abs(lx - cx) + Math.abs(ly - 22) < 1 ? '#e0fbff' : '#6ad8ff';   // floating gems
    if (lx >= 72 && lx < 77 && ly >= 47 - (lx > 72 && lx < 76 ? 1 : 0) && ly < 50) col = ly === 48 && (lx === 73 || lx === 75) ? '#10301a' : '#7ae06a';   // a slime
    if (lx >= 20 && lx < 24 && ly >= 30 && ly < 36) col = ly < 32 ? (lx === 22 && ly === 31 ? '#ffe9a0' : '#e8e2d6') : ly < 35 ? '#e8e2d6' : '#8a7ab8';   // the hero: a small hooded figure, blank face
    if (ly < 5) col = lx < 30 ? (lx % 5 < 3 && ly > 1 && ly < 4 ? '#e5484d' : '#101216') : (lx > 80 && ly > 1 && ly < 4 && lx % 3 ? '#e8e2d6' : '#101216');   // HUD: hearts, score
    const refl = Math.max(0, 1 - Math.abs(lx - 78 - ly * 0.35) / 14) * (1 - on) * k;   // the door's light on the dark glass
    pc.px(x, y, { a: P.black, d: 0.44, id: 11, e: on > 0.05 ? col : '#ffd9a0', ei: on > 0.05 ? 1.5 * on : 0.35 * refl + 0.04 * k });
  }
  pc.rect(108, 242, 14, 18, (x, y) => ({ a: x === 108 ? '#4a4d56' : x === 121 ? '#1b1c21' : y === 250 ? '#15161b' : x === 109 ? '#33363e' : P.monL, d: 0.45, id: 12 }));
  pc.rect(96, 258, 38, 4, (x, y) => ({ a: y === 258 ? '#4a4d56' : P.monL, d: 0.45, id: 12 }));
  // keyboard with keys and RGB, a mouse on its pad, a headset, the mug, the plant
  pc.rect(70, 262, 74, 7, (x, y) => ({ a: y === 262 ? '#2a2c33' : (x - 70) % 3 === 2 || y === 265 ? '#0f1014' : P.key, d: 0.41, id: 13, n: [0, 0.8] }));
  for (let x = 72; x < 142; x += 3) pc.px(x, 268, { a: P.key, d: 0.405, id: 13, e: ['#ff4d6d', '#ffb224', '#4dd2ff', '#9b6bff'][Math.floor(x / 18) % 4], ei: 1.4 * on });
  pc.rect(148, 264, 18, 6, { a: '#1a1b20', d: 0.412, id: 14 });
  pc.rect(152, 263, 6, 6, (x, y) => ({ a: y === 263 ? '#4a4d56' : x === 155 ? '#0f1014' : P.key, d: 0.41, id: 14 }));
  // headphones on a stand: the stand, the headband arc, two ear cups with a lit rim
  pc.rect(48, 252, 2, 16, { a: '#3a3c45', d: 0.412, id: 15 }); pc.rect(44, 267, 10, 2, { a: '#2a2c33', d: 0.412, id: 15 });
  for (let a = Math.PI; a <= 2 * Math.PI; a += 0.08) pc.px(Math.round(49 + Math.cos(a) * 8), Math.round(252 + Math.sin(a) * 7), { a: a < 4.2 ? '#4a4d56' : '#2a2c33', d: 0.41, id: 15 });
  for (const ex of [40, 56]) pc.rect(ex, 250, 4, 8, (x, y) => ({ a: x === ex ? '#5a5d66' : y === 250 ? '#4a4d56' : '#1d1e24', d: 0.409, id: 15 }));
  pc.rect(182, 254, 9, 14, (x, y) => ({ a: x === 182 ? '#f4efe6' : x === 190 ? '#a8a296' : y === 254 ? '#3a2418' : P.mug, d: 0.41, id: 16 }));
  pc.rect(191, 257, 2, 6, { a: '#c8c2b5', d: 0.41, id: 16 });
  pc.rect(196, 248, 12, 20, (x, y) => ({ a: y === 248 ? '#8a603e' : x === 207 ? '#4a3222' : '#6b4a32', d: 0.41, id: 17 }));
  for (let i = 0; i < 9; i++) pc.line(202, 248, 194 + i * 2, 234 + (i % 3) * 3, { a: ['#2f5a3e', '#3d6b4a', '#24472f'][i % 3]!, d: 0.41, id: 17 });
  // the phone on the desk, propped up; it wakes with LIVE
  const ph = { x: 26, y: 238 };
  pc.rect(ph.x, ph.y, 14, 26, (x, y) => ({ a: x === ph.x || y === ph.y ? '#3a3d46' : x === ph.x + 13 || y === ph.y + 25 ? '#0b0c10' : x === ph.x + 1 ? '#24262d' : P.black, d: 0.4, id: 18 }));
  pc.rect(ph.x + 1, ph.y + 1, 12, 24, (x, y) => ({ a: Math.abs((x - ph.x) - (y - ph.y) * 0.5 - 2) < 1 ? '#2c2f38' : P.black, d: 0.4, id: 18, e: '#ffd9a0', ei: (0.9 - (y - ph.y) * 0.015) * k }));   // a dim reflection on the glass
  if (k > 0.5) for (let x = 0; x < 6; x++) for (let y = 0; y < 3; y++) pc.px(ph.x + 3 + x, ph.y + 3 + y, { a: '#b0343a', d: 0.395, id: 19, e: '#ff3b3b', ei: 4 * (Math.sin(t * 6) > -0.3 ? 1 : 0.4) });
  // the empty gaming chair, turned toward the door: stitched leather panels, red stripes, a headrest cushion
  const cx = 150, cy = 330;
  const CH = ramp(P.chair, 0.9), CR = ramp(P.chairR, 0.8);
  pc.poly([[cx - 30, cy - 62], [cx - 22, cy - 74], [cx + 18, cy - 78], [cx + 26, cy - 68], [cx + 30, cy + 40], [cx - 30, cy + 44]], (x, y) => {
    const side = x < cx - 24 || x > cx + 24, stitch = (x === cx - 24 || x === cx + 24 || (y - cy) % 14 === 0) && (x + y) % 2 === 0;
    // quilted rows: each puffs up between stitch lines (lit top, a shadow under the seam), a leather sheen
    const ry = ((y - cy) % 14 + 14) % 14;
    const sheen = Math.exp(-(((x - (cx - 6 + (y - cy) * 0.05)) / 3.5) ** 2)) * (vnoise(x * 0.3, y * 0.08, 5) > 0.35 ? 1 : 0.4);
    const v = 2 + (side ? -0.9 : 0) + (vnoise(x * 0.12, y * 0.12, 2) - 0.5) * 0.9 + (y < cy - 60 ? 0.6 : 0) + (ry === 1 ? -0.9 : ry < 5 ? 0.35 : ry > 11 ? -0.35 : 0) + sheen * 1.4;
    return { a: stitch ? CH[3]! : CH[Math.max(0, Math.min(4, dither(v, x, y)))]!, d: 0.2, id: 20, n: [(x - cx) / 50, y < cy - 66 ? 0.6 : ry < 5 ? 0.45 : 0.1] };
  });
  pc.rect(cx - 14, cy - 64, 26, 12, (x, y) => ({ a: y === cy - 64 ? CH[3]! : y === cy - 53 ? CH[0]! : (x + y) % 9 === 0 ? CH[3]! : CH[2]!, d: 0.198, id: 23, n: [0, 0.4] }));
  pc.poly([[cx - 22, cy - 66], [cx - 14, cy - 67], [cx - 10, cy + 38], [cx - 18, cy + 39]], (x, y) => ({ a: CR[x === cx - 21 ? 3 : (y % 7 === 0 ? 1 : 2)]!, d: 0.195, id: 20 }));
  pc.poly([[cx + 6, cy - 69], [cx + 14, cy - 70], [cx + 16, cy + 37], [cx + 8, cy + 37]], (x, y) => ({ a: CR[x === cx + 7 ? 3 : (y % 7 === 0 ? 1 : 2)]!, d: 0.195, id: 20 }));
  for (let y = cy - 64; y < cy + 37; y += 2) { pc.px(cx - 23, y, { a: CR[4]!, d: 0.194, id: 20 }); pc.px(cx + 15, y, { a: CR[4]!, d: 0.194, id: 20 }); }   // contrast stitching
  // the monitor's cold light catching the chair's left edge and top (rim light), the door's warm light on the right edge
  pc.line(cx - 30, cy - 62, cx - 30, cy + 40, { a: '#8a9ac0', d: 0.189, id: 20, n: [-0.8, 0.2] });
  pc.line(cx - 22, cy - 74, cx + 18, cy - 78, { a: '#9aa8c8', d: 0.189, id: 20, n: [0, 0.9] });
  pc.line(cx - 30, cy - 62, cx - 22, cy - 74, { a: '#8a9ac0', d: 0.189, id: 20, n: [-0.6, 0.6] });
  pc.line(cx + 29, cy - 60, cx + 30, cy + 38, { a: '#b8895a', d: 0.189, id: 20, n: [0.8, 0] });
  pc.rect(cx - 28, cy + 40, 56, 12, (x, y) => ({ a: y === cy + 40 ? CH[4]! : y === cy + 51 ? CH[0]! : y === cy + 41 ? CH[3]! : CH[(x + y) % 11 === 0 ? 2 : 1]!, d: 0.19, id: 21, n: [0, 0.6] }));
  pc.rect(cx - 2, cy + 52, 5, 40, (x) => ({ a: x === cx - 2 ? '#8d929c' : x === cx + 2 ? '#2a2c33' : P.metal, d: 0.18, id: 22 }));
  for (const dx of [-36, -14, 12, 34]) { pc.line(cx, cy + 92, cx + dx, cy + 104, { a: P.metal, d: 0.17, id: 22 }); pc.disc(cx + dx, cy + 105, 2, { a: '#1a1b20', d: 0.169, id: 22 }); }
}

export function deskLights(k: number): Light[] {
  const on = Math.max(0, 1 - k * 1.6);
  return [
    { x: 115, y: 210, d: 0.4, col: '#7aa6d8', i: 2.2 * on, r: 90, shadow: true },
    { x: 250, y: 220, d: 0.56, col: '#ffd9a0', i: 0.6 + 3.2 * k, r: 120, shadow: true },
    { x: 33, y: 250, d: 0.38, col: '#ffd9a0', i: 0.8 * k, r: 26 },
    { x: 150, y: 250, d: 0.32, col: '#7aa6d8', i: 1.6 * on, r: 70 },        // the monitor's glow on the chair's back edges (rim)
    { x: 235, y: 300, d: 0.1, col: '#ffd9a0', i: 0.5 + 1.4 * k, r: 90 },     // warm fill from the doorway, from the camera side
  ];
}
