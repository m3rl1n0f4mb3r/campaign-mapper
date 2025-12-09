// ============================================
// MAP GENERATOR
// Handles full map and regional (19-hex) generation
// Based on Sandbox Generator PDF algorithms
// ============================================

import type { HexCoord, Hex } from '../types';
import { coordToKey } from '../types';
import { getNeighbors, hexDistance } from '../hexUtils';
import { normalizeFeatureData, detailsToFeatureNotes } from '../featureUtils';
import type { BiomeType, FeatureType, GeneratedFeature as GeneratorFeature } from './types';
import {
  generateStartingBiome,
  generateNextBiome,
  biomeToTerrainId
} from './biomeGenerator';
import { generateFeature, rollFeatureType } from './featureGenerator';
import { percentageCheck } from './tableSystem';

// ============================================
// SPIRAL COORDINATE GENERATION
// ============================================

/**
 * Axial direction vectors for clockwise spiral
 * Starting from East, going clockwise: E, SE, SW, W, NW, NE
 */
const CLOCKWISE_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },   // E
  { q: 0, r: 1 },   // SE
  { q: -1, r: 1 },  // SW
  { q: -1, r: 0 },  // W
  { q: 0, r: -1 },  // NW
  { q: 1, r: -1 },  // NE
];

/**
 * Generate coordinates in a clockwise spiral pattern from center
 * This is the order hexes should be generated for proper neighbor influence
 */
export function generateSpiralCoords(center: HexCoord, radius: number): HexCoord[] {
  const coords: HexCoord[] = [center];
  
  if (radius === 0) return coords;
  
  // For each ring from 1 to radius
  for (let ring = 1; ring <= radius; ring++) {
    // Start at the hex directly to the "east" of center, `ring` steps away
    let current: HexCoord = {
      q: center.q + ring,
      r: center.r,
    };
    
    // Walk around the ring in 6 directions
    for (let side = 0; side < 6; side++) {
      const direction = CLOCKWISE_DIRECTIONS[(side + 2) % 6]; // Offset to start walking SW
      
      for (let step = 0; step < ring; step++) {
        coords.push(current);
        current = {
          q: current.q + direction.q,
          r: current.r + direction.r,
        };
      }
    }
  }
  
  return coords;
}

/**
 * Generate 19-hex region (center + 2 rings)
 * This is the "local" generation method from the PDF
 */
export function generate19HexRegion(center: HexCoord): HexCoord[] {
  return generateSpiralCoords(center, 2);
}

/**
 * Calculate the radius needed to cover a rectangular grid
 */
export function calculateCoverageRadius(
  cols: number, 
  rows: number,
  center: HexCoord,
  startCol: number,
  startRow: number
): number {
  // Calculate the maximum distance from center to any corner
  const corners = [
    { q: startCol, r: startRow },
    { q: startCol + cols - 1, r: startRow },
    { q: startCol, r: startRow + rows - 1 },
    { q: startCol + cols - 1, r: startRow + rows - 1 },
  ];
  
  let maxDist = 0;
  for (const corner of corners) {
    const dist = hexDistance(center, corner);
    if (dist > maxDist) maxDist = dist;
  }
  
  return Math.ceil(maxDist) + 1;
}

// ============================================
// GENERATION OPTIONS
// ============================================

export interface MapGenerationOptions {
  // What to generate
  generateTerrain: boolean;
  generateFeatures: boolean;
  
  // Feature options (when generateFeatures is true)
  featureChance: number;        // Percentage chance per hex (default 15%)
  includeLandmarks: boolean;
  includeSettlements: boolean;
  includeLairs: boolean;
  includeDungeons: boolean;
  
  // Starting biome (optional - if not set, will roll randomly)
  startingBiome?: BiomeType;
}

export const DEFAULT_GENERATION_OPTIONS: MapGenerationOptions = {
  generateTerrain: true,
  generateFeatures: true,
  featureChance: 15,
  includeLandmarks: true,
  includeSettlements: true,
  includeLairs: true,
  includeDungeons: true,
};

// ============================================
// GENERATION RESULT
// ============================================

export interface HexGenerationResult {
  coord: HexCoord;
  terrainId: string;
  biome: BiomeType;
  featureType?: FeatureType;
  feature?: GeneratorFeature;
}

