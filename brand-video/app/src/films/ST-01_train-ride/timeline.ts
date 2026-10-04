// ST-01 · The train ride. Times follow script v0.7 on the analysed grid (bar n starts at barT(n)).
import type { AudioData } from '../../engine/audio';
import type { TimelineEntry } from '../../engine/engine';

export function makeTimeline(au: AudioData): TimelineEntry[] {
  const B = (bar: number, beat = 0) => au.timeOfBeat(bar * 4 + beat);
  const town = () => import('./town');
  const train = () => import('./carriage');
  const t0 = B(11); // the train starts at the break
  const gone = 36.52; // "…till the signal's gone" (line 11, last word)
  return [
    { id: 'open', load: town, start: 0, end: B(1, 2), params: { shot: 'open' } },
    { id: 'tour', load: town, start: B(2), end: B(6), params: { shot: 'tour' } },
    { id: 'station', load: () => import('./station'), start: B(8), end: B(11), params: {} },
    { id: 'board', load: train, start: B(11), end: B(12), params: { shot: 'board', t0 } },
    { id: 'hero', load: train, start: B(13), end: B(17), params: { shot: 'hero', t0 } },
    { id: 'lost', load: train, start: B(17), end: B(19), params: { shot: 'lost', t0, gone, black: B(18, 3) } },
    { id: 'outro', load: town, start: B(23), end: B(27), params: { shot: 'outro' } },
    { id: 'newday', load: town, start: B(27), end: au.duration, params: { shot: 'newday', keptAt: B(29) } },
  ];
}
