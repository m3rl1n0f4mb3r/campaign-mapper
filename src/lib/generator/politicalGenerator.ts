// ============================================
// POLITICAL/FACTION GENERATOR
// ============================================

import type { HexCoord, Faction, FactionRelationshipStatus } from '../types';
import type { SettlementType, DomainInfo } from './types';
import { rollOnTable, chanceIn6 } from './tableSystem';
import { FACTION_RELATIONSHIP } from './tables/features';
import { getNeighbors } from '../hexUtils';
import { coordToKey } from '../types';

// ============================================
// DOMAIN GENERATION
// ============================================

/**
 * Determine domain size based on settlement type
 * Cities and Castles = 7 hexes (center + 6 neighbors)
 * Towers and Abbeys = 1 hex (only the settlement hex)
 * Hamlets and Villages = 0 (no domain, they belong to other factions)
 */
export function getDomainSize(settlementType: SettlementType): 'large' | 'small' | 'none' {
  switch (settlementType) {
    case 'city':
    case 'castle':
      return 'large';
    case 'tower':
    case 'abbey':
      return 'small';
    case 'hamlet':
    case 'village':
    default:
      return 'none';
  }
}

/**
 * Generate the hexes that belong to a domain
 */
export function generateDomainHexes(
  centerCoord: HexCoord,
  settlementType: SettlementType
): HexCoord[] {
  const size = getDomainSize(settlementType);
  
  if (size === 'none') {
    return [];
  }
  
  if (size === 'small') {
    return [centerCoord];
  }
  
  // Large domain: center + 6 neighbors
  const neighbors = getNeighbors(centerCoord);
  return [centerCoord, ...neighbors];
}

/**
 * Create a DomainInfo object for a settlement
 */
export function createDomain(
  centerCoord: HexCoord,
  settlementType: SettlementType
): DomainInfo | null {
  const size = getDomainSize(settlementType);
  
  if (size === 'none') {
    return null;
  }
  
  return {
    centerHex: centerCoord,
    hexes: generateDomainHexes(centerCoord, settlementType),
    size,
    settlementType,
  };
}

// ============================================
// FACTION RELATIONSHIPS
// ============================================

/**
 * Roll for relationship between two factions
 */
export function rollFactionRelationship(): FactionRelationshipStatus {
  const result = rollOnTable(FACTION_RELATIONSHIP);
  return result.value as FactionRelationshipStatus;
}

/**
 * Check if two domains with overlapping hexes belong to the same faction
 * According to PDF: 3-in-6 chance they belong to the same faction
 */
export function checkSameFaction(): boolean {
  return chanceIn6(3);
}

/**
 * Find contested hexes between two domains
 */
export function findContestedHexes(domain1: DomainInfo, domain2: DomainInfo): HexCoord[] {
  const set1 = new Set(domain1.hexes.map(c => coordToKey(c)));
  const contested: HexCoord[] = [];
  
  for (const hex of domain2.hexes) {
    if (set1.has(coordToKey(hex))) {
      contested.push(hex);
    }
  }
  
  return contested;
}

/**
 * Check if two domains are neighbors (share at least one hex or adjacent hexes)
 */
export function domainsAreNeighbors(domain1: DomainInfo, domain2: DomainInfo): boolean {
  // Check for overlapping hexes
  const contested = findContestedHexes(domain1, domain2);
  if (contested.length > 0) {
    return true;
  }
  
  // Check if any hex in domain1 is adjacent to any hex in domain2
  const set2 = new Set(domain2.hexes.map(c => coordToKey(c)));
  
  for (const hex of domain1.hexes) {
    const neighbors = getNeighbors(hex);
    for (const neighbor of neighbors) {
      if (set2.has(coordToKey(neighbor))) {
        return true;
      }
    }
  }
  
  return false;
}

// ============================================
// FACTION GENERATION
// ============================================

/**
 * Generate a unique faction ID
 */
function generateFactionId(): string {
  return `faction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a faction from a settlement
 */
export function createFactionFromSettlement(
  settlementName: string,
  settlementType: SettlementType,
  centerCoord: HexCoord,
  color?: string
): Faction | null {
  const domain = createDomain(centerCoord, settlementType);
  
  if (!domain) {
    return null; // Hamlets and villages don't create factions
  }
  
  // Generate a color if not provided
  const factionColor = color || generateFactionColor();
  
  return {
    id: generateFactionId(),
    name: settlementName,
    type: 'faction',
    color: factionColor,
    sourceHexCoord: centerCoord,
    domainHexes: domain.hexes,
    relationships: [],
  };
}

/**
 * Generate a random faction color
 */
function generateFactionColor(): string {
  const colors = [
    '#e94560', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa',
    '#f472b6', '#34d399', '#38bdf8', '#fb923c', '#c084fc',
    '#f87171', '#22d3d3', '#818cf8', '#facc15', '#f97316',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate relationships between a new faction and existing factions
 */
export function generateFactionRelationships(
  newFaction: Faction,
  existingFactions: Faction[]
): void {
  // Only generate relationships with neighboring factions
  const newDomain: DomainInfo = {
    centerHex: newFaction.sourceHexCoord,
    hexes: newFaction.domainHexes,
    size: newFaction.domainHexes.length > 1 ? 'large' : 'small',
    settlementType: 'city', // Doesn't matter for neighbor check
  };
  
  for (const existingFaction of existingFactions) {
    const existingDomain: DomainInfo = {
      centerHex: existingFaction.sourceHexCoord,
      hexes: existingFaction.domainHexes,
      size: existingFaction.domainHexes.length > 1 ? 'large' : 'small',
      settlementType: 'city',
    };
    
    if (domainsAreNeighbors(newDomain, existingDomain)) {
      const relationship = rollFactionRelationship();
      
      // Add relationship to new faction
      newFaction.relationships.push({
        factionId: existingFaction.id,
        status: relationship,
      });
      
      // Add reciprocal relationship to existing faction
      existingFaction.relationships.push({
        factionId: newFaction.id,
        status: relationship,
      });
    }
  }
}

/**
 * Analyze which hexes are contested between factions
 */
export function analyzeContestedHexes(factions: Faction[]): Map<string, string[]> {
  const hexFactions = new Map<string, string[]>();
  
  for (const faction of factions) {
    for (const hex of faction.domainHexes) {
      const key = coordToKey(hex);
      if (!hexFactions.has(key)) {
        hexFactions.set(key, []);
      }
      hexFactions.get(key)!.push(faction.id);
    }
  }
  
  // Filter to only contested hexes (more than one faction)
  const contested = new Map<string, string[]>();
  for (const [key, factionIds] of hexFactions) {
    if (factionIds.length > 1) {
      contested.set(key, factionIds);
    }
  }
  
  return contested;
}

export default {
  getDomainSize,
  generateDomainHexes,
  createDomain,
  rollFactionRelationship,
  checkSameFaction,
  findContestedHexes,
  domainsAreNeighbors,
  createFactionFromSettlement,
  generateFactionRelationships,
  analyzeContestedHexes,
};
