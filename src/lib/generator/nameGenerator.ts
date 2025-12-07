// ============================================
// NAME GENERATOR
// ============================================

import type { SettlementType } from './types';
import { rollOnTable, pickRandom, d30 } from './tableSystem';
import {
  NAME_STRUCTURE,
  NAME_COMPONENTS,
  CASTLE_NAME_FIRST,
  CASTLE_NAME_SECOND,
  ABBEY_NAME_PREFIXES,
  SAINTS,
} from './tables/names';

/**
 * Pick a random component from a named list
 */
function pickComponent(letter: string): string {
  const components = NAME_COMPONENTS[letter];
  if (!components) {
    console.warn(`Unknown name component: ${letter}`);
    return '';
  }
  return pickRandom(components);
}

/**
 * Generate a settlement name using the structure tables
 */
export function generateSettlementName(): string {
  const result = rollOnTable(NAME_STRUCTURE);
  const structure = result.value;
  
  // Parse the structure and build the name
  return buildNameFromStructure(structure);
}

/**
 * Build a name from a structure pattern
 * Structure examples: BA, BF, D-by-sea, Dington, etc.
 */
function buildNameFromStructure(structure: string): string {
  // Handle special suffixed patterns first
  if (structure === 'D-by-sea') {
    return `${pickComponent('D')}-by-sea`;
  }
  if (structure === 'D-in-D') {
    return `${pickComponent('D')}-in-${pickComponent('D')}`;
  }
  if (structure === 'D-le-D') {
    return `${pickComponent('D')}-le-${pickComponent('D')}`;
  }
  if (structure === 'D-les-bains') {
    return `${pickComponent('D')}-les-bains`;
  }
  if (structure === 'D-on-the-hill') {
    return `${pickComponent('D')}-on-the-hill`;
  }
  if (structure === 'Dington') {
    return `${pickComponent('D')}ington`;
  }
  if (structure === 'Dsby') {
    return `${pickComponent('D')}sby`;
  }
  if (structure === 'Dthorpe') {
    return `${pickComponent('D')}thorpe`;
  }
  if (structure === 'Dton') {
    return `${pickComponent('D')}ton`;
  }
  if (structure === 'Trou-au-D') {
    return `Trou-au-${pickComponent('D')}`;
  }
  if (structure === 'Trou-de-D') {
    return `Trou-de-${pickComponent('D')}`;
  }
  if (structure === 'Val-D') {
    return `Val-${pickComponent('D')}`;
  }
  
  // Handle simple letter combinations (BA, BF, BHF, etc.)
  const parts: string[] = [];
  for (const letter of structure) {
    if (NAME_COMPONENTS[letter]) {
      parts.push(pickComponent(letter));
    }
  }
  
  // Join with space or concatenate based on common patterns
  if (parts.length === 2) {
    // Could be "Robin Bank" or "Robinbank" - use space for readability
    return parts.join(' ');
  }
  if (parts.length === 3) {
    // "Knight Pass City" style
    return parts.join(' ');
  }
  
  return parts.join(' ');
}

/**
 * Generate a castle name (FirstPart + SecondPart)
 */
export function generateCastleName(): string {
  const first = pickRandom(CASTLE_NAME_FIRST);
  const second = pickRandom(CASTLE_NAME_SECOND);
  return `${first}${second}`;
}

/**
 * Generate an abbey name
 */
export function generateAbbeyName(): string {
  // 80% chance of Saint-based name, 20% other prefix
  const roll = d30();
  
  if (roll <= 24) {
    // Saint-based name
    const saint = pickRandom(SAINTS);
    return `Saint-${saint}`;
  } else {
    // Other abbey name
    return pickRandom(ABBEY_NAME_PREFIXES);
  }
}

/**
 * Generate a tower name (uses wizard/location naming)
 * Towers are named after their wizard or location
 */
export function generateTowerName(): string {
  // Use adjective + noun or location-based name
  const patterns = [
    () => `${pickComponent('E')} Tower`,           // "Black Tower"
    () => `Tower of ${pickComponent('B')}`,        // "Tower of Shadows"
    () => `${pickComponent('C')}'s Tower`,         // "John's Tower"
    () => `The ${pickComponent('E')} Spire`,       // "The Dark Spire"
    () => `${pickComponent('B')} Tower`,           // "Moon Tower"
  ];
  
  return pickRandom(patterns)();
}

/**
 * Generate a name appropriate for a settlement type
 */
export function generateNameForSettlement(type: SettlementType): string {
  switch (type) {
    case 'castle':
      return generateCastleName();
    case 'abbey':
      return generateAbbeyName();
    case 'tower':
      return generateTowerName();
    case 'hamlet':
    case 'village':
    case 'city':
    default:
      return generateSettlementName();
  }
}

/**
 * Generate multiple name options for user to choose from
 */
export function generateNameOptions(type: SettlementType, count: number = 5): string[] {
  const names: string[] = [];
  const usedNames = new Set<string>();
  
  while (names.length < count) {
    const name = generateNameForSettlement(type);
    if (!usedNames.has(name)) {
      usedNames.add(name);
      names.push(name);
    }
  }
  
  return names;
}

/**
 * Faction name patterns
 */
const FACTION_PREFIXES = [
  'The', 'Order of', 'House of', 'Clan', 'Brotherhood of', 'Guild of',
  'League of', 'Council of', 'Knights of', 'Lords of', 'Children of',
];

const FACTION_TYPES = [
  'Order', 'Brotherhood', 'Guild', 'League', 'Council', 'Covenant',
  'Alliance', 'Compact', 'Pact', 'Circle', 'Cabal', 'Syndicate',
];

/**
 * Generate a faction name
 */
export function generateFactionName(): string {
  const patterns = [
    // "The [Adjective] [Noun]s" - e.g., "The Silver Hawks"
    () => `The ${pickComponent('E')} ${pickComponent('B')}s`,
    // "Order of the [Noun]" - e.g., "Order of the Rose"
    () => `Order of the ${pickComponent('B')}`,
    // "House [Name]" - e.g., "House Galgar"
    () => `House ${pickComponent('D')}`,
    // "The [Noun] [FactionType]" - e.g., "The Dragon Guild"
    () => `The ${pickComponent('B')} ${pickRandom(FACTION_TYPES)}`,
    // "[Adjective] [FactionType]" - e.g., "Golden Alliance"
    () => `${pickComponent('E')} ${pickRandom(FACTION_TYPES)}`,
    // "Knights of [Name]" - e.g., "Knights of Vanau"
    () => `Knights of ${pickComponent('D')}`,
    // "The [Name] [FactionType]" - e.g., "The Rundur Compact"
    () => `The ${pickComponent('D')} ${pickRandom(FACTION_TYPES)}`,
    // "[Prefix] [Adjective] [Noun]" - e.g., "Brotherhood of the Black Rose"
    () => `${pickRandom(FACTION_PREFIXES)} the ${pickComponent('E')} ${pickComponent('B')}`,
  ];
  
  return pickRandom(patterns)();
}

/**
 * Generate multiple faction name options
 */
export function generateFactionNameOptions(count: number = 5): string[] {
  const names: string[] = [];
  const usedNames = new Set<string>();
  
  while (names.length < count) {
    const name = generateFactionName();
    if (!usedNames.has(name)) {
      usedNames.add(name);
      names.push(name);
    }
  }
  
  return names;
}

export default {
  generateSettlementName,
  generateCastleName,
  generateAbbeyName,
  generateTowerName,
  generateNameForSettlement,
  generateNameOptions,
  generateFactionName,
  generateFactionNameOptions,
};
