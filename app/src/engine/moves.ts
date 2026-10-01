// Movement library for the v2 rig. Every move is a pure function of time: it adds joint rotations, root
// motion and squash/stretch into a RigPose, scaled by a weight. A character's pose for a frame is the sum
// of its layers (a base layer from Stage.place plus any act() calls), evaluated at t; follow-through on
// ears and tail comes from evaluating the same layers a few frames earlier (their velocity, delayed),
// so it stays deterministic and seekable.
//
// Rig space: units are sprite pixels (a character is 32 tall), +y up, +z = the way the character faces.
// Sign conventions: +rx tips a part's top towards +z (forward lean / arm swings back); left arm, left ear
// and left wing are on -x, so their "outward" is +rz for ears, -rz for arms and wings (mirror for right).
import type { Joint } from '../sprites/sculpt';
import { clamp, ease, fract, smoothstep, window01 } from './util';

export type E3 = [number, number, number];
export interface RigPose {
  x: number; y: number; z: number;
  yaw: number; pitch: number; roll: number;
  /** Vertical scale about the feet (volume-preserving: x/z scale by 1/sqrt). 1 = rest. */
  sq: number;
  j: Record<Joint, E3>;
  /** Jaw 0..1 (open-mouth sprite patch + mouth voxels pushed in) and eyelids 0..1. */
  mouth: number;
  blink: number;
}

const JOINTS: Joint[] = ['torso', 'head', 'earL', 'earR', 'armL', 'armR', 'legL', 'legR', 'wingL', 'wingR', 'tail'];
export function restPose(): RigPose {
  const j = {} as Record<Joint, E3>;
  for (const k of JOINTS) j[k] = [0, 0, 0];
  return { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, sq: 1, j, mouth: 0, blink: 0 };
}

export interface MoveCtx {
  /** Song beat index at time t (continuous). */
  beat: (t: number) => number;
  /** Vocal envelope 0..1 at t. */
  vocal: (t: number) => number;
  seed: number;
  /** Singing now (mouth follows the vocal envelope). */
  sing: boolean;
  energy: number;
}

export interface MoveOpts {
  /** Duration (s) of a timed move, or of the window of a cyclic one (fades in/out over `fade`). */
  dur?: number;
  fade?: number;
  /** Weight multiplier. */
  w?: number;
  /** Arm used by point/punch: 'L' or 'R' (default R). */
  side?: 'L' | 'R';
  /** jump/fly height (px), turn angle (rad), cycle rate (Hz), forward travel (px/s), amplitude. */
  h?: number;
  angle?: number;
  rate?: number;
  travel?: number;
  amp?: number;
  /** sit: 0 = upright sit, 1 = full slump (h = drop, default the leg length). */
  slump?: number;
  /** jump: airtime (s). */
  air?: number;
}

/** A move adds into P at song time t; lt = t - t0 (local time). Weight w is already enveloped. */
type MoveFn = (P: RigPose, lt: number, t: number, w: number, o: MoveOpts, cx: MoveCtx) => void;

const add = (P: RigPose, j: Joint, w: number, x: number, y = 0, z = 0) => {
  const e = P.j[j];
  e[0] += w * x; e[1] += w * y; e[2] += w * z;
};
/** Arms/ears/wings in mirrored pairs: `out` is outward rotation (sign handled per side). */
const pairZ = (P: RigPose, l: Joint, r: Joint, w: number, outL: number, outR = outL, signL = -1) => {
  add(P, l, w, 0, 0, signL * outL);
  add(P, r, w, 0, 0, -signL * outR);
};
const sin = Math.sin, cos = Math.cos, PI = Math.PI, TAU = PI * 2;
/** Damped spring settling from 1 to 0 (overshoot) over u in 0..1. */
const settle = (u: number, k = 3) => (u <= 0 ? 1 : u >= 1 ? 0 : Math.exp(-4 * u) * cos(k * PI * u) * (1 - u));
const hump = (u: number) => (u <= 0 || u >= 1 ? 0 : sin(PI * u));

