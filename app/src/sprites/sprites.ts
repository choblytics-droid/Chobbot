// The two main characters as 32x32 pixel sprites (rebuilt from the client's art, sampled from the
// reference sheet): Venmar (singer A, blue dragon-cat with bat wings) and Quest (singer B, orange fox).
// One char per pixel, '.' = empty; palettes are sRGB hex. Pose variants (blink, open mouth) are
// pixel patches; moving parts (wings, tail, arms) are masks the voxel builder splits into hinged groups.

export type PartName = 'body' | 'wingL' | 'wingR' | 'tail' | 'armL' | 'armR';

export interface SpriteDef {
  name: string;
  rows: string[];
  pal: Record<string, string>;
  /** Palette keys that glow (emissive) in 3D. */
  emissive: Record<string, number>;
  /** Which part a pixel belongs to (default body). */
  part: (col: number, row: number) => PartName;
  /** Hinge (col, row) of each moving part in pixel coords. */
  hinge: Partial<Record<PartName, [number, number]>>;
  /** Pixel patches: closed eyes, open mouth. [col, row, key] ('.' clears). */
  blink: [number, number, string][];
  mouth: [number, number, string][];
  /** Accent colour key for UI (palette.ts). */
  accent: string;
}

const VENMAR_ROWS = [
    '................................',
    '.......a................a.......',
    '.......aa.........a....aa.......',
    '.......aba.....a..a...aba.......',
    '......abcba....a.aa..abcba......',
    '......abccaa...a.aa.aaccba......',
    '......abcadaaaacaeaaadacba......',
    '......abcadfaacceecaadfcbgg.....',
    '......aaaadfaccceecaadfaaa......',
    '......abbadfaccceecaadfbbgg.....',
    '.....abbbbbbacaaacaabbbbbba.....',
    '.....abbbbaababbbabbaabbbba.....',
    '....abbbbacaabbbbbbacaabbbba....',
    '....abbbbaaaabhbbhbaaaabbhha....',
    '....abbbbaiiabbbbbbaiiabbhha....',
    '...aabbbbbaabbbbbbbbaabbhhbaa...',
    '.aabhajjbbbbbbbaabbbbbbbjjahbaa.',
    '.abhhabbbbbbbbbbbbbbbbbhhhahhba.',
    '.abbhhabbbbbbbbbbbbbbbbhhahhbba.',
    'abbbbbhaabbbbbbbbbbbbbhaahbbbbba',
    'acbabbbhbaaabbbbbbbbaaabhbbbabca',
    'aaa.abababbbaaaaaaaabbbababa.aaa',
    '..a.aababbbbabccccbabbbba.aa.a..',
    '...abababbbbabccccbabbbba.a.....',
    '..acbbbabbbbabccccbabbbba.......',
    '.acccbbaccccabccccbacccca.......',
    'acccccbaccccabccccbacccca.......',
    'acccccbbaccabbccccbbacca........',
    'acccccbbbaaabbccccbbaaa.........',
    '.acccbbbbbaaabccccbaa...........',
    '..aabbbbba.abaaaaaaba...........',
    '....aaaaa..aaaa..aaaa...........',
];

export const VENMAR: SpriteDef = {
  name: 'VENMAR',
  accent: 'cyan',
  rows: VENMAR_ROWS,
  pal: {
    a: '#16264f', b: '#43c1ee', c: '#ffffff', d: '#3fe03a', e: '#8fd8f6',
    f: '#25a42c', g: '#f6c21c', h: '#2c8fd1', i: '#3a86e8', j: '#f59ab4',
    k: '#0b1430', // mouth interior (pose patch only)
  },
  emissive: { d: 0.6, g: 0.9, i: 0.35, e: 0.25 },
  part: (c, r) => {
    if (r >= 15 && r <= 22 && c <= 3) return 'wingL';
    if (r >= 15 && r <= 22 && c >= 28) return 'wingR';
    if (r >= 22 && c <= 6) return 'tail';
    return 'body';
  },
  hinge: { wingL: [4, 19], wingR: [27, 19], tail: [7, 27] },
  blink: eyePatch(VENMAR_ROWS, [11, 15], [[9, 12], [19, 22]], 'b', 13, 'a', 'aci'),
  mouth: [
    [14, 16, 'a'], [15, 16, 'k'], [16, 16, 'k'], [17, 16, 'a'],
    [14, 17, 'a'], [15, 17, 'f'], [16, 17, 'f'], [17, 17, 'a'],
    [15, 18, 'a'], [16, 18, 'a'],
  ],
};

