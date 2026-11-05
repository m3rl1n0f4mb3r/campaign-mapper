/**
 * Sizes for everything drawn inside a hex (labels, badges, highlight strokes).
 *
 * Sizes are tuned for the default hex size and scaled by getHexScale(), so
 * decorations stay proportional to the hex on any map. Shared by the on-screen
 * map and image export so the two can't drift apart.
 */
import type { CampaignSettings, GridConfig } from './types';

/** Hex size (center to vertex) the base sizes below were designed for. */
export const BASE_HEX_SIZE = 32;

export const BASE_DECORATION_SIZES = {
  coordFont: 8,
  symbolFont: 14,
  featureRadius: 8,
  featureFont: 9,
  exploredRadius: 4,
  linkRadius: 7,
  linkFont: 8,
  factionBorder: 3,
} as const;

/** labelScale limits (1 = 100%). */
export const LABEL_SCALE_DEFAULT = 1;
export const LABEL_SCALE_MIN = 0.25;
export const LABEL_SCALE_MAX = 10;
/** The slider normally ends here; it stretches when the value is larger. */
export const LABEL_SCALE_SLIDER_MAX = 3;

export function clampLabelScale(value: number): number {
  if (!Number.isFinite(value)) return LABEL_SCALE_DEFAULT;
  return Math.min(LABEL_SCALE_MAX, Math.max(LABEL_SCALE_MIN, value));
}

/**
 * Multiplier for all hex decorations: proportional to hex size, times the
 * user's Label Size. Older maps without labelScale use 100%.
 */
export function getHexScale(
  gridConfig: Pick<GridConfig, 'hexSize'>,
  settings?: Pick<CampaignSettings, 'labelScale'>
): number {
  const labelScale = clampLabelScale(settings?.labelScale ?? LABEL_SCALE_DEFAULT);
  return (gridConfig.hexSize / BASE_HEX_SIZE) * labelScale;
}
