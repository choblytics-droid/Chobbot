import { hexToLinear } from './util';

// Brand palette. PLACEHOLDER values until the web design's tokens land: change them here and every
// shot follows (GLSL constants C_*, LIN for GL, rgba() for Canvas2D all derive from this table).
//
// Rules (docs/SERIES.md): only `signal` (the brand accent) and `ember` glow (> ~0.85 linear).
// Pain is cold (frost / steel / night), the answer is warm (signal / ember). `alert` is for spam and
// toxicity only.
export const HEX = {
  ink: '#0B0B0E', // background black
  ink2: '#16161B', // raised black: panels, chat cards in the dark
  graphite: '#5B5E66', // dim lines, secondary text
  ash: '#9A9DA6', // mid grey, unsent / unread text
  bone: '#F1EEE8', // primary text, paper
  signal: '#FFB224', // BRAND ACCENT (placeholder): the companion, the answer, the glow
  ember: '#FFE1A6', // hot core of the accent
  blood: '#B5560E', // deep shade of the accent
  frost: '#8EA6C2', // cold monitor light: the pain
  steel: '#2A3442', // cold shadow
  night: '#07090D', // deepest room shadow
  alert: '#E5484D', // spam, toxicity, errors
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
