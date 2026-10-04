// Music analysis (films/<film>/data/audio.json + scope.bin) sampled at arbitrary clip time.
import { FILM_DIR } from './scale';

export interface AudioJSON {
  duration: number;
  bpm: number;
  fps: number;
  beats: number[];
  downbeats: number[];
  sections: { name: string; start: number; end: number }[];
  features: Record<string, number[]>;
  onsets: Record<string, [number, number][]>;
  drop: number;
  breaks: number[];
  song_offset: number;
  /** The master audio file, relative to the film folder (default audio/track.wav). */
  audio?: string;
  scope: { file: string; specFrames: number; specBands: number; specFps: number; waveRate: number; waveLen: number };
}

export interface AudioSample {
  rms: number; low: number; mid: number; high: number; bell: number;
  /** Decaying pulses (1 at the hit, half-life ~60-140 ms), scaled by hit strength. */
  kick: number; snare: number; hat: number; bellHit: number;
}

const FEATURES = ['rms', 'low', 'mid', 'high', 'bell'] as const;

export class AudioData {
  duration: number;
  bpm: number;
  beats: number[];
  downbeats: number[];
  sections: { name: string; start: number; end: number }[];
  private fps: number;
  private feat: Record<string, Float32Array> = {};
  onsets: Record<string, [number, number][]>;
  drop: number;
  breaks: number[];
  songOffset: number;
  /** The master audio file, relative to the film folder. */
  file: string;
  /** Log spectrum, frames x bands (0..1), and the min/max waveform at waveRate (-1..1). */
  spec: Float32Array = new Float32Array(0);
  specBands = 48;
  specFps = 100;
  waveMin: Float32Array = new Float32Array(0);
  waveMax: Float32Array = new Float32Array(0);
  waveRate = 1000;

  constructor(j: AudioJSON) {
    this.duration = j.duration;
    this.bpm = j.bpm;
    this.beats = j.beats;
    this.downbeats = j.downbeats;
    this.sections = j.sections;
    this.fps = j.fps || 100;
    // envelopes may be nested under `features` or top-level arrays
    for (const k of FEATURES) this.feat[k] = Float32Array.from(j.features?.[k] ?? ((j as any)[k] as number[] | undefined) ?? []);
    this.onsets = j.onsets ?? {};
    this.drop = j.drop;
    this.breaks = j.breaks ?? [];
    this.songOffset = j.song_offset ?? 0;
    this.file = j.audio ?? 'audio/track.wav';
  }