const QUEST_ROWS = [
    '................................',
    '.......a................a.......',
    '.......aa..............aa.......',
    '.......aaa........a...aaa.......',
    '......aabaa......aa..aabaa......',
    '......aabbaa.a...aa.aabbaa......',
    '......aabbbaaaaaaccaabbbaa......',
    '......aabaaaaddaddcaaaabaa......',
    '......aaacccadddddddaccaaa......',
    '......accccaddddddddacccca......',
    '.....acccccaadddaaaaaacccea.....',
    '.....accfcffcaaaccccffcfcea.....',
    '....accccfbffccccccfbffcceea....',
    '....accccffffccccccffffceeeaa...',
    '....accccfggfccccccfggfceeeaha..',
    '....acccccffccccccccffcccccahha.',
    '...a.ahhhhccccceeccccchhhhahaha.',
    '....aahhhiicccchhcccciihhjaahha.',
    '......ahhhhhhhhhhhhhhhhhjahhhha.',
    '.......aahhhhhhhhhhhhhjaahhhha..',
    '.........aaahhhhhhhhaaaccchhha..',
    '........acccaaaaaaaacccacccccca.',
    '.......aaaaaachhhhcaaaaaaccccca.',
    '.......accccachhhhcaccccaccccca.',
    '.......aaaaaachhhhcaaaaaaccccca.',
    '.......aaaaaachhhhcaaaaaaccccca.',
    '.......aaaaaachhhhcaaaaaacccca..',
    '........akaacchhhhccaakaccccca..',
    '.........aaacchhhhccaaaeeccca...',
    '...........aachhhhcaa.aaeeeaa...',
    '...........aaaaaaaaaa...aaa.....',
    '...........aaaa..aaaa...........',
];

export const QUEST: SpriteDef = {
  name: 'QUEST',
  accent: 'signal',
  rows: QUEST_ROWS,
  pal: {
    a: '#221c20', b: '#ffffff', c: '#ff5a1c', d: '#b32a14', e: '#d7461d', f: '#183d27',
    g: '#43c84a', h: '#fdf8f0', i: '#80d0e8', j: '#e8ddd0', k: '#1a8fb3',
    m: '#12090b', // mouth interior (pose patch only)
  },
  emissive: { g: 0.7, k: 0.8, i: 0.2 },
  part: (c, r) => {
    if (r >= 14 && r <= 29 && c >= 25) return 'tail';
    if (r >= 21 && r <= 28 && c >= 7 && c <= 12) return 'armL';
    if (r >= 21 && r <= 28 && c >= 19 && c <= 24) return 'armR';
    return 'body';
  },
  hinge: { tail: [25, 25], armL: [10, 21], armR: [21, 21] },
  blink: eyePatch(QUEST_ROWS, [11, 15], [[8, 12], [19, 23]], 'c', 13, 'a', 'fgb'),
  mouth: [
    [14, 17, 'a'], [15, 17, 'm'], [16, 17, 'm'], [17, 17, 'a'],
    [14, 18, 'a'], [15, 18, 'k'], [16, 18, 'k'], [17, 18, 'a'],
    [15, 19, 'a'], [16, 19, 'a'],
  ],
};


/** Closed-eye patch: pixels of `keys` inside the eye boxes become `fill`, and row `lidRow` becomes the lid line. */
function eyePatch(rows: string[], [r0, r1]: [number, number], boxes: [number, number][], fill: string, lidRow: number, lid: string, keys: string) {
  const out: [number, number, string][] = [];
  for (const [c0, c1] of boxes)
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) {
        const k = rows[r]![c]!;
        if (r === lidRow) out.push([c, r, lid]);
        else if (keys.includes(k)) out.push([c, r, fill]);
      }
  return out;
}