// ============================================
// CORE GENERATION FUNCTIONS
// ============================================

/**
 * Generate a single hex based on its neighbors
 */
function generateSingleHex(
  coord: HexCoord,
  generatedBiomes: Map<string, BiomeType>,
  options: MapGenerationOptions,
  isFirst: boolean
): HexGenerationResult {
  const key = coordToKey(coord);
  
  // Generate terrain
  let biome: BiomeType;
  
  if (isFirst && options.startingBiome) {
    biome = options.startingBiome;
  } else if (isFirst) {
    biome = generateStartingBiome();
  } else {
    // Get neighbor biomes
    const neighbors = getNeighbors(coord);
    const neighborBiomes: BiomeType[] = [];
    
    for (const neighbor of neighbors) {
      const neighborKey = coordToKey(neighbor);
      const existingBiome = generatedBiomes.get(neighborKey);
      if (existingBiome) {
        neighborBiomes.push(existingBiome);
      }
    }
    
    biome = generateNextBiome(neighborBiomes);
  }
  
  const terrainId = biomeToTerrainId(biome);
  generatedBiomes.set(key, biome);
  
  const result: HexGenerationResult = {
    coord,
    terrainId,
    biome,
  };
  
  // Generate feature if enabled
  if (options.generateFeatures && percentageCheck(options.featureChance)) {
    const featureType = rollFeatureType();
    
    // Check if this feature type is enabled
    const shouldGenerate = 
      (featureType === 'landmark' && options.includeLandmarks) ||
      (featureType === 'settlement' && options.includeSettlements) ||
      (featureType === 'lair' && options.includeLairs) ||
      (featureType === 'dungeon' && options.includeDungeons);
    
    if (shouldGenerate) {
      result.featureType = featureType;
      result.feature = generateFeature(featureType, undefined, terrainId);
    }
  }
  
  return result;
}

/**
 * Generate terrain and features for a 19-hex region
 * This is the "piece together" method for existing maps
 */
export function generateRegion(
  centerCoord: HexCoord,
  existingTerrain: Map<string, string>,
  options: Partial<MapGenerationOptions> = {}
): HexGenerationResult[] {
  const opts = { ...DEFAULT_GENERATION_OPTIONS, ...options };
  const results: HexGenerationResult[] = [];
  
  // Convert existing terrain to biomes
  const generatedBiomes = terrainToBiomeMap(existingTerrain);
  
  // Get 19-hex spiral coords
  const coords = generate19HexRegion(centerCoord);
  
  // Filter out coords that already have terrain (unless we want to overwrite)
  const targetCoords = coords.filter(c => !existingTerrain.has(coordToKey(c)));
  
  // Generate each hex in spiral order
  for (let i = 0; i < targetCoords.length; i++) {
    const coord = targetCoords[i];
    const isFirst = i === 0 && !hasAnyNeighborTerrain(coord, generatedBiomes);
    
    const result = generateSingleHex(coord, generatedBiomes, opts, isFirst);
    results.push(result);
  }
  
  return results;
}

/**
 * Generate terrain and features for an entire map
 * Uses spiral from center for good neighbor influence
 */
export function generateFullMap(
  allCoords: HexCoord[],
  centerCoord: HexCoord,
  options: Partial<MapGenerationOptions> = {}
): HexGenerationResult[] {
  const opts = { ...DEFAULT_GENERATION_OPTIONS, ...options };
  const results: HexGenerationResult[] = [];
  const generatedBiomes = new Map<string, BiomeType>();
  
  // Create a set of valid coords for quick lookup
  const validCoords = new Set(allCoords.map(c => coordToKey(c)));
  
  // Calculate radius needed to cover all coords
  let maxDist = 0;
  for (const coord of allCoords) {
    const dist = hexDistance(centerCoord, coord);
    if (dist > maxDist) maxDist = dist;
  }
  const radius = Math.ceil(maxDist) + 1;
  
  // Generate spiral coords and filter to only valid ones
  const spiralCoords = generateSpiralCoords(centerCoord, radius);
  const orderedCoords = spiralCoords.filter(c => validCoords.has(coordToKey(c)));
  
  // Generate each hex in spiral order
  for (let i = 0; i < orderedCoords.length; i++) {
    const coord = orderedCoords[i];
    const isFirst = i === 0;
    
    const result = generateSingleHex(coord, generatedBiomes, opts, isFirst);
    results.push(result);
  }
  
  return results;
}

