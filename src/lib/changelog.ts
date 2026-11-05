import { APP_VERSION } from './version';

export interface ChangelogItem {
  title: string;
  /** One or two sentences, plain language */
  description: string;
  /** Shows "by user request" next to the title (never names anyone) */
  userRequest?: boolean;
}

export interface ChangelogEntry {
  version: string;
  /** YYYY-MM-DD */
  date: string;
  items: ChangelogItem[];
}

/**
 * Release notes shown in What's New, newest first. Add an entry for each
 * release with user-facing changes; releases without one show nothing.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2026-11-05',
    items: [
      {
        title: 'Label Size',
        description: 'Hex numbers, symbols and badges now scale with your hex size, so they’re readable on large map images. Fine-tune them with Label Size in Settings.',
        userRequest: true,
      },
      {
        title: 'Hex markers',
        description: 'Movable icons for your party, destination, or anyone you left behind. Select a hex and tap a marker at the top of the panel to move it there. Manage them from 📍 in the toolbar.',
        userRequest: true,
      },
      {
        title: 'Marker trails',
        description: 'Markers can record the route they travel, drawn as a line on the map. The starter Party marker records its trail and marks hexes explored as it goes. Hide trails any time; they keep recording.',
        userRequest: true,
      },
      {
        title: 'Explored Indicators',
        description: 'The green dot on explored hexes can now be turned off in Settings.',
      },
      {
        title: 'Better on tablets',
        description: 'Confirmations and errors use in-app dialogs, and toolbar counts, terrain names and link addresses no longer need hover.',
      },
    ],
  },
];

/** Compare "1.10.0" vs "1.9.0" numerically by part: negative, 0 or positive */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Every entry up to the running version (for reopening What's New) */
export function getReleasedEntries(current = APP_VERSION): ChangelogEntry[] {
  return CHANGELOG.filter(e => compareVersions(e.version, current) <= 0);
}

/**
 * Entries a returning user hasn't seen yet. Users from before What's New
 * existed (no lastSeenVersion) get only the current version's entry.
 */
export function getUnseenEntries(lastSeenVersion: string | undefined, current = APP_VERSION): ChangelogEntry[] {
  const released = getReleasedEntries(current);
  if (lastSeenVersion === undefined) {
    return released.filter(e => compareVersions(e.version, current) === 0);
  }
  return released.filter(e => compareVersions(e.version, lastSeenVersion) > 0);
}
