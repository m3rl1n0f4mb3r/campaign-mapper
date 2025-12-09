// ============================================
// FEATURE GENERATOR (Landmark/Settlement/Lair/Dungeon)
// ============================================

import type { 
  FeatureType, 
  SettlementType, 
  LandmarkCategory, 
  LandmarkSubCategory,
  LandmarkContent,
  GeneratedFeature,
  GeneratedLandmark,
  GeneratedSettlement,
} from './types';
import { 
  rollOnTable, 
  percentageCheck,
} from './tableSystem';
import {
  HEX_FEATURE,
  SETTLEMENT_TYPE,
  LANDMARK_CATEGORY,
  NATURAL_LANDMARK_TYPE,
  ARTIFICIAL_LANDMARK_TYPE,
  MAGIC_LANDMARK_TYPE,
  LANDMARK_CONTENT,
  DISPOSITION,
  LAIR_LAYOUT,
  DUNGEON_LEVELS,
} from './tables/features';
import {
  LANDMARK_DETAIL_TABLES,
  HAZARD_TABLE,
  EMPTY_INFO_TABLE,
  SPECIAL_TABLE,
  DISPUTES_TABLE,
  THREATS_TABLE,
  MYSTERIES_TABLE,
  NPC_PROBLEMS_TABLE,
} from './tables/landmarks';
import { SETTLEMENT_TABLES } from './tables/settlements';
import { BIOME_ENCOUNTER_TABLES } from './tables/biomes';
import { generateNameForSettlement } from './nameGenerator';

// ============================================
// FEATURE TYPE GENERATION
// ============================================

/**
 * Roll for what type of feature is in a hex
 */
export function rollFeatureType(): FeatureType {
  const result = rollOnTable(HEX_FEATURE);
  return result.value as FeatureType;
}

/**
 * Roll for settlement type
 */
export function rollSettlementType(): SettlementType {
  const result = rollOnTable(SETTLEMENT_TYPE);
  return result.value as SettlementType;
}

// ============================================
// LANDMARK GENERATION
// ============================================

/**
 * Roll for landmark category (natural/artificial/magic)
 */
export function rollLandmarkCategory(): LandmarkCategory {
  const result = rollOnTable(LANDMARK_CATEGORY);
  return result.value as LandmarkCategory;
}

/**
 * Roll for landmark subcategory based on category
 */
export function rollLandmarkSubCategory(category: LandmarkCategory): LandmarkSubCategory {
  let table;
  switch (category) {
    case 'natural':
      table = NATURAL_LANDMARK_TYPE;
      break;
    case 'artificial':
      table = ARTIFICIAL_LANDMARK_TYPE;
      break;
    case 'magic':
      table = MAGIC_LANDMARK_TYPE;
      break;
  }
  const result = rollOnTable(table);
  return result.value as LandmarkSubCategory;
}

/**
 * Roll for the specific landmark name based on subcategory
 */
export function rollLandmarkName(subCategory: LandmarkSubCategory): string {
  const table = LANDMARK_DETAIL_TABLES[subCategory];
  if (!table) {
    console.warn(`No table found for subcategory: ${subCategory}`);
    return 'Unknown landmark';
  }
  const result = rollOnTable(table);
  return result.value;
}

/**
 * Roll for landmark content type
 */
export function rollLandmarkContent(): LandmarkContent {
  const result = rollOnTable(LANDMARK_CONTENT);
  return result.value as LandmarkContent;
}

/**
 * Check if landmark has treasure based on content type
 */
export function checkLandmarkTreasure(content: LandmarkContent): boolean {
  switch (content) {
    case 'hazard':
      return percentageCheck(25);
    case 'empty':
      return percentageCheck(15);
    case 'monsters':
      return percentageCheck(50);
    case 'special':
      return true; // Variable - DM decides
    default:
      return false;
  }
}

/**
 * Generate a complete landmark
 */