export const MOVES: Record<string, { fn: MoveFn; cyclic?: boolean; len?: (o: MoveOpts) => number }> = {
  /** Breathing, weight shift, slow ear/tail drift. */
  idle: {
    cyclic: true,
    fn: (P, _lt, t, w, o, cx) => {
      const s = cx.seed, a = o.amp ?? 1;
      const br = sin(TAU * (t / 3.4) + s);
      P.sq += w * a * 0.014 * br;
      P.y += w * a * 0.15 * br;
      add(P, 'torso', w * a, 0.02 * br, 0.04 * sin(t * 0.7 + s), 0.02 * sin(t * 0.5 + s));
      add(P, 'head', w * a, -0.03 * br, 0.08 * sin(t * 0.45 + s * 2), -0.03 * sin(t * 0.5 + s));
      pairZ(P, 'armL', 'armR', w * a, 0.06 + 0.04 * br);
      pairZ(P, 'earL', 'earR', w * a, 0.06 * sin(t * 1.3 + s), 0.06 * sin(t * 1.1 + s + 1), 1);
      add(P, 'tail', w * a, 0, 0.18 * sin(t * 1.1 + s), 0.1 * sin(t * 0.8 + s));
      add(P, 'wingL', w * a, 0, 0.08 * br, -0.06 * br);
      add(P, 'wingR', w * a, 0, -0.08 * br, 0.06 * br);
    },
  },
  /** Beat-synced groove: dip on the beat, sway on alternate beats, head nod, arm pumps, tail wag. */
  groove: {
    cyclic: true,
    fn: (P, _lt, t, w, o, cx) => {
      const b = cx.beat(t), ph = fract(b), e = (o.amp ?? 1) * cx.energy;
      const dip = Math.pow(1 - ph, 3); // 1 on the beat, decaying
      const sw = sin(PI * b); // alternates side every beat
      P.y += w * e * (-1.1 * dip + 0.4);
      P.sq += w * e * (-0.05 * dip + 0.02);
      P.roll += w * e * 0.05 * sw;
      P.x += w * e * 0.7 * sw;
      add(P, 'torso', w * e, 0.04 * dip, 0.1 * sw, 0);
      add(P, 'head', w * e, 0.14 * Math.pow(1 - fract(b - 0.12), 3), -0.08 * sw, -0.1 * sw);
      add(P, 'armL', w * e, -0.45 * Math.max(0, sw), 0, -0.12 - 0.15 * dip);
      add(P, 'armR', w * e, -0.45 * Math.max(0, -sw), 0, 0.12 + 0.15 * dip);
      add(P, 'legL', w * e, -0.18 * Math.max(0, sw));
      add(P, 'legR', w * e, -0.18 * Math.max(0, -sw));
      add(P, 'tail', w * e, 0, 0.3 * sin(PI * b - 0.7), 0.25 * sin(PI * b - 0.5));
      const f = (0.3 + 0.35 * e) * sin(PI * b);
      add(P, 'wingL', w, 0, f, -f * 0.5);
      add(P, 'wingR', w, 0, -f, f * 0.5);
    },
  },
  /** Walk cycle (rate = strides/s); run is the same with lean, bounce and bigger swings. travel moves +z. */
  walk: { cyclic: true, fn: (P, lt, t, w, o, cx) => gait(P, lt, t, w, o, cx, false) },
  run: { cyclic: true, fn: (P, lt, t, w, o, cx) => gait(P, lt, t, w, o, cx, true) },
  /** Jump: crouch (anticipation) -> stretch on take-off -> tuck at the apex -> squash on landing -> settle. */
  jump: {
    len: (o) => 0.16 + (o.air ?? 0.5) + 0.32,
    fn: (P, lt, _t, w, o) => {
      const A = 0.16, T = o.air ?? 0.5, L = 0.32, h = o.h ?? 10;
      if (lt < A) {
        const k = ease.inOutQuad(clamp(lt / A));
        P.y -= w * 2.2 * k; P.sq -= w * 0.2 * k;
        add(P, 'torso', w * k, 0.28); add(P, 'head', w * k, -0.18);
        add(P, 'armL', w * k, 0.7, 0, -0.2); add(P, 'armR', w * k, 0.7, 0, 0.2);
        pairZ(P, 'earL', 'earR', w * k, 0.25, 0.25, 1);
      } else if (lt < A + T) {
        const u = (lt - A) / T;
        P.y += w * (4 * h * u * (1 - u) - 2.2 * Math.max(0, 1 - u * 6));
        P.sq += w * (0.2 * Math.max(0, 1 - u * 2.5) - 0.2 * Math.max(0, 1 - u * 6) + 0.08 * smoothstep(0.7, 1, u));
        const up = hump(Math.min(1, u * 1.4));
        add(P, 'armL', w, -0.4 * up, 0, -2.3 * up); add(P, 'armR', w, -0.4 * up, 0, 2.3 * up);
        add(P, 'legL', w, -0.55 * hump(u)); add(P, 'legR', w, -0.4 * hump(u));
        add(P, 'torso', w, -0.12 * hump(u));
        add(P, 'tail', w, 0, 0, 0.5 * hump(u));
      } else if (lt < A + T + L) {
        const v = (lt - A - T) / L, s = settle(v, 2.2);
        P.sq += w * -0.26 * s;
        P.y -= w * 1.8 * Math.max(0, s);
        add(P, 'torso', w * Math.max(0, s), 0.3); add(P, 'head', w * s, 0.15);
        add(P, 'armL', w * s, 0, 0, -0.5); add(P, 'armR', w * s, 0, 0, 0.5);
        pairZ(P, 'earL', 'earR', w * s, 0.4, 0.4, 1);
      }
    },
  },
  /** Turn by `angle` (default pi) over dur: the head leads, the body follows, a small hop. Holds the angle. */
  turn: {
    fn: (P, lt, _t, w, o) => {
      const a = o.angle ?? PI, d = o.dur ?? 0.45;
      const hp = ease.outCubic(clamp(lt / (d * 0.6))), bp = ease.inOutCubic(clamp((lt - d * 0.15) / (d * 0.85)));
      P.yaw += w * (a * bp - a * 0.07 * hump(clamp(lt / (d * 0.3))));
      add(P, 'head', w, 0, a * 0.35 * (hp - bp), 0);
      P.y += w * 0.9 * hump(clamp(lt / d));
    },
  },
  /** Point / accuse: snap the arm forward with overshoot, lean in, hold, return. dur = hold length. */
  point: { len: (o) => (o.dur ?? 1.2) + 0.5, fn: (P, lt, _t, w, o) => pointFn(P, lt, w, o, false) },
  accuse: { len: (o) => (o.dur ?? 1.2) + 0.5, fn: (P, lt, _t, w, o) => pointFn(P, lt, w, o, true) },
  /** Punch: wind-up (arm back, shoulders twist away), strike with a lunge, recoil, recover. */
  punch: {
    len: () => 0.75,
    fn: (P, lt, _t, w, o) => {
      const R = (o.side ?? 'R') === 'R', sg = R ? 1 : -1, arm: Joint = R ? 'armR' : 'armL', other: Joint = R ? 'armL' : 'armR';
      const wind = ease.inOutQuad(clamp(lt / 0.14));
      const hit = ease.outCubic(clamp((lt - 0.14) / 0.07));
      const back = ease.inOutQuad(clamp((lt - 0.38) / 0.37));
      const k = (1 - back);
      const twist = sg * (0.4 * wind - 0.9 * hit) * k;
      add(P, 'torso', w, (0.1 * wind + 0.15 * hit) * k, twist, 0);
      add(P, arm, w, (0.9 * wind - 1.6 * hit) * k, 0, sg * (-0.2 * wind + 1.35 * hit) * k);
      add(P, other, w, (0.3 * hit) * k, 0, -sg * 0.35 * k);
      add(P, 'head', w, -0.1 * hit * k, -twist * 0.5, 0);
      P.z += w * 3.2 * hit * k; P.x += w * sg * 2.5 * hit * k; P.y -= w * 0.8 * wind * k; P.roll -= w * sg * 0.12 * hit * k;
      P.sq += w * (0.08 * hit - 0.06 * wind) * k;
      if (lt > 0.21 && lt < 0.45) P.x += w * 0.25 * sin((lt - 0.21) * 70) * (0.45 - lt) * 4; // impact shudder
    },
  },
  /** Sit down (slump 0) or slump (1): drop, legs forward, hunch, head and ears droop. Holds for dur. */
  sit: {
    len: (o) => (o.dur ?? 2) + 0.4,
    fn: (P, lt, _t, w, o) => {
      const d = o.dur ?? 2, sl = o.slump ?? 0;
      const k = ease.outCubic(clamp(lt / 0.5)) * (1 - ease.inOutQuad(clamp((lt - d) / 0.4))) + 0.12 * hump(clamp((lt - 0.35) / 0.3));
      P.y -= w * (o.h ?? 2.6) * k;
      add(P, 'legL', w * k, -1.45, 0, -0.12); add(P, 'legR', w * k, -1.45, 0, 0.12);
      add(P, 'torso', w * k, -0.1 + 0.3 * sl);
      add(P, 'head', w * k, 0.08 + 0.22 * sl);
      pairZ(P, 'armL', 'armR', w * k, -0.05 + 0.1 * sl);
      add(P, 'armL', w * k, -0.3 * (1 - sl)); add(P, 'armR', w * k, -0.3 * (1 - sl));
      pairZ(P, 'earL', 'earR', w * k, 0.15 + 0.55 * sl, 0.15 + 0.55 * sl, 1);
      add(P, 'tail', w * k, 0, -0.3, -0.4 * sl);
      add(P, 'wingL', w * k, 0, 0.3, 0.5 * sl); add(P, 'wingR', w * k, 0, -0.3, -0.5 * sl);
    },
  },
  /** Flight (Venmar): lift to h, wing beats (downstroke lifts the body), legs trail, lean into the air. */
  fly: {
    cyclic: true,
    fn: (P, lt, t, w, o) => {
      const f = o.rate ?? 2.4, ph = TAU * f * t, h = o.h ?? 8;
      const lift = ease.inOutCubic(clamp(lt / 0.6));
      const beat = sin(ph);
      P.y += w * (h * lift + 1.4 * sin(ph - PI / 2) * lift);
      P.sq += w * 0.04 * cos(ph);
      add(P, 'wingL', w, 0, -0.45 * cos(ph), 0.25 - 1.0 * beat);
      add(P, 'wingR', w, 0, 0.45 * cos(ph), -0.25 + 1.0 * beat);
      add(P, 'legL', w * lift, 0.55 + 0.1 * sin(ph - 1)); add(P, 'legR', w * lift, 0.45 + 0.1 * sin(ph - 1.3));
      add(P, 'torso', w * lift, 0.18); add(P, 'head', w * lift, -0.12);
      add(P, 'armL', w * lift, 0.35, 0, -0.15); add(P, 'armR', w * lift, 0.35, 0, 0.15);
      add(P, 'tail', w * lift, 0.3, 0, 0.3 * sin(ph - 1.2));
      pairZ(P, 'earL', 'earR', w * lift, -0.15, -0.15, 1); add(P, 'earL', w * lift, -0.35); add(P, 'earR', w * lift, -0.35);
    },
  },
  /** Tail swipe (Quest): wind the tail back, spin into a sweeping strike with a hop, settle. */
  swipe: {
    len: () => 0.8,
    fn: (P, lt, _t, w) => {
      const wind = ease.inOutQuad(clamp(lt / 0.2)), hit = ease.outCubic(clamp((lt - 0.2) / 0.15));
      const back = clamp((lt - 0.4) / 0.4), s = 1 - ease.inOutQuad(back);
      add(P, 'tail', w, 0, (0.7 * wind - 2.1 * hit) * s + 0.25 * settle(back) * hit, 0.4 * hit * s);
      P.yaw += w * (0.25 * wind - 0.75 * hit) * s;
      add(P, 'torso', w, 0, (0.2 * wind - 0.35 * hit) * s, 0);
      add(P, 'head', w, 0, (-0.25 * wind + 0.5 * hit) * s, 0);
      P.y += w * 1.6 * hump(clamp((lt - 0.17) / 0.3));
      add(P, 'armL', w * hit * s, 0, 0, -0.6); add(P, 'armR', w * hit * s, 0, 0, 0.6);
    },
  },
  /** A shocked recoil: rear back, arms up, ears flat, settle. */
  recoil: {
    len: () => 0.9,
    fn: (P, lt, _t, w) => {
      const k = ease.outCubic(clamp(lt / 0.12)) * (1 - ease.inOutQuad(clamp((lt - 0.4) / 0.5)));
      P.z -= w * 2.5 * k; P.y += w * 1.2 * hump(clamp(lt / 0.3)); P.sq += w * 0.1 * hump(clamp(lt / 0.25));
      add(P, 'torso', w * k, -0.3); add(P, 'head', w * k, -0.2);
      add(P, 'armL', w * k, -0.9, 0, -0.8); add(P, 'armR', w * k, -0.9, 0, 0.8);
      add(P, 'earL', w * k, -0.6); add(P, 'earR', w * k, -0.6);
    },
  },
};

