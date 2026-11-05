/**
 * Fallback colors for factions without a chosen color. Don't change: factions
 * are assigned from this list by id hash, so edits recolor existing maps.
 */
export const FACTION_COLORS = [
  '#e94560', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa',
  '#f472b6', '#34d399', '#38bdf8', '#fb923c', '#c084fc',
];

/**
 * Marker preset colors: 15 picks from Sasha Trubetskoy's "List of 20 Simple,
 * Distinct Colors" (https://sashamaps.net/docs/resources/20-colors/). Skipped
 * navy and black (vanish on the dark UI) and white, beige and lavender (too
 * pale on map images). Two rows of 8 in the marker form, with the custom slot.
 */
export const MARKER_COLORS = [
  '#e6194b', // red
  '#f58231', // orange
  '#ffe119', // yellow
  '#bfef45', // lime
  '#3cb44b', // green
  '#469990', // teal
  '#42d4f4', // cyan
  '#4363d8', // blue
  '#911eb4', // purple
  '#f032e6', // magenta
  '#fabed4', // pink
  '#800000', // maroon
  '#9a6324', // brown
  '#808000', // olive
  '#a9a9a9', // grey
];

/** Black or white, whichever reads better on the given hex color */
export function getContrastText(color: string): '#000' | '#fff' {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const value = parseInt(full, 16);
  if (full.length !== 6 || isNaN(value)) return '#fff';

  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  // Perceived brightness (ITU-R BT.601)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000' : '#fff';
}