export function generateLandmark(): GeneratedLandmark {
  const category = rollLandmarkCategory();
  const subCategory = rollLandmarkSubCategory(category);
  const nature = rollLandmarkName(subCategory); // "Nature" per the Sandbox Generator book
  const content = rollLandmarkContent();
  const hasTreasure = checkLandmarkTreasure(content);

  const landmark: GeneratedLandmark = {
    category,
    subCategory,
    nature,
    content,
    hasTreasure,
  };

  // Add content-specific details (flattened for display)
  if (content === 'hazard') {
    const hazardResult = rollOnTable(HAZARD_TABLE);
    landmark.hazard = hazardResult.value;
  } else if (content === 'empty') {
    const infoResult = rollOnTable(EMPTY_INFO_TABLE);
    landmark.information = infoResult.value;
  } else if (content === 'special') {
    const specialResult = rollOnTable(SPECIAL_TABLE);
    landmark.special = specialResult.value;

    // Roll on the appropriate sub-table based on special type
    if (specialResult.value === 'Arbitrate a dispute') {
      const disputeResult = rollOnTable(DISPUTES_TABLE);
      landmark.dispute = disputeResult.value;
    } else if (specialResult.value === 'Prevent a threat') {
      const threatResult = rollOnTable(THREATS_TABLE);
      landmark.threat = threatResult.value;
    } else if (specialResult.value === 'Uncover a mystery') {
      const mysteryResult = rollOnTable(MYSTERIES_TABLE);
      landmark.mystery = mysteryResult.value;
    } else if (specialResult.value === 'NPC(s)/Monster(s) in need') {
      const problemResult = rollOnTable(NPC_PROBLEMS_TABLE);
      landmark.npcProblem = problemResult.value;
    }
    // "Solve a puzzle/riddle" and "Related to landmark" don't have sub-tables
  }
  // For 'monsters', the biome encounter table would be used

  return landmark;
}

// ============================================
// SETTLEMENT GENERATION
// ============================================

/**
 * Check if a 1-in-6 chance succeeds (roll 1 on d6)
 */
function oneInSixChance(): boolean {
  return Math.floor(Math.random() * 6) + 1 === 1;
}

/**
 * Generate hamlet details (PDF p.32-33)
 * - building (main building, always)
 * - layout (always)
 * - disposition (always)
 * - secret (1-in-6 chance)
 */
function generateHamletDetails(): Record<string, string> {
  const tables = SETTLEMENT_TABLES.hamlet;
  const details: Record<string, string> = {};
  
  details.building = rollOnTable(tables.building).value;
  details.layout = rollOnTable(tables.layout).value;
  details.disposition = rollOnTable(tables.disposition).value;
  
  // Secret is only rolled on 1-in-6 chance
  if (oneInSixChance()) {
    details.secret = rollOnTable(tables.secret).value;
  }
  
  return details;
}

/**
 * Generate village details (PDF p.34-37)
 * - size (always)
 * - layout (always)
 * - disposition (always)
 * - occupation (1-in-6 chance for additional occupation)
 * - specialLocation (roll based on grade)
 * - defense (roll based on grade)
 * - notableNpc (roll based on grade)
 * - ruler (always)
 * - secret (1-in-6 chance)
 * - event (1-in-6 chance)
 */
function generateVillageDetails(): Record<string, string> {
  const tables = SETTLEMENT_TABLES.village;
  const details: Record<string, string> = {};
  
  details.size = rollOnTable(tables.size).value;
  details.layout = rollOnTable(tables.layout).value;
  details.disposition = rollOnTable(tables.disposition).value;
  details.ruler = rollOnTable(tables.ruler).value;
  
  // Additional occupation (1-in-6 chance)
  if (oneInSixChance()) {
    details.occupation = rollOnTable(tables.occupation).value;
  }
  
  // Special location (always have at least one)
  details.specialLocation = rollOnTable(tables.specialLocation).value;
  
  // Defense (roll once for small/medium villages)
  details.defense = rollOnTable(tables.defense).value;
  
  // Notable NPC (always have at least one)
  details.notableNpc = rollOnTable(tables.notableNpc).value;
  
  // Secret (1-in-6 chance)
  if (oneInSixChance()) {
    details.secret = rollOnTable(tables.secret).value;
  }
  
  // Event (1-in-6 chance)
  if (oneInSixChance()) {
    details.event = rollOnTable(tables.event).value;
  }
  
  return details;
}

/**
 * Generate city details (PDF p.38-43)
 * - size (always)
 * - occupation (1-2 based on grade)
 * - characteristic (roll twice, may be "Nothing special")
 * - appearance (always)
 * - specialLocation (based on grade)
 * - notableNpc (based on grade)
 * - ruler (always)
 * - disposition (always)
 * - event (1-in-6 chance)
 */
function generateCityDetails(): Record<string, string> {
  const tables = SETTLEMENT_TABLES.city;
  const details: Record<string, string> = {};
  
  details.size = rollOnTable(tables.size).value;
  details.disposition = rollOnTable(tables.disposition).value;
  details.ruler = rollOnTable(tables.ruler).value;
  details.appearance = rollOnTable(tables.appearance).value;
  
  // Occupation (at least one)
  details.occupation = rollOnTable(tables.occupation).value;
  
  // Characteristic (roll twice, filter "Nothing special")
  const char1 = rollOnTable(tables.characteristic).value;
  const char2 = rollOnTable(tables.characteristic).value;
  const characteristics = [char1, char2].filter(c => c !== 'Nothing special');
  if (characteristics.length > 0) {
    details.characteristic = characteristics.join(', ');
  }
  
  // Special location
  details.specialLocation = rollOnTable(tables.specialLocation).value;
  
  // Notable NPC
  details.notableNpc = rollOnTable(tables.notableNpc).value;
  
  // Event (1-in-6 chance)
  if (oneInSixChance()) {
    details.event = rollOnTable(tables.event).value;
  }
  
  return details;
}

