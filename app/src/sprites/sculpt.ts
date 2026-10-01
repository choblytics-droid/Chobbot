// Sculpt specs for the v2 rig (src/config.ts RIG='v2'): how each 32x32 sprite becomes a sculpted,
// jointed voxel model. Nothing is repainted: every voxel takes the colour of its sprite pixel, so the
// front view is still the sprite. What the spec adds is depth (a rounded profile per part plus domes for
// snout, cheeks, belly, crest), a joint tree with pivots, and the colours of the back half.
import type { SpriteDef } from './sprites';

export type Joint = 'torso' | 'head' | 'earL' | 'earR' | 'armL' | 'armR' | 'legL' | 'legR' | 'wingL' | 'wingR' | 'tail';

export interface PartDepth {
  /** Half thickness at the part's centre and at its outline (voxels). */
  R: number;
  edge: number;
  /** Distance from the outline (px) at which the profile reaches R (rounded like a quarter circle). */
  span: number;
  /** Centre plane z (voxels; +z = towards the viewer of the sprite). */
  zc: number;
  /** Back half thickness as a fraction of the front (1 = symmetric). */
  back?: number;
}

/** A dome added to the front surface: centre (col,row), radii (px), height (voxels). */
export type Bulge = { part: Joint; c: number; r: number; rx: number; ry: number; h: number };

export interface SculptSpec {
  part: (c: number, r: number) => Joint;
  /** Joint pivot in pixel coords and parent joint (root = the feet). */
  joints: Record<Joint, { at: [number, number]; parent: Joint | null }>;
  depth: Record<Joint, PartDepth>;
  bulges: Bulge[];
  /** Back-half palette swaps per part (face details become fur), and parts that keep their front colours. */
  back: Partial<Record<Joint, Record<string, string>>>;
  /** Extra pixel rows appended under the sprite (leg option A): rows of the same width, '.' = empty. */
  extraRows?: string[];
}

const SHARED_JOINTS = (o: { armL: [number, number]; armR: [number, number]; earL: [number, number]; earR: [number, number]; tail: [number, number]; wingL?: [number, number]; wingR?: [number, number]; legY: number }) => ({
  torso: { at: [15.5, 29] as [number, number], parent: null },
  head: { at: [15.5, 20.5] as [number, number], parent: 'torso' as Joint },
  earL: { at: o.earL, parent: 'head' as Joint },
  earR: { at: o.earR, parent: 'head' as Joint },
  armL: { at: o.armL, parent: 'torso' as Joint },
  armR: { at: o.armR, parent: 'torso' as Joint },
  legL: { at: [13, o.legY] as [number, number], parent: null },
  legR: { at: [18, o.legY] as [number, number], parent: null },
  wingL: { at: o.wingL ?? [4, 19], parent: 'torso' as Joint },
  wingR: { at: o.wingR ?? [27, 19], parent: 'torso' as Joint },
  tail: { at: o.tail, parent: 'torso' as Joint },
});

// ------------------------------------------------------------------ Venmar
const vWingEdge: Record<number, number> = { 15: 3, 16: 5, 17: 5, 18: 6, 19: 7, 20: 8, 21: 8, 22: 3, 23: 2 };

export function venmarSculpt(legs: 'a' | 'b'): SculptSpec {
  // Option A: two short legs (3 rows) are added under the body, coloured like the arms (blue, white paw).
  // Option B: no new pixels; the existing feet (rows 30-31) are split into two stubby legs.
  const extraRows = legs === 'a'
    ? [
      '...........abbbba..abbbba.......',
      '...........abccba..abccba.......',
      '..........aacccca..acccca.......',
      '..........aaaaaa...aaaaaa.......',
    ]
    : undefined;
  const legTop = legs === 'a' ? 32 : 30;
  return {
    part: (c, r) => {
      if (r >= legTop) return c <= 15 ? 'legL' : 'legR';
      if (r >= 15 && r <= 23 && c <= (vWingEdge[r] ?? -1)) return r >= 22 ? 'tail' : 'wingL';
      if (r >= 15 && r <= 23 && c >= 31 - (vWingEdge[r] ?? -1)) return 'wingR';
      if ((r >= 22 && c <= 6) || (r >= 29 && c <= 9)) return 'tail';
      if (r <= 7 && c <= 9) return 'earL';
      if (r <= 7 && c >= 23 && !(c >= 25 && r >= 7)) return 'earR';
      if (r <= 20) return 'head';
      if (r <= 29 && c >= 7 && c <= 12) return 'armL';
      if (r <= 29 && c >= 19 && c <= 24) return 'armR';
      return 'torso';
    },
    joints: SHARED_JOINTS({ armL: [10, 22], armR: [21, 22], earL: [8.5, 8], earR: [23.5, 8], tail: [7, 27], wingL: [6.5, 18.5], wingR: [24.5, 18.5], legY: legTop }),
    depth: {
      head: { R: 7, edge: 1.5, span: 6, zc: 0.5 },
      torso: { R: 5.5, edge: 1.5, span: 5, zc: -0.5 },
      armL: { R: 2.5, edge: 1, span: 2.5, zc: 1.5 },
      armR: { R: 2.5, edge: 1, span: 2.5, zc: 1.5 },
      legL: { R: 2.5, edge: 1, span: 2, zc: 0 },
      legR: { R: 2.5, edge: 1, span: 2, zc: 0 },
      earL: { R: 1.5, edge: 0.5, span: 2, zc: -0.5 },
      earR: { R: 1.5, edge: 0.5, span: 2, zc: -0.5 },
      wingL: { R: 0.6, edge: 0.5, span: 2, zc: -2 },
      wingR: { R: 0.6, edge: 0.5, span: 2, zc: -2 },
      tail: { R: 2.5, edge: 1, span: 3, zc: -2.5 },
    },
    bulges: [
      { part: 'head', c: 15.5, r: 16, rx: 4, ry: 3.2, h: 2.5 }, // snout
      { part: 'head', c: 7.5, r: 16.5, rx: 2.6, ry: 2.2, h: 1.2 }, // cheeks
      { part: 'head', c: 23.5, r: 16.5, rx: 2.6, ry: 2.2, h: 1.2 },
      { part: 'head', c: 16, r: 6.5, rx: 2.5, ry: 4, h: 1.2 }, // crest
      { part: 'head', c: 10.5, r: 13, rx: 2, ry: 1.6, h: -0.8 }, // eye sockets
      { part: 'head', c: 21, r: 13, rx: 2, ry: 1.6, h: -0.8 },
      { part: 'torso', c: 15.5, r: 25.5, rx: 3.5, ry: 4.5, h: 2 }, // belly
    ],
    back: {
      head: { a: 'b', c: 'b', d: 'b', e: 'b', f: 'b', i: 'b', j: 'b', h: 'b', k: 'b' },
      earL: { c: 'b' }, earR: { c: 'b' },
      torso: { a: 'b', c: 'b', h: 'b' },
      armL: { c: 'b' }, armR: { c: 'b' },
    },
    extraRows,
  };
}

