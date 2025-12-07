// ============================================
// GENERATOR TABLE TYPES
// ============================================

/**
 * A single entry in a rollable table
 */
export interface TableEntry {
  id: string;
  min: number;
  max: number;
  value: string;
  subTable?: string;  // Reference to another table for nested rolls
  subTableCount?: number;  // How many times to roll on subtable
}

/**
 * A rollable table definition
 */
export interface RollableTable {
  id: string;
  name: string;
  description?: string;
  category: string;
  diceFormula: string;  // e.g., "1d6", "1d20", "2d6", "1d100"
  entries: TableEntry[];
}

/**
 * Result of rolling on a table
 */
export interface RollResult {
  tableId: string;
  roll: number;
  value: string;
  subResults?: RollResult[];  // Results from nested subtable rolls
}

// ============================================
// BIOME TYPES (matches PDF p.8)
// ============================================

export type BiomeType = 'grassland' | 'forest' | 'hills' | 'marsh' | 'mountains';

export const BIOME_TO_TERRAIN: Record<BiomeType, string> = {
  grassland: 'plains',
  forest: 'forest',
  hills: 'hills',
  marsh: 'swamp',
  mountains: 'mountain',
};

// ============================================
// FEATURE TYPES (matches PDF p.11)
// ============================================

export type FeatureType = 'landmark' | 'settlement' | 'lair' | 'dungeon';

export type SettlementType = 'hamlet' | 'village' | 'city' | 'castle' | 'tower' | 'abbey';

export type LandmarkCategory = 'natural' | 'artificial' | 'magic';

export type LandmarkSubCategory = 
  | 'fauna' | 'flora_a' | 'flora_b' | 'geology_a' | 'geology_b' | 'hydrology'  // natural
  | 'labor' | 'mystery' | 'ruin' | 'small_structure' | 'travel' | 'worship'    // artificial
  | 'area_under_spell' | 'enchanted_item' | 'magic_path' | 'magic_remains' | 'place_of_power' | 'strange_phenomenon';  // magic

export type LandmarkContent = 'hazard' | 'empty' | 'special' | 'monsters';

// ============================================
// FACTION/POLITICAL TYPES (matches PDF p.12-13)
// ============================================

export type FactionRelationship = 'open_war' | 'hostility' | 'indifference' | 'peace_trade' | 'alliance';

export interface DomainInfo {
  centerHex: { q: number; r: number };
  hexes: Array<{ q: number; r: number }>;
  size: 'small' | 'large';  // small = 1 hex (tower/abbey), large = 7 hexes (city/castle)
  settlementType: SettlementType;
}

// ============================================
// GENERATED CONTENT TYPES
// ============================================

export interface GeneratedLandmark {
  category: LandmarkCategory;
  subCategory: LandmarkSubCategory;
  name: string;
  content: LandmarkContent;
  hasTreasure: boolean;
  details?: Record<string, string>;
}

export interface GeneratedSettlement {
  type: SettlementType;
  name: string;
  size?: 'small' | 'medium' | 'big' | 'major';
  details: Record<string, string | string[]>;
}

export interface GeneratedLair {
  monsterType: string;
  details?: Record<string, string>;
}

export interface GeneratedDungeon {
  levels: number;
  details?: Record<string, string>;
}

export type GeneratedFeature = 
  | { type: 'landmark'; data: GeneratedLandmark }
  | { type: 'settlement'; data: GeneratedSettlement }
  | { type: 'lair'; data: GeneratedLair }
  | { type: 'dungeon'; data: GeneratedDungeon };