/**
 * Generate castle details (PDF p.44-48)
 * - condition (always)
 * - keepShape (always)
 * - keepLevels (1d3+1)
 * - defensiveStructure (1d4 times)
 * - wallShape (if has stone walls)
 * - disposition (always)
 * - event (1-in-6 chance)
 */
function generateCastleDetails(): Record<string, string> {
  const tables = SETTLEMENT_TABLES.castle;
  const details: Record<string, string> = {};
  
  details.condition = rollOnTable(tables.condition).value;
  details.keepShape = rollOnTable(tables.keepShape).value;
  details.disposition = rollOnTable(tables.disposition).value;
  
  // Keep has 1d3+1 levels
  const keepLevels = Math.floor(Math.random() * 3) + 2; // 2-4 levels
  details.keepLevels = String(keepLevels);
  
  // Roll 1d4 defensive structures
  const numDefenses = Math.floor(Math.random() * 4) + 1;
  const defenses: string[] = [];
  const usedDefenses = new Set<string>();
  for (let i = 0; i < numDefenses; i++) {
    const defense = rollOnTable(tables.defensiveStructure).value;
    if (!usedDefenses.has(defense)) {
      usedDefenses.add(defense);
      defenses.push(defense);
    }
  }
  details.defense = defenses.join(', ');
  
  // If has stone walls, roll for wall shape
  if (defenses.includes('Stone walls and towers')) {
    details.wallShape = rollOnTable(tables.wallShape).value;
  }
  
  // Event (1-in-6 chance)
  if (oneInSixChance()) {
    details.event = rollOnTable(tables.event).value;
  }
  
  return details;
}

/**
 * Generate tower details (PDF p.49-52)
 * - levels (aboveground)
 * - material
 * - shape
 * - topLevel
 * - disposition
 */
function generateTowerDetails(): Record<string, string> {
  const tables = SETTLEMENT_TABLES.tower;
  const details: Record<string, string> = {};
  
  details.levels = rollOnTable(tables.levels).value;
  details.material = rollOnTable(tables.material).value;
  details.shape = rollOnTable(tables.shape).value;
  details.topLevel = rollOnTable(tables.topLevel).value;
  details.disposition = rollOnTable(tables.disposition).value;
  
  return details;
}

/**
 * Generate abbey details (PDF p.53-57)
 * - size (small or major)
 * - garden
 * - farming (roll twice)
 * - fame (only for major abbeys, 12-20 = Religious artifact)
 * - disposition
 * - event (1-in-6 chance)
 */
function generateAbbeyDetails(): Record<string, string> {
  const tables = SETTLEMENT_TABLES.abbey;
  const details: Record<string, string> = {};
  
  details.size = rollOnTable(tables.size).value;
  details.disposition = rollOnTable(tables.disposition).value;
  details.garden = rollOnTable(tables.garden).value;
  
  // Farming (roll twice for variety)
  const farming1 = rollOnTable(tables.farming).value;
  const farming2 = rollOnTable(tables.farming).value;
  if (farming1 === farming2) {
    details.farming = farming1;
  } else {
    details.farming = `${farming1}, ${farming2}`;
  }
  
  // Fame (only for major abbeys)
  if (details.size === 'major') {
    details.fame = rollOnTable(tables.fame).value;
  }
  
  // Event (1-in-6 chance)
  if (oneInSixChance()) {
    details.event = rollOnTable(tables.event).value;
  }
  
  return details;
}

/**
 * Generate settlement details based on type - dispatches to type-specific generators
 */
export function generateSettlementDetails(type: SettlementType): Record<string, string> {
  switch (type) {
    case 'hamlet':
      return generateHamletDetails();
    case 'village':
      return generateVillageDetails();
    case 'city':
      return generateCityDetails();
    case 'castle':
      return generateCastleDetails();
    case 'tower':
      return generateTowerDetails();
    case 'abbey':
      return generateAbbeyDetails();
    default:
      return {};
  }
}

/**
 * Generate a complete settlement - returns flat structure with all details at top level
 */