function gait(P: RigPose, lt: number, t: number, w: number, o: MoveOpts, cx: MoveCtx, run: boolean) {
  const f = o.rate ?? (run ? 2.6 : 1.7), ph = TAU * f * t + cx.seed;
  const A = (o.amp ?? 1) * (run ? 1.0 : 0.55), s = sin(ph), c = cos(ph);
  add(P, 'legL', w, A * s); add(P, 'legR', w, -A * s);
  add(P, 'armL', w, -A * 0.9 * s, 0, run ? -0.25 : -0.08); add(P, 'armR', w, A * 0.9 * s, 0, run ? 0.25 : 0.08);
  const bob = Math.abs(c); // highest mid-stride, lowest at foot contact
  P.y += w * (run ? 1.8 : 0.7) * (bob - 0.5);
  P.sq += w * (run ? 0.06 : 0.025) * (bob - 0.6);
  add(P, 'torso', w, run ? 0.28 : 0.04, 0.1 * s, 0.03 * s);
  add(P, 'head', w, run ? -0.18 : 0, -0.06 * s, 0);
  add(P, 'tail', w, run ? 0.35 : 0, 0.35 * sin(ph - 0.9), 0.15 * sin(2 * ph - 1));
  if (run) { add(P, 'earL', w, -0.35); add(P, 'earR', w, -0.35); add(P, 'wingL', w, 0, 0.5, 0.4); add(P, 'wingR', w, 0, -0.5, -0.4); }
  P.z += w * (o.travel ?? 0) * lt;
}

