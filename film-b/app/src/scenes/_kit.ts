// Shared scene kit: beat-grid helpers, the spark, and the small mono annotation voice.
// Every plate uses these so the recurring pieces look identical across the film.
import type { AudioData } from '../engine/audio';
import { LineBatch } from '../engine/lines';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { hash, TAU } from '../engine/util';

export type P2 = { x: number; y: number };

/** Beat index counted from the clip's first downbeat (0 at t = 0), continuous. */
export const beatNo = (au: AudioData, t: number) => au.beatAt(t) - au.beatAt(0);
/** Clip time of beat k (counted from the clip's first downbeat). */
export const beatT = (au: AudioData, k: number) => au.timeOfBeat(k + au.beatAt(0));

/** Onsets of a kind inside [t0, t1), as {t, s}. */
export const hits = (au: AudioData, kind: string, t0: number, t1: number) =>
  au.events(kind, t0, t1).map(([t, s]) => ({ t, s }));

/** The last onset time of `kind` at or before t (or -inf). */
export function lastHit(au: AudioData, kind: string, t: number, since = -Infinity) {
  let r = -Infinity;
  for (const [ot] of au.onsets[kind] ?? []) { if (ot > t) break; if (ot >= since) r = ot; }
  return r;
}

const L = (k: keyof typeof LIN, m: number): [number, number, number] => [LIN[k][0] * m, LIN[k][1] * m, LIN[k][2] * m];

/** The spark head: white-hot core, ember ring, orange halo and four flickering rays (2D additive LineBatch). */
export function sparkHead(lb: LineBatch, x: number, y: number, t: number, scale = 1, intensity = 1) {
  const flick = 0.85 + 0.15 * Math.sin(t * 91.7) * Math.sin(t * 57.3);
  const I = intensity * flick;
  lb.seg2(x, y, x + 0.01, y, 34 * scale, L('signal', 0.45 * I), 0.35);
  lb.seg2(x, y, x + 0.01, y, 15 * scale, L('ember', 2.5 * I), 0.8);
  lb.seg2(x, y, x + 0.01, y, 6 * scale, [6 * I, 5 * I, 4 * I], 1);
  for (let i = 0; i < 4; i++) {
    const a = i * (TAU / 4) + t * 3 + 0.4;
    const r = (11 + 6 * hash(Math.floor(t * 30), i)) * scale;
    lb.seg2(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, 1.4 * scale, [3 * I, 1.2 * I, 0.4 * I], 0.8);
  }
}

/**
 * Sputtering particles for a spark whose head is at headAt(t). Deterministic: particles are born on
 * a fixed clock with hashed velocities, so any sub-frame time gives the same particles.
 */
export function sparkParticles(lb: LineBatch, t: number, headAt: (t: number) => P2 | null, o: { rate?: number; life?: number; speed?: number; gravity?: number; intensity?: number; seed?: number; width?: number } = {}) {
  const life = o.life ?? 0.45, speed = o.speed ?? 300, g = o.gravity ?? 600, I = o.intensity ?? 1, seed = o.seed ?? 1, rate = o.rate ?? 90;
  const n0 = Math.floor((t - life) * rate), n1 = Math.floor(t * rate);
  for (let n = n0; n <= n1; n++) {
    const tb = n / rate;
    if (tb > t) continue;
    const age = t - tb;
    const h = headAt(tb);
    if (!h) continue;
    const a = hash(n, seed) * TAU, sp = speed * (0.25 + hash(n, seed + 1) ** 2 * 1.2);
    const lf = life * (0.35 + 0.65 * hash(n, seed + 2));
    if (age > lf) continue;
    const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp - speed * 0.3;
    const at = (u: number) => ({ x: h.x + vx * u, y: h.y + vy * u + 0.5 * g * u * u });
    const p0 = at(Math.max(0, age - 0.018)), p1 = at(age);
    const k = 1 - age / lf, heat = k * k;
    lb.seg2(p0.x, p0.y, p1.x, p1.y, (o.width ?? 1.8) * (0.5 + k * 0.7), [
      (LIN.signal[0] + (1 - LIN.signal[0]) * heat) * 2.2 * I,
      (LIN.signal[1] + (0.8 - LIN.signal[1]) * heat) * 2.2 * I,
      (LIN.signal[2] + (0.5 - LIN.signal[2]) * heat) * 2.2 * I,
    ], Math.min(1, k * 1.4));
  }
}

/** Mono annotation (IBM Plex Mono): the film's machine voice for labels and readouts. */
export function mono(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: { size?: number; col?: string; a?: number; weight?: number; align?: CanvasTextAlign } = {}) {
  c.font = font(F.mono(o.weight ?? 400), o.size ?? 22);
  c.textAlign = o.align ?? 'left';
  c.fillStyle = rgba(o.col ?? 'bone', o.a ?? 0.7);
  c.fillText(s, x, y);
  c.textAlign = 'left';
}

/** mm:ss.mmm clip timecode (quantised to the output frame so it never double-exposes in motion blur). */
export const timecode = (t: number) => {
  const q = Math.max(0, Math.round(t * 60) / 60);
  const m = Math.floor(q / 60), s = q - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
};

export const CAP = 0.686; // Archivo cap height / em
