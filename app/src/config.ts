// Global switches. RIG picks the character rig:
//   'v1' = the first video's flat extruded sprites (ferrugem-v2.mp4); render it with --rig v1
//   'v2' = sculpted, jointed voxel rig, movement library, lighting/atmosphere, text halo, lyric fixes (default)
// Override per run with ?rig=v1|v2 (render.ts --rig v2). ?lab=1 swaps the timeline for the rig lab sheet.
export type RigVersion = 'v1' | 'v2';
export const DEFAULT_RIG: RigVersion = 'v2';

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const RIG: RigVersion = q.get('rig') === 'v2' ? 'v2' : q.get('rig') === 'v1' ? 'v1' : DEFAULT_RIG;
export const V2 = RIG === 'v2';
/** Rig lab (contact sheets): ?lab=1. Venmar's leg option for the lab and v2: ?legs=a|b. */
export const LAB = q.has('lab');
export const LEGS: 'a' | 'b' = q.get('legs') === 'a' ? 'a' : 'b';