function pointFn(P: RigPose, lt: number, w: number, o: MoveOpts, accuse: boolean) {
  const d = o.dur ?? 1.2, R = (o.side ?? 'R') === 'R', sg = R ? 1 : -1;
  const arm: Joint = R ? 'armR' : 'armL', other: Joint = R ? 'armL' : 'armR';
  const inn = clamp(lt / 0.16), out = ease.inOutQuad(clamp((lt - 0.16 - d) / 0.34));
  const k = ease.outBack(inn) * (1 - out);
  const jab = accuse ? 0.14 * sin((lt - 0.16) * 32) * Math.exp(-Math.max(0, lt - 0.16) * 5) * (lt > 0.16 ? 1 : 0) : 0;
  // the arm swings out to the side and forward (reads from the front as well as in profile)
  add(P, arm, w * k, -0.75 + jab, 0, sg * (1.45 + jab));
  add(P, 'torso', w * k, accuse ? 0.16 : 0.08, -sg * 0.3, sg * 0.08);
  P.yaw += w * k * sg * 0.35;
  add(P, 'head', w * k, accuse ? 0.1 : 0.04, sg * 0.1, 0);
  if (accuse) add(P, other, w * k, 0.35, 0, -sg * 0.55);
  add(P, 'earL', w * k, accuse ? 0.3 : 0.15); add(P, 'earR', w * k, accuse ? 0.3 : 0.15);
  P.z += w * k * (accuse ? 1.2 : 0.4);
}

