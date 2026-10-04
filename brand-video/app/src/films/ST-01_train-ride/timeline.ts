// ST-01 · The train ride. Times follow script v0.7 on the analysed grid (bar n starts at B(n)).
// Every cut sits on a beat; a transition is centred on its cut and lasts `beats` beats.
import type { AudioData } from '../../engine/audio';
import type { TimelineEntry, Transition } from '../../engine/engine';

export function makeTimeline(au: AudioData): TimelineEntry[] {
  const B = (bar: number, beat = 0) => au.timeOfBeat(bar * 4 + beat);
  const beat = 60 / au.bpm;
  const town = () => import('./town');
  const train = () => import('./carriage');
  const chat = () => import('./chat');
  const t0 = B(11); // the train starts at the break
  const gone = 36.52; // "…till the signal's gone" (line 11, last word)
  type E = TimelineEntry & { inBeats?: number };
  const E: E[] = [
    { id: 'open', load: town, start: 0, end: B(1, 2), params: { shot: 'open' } },
    { id: 'desk', load: () => import('./desk'), start: B(1, 2), end: B(2), trans: 'pixel', inBeats: 0.5 },
    { id: 'tour', load: town, start: B(2), end: B(6), params: { shot: 'tour' }, trans: 'flash', inBeats: 0.5 },
    { id: 'neon', load: town, start: B(6), end: B(8), params: { shot: 'neon' }, trans: 'scan', inBeats: 1 },
    { id: 'station', load: () => import('./station'), start: B(8), end: B(11), trans: 'pixel', inBeats: 1 },
    { id: 'board', load: train, start: B(11), end: B(12), params: { shot: 'board', t0 }, trans: 'dip', inBeats: 0.5 },
    { id: 'keep', load: chat, start: B(12), end: B(13), params: { shot: 'keep' }, trans: 'pixel', inBeats: 0.5 },
    { id: 'hero', load: train, start: B(13), end: B(17), params: { shot: 'hero', t0 }, trans: 'flash', inBeats: 0.5 },
    // the same shot continues (no transition): the signal fails on "gone"
    { id: 'lost', load: train, start: B(17), end: B(19), params: { shot: 'lost', t0, gone, black: B(18, 3) } },
    { id: 'thanks', load: chat, start: B(19), end: B(21), params: { shot: 'thanks' }, trans: 'scan', inBeats: 0.5 },
    // the front page slams in on the hook's downbeat (its own slam: a hard cut)
    { id: 'front', load: () => import('./frontpage'), start: B(21), end: B(22) },
    { id: 'globe', load: () => import('./globe'), start: B(22), end: B(23), trans: 'ink', inBeats: 1 },
    { id: 'outro', load: town, start: B(23), end: B(27), params: { shot: 'outro', msgAt: B(25), sparkAt: B(26) }, trans: 'pixel', inBeats: 1 },
    { id: 'newday', load: town, start: B(27), end: au.duration, params: { shot: 'newday', keptAt: B(29) }, trans: 'ink', inBeats: 2 },
    // the end card holds 2.5 s past the song, over the sonic logo (added in the edit)
    { id: 'endcard', load: () => import('./endcard'), start: au.duration, end: au.duration + 2.5, trans: 'dip', inBeats: 1 },
  ];
  // centre each transition on its cut: the outgoing shot runs on, the incoming one starts early
  for (let i = 1; i < E.length; i++) {
    const d = (E[i]!.inBeats ?? 0) * beat;
    if (d <= 0) continue;
    E[i - 1]!.end += d / 2;
    E[i]!.start -= d / 2;
  }
  return E.map(({ inBeats, ...e }) => e as TimelineEntry & { trans?: Transition });
}
