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
    { id: 'desk', load: () => import('./desk'), start: B(1, 2), end: B(2) },
    { id: 'tour', load: town, start: B(2), end: B(6), params: { shot: 'tour' } },
    { id: 'neon', load: town, start: B(6), end: B(8), params: { shot: 'neon' } },
    { id: 'station', load: () => import('./station'), start: B(8), end: B(11), params: {} },
    { id: 'board', load: train, start: B(11), end: B(12), params: { shot: 'board', t0 } },
    { id: 'keep', load: () => import('./chat'), start: B(12), end: B(13), params: { shot: 'keep' } },
    { id: 'hero', load: train, start: B(13), end: B(17), params: { shot: 'hero', t0 } },
    { id: 'lost', load: train, start: B(17), end: B(19), params: { shot: 'lost', t0, gone, black: B(18, 3) } },
    { id: 'thanks', load: () => import('./chat'), start: B(19), end: B(21), params: { shot: 'thanks' } },
    { id: 'front', load: () => import('./frontpage'), start: B(21), end: B(22) },
    { id: 'globe', load: () => import('./globe'), start: B(22), end: B(23) },
    { id: 'outro', load: town, start: B(23), end: B(27), params: { shot: 'outro', msgAt: B(25), sparkAt: B(26) } },
    { id: 'newday', load: town, start: B(27), end: au.duration, params: { shot: 'newday', keptAt: B(29) } },
    // the end card holds 2.5 s past the song, over the sonic logo (added in the edit)
    { id: 'endcard', load: () => import('./endcard'), start: au.duration, end: au.duration + 2.5 },
  ];
}
