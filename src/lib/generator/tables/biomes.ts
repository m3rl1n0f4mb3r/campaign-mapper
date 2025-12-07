// ============================================
// BIOME TABLES (from PDF p.8)
// ============================================

import type { RollableTable } from '../types';

/**
 * Starting hex biome (1d10)
 * Used for the first hex when generating a new region
 */
export const STARTING_HEX_BIOME: RollableTable = {
  id: 'starting-hex-biome',
  name: 'Starting Hex Biome',
  description: 'Determines the biome of the first hex in a region',
  category: 'biomes',
  diceFormula: '1d10',
  entries: [
    { id: 'e1', min: 1, max: 4, value: 'grassland' },
    { id: 'e2', min: 5, max: 6, value: 'forest' },
    { id: 'e3', min: 7, max: 8, value: 'hills' },
    { id: 'e4', min: 9, max: 9, value: 'marsh' },
    { id: 'e5', min: 10, max: 10, value: 'mountains' },
  ],
};

/**
 * Next hex biome (1d10)
 * Used for hexes adjacent to already-generated hexes
 * Note: 1-5 means "same as previous hex" which is handled in generator logic
 */
export const NEXT_HEX_BIOME: RollableTable = {
  id: 'next-hex-biome',
  name: 'Next Hex Biome',
  description: 'Determines the biome of adjacent hexes (1-5 = same as neighbor)',
  category: 'biomes',
  diceFormula: '1d10',
  entries: [
    { id: 'e1', min: 1, max: 5, value: 'same' },
    { id: 'e2', min: 6, max: 6, value: 'grassland' },
    { id: 'e3', min: 7, max: 7, value: 'forest' },
    { id: 'e4', min: 8, max: 8, value: 'hills' },
    { id: 'e5', min: 9, max: 9, value: 'marsh' },
    { id: 'e6', min: 10, max: 10, value: 'mountains' },
  ],
};

/**
 * Random encounter tables per biome (2d6)
 */
export const ENCOUNTERS_GRASSLAND: RollableTable = {
  id: 'encounters-grassland',
  name: 'Grassland Encounters',
  category: 'encounters',
  diceFormula: '2d6',
  entries: [
    { id: 'e2', min: 2, max: 2, value: 'Dinosaurs' },
    { id: 'e3', min: 3, max: 3, value: 'Ogres' },
    { id: 'e4', min: 4, max: 4, value: 'Gnolls' },
    { id: 'e5', min: 5, max: 5, value: 'Orcs' },
    { id: 'e6', min: 6, max: 6, value: 'Goblins' },
    { id: 'e7', min: 7, max: 7, value: 'Giant rats' },
    { id: 'e8', min: 8, max: 8, value: 'Wolves' },
    { id: 'e9', min: 9, max: 9, value: 'Bandits' },
    { id: 'e10', min: 10, max: 10, value: 'Berserkers' },
    { id: 'e11', min: 11, max: 11, value: 'Worgs' },
    { id: 'e12', min: 12, max: 12, value: 'Werewolves' },
  ],
};

export const ENCOUNTERS_FOREST: RollableTable = {
  id: 'encounters-forest',
  name: 'Forest Encounters',
  category: 'encounters',
  diceFormula: '2d6',
  entries: [
    { id: 'e2', min: 2, max: 2, value: 'Ents' },
    { id: 'e3', min: 3, max: 3, value: 'Giant spiders' },
    { id: 'e4', min: 4, max: 4, value: 'Ogres' },
    { id: 'e5', min: 5, max: 5, value: 'Bears' },
    { id: 'e6', min: 6, max: 6, value: 'Goblins' },
    { id: 'e7', min: 7, max: 7, value: 'Boars' },
    { id: 'e8', min: 8, max: 8, value: 'Wolves' },
    { id: 'e9', min: 9, max: 9, value: 'Bandits' },
    { id: 'e10', min: 10, max: 10, value: 'Elves' },
    { id: 'e11', min: 11, max: 11, value: 'Dryads' },
    { id: 'e12', min: 12, max: 12, value: 'Werewolves' },
  ],
};

