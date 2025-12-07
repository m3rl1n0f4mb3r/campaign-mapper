// ============================================
// FEATURE TABLES (from PDF p.11)
// ============================================

import type { RollableTable } from '../types';

/**
 * Main feature type table (1d6)
 */
export const HEX_FEATURE: RollableTable = {
  id: 'hex-feature',
  name: 'Hex Feature',
  description: 'What type of feature is in this hex',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 3, value: 'landmark' },
    { id: 'e2', min: 4, max: 4, value: 'settlement' },
    { id: 'e3', min: 5, max: 5, value: 'lair' },
    { id: 'e4', min: 6, max: 6, value: 'dungeon' },
  ],
};

/**
 * Settlement type table (1d6)
 */
export const SETTLEMENT_TYPE: RollableTable = {
  id: 'settlement-type',
  name: 'Settlement Type',
  description: 'What type of settlement',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'hamlet' },
    { id: 'e2', min: 2, max: 2, value: 'village' },
    { id: 'e3', min: 3, max: 3, value: 'city' },
    { id: 'e4', min: 4, max: 4, value: 'castle' },
    { id: 'e5', min: 5, max: 5, value: 'tower' },
    { id: 'e6', min: 6, max: 6, value: 'abbey' },
  ],
};

/**
 * Landmark category table (1d6)
 */
export const LANDMARK_CATEGORY: RollableTable = {
  id: 'landmark-category',
  name: 'Landmark Category',
  description: 'Natural, artificial, or magic landmark',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 3, value: 'natural' },
    { id: 'e2', min: 4, max: 5, value: 'artificial' },
    { id: 'e3', min: 6, max: 6, value: 'magic' },
  ],
};

/**
 * Natural landmark subcategory (1d6)
 */
export const NATURAL_LANDMARK_TYPE: RollableTable = {
  id: 'natural-landmark-type',
  name: 'Natural Landmark Type',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'fauna' },
    { id: 'e2', min: 2, max: 2, value: 'flora_a' },
    { id: 'e3', min: 3, max: 3, value: 'flora_b' },
    { id: 'e4', min: 4, max: 4, value: 'geology_a' },
    { id: 'e5', min: 5, max: 5, value: 'geology_b' },
    { id: 'e6', min: 6, max: 6, value: 'hydrology' },
  ],
};

/**
 * Artificial landmark subcategory (1d6)
 */
export const ARTIFICIAL_LANDMARK_TYPE: RollableTable = {
  id: 'artificial-landmark-type',
  name: 'Artificial Landmark Type',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'labor' },
    { id: 'e2', min: 2, max: 2, value: 'mystery' },
    { id: 'e3', min: 3, max: 3, value: 'ruin' },
    { id: 'e4', min: 4, max: 4, value: 'small_structure' },
    { id: 'e5', min: 5, max: 5, value: 'travel' },
    { id: 'e6', min: 6, max: 6, value: 'worship' },
  ],
};

/**
 * Magic landmark subcategory (1d6)
 */
export const MAGIC_LANDMARK_TYPE: RollableTable = {
  id: 'magic-landmark-type',
  name: 'Magic Landmark Type',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'area_under_spell' },
    { id: 'e2', min: 2, max: 2, value: 'enchanted_item' },
    { id: 'e3', min: 3, max: 3, value: 'magic_path' },
    { id: 'e4', min: 4, max: 4, value: 'magic_remains' },
    { id: 'e5', min: 5, max: 5, value: 'place_of_power' },
    { id: 'e6', min: 6, max: 6, value: 'strange_phenomenon' },
  ],
};

/**
 * Landmark content table (1d6)
 */
export const LANDMARK_CONTENT: RollableTable = {
  id: 'landmark-content',
  name: 'Landmark Content',
  description: 'What can be found at the landmark',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'hazard' },
    { id: 'e2', min: 2, max: 3, value: 'empty' },
    { id: 'e3', min: 4, max: 4, value: 'special' },
    { id: 'e4', min: 5, max: 6, value: 'monsters' },
  ],
};

/**
 * Faction relationship table (2d6)
 */
export const FACTION_RELATIONSHIP: RollableTable = {
  id: 'faction-relationship',
  name: 'Faction Relationship',
  description: 'Relationship between two factions',
  category: 'factions',
  diceFormula: '2d6',
  entries: [
    { id: 'e2', min: 2, max: 2, value: 'open_war' },
    { id: 'e3', min: 3, max: 5, value: 'hostility' },
    { id: 'e4', min: 6, max: 8, value: 'indifference' },
    { id: 'e5', min: 9, max: 11, value: 'peace_trade' },
    { id: 'e6', min: 12, max: 12, value: 'alliance' },
  ],
};

/**
 * Disposition table (2d6) - used for settlements, castles, etc.
 */
export const DISPOSITION: RollableTable = {
  id: 'disposition',
  name: 'Disposition',
  description: 'Initial disposition towards PCs',
  category: 'features',
  diceFormula: '2d6',
  entries: [
    { id: 'e1', min: 2, max: 2, value: 'Attack on sight' },
    { id: 'e2', min: 3, max: 5, value: 'Hostile' },
    { id: 'e3', min: 6, max: 8, value: 'Neutral' },
    { id: 'e4', min: 9, max: 11, value: 'Welcoming' },
    { id: 'e5', min: 12, max: 12, value: 'Enthusiastic' },
  ],
};

/**
 * Event timing table (1d6)
 */
export const EVENT_TIMING: RollableTable = {
  id: 'event-timing',
  name: 'Event Timing',
  description: 'When the event occurs',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Ended earlier' },
    { id: 'e2', min: 2, max: 4, value: 'Is happening now' },
    { id: 'e3', min: 5, max: 6, value: 'Will take place in the future' },
  ],
};

/**
 * Lair layout table (1d8 for large groups, 1d3 for small)
 */
export const LAIR_LAYOUT: RollableTable = {
  id: 'lair-layout',
  name: 'Lair Layout',
  description: 'Physical layout of the lair',
  category: 'features',
  diceFormula: '1d8',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Single chamber' },
    { id: 'e2', min: 2, max: 3, value: 'Two connected chambers' },
    { id: 'e3', min: 4, max: 5, value: 'Three chambers in a row' },
    { id: 'e4', min: 6, max: 7, value: 'Central hub with branches' },
    { id: 'e5', min: 8, max: 8, value: 'Complex multi-room' },
  ],
};

/**
 * Dungeon levels table (1d6)
 */
export const DUNGEON_LEVELS: RollableTable = {
  id: 'dungeon-levels',
  name: 'Dungeon Levels',
  description: 'Number of dungeon levels',
  category: 'features',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 2, value: '1' },
    { id: 'e2', min: 3, max: 4, value: '2' },
    { id: 'e3', min: 5, max: 5, value: '3' },
    { id: 'e4', min: 6, max: 6, value: '4+' },
  ],
};

export default {
  HEX_FEATURE,
  SETTLEMENT_TYPE,
  LANDMARK_CATEGORY,
  NATURAL_LANDMARK_TYPE,
  ARTIFICIAL_LANDMARK_TYPE,
  MAGIC_LANDMARK_TYPE,
  LANDMARK_CONTENT,
  FACTION_RELATIONSHIP,
  DISPOSITION,
  EVENT_TIMING,
  LAIR_LAYOUT,
  DUNGEON_LEVELS,
};
