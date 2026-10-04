// ST-01 · The train ride. Times follow script v0.8 on the analysed grid (bar 0 = the verse's first
// downbeat at 0.41 s; the song starts straight away, no instrumental intro).
// Every cut sits on a beat; a transition is centred on its cut and lasts `beats` beats.
import type { AudioData } from '../../engine/audio';
import type { TimelineEntry, Transition } from '../../engine/engine';

export function makeTimeline(au: AudioData): TimelineEntry[] {
  const B = (bar: number, beat = 0) => au.timeOfBeat(bar * 4 + beat);
  const beat = 60 / au.bpm;
  const town = () => import('./town');
  const train = () => import('./carriage');
  const chat = () => import('./chat');
  const t0 = B(9); // the train starts at the break
  const gone = 33.06; // "…till the signal's gone" (line 11, last word)
  const hookEnd = 2.75; // the "Based on a true story" sticker, over the first shot and across the first cut
  type E = TimelineEntry & { inBeats?: number };
  const E: E[] = [
    { id: 'desk', load: () => import('./desk'), start: 0, end: B(1), params: { hookEnd } },
    { id: 'tour', load: town, start: B(1), end: B(4), params: { shot: 'tour', hookEnd }, trans: 'flash', inBeats: 0.5 },
    { id: 'neon', load: town, start: B(4), end: B(6), params: { shot: 'neon' }, trans: 'scan', inBeats: 1 },
    { id: 'station', load: () => import('./station'), start: B(6), end: B(9), trans: 'pixel', inBeats: 1 },
    { id: 'board', load: train, start: B(9), end: B(10), params: { shot: 'board', t0 }, trans: 'dip', inBeats: 0.5 },
    { id: 'keep', load: chat, start: B(10), end: B(11), params: { shot: 'keep' }, trans: 'pixel', inBeats: 0.5 },
    { id: 'hero', load: train, start: B(11), end: B(15), params: { shot: 'hero', t0 }, trans: 'flash', inBeats: 0.5 },
    // the same shot continues (no transition): the signal fails on "gone"
    { id: 'lost', load: train, start: B(15), end: B(17), params: { shot: 'lost', t0, gone, black: B(16, 3) } },
    { id: 'thanks', load: chat, start: B(17), end: B(19), params: { shot: 'thanks' }, trans: 'scan', inBeats: 0.5 },
    // the front page slams in on the hook's downbeat (its own slam: a hard cut)
    { id: 'front', load: () => import('./frontpage'), start: B(19), end: B(20) },
    { id: 'globe', load: () => import('./globe'), start: B(20), end: B(21), trans: 'ink', inBeats: 1 },
    { id: 'outro', load: town, start: B(21), end: B(25), params: { shot: 'outro', msgAt: B(23) }, trans: 'pixel', inBeats: 1 },
    // the film ends on the story (no brand end card): the last shot fades with the song
    { id: 'newday', load: town, start: B(25), end: au.duration, params: { shot: 'newday', keptAt: B(27) }, trans: 'ink', inBeats: 2 },
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