// ------------------------------------------------------------------ Quest
export function questSculpt(): SculptSpec {
  return {
    part: (c, r) => {
      if (r >= 30) return c <= 15 ? 'legL' : 'legR';
      if ((r >= 13 && r <= 19 && c >= 27 - Math.max(0, r - 17)) || (r === 20 && c >= 23) || (r >= 21 && c >= 24)) return 'tail';
      if (r <= 7 && c <= 11) return 'earL';
      if (r <= 7 && c >= 20) return 'earR';
      if (r <= 20) return 'head';
      if (c <= 12) return 'armL';
      if (c >= 19) return 'armR';
      return 'torso';
    },
    joints: SHARED_JOINTS({ armL: [10, 21.5], armR: [21, 21.5], earL: [9, 7.5], earR: [22, 7.5], tail: [24, 25], legY: 30 }),
    depth: {
      head: { R: 7, edge: 1.5, span: 6, zc: 0 },
      torso: { R: 5, edge: 1.5, span: 4, zc: -0.5 },
      armL: { R: 2.5, edge: 1, span: 2.5, zc: 1 },
      armR: { R: 2.5, edge: 1, span: 2.5, zc: 1 },
      legL: { R: 2.5, edge: 1, span: 2, zc: 0 },
      legR: { R: 2.5, edge: 1, span: 2, zc: 0 },
      earL: { R: 1.5, edge: 0.5, span: 2, zc: -0.5 },
      earR: { R: 1.5, edge: 0.5, span: 2, zc: -0.5 },
      wingL: { R: 1, edge: 0.5, span: 1, zc: 0 },
      wingR: { R: 1, edge: 0.5, span: 1, zc: 0 },
      tail: { R: 3.5, edge: 1, span: 3, zc: -3 },
    },
    bulges: [
      { part: 'head', c: 15.5, r: 17.5, rx: 5, ry: 2.8, h: 3.2 }, // fox muzzle
      { part: 'head', c: 15.5, r: 14.5, rx: 2, ry: 1.8, h: 1.2 }, // bridge of the nose
      { part: 'head', c: 7.5, r: 17.5, rx: 2.6, ry: 2, h: 1.3 }, // cheek fur
      { part: 'head', c: 23.5, r: 17.5, rx: 2.6, ry: 2, h: 1.3 },
      { part: 'head', c: 10.5, r: 13, rx: 2.3, ry: 1.8, h: -0.8 }, // eye sockets
      { part: 'head', c: 21, r: 13, rx: 2.3, ry: 1.8, h: -0.8 },
      { part: 'torso', c: 15.5, r: 25.5, rx: 3, ry: 4.5, h: 1.6 }, // chest / belly
    ],
    back: {
      head: { a: 'c', b: 'c', f: 'c', g: 'c', i: 'c', k: 'c', m: 'c', h: 'c', j: 'c' },
      earL: { b: 'a' }, earR: { b: 'a' },
      torso: { a: 'c', h: 'c', j: 'c', k: 'a' },
    },
  };
}

export function sculptFor(def: SpriteDef, legs: 'a' | 'b'): SculptSpec | null {
  if (def.name === 'VENMAR') return venmarSculpt(legs);
  if (def.name === 'QUEST') return questSculpt();
  return null;
}
