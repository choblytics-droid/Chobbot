import { hexToLinear } from './util';

// Palette. The first block is pdoom-video's (ink / bone / signal); the second is the song cover's
// world (night blue stone, magenta and cyan neon, rust, ghost white) used by the version-B plates.
export const HEX = {
  ink: '#0A0A0B', // background black (slightly warm)
  ink2: '#151517', // raised black (panels, paper-in-the-dark)
  graphite: '#5E5B57', // dim lines, secondary text
  ash: '#9C978F', // mid grey
  bone: '#EEE9DF', // paper white, primary text
  signal: '#FF4D12', // hazard orange: the spark, the fuse, P(doom)
  ember: '#FF8A3D', // hotter, lighter orange for cores/highlights
  blood: '#C21D0B', // deep red-orange for shadows of signal
  acid: '#D8FF3C', // acid: only for the shrooms moment
  // ---- the cover's world (version B, cover-art take): a rainy neon alley at night
  night: '#0A0C1C', // sky / deepest shadow (blue-black)
  stone: '#2B2E4A', // wet stone, lit by the night
  stone2: '#454A70', // stone in neon light
  mist: '#7C7FB0', // fog, far facades
  magenta: '#FF3FB4', // neon sign (pink-magenta)
  violet: '#A64DFF', // neon haze
  cyan: '#39E8FF', // neon sign (cyan), the ghost's glow
  rust: '#C4561F', // the door's rust (ferrugem)
  rustDark: '#5E2410', // pitted rust
  rustLite: '#E8914A', // fresh rust, embers
  ghost: '#EAF6FF', // the ghost's sheet
} as const;

export type PaletteKey = keyof typeof HEX;

/** Linear RGB triplets for GL uniforms. */
export const LIN: Record<PaletteKey, [number, number, number]> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, hexToLinear(v)]),
) as Record<PaletteKey, [number, number, number]>;

/** CSS rgba() for Canvas2D. */
export function rgba(key: PaletteKey | string, a = 1): string {
  const hex = (HEX as Record<string, string>)[key] ?? key;
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
