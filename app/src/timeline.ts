// The edit: which scene plays when. Boundaries are anchored to lyric lines and snapped to the
// beat grid (data/lyrics.json, data/audio.json), so they follow the aligned data.
//
// Structure (Ferrugem na Fenda x Cowbell Infection, 132.9 BPM, 2:46):
//   intro · verse A1 (Venmar) · verse A2 · break · verse B1 (Quest) · verse B2 · break ·
//   verse A3 (Venmar) · chant (both) · outro (Quest)
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  /** Cut on the last beat at/before the first word of the matching line. */
  const cut = (q: string, nth = 0, tol = 0.02) => {
    const s = ly.get(q, nth).words[0]!.start;
    return au.timeOfBeat(Math.floor(au.beatAt(s + tol)));
  };
  /** Nearest downbeat to t. */
  const db = (t: number) => au.downbeats.reduce((b, d) => (Math.abs(d - t) < Math.abs(b - t) ? d : b), au.downbeats[0] ?? t);
  const sec = (name: string) => au.sections.find((x) => x.name === name)!;

  const b = {
    run: sec('verseA1').start,
    fortress: cut('building a fortress'),
    throne: cut('He told you everything'),
    ghost: cut('He told me everything', 0),
    swap: db(ly.get('barely survive').end + 0.2),
    infection: cut('talking loud'),
    bridge: cut('Burning every bridge'),
    arcade: cut('But every word'),
    mirror: cut('You look at me'),
    night: cut('He told me everything', 1),
    duo: db(ly.get('stealing his light').end + 0.3),
    del: cut('Destroy my contact'),
    faces: cut('terrified of me'),
    kaiju: cut('proud of the monster'),
    chant: cut('Bad things'),
    outro: cut('Only the bad things'),
    end: au.duration,
  };

  const E = (id: string, file: string, start: number, end: number, extra: Partial<TimelineEntry> = {}): TimelineEntry =>
    ({ id, load: scene(file), start, end, ...extra });

  return [
    E('intro', 'intro', 0, b.run),
    E('run', 'run', b.run, b.fortress),
    E('fortress', 'fortress', b.fortress, b.throne),
    E('throne', 'throne', b.throne, b.ghost),
    E('ghost', 'ghost', b.ghost, b.swap),
    E('swap', 'swap', b.swap, b.infection),
    E('infection', 'infection', b.infection, b.bridge),
    E('bridge', 'bridge', b.bridge, b.arcade),
    E('arcade', 'arcade', b.arcade, b.mirror),
    E('mirror', 'mirror', b.mirror, b.night),
    E('night', 'night', b.night, b.duo),
    E('duo', 'duo', b.duo, b.del),
    E('delete', 'delete', b.del, b.faces),
    E('fear', 'fear', b.faces, b.kaiju),
    E('kaiju', 'kaiju', b.kaiju, b.chant),
    E('chant', 'chant', b.chant, b.outro),
    E('outro', 'outro', b.outro, b.end),
  ];
}