export const ENCOUNTERS_HILLS: RollableTable = {
  id: 'encounters-hills',
  name: 'Hills Encounters',
  category: 'encounters',
  diceFormula: '2d6',
  entries: [
    { id: 'e2', min: 2, max: 2, value: 'Manticores' },
    { id: 'e3', min: 3, max: 3, value: 'Basilisks' },
    { id: 'e4', min: 4, max: 4, value: 'Ogres' },
    { id: 'e5', min: 5, max: 5, value: 'Orcs' },
    { id: 'e6', min: 6, max: 6, value: 'Goblins' },
    { id: 'e7', min: 7, max: 7, value: 'Giant rats' },
    { id: 'e8', min: 8, max: 8, value: 'Wolves' },
    { id: 'e9', min: 9, max: 9, value: 'Bandits' },
    { id: 'e10', min: 10, max: 10, value: 'Beastmen' },
    { id: 'e11', min: 11, max: 11, value: 'Giants' },
    { id: 'e12', min: 12, max: 12, value: 'Wyverns' },
  ],
};

export const ENCOUNTERS_MARSH: RollableTable = {
  id: 'encounters-marsh',
  name: 'Marsh Encounters',
  category: 'encounters',
  diceFormula: '2d6',
  entries: [
    { id: 'e2', min: 2, max: 2, value: 'Moth-men' },
    { id: 'e3', min: 3, max: 3, value: 'Mushroom-men' },
    { id: 'e4', min: 4, max: 4, value: 'Frog-men' },
    { id: 'e5', min: 5, max: 5, value: 'Trolls' },
    { id: 'e6', min: 6, max: 6, value: 'Skeletons' },
    { id: 'e7', min: 7, max: 7, value: 'Crocodiles' },
    { id: 'e8', min: 8, max: 8, value: 'Zombies' },
    { id: 'e9', min: 9, max: 9, value: 'Orcs' },
    { id: 'e10', min: 10, max: 10, value: 'Lizard-men' },
    { id: 'e11', min: 11, max: 11, value: 'Snake-men' },
    { id: 'e12', min: 12, max: 12, value: 'Hydras' },
  ],
};

export const ENCOUNTERS_MOUNTAINS: RollableTable = {
  id: 'encounters-mountains',
  name: 'Mountains Encounters',
  category: 'encounters',
  diceFormula: '2d6',
  entries: [
    { id: 'e2', min: 2, max: 2, value: 'Giants' },
    { id: 'e3', min: 3, max: 3, value: 'Griffins' },
    { id: 'e4', min: 4, max: 4, value: 'Dwarves' },
    { id: 'e5', min: 5, max: 5, value: 'Kobolds' },
    { id: 'e6', min: 6, max: 6, value: 'Orcs' },
    { id: 'e7', min: 7, max: 7, value: 'Bears' },
    { id: 'e8', min: 8, max: 8, value: 'Wolves' },
    { id: 'e9', min: 9, max: 9, value: 'Bandits' },
    { id: 'e10', min: 10, max: 10, value: 'Berserkers' },
    { id: 'e11', min: 11, max: 11, value: 'Smilodons' },
    { id: 'e12', min: 12, max: 12, value: 'Vampires' },
  ],
};

export const BIOME_ENCOUNTER_TABLES: Record<string, RollableTable> = {
  grassland: ENCOUNTERS_GRASSLAND,
  forest: ENCOUNTERS_FOREST,
  hills: ENCOUNTERS_HILLS,
  marsh: ENCOUNTERS_MARSH,
  mountains: ENCOUNTERS_MOUNTAINS,
};

export default {
  STARTING_HEX_BIOME,
  NEXT_HEX_BIOME,
  BIOME_ENCOUNTER_TABLES,
};