export function generateSettlement(type?: SettlementType): GeneratedSettlement {
  const settlementType = type || rollSettlementType();
  const name = generateNameForSettlement(settlementType);
  const details = generateSettlementDetails(settlementType);
  
  // Extract size if present
  const size = details.size as 'small' | 'medium' | 'big' | 'major' | undefined;
  
  // Return with details containing everything flat for storage
  // When stored, hex.feature.details will have type, name, and all rolled values
  return {
    type: settlementType,
    name,
    size,
    details: {
      ...details,
    },
  };
}

// ============================================
// LAIR GENERATION
// ============================================

/**
 * Roll for disposition (2d6)
 */
export function rollDisposition(): string {
  const result = rollOnTable(DISPOSITION);
  return result.value;
}

/**
 * Map terrain IDs to biome types for encounter tables
 */
const TERRAIN_TO_BIOME: Record<string, string> = {
  plains: 'grassland',
  grassland: 'grassland',
  forest: 'forest',
  hills: 'hills',
  swamp: 'marsh',
  marsh: 'marsh',
  mountain: 'mountains',
  mountains: 'mountains',
};

/**
 * Generate a lair
 */
export function generateLair(biome?: string): { 
  monsterType: string; 
  layout: string;
  disposition: string;
  percentOutside: number;
  details?: Record<string, string>;
} {
  // Get monster type from biome if provided
  let monsterType = 'Unknown creature';
  
  // Try to map terrain to biome if needed
  const effectiveBiome = biome ? (TERRAIN_TO_BIOME[biome] || biome) : undefined;
  
  if (effectiveBiome) {
    const table = BIOME_ENCOUNTER_TABLES[effectiveBiome];
    if (table) {
      const result = rollOnTable(table);
      monsterType = result.value;
    }
  }
  
  // Fallback: pick a random biome table if no biome specified
  if (monsterType === 'Unknown creature') {
    const biomes = ['grassland', 'forest', 'hills', 'marsh', 'mountains'];
    const randomBiome = biomes[Math.floor(Math.random() * biomes.length)];
    const table = BIOME_ENCOUNTER_TABLES[randomBiome];
    if (table) {
      const result = rollOnTable(table);
      monsterType = result.value;
    }
  }
  
  // Get layout
  const layoutResult = rollOnTable(LAIR_LAYOUT);
  const layout = layoutResult.value;
  
  // Get disposition
  const disposition = rollDisposition();
  
  // What percentage of monsters are outside (1d6 * 10%)
  const percentOutside = (Math.floor(Math.random() * 6) + 1) * 10;
  
  return {
    monsterType,
    layout,
    disposition,
    percentOutside,
  };
}

// ============================================
// DUNGEON GENERATION
// ============================================

/**
 * Generate a dungeon
 */
export function generateDungeon(): {
  levels: number;
  disposition: string;
  details?: Record<string, string>;
} {
  // Get number of levels
  const levelsResult = rollOnTable(DUNGEON_LEVELS);
  let levels: number;
  if (levelsResult.value === '4+') {
    levels = 4 + Math.floor(Math.random() * 3); // 4-6 levels
  } else {
    levels = parseInt(levelsResult.value);
  }
  
  // Dungeons have multiple factions, so disposition is complex
  const disposition = rollDisposition();
  
  return {
    levels,
    disposition,
  };
}

// ============================================
// FULL FEATURE GENERATION
// ============================================

/**
 * Generate a complete feature for a hex
 * @param forceType - Force a specific feature type
 * @param forceSettlementType - Force a specific settlement type (only used if forceType is 'settlement')
 * @param terrainOrBiome - The terrain ID or biome type (used for lair monster generation)
 */
export function generateFeature(
  forceType?: FeatureType, 
  forceSettlementType?: SettlementType,
  terrainOrBiome?: string
): GeneratedFeature {
  const featureType = forceType || rollFeatureType();
  
  switch (featureType) {
    case 'landmark':
      return {
        type: 'landmark',
        data: generateLandmark(),
      };
    
    case 'settlement':
      return {
        type: 'settlement',
        data: generateSettlement(forceSettlementType),
      };
    
    case 'lair':
      return {
        type: 'lair',
        data: generateLair(terrainOrBiome),
      };
    
    case 'dungeon':
      return {
        type: 'dungeon',
        data: generateDungeon(),
      };
    
    default:
      return {
        type: 'landmark',
        data: generateLandmark(),
      };
  }
}

/**
 * Generate lair monster based on biome
 */
export function generateLairMonster(biome: string): string {
  const table = BIOME_ENCOUNTER_TABLES[biome];
  if (!table) {
    return 'Unknown creature';
  }
  const result = rollOnTable(table);
  return result.value;
}

export default {
  rollFeatureType,
  rollSettlementType,
  generateLandmark,
  generateSettlement,
  generateSettlementDetails,
  generateFeature,
  generateLairMonster,
};
