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

export function makeTimeline(au: AudioData): TimelineEntry[] {
  const s = (name: string) => au.sections.find((x) => x.name === name)!;
  const E = (id: string, start: number, end: number, extra: Partial<TimelineEntry> = {}): TimelineEntry =>
    ({ id, load: scene(id), start, end, ...extra });
  return [
    E('riser', 0, au.drop),
    E('scope', s('phrase1').start, s('phrase1').end),
    E('grid', s('phrase2').start, s('phrase2').end),
    E('rings', s('phrase3').start, s('phrase3').end),
    E('slam', s('phrase4').start, s('phrase4').end),
    E('infect', s('phrase5').start, s('phrase5').end),
    E('end', s('phrase6').start, au.duration),
  ];
}