/**
 * Generate only features for existing hexes (terrain already exists)
 * @param coords - Coordinates to generate features for
 * @param options - Generation options
 * @param existingTerrain - Optional map of coord keys to terrain IDs (for lair monster generation)
 */
export function generateFeaturesOnly(
  coords: HexCoord[],
  options: Partial<MapGenerationOptions> = {},
  existingTerrain?: Map<string, string>
): HexGenerationResult[] {
  const opts = { ...DEFAULT_GENERATION_OPTIONS, ...options, generateTerrain: false };
  const results: HexGenerationResult[] = [];
  
  for (const coord of coords) {
    if (percentageCheck(opts.featureChance)) {
      const featureType = rollFeatureType();
      
      const shouldGenerate = 
        (featureType === 'landmark' && opts.includeLandmarks) ||
        (featureType === 'settlement' && opts.includeSettlements) ||
        (featureType === 'lair' && opts.includeLairs) ||
        (featureType === 'dungeon' && opts.includeDungeons);
      
      if (shouldGenerate) {
        // Get terrain for this coord if available (for lair monster generation)
        const terrainId = existingTerrain?.get(coordToKey(coord)) || '';
        
        results.push({
          coord,
          terrainId, // Pass through for reference
          biome: 'grassland', // Placeholder
          featureType,
          feature: generateFeature(featureType, undefined, terrainId),
        });
      }
    }
  }
  
  return results;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert terrain map to biome map
 */
function terrainToBiomeMap(terrainMap: Map<string, string>): Map<string, BiomeType> {
  const biomeMap = new Map<string, BiomeType>();
  
  const terrainToBiome: Record<string, BiomeType> = {
    plains: 'grassland',
    forest: 'forest',
    deciduous_forest: 'forest',
    dense_forest: 'forest',
    hills: 'hills',
    swamp: 'marsh',
    marsh: 'marsh',
    mountain: 'mountains',
    desert: 'grassland',
    wasteland: 'grassland',
    tundra: 'grassland',
    water: 'grassland',
  };
  
  for (const [key, terrainId] of terrainMap) {
    const biome = terrainToBiome[terrainId] || 'grassland';
    biomeMap.set(key, biome);
  }
  
  return biomeMap;
}

/**
 * Check if a coord has any neighbors with existing terrain
 */
function hasAnyNeighborTerrain(coord: HexCoord, biomeMap: Map<string, BiomeType>): boolean {
  const neighbors = getNeighbors(coord);
  for (const neighbor of neighbors) {
    if (biomeMap.has(coordToKey(neighbor))) {
      return true;
    }
  }
  return false;
}

/**
 * Apply generation results to hex array
 */
export function applyGenerationResults(
  hexes: Hex[],
  results: HexGenerationResult[]
): Hex[] {
  const resultMap = new Map(results.map(r => [coordToKey(r.coord), r]));
  
  return hexes.map(hex => {
    const result = resultMap.get(coordToKey(hex.coord));
    if (!result) return hex;
    
    const updates: Partial<Hex> = {};
    
    if (result.terrainId) {
      updates.terrainId = result.terrainId;
    }
    
    if (result.featureType && result.feature) {
      updates.featureType = result.featureType;

      // Extract data from the generator feature type
      const featureData = 'data' in result.feature
        ? result.feature.data
        : result.feature;

      const { details, featureName } = normalizeFeatureData(result.featureType, featureData);

      // Convert generated details to feature notes
      const featureNotes = detailsToFeatureNotes(details);

      updates.feature = {
        type: result.featureType,
        details,
        originalDetails: details,
        originalFeatureType: result.featureType,
        originalTerrainId: result.terrainId,
      };

      // Set campaign data with name and feature notes
      updates.campaignData = {
        ...hex.campaignData,
        name: featureName || hex.campaignData?.name,
        featureNotes,
      };
    }
    
    return { ...hex, ...updates };
  });
}

export default {
  generateSpiralCoords,
  generate19HexRegion,
  generateRegion,
  generateFullMap,
  generateFeaturesOnly,
  applyGenerationResults,
  DEFAULT_GENERATION_OPTIONS,
};
