// Output resolution multiplier, read once from the page URL (`?scale=2` renders 3840x2160).
// Scenes keep laying out in logical W x H px; the engine renders at SCALE x that.
// Kept in its own module so glsl/common.ts can use it without an import cycle through gl.ts.
function readScale() {
  if (typeof location === 'undefined') return 1;
  const s = Math.round(Number(new URLSearchParams(location.search).get('scale') ?? '1'));
  return Number.isFinite(s) && s >= 1 ? Math.min(s, 4) : 1;
}

/** Physical pixels per logical pixel of the output (integer 1..4, default 1). */
export const SCALE = readScale();

/** Frame format from the URL (`?format=16x9`): 9x16 (1080x1920, the default: social first) or 16x9 (1920x1080). */
function readFormat(): '9x16' | '16x9' {
  if (typeof location === 'undefined') return '9x16';
  return new URLSearchParams(location.search).get('format') === '16x9' ? '16x9' : '9x16';
}
export const FORMAT = readFormat();

/** The film to play (`?film=pain-01-hello`): its timeline is src/films/<film>/timeline.ts, its assets films/<film>/. */
export const FILM = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('film')) || 'ST-01_train-ride';
/** URL prefix of the film's assets (audio/, data/), served from brand-video/films/<film>/. */
export const FILM_DIR = `films/${FILM}`;