// ------------------------------------------------------------------ layers -> pose
export interface Layer { name: string; t0: number; o: MoveOpts }

function evalLayers(layers: Layer[], t: number, cx: MoveCtx): RigPose {
  const P = restPose();
  for (const L of layers) {
    const m = MOVES[L.name];
    if (!m) continue;
    const lt = t - L.t0;
    if (lt < 0) continue;
    let w = L.o.w ?? 1;
    if (m.cyclic) {
      const fd = L.o.fade ?? 0.25;
      w *= L.o.dur !== undefined ? window01(lt, 0, L.o.dur, fd, fd) : L.t0 === -1e9 ? 1 : clamp(lt / fd);
    } else if (m.len && lt > m.len(L.o) && L.name !== 'turn') continue;
    if (w <= 0) continue;
    m.fn(P, lt, t, w, L.o, cx);
  }
  return P;
}

/** The final pose at t: the layers, blinks, the jaw on the vocal, and delayed follow-through on ears/tail. */
export function rigPose(layers: Layer[], t: number, cx: MoveCtx): RigPose {
  const P = evalLayers(layers, t, cx);
  const d = 1 / 15;
  const A = evalLayers(layers, t - d * 0.8, cx), B = evalLayers(layers, t - d * 1.8, cx);
  const vy = (A.y - B.y) / d, vyaw = (A.yaw - B.yaw) / d, vroll = (A.roll - B.roll) / d + (A.j.torso[2] - B.j.torso[2]) / d;
  const vx = (A.x - B.x) / d, vz = (A.z - B.z) / d, vhead = (A.j.head[0] - B.j.head[0]) / d;
  const ear = clamp(-vy * 0.012 - vhead * 0.05 - vz * 0.01, -0.6, 0.6);
  add(P, 'earL', 1, ear, 0, clamp(vroll * 0.08 + vx * 0.006, -0.4, 0.4));
  add(P, 'earR', 1, ear, 0, clamp(vroll * 0.08 + vx * 0.006, -0.4, 0.4));
  add(P, 'tail', 1, clamp(-vz * 0.01, -0.4, 0.4), clamp(-vyaw * 0.22 - vx * 0.01, -0.8, 0.8), clamp(-vy * 0.01, -0.5, 0.5));
  // blinks: every ~2.8-4 s (seeded), sometimes a double blink
  const per = 3.1 + (cx.seed % 3) * 0.37, bt = (t + cx.seed * 1.3) % per;
  P.blink = bt < 0.12 || (cx.seed % 2 === 1 && Math.floor((t + cx.seed * 1.3) / per) % 3 === 0 && bt > 0.22 && bt < 0.32) ? 1 : 0;
  if (cx.sing) {
    const v = cx.vocal(t);
    P.mouth = Math.max(P.mouth, smoothstep(0.2, 0.6, v));
    add(P, 'head', 1, -0.07 * smoothstep(0.3, 0.8, v));
  }
  return P;
}
