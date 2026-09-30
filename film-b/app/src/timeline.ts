// The edit: which plate plays when. Boundaries come from the analysed phrase map
// (data/audio.json sections: a 2-bar riser, the drop, then 4-bar phrases), so every
// cut is a hard cut on a downbeat.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { AudioData } from './engine/audio';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

/** `?cut=generic` renders the first, data-panel take; the default is the cover-art / lyric take. */
const CUT = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('cut') ?? 'cover' : 'cover';

export function makeTimeline(au: AudioData): TimelineEntry[] {
  const s = (name: string) => au.sections.find((x) => x.name === name)!;
  const E = (id: string, start: number, end: number, extra: Partial<TimelineEntry> = {}): TimelineEntry =>
    ({ id, load: scene(id), start, end, ...extra });
  const bounds = [0, au.drop, s('phrase1').end, s('phrase2').end, s('phrase3').end, s('phrase4').end, s('phrase5').end, au.duration];
  const ids = CUT === 'generic'
    ? ['riser', 'scope', 'grid', 'rings', 'slam', 'infect', 'end']
    : ['alley', 'door', 'legend', 'puddle', 'wall', 'toxic', 'loop'];
  return ids.map((id, i) => E(id, bounds[i]!, bounds[i + 1]!));
}
