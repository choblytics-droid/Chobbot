import { hexToLinear } from './util';

// "Ferrugem na Fenda" palette: a rusted night city split by a rift of light.
// The two singers own the two poles of a teal/orange grade: Venmar (singer A) is cyan,
// Quest (singer B) is hazard orange. Rust and navy hold everything together; the
// infection green (Venmar's ear) and cowbell gold are rare accents.
export const HEX = {
  ink: '#05060F', // night black (blue-black)
  ink2: '#0D1024', // raised night (panels, fog floor)
  graphite: '#2A2F4A', // dim structure
  ash: '#7A7F9A', // mid grey-blue
  bone: '#F3EEE4', // paper white, primary type
  signal: '#FF5A1C', // Quest orange (the spark)
  ember: '#FFA14A', // hot core of orange
  blood: '#B32A14', // deep rust-red
  acid: '#3FE03A', // infection green (Venmar's ear)
  cyan: '#43C1EE', // Venmar blue
  ice: '#8FD8F6', // Venmar highlight
  navy: '#16264F', // Venmar outline
  deep: '#2C8FD1', // Venmar shade
  gold: '#F6C21C', // cowbell gold
  rust: '#8A3B12', // rust
  rose: '#F59AB4', // blush
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
