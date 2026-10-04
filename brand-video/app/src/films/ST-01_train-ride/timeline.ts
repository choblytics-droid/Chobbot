// ST-01 · The train ride. Times follow script v0.7 on the analysed grid (bar n starts at barT(n)).
import type { AudioData } from '../../engine/audio';
import type { TimelineEntry } from '../../engine/engine';

export function makeTimeline(au: AudioData): TimelineEntry[] {
  const B = (bar: number, beat = 0) => au.timeOfBeat(bar * 4 + beat);
  const town = () => import('./town');
  return [
    { id: 'open', load: town, start: 0, end: B(1, 2), params: { shot: 'open' } },
    { id: 'tour', load: town, start: B(2), end: B(6), params: { shot: 'tour' } },
    { id: 'outro', load: town, start: B(23), end: B(27), params: { shot: 'outro' } },
    { id: 'newday', load: town, start: B(27), end: au.duration, params: { shot: 'newday', keptAt: B(29) } },
  ];
}