  static async load(): Promise<AudioData> {
    for (const url of [`${FILM_DIR}/data/audio.json`]) {
      const r = await fetch(url);
      if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) {
        const j = (await r.json()) as AudioJSON;
        const a = new AudioData(j);
        const s = j.scope;
        const b = new Uint8Array(await (await fetch(`${FILM_DIR}/${s.file}`)).arrayBuffer());
        const ns = s.specFrames * s.specBands;
        a.spec = Float32Array.from(b.subarray(0, ns), (v) => v / 255);
        a.waveMin = Float32Array.from(b.subarray(ns, ns + s.waveLen), (v) => v / 127.5 - 1);
        a.waveMax = Float32Array.from(b.subarray(ns + s.waveLen, ns + 2 * s.waveLen), (v) => v / 127.5 - 1);
        a.specBands = s.specBands; a.specFps = s.specFps; a.waveRate = s.waveRate;
        return a;
      }
    }
    throw new Error('no audio analysis data found');
  }

  /** Linear-interpolated envelope value at time t. */
  env(name: string, t: number): number {
    const a = this.feat[name];
    if (!a || a.length === 0) return 0;
    const x = t * this.fps;
    const i = Math.floor(x);
    if (i < 0) return a[0]!;
    if (i >= a.length - 1) return a[a.length - 1]!;
    const f = x - i;
    return a[i]! * (1 - f) + a[i + 1]! * f;
  }

  /** Max over [t - w, t]: a peak-hold for punchy reactions. */
  envPeak(name: string, t: number, w = 0.08): number {
    let m = 0;
    for (let s = t - w; s <= t; s += 1 / this.fps) m = Math.max(m, this.env(name, s));
    return m;
  }

  /** Sum of decaying pulses from onsets of a kind (kick/snare/hat/vocal) before t. */
  hit(kind: string, t: number, halfLife = 0.11): number {
    const list = this.onsets[kind];
    if (!list || list.length === 0) return 0;
    let lo = 0, hi = list.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (list[m]![0] <= t) lo = m + 1; else hi = m; }
    let v = 0;
    for (let i = lo - 1; i >= 0 && i >= lo - 6; i--) {
      const [ot, s] = list[i]!;
      const dt = t - ot;
      if (dt > halfLife * 8) break;
      v = Math.max(v, s * Math.pow(0.5, dt / halfLife));
    }
    return v;
  }

  /** Onset events of a kind in [t0, t1). */
  events(kind: string, t0: number, t1: number): [number, number][] {
    return (this.onsets[kind] ?? []).filter(([t]) => t >= t0 && t < t1);
  }

  sample(t: number): AudioSample {
    return {
      rms: this.env('rms', t), low: this.env('low', t), mid: this.env('mid', t), high: this.env('high', t), bell: this.env('bell', t),
      kick: this.hit('kick', t, 0.12), snare: this.hit('snare', t, 0.14), hat: this.hit('hat', t, 0.06),
      bellHit: this.hit('bell', t, 0.09),
    };
  }

  /** Continuous beat index: 0 at first beat, fractional in between (extrapolated outside). */
  beatAt(t: number): number {
    const b = this.beats;
    if (b.length < 2) return t * (this.bpm / 60);
    if (t <= b[0]!) return (t - b[0]!) / (b[1]! - b[0]!);
    if (t >= b[b.length - 1]!) {
      const p = b[b.length - 1]! - b[b.length - 2]!;
      return b.length - 1 + (t - b[b.length - 1]!) / p;
    }
    let lo = 0, hi = b.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (b[m]! <= t) lo = m; else hi = m; }
    return lo + (t - b[lo]!) / (b[hi]! - b[lo]!);
  }

  /** Time of (fractional) beat index. */
  timeOfBeat(i: number): number {
    const b = this.beats;
    const n = b.length;
    const period = n > 1 ? (b[n - 1]! - b[0]!) / (n - 1) : 60 / this.bpm;
    if (i <= 0) return (b[0] ?? 0) + i * period;
    if (i >= n - 1) return b[n - 1]! + (i - (n - 1)) * period;
    const k = Math.floor(i);
    return b[k]! + (b[k + 1]! - b[k]!) * (i - k);
  }

  /** Continuous bar index from downbeats (0 at first downbeat). */
  barAt(t: number): number {
    const d = this.downbeats;
    if (d.length < 2) return this.beatAt(t) / 4;
    if (t <= d[0]!) return (t - d[0]!) / (d[1]! - d[0]!);
    if (t >= d[d.length - 1]!) {
      const p = d[d.length - 1]! - d[d.length - 2]!;
      return d.length - 1 + (t - d[d.length - 1]!) / p;
    }
    let lo = 0, hi = d.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d[m]! <= t) lo = m; else hi = m; }
    return lo + (t - d[lo]!) / (d[hi]! - d[lo]!);
  }

  /** Nearest beat time to t. */
  nearestBeat(t: number): number {
    return this.timeOfBeat(Math.round(this.beatAt(t)));
  }

  /** Spectrum band b (0 = 40 Hz .. specBands-1 = 16 kHz) at time t, 0..1 (linear-interpolated in time). */
  specAt(t: number, b: number): number {
    const n = this.spec.length / this.specBands;
    if (n === 0) return 0;
    const x = Math.max(0, Math.min(n - 1.001, t * this.specFps));
    const i = Math.floor(x), f = x - i;
    return this.spec[i * this.specBands + b]! * (1 - f) + this.spec[(i + 1) * this.specBands + b]! * f;
  }

  /** Waveform envelope [min, max] (-1..1) at time t. */
  waveAt(t: number): [number, number] {
    const i = Math.max(0, Math.min(this.waveMin.length - 1, Math.round(t * this.waveRate)));
    return [this.waveMin[i] ?? 0, this.waveMax[i] ?? 0];
  }

  section(t: number) {
    return this.sections.find((s) => t >= s.start && t < s.end) ?? this.sections[this.sections.length - 1];
  }
}
