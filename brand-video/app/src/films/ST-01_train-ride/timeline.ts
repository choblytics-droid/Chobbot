import type { AudioData } from '../../engine/audio';
import type { TimelineEntry } from '../../engine/engine';
export function makeTimeline(au: AudioData): TimelineEntry[] {
  return [{ id: 'test', load: () => import('./test'), start: 0, end: au.duration }];
}