// "Him": the one the song is about, never a real character — a faceless hooded shadow with red eyes.
const SHADOW_ROWS = [
  '................................',
  '................................',
  '............ccccccc.............',
  '..........ccaaaaaaacc...........',
  '.........caaaaaaaaaaac..........',
  '........caaaaaaaaaaaaac.........',
  '........caaabbbbbbbaaaa.........',
  '.......caabbbbbbbbbbbaaa........',
  '.......cabbbbbbbbbbbbbaa........',
  '.......cabbrrbbbbbrrbbaa........',
  '.......cabbrrbbbbbrrbbaa........',
  '.......cabbbbbbbbbbbbbaa........',
  '.......caabbbbbbbbbbbaaa........',
  '........caabbbbbbbbbaaa.........',
  '.......caaaaaaaaaaaaaaaa........',
  '......caaaaaaaaaaaaaaaaaa.......',
  '.....caaaaaaaaaaaaaaaaaaaa......',
  '....caaaaaaaaaaaaaaaaaaaaaa.....',
  '....caaaaaaaaaaaaaaaaaaaaaa.....',
  '...caaaaaaaaaaaaaaaaaaaaaaaa....',
  '...caaaaaaaaaaaaaaaaaaaaaaaa....',
  '...caaaaaaaaaaaaaaaaaaaaaaaa....',
  '....caaaaaaaaaaaaaaaaaaaaaa.....',
  '....caaaaaaaaaaaaaaaaaaaaaa.....',
  '....caaaaaaaaaaaaaaaaaaaaaa.....',
  '.....caaaaaaaaaaaaaaaaaaaa......',
  '.....caaaaaaaaaaaaaaaaaaaa......',
  '.....caaaaaaaa...aaaaaaaaa......',
  '......caaaaaa.....aaaaaaa.......',
  '......caaaaaa.....aaaaaaa.......',
  '.....caaaaaaa.....aaaaaaaa......',
  '................................',
];

export const SHADOW: SpriteDef = {
  name: 'HIM',
  accent: 'blood',
  rows: SHADOW_ROWS,
  pal: { a: '#0b0a14', b: '#000000', c: '#262238', r: '#ff2030' },
  emissive: { r: 3.0 },
  part: () => 'body',
  hinge: {},
  blink: eyePatch(SHADOW_ROWS, [9, 10], [[11, 12], [18, 19]], 'b', 99, 'b', 'r'),
  mouth: [],
};

export const CHARS = { venmar: VENMAR, quest: QUEST, shadow: SHADOW };

/** Pixel grid of a pose (rows as char arrays) with optional blink/mouth patches applied. */
export function poseGrid(def: SpriteDef, o: { blink?: boolean; mouth?: boolean } = {}): string[][] {
  const g = def.rows.map((r) => r.split(''));
  if (o.blink) for (const [c, r, k] of def.blink) if (g[r]![c] !== '.') g[r]![c] = k;
  if (o.mouth) for (const [c, r, k] of def.mouth) g[r]![c] = k;
  return g;
}

/** Draw a sprite pose on a Canvas2D at (x, y) = top-left, `px` screen px per pixel. */
export function drawSprite(c: CanvasRenderingContext2D, def: SpriteDef, x: number, y: number, px: number, o: { blink?: boolean; mouth?: boolean; flip?: boolean; tint?: string; tintA?: number; alpha?: number } = {}) {
  const g = poseGrid(def, o);
  const base = c.globalAlpha;
  c.save();
  c.globalAlpha = base * (o.alpha ?? 1);
  for (let r = 0; r < 32; r++) {
    for (let col = 0; col < 32; col++) {
      const k = g[r]![o.flip ? 31 - col : col]!;
      if (k === '.') continue;
      c.fillStyle = o.tint && (o.tintA ?? 1) >= 1 ? o.tint : def.pal[k]!;
      c.fillRect(x + col * px, y + r * px, px + 0.5, px + 0.5);
      if (o.tint && (o.tintA ?? 1) < 1 && (o.tintA ?? 0) > 0) {
        c.globalAlpha = base * (o.alpha ?? 1) * o.tintA!;
        c.fillStyle = o.tint;
        c.fillRect(x + col * px, y + r * px, px + 0.5, px + 0.5);
        c.globalAlpha = base * (o.alpha ?? 1);
      }
    }
  }
  c.restore();
}
