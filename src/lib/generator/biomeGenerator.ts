// ============================================
// BIOME/TERRAIN GENERATOR
// ============================================

import type { HexCoord } from '../types';
import type { BiomeType } from './types';
import { BIOME_TO_TERRAIN } from './types';
import { rollOnTable, pickRandom } from './tableSystem';
import { STARTING_HEX_BIOME, NEXT_HEX_BIOME } from './tables/biomes';
import { getNeighbors } from '../hexUtils';
import { coordToKey } from '../types';

/**
 * Generate a random starting biome
 */
export function generateStartingBiome(): BiomeType {
  const result = rollOnTable(STARTING_HEX_BIOME);
  return result.value as BiomeType;
}

/**
 * Generate biome for a hex based on its neighbors
 * Uses the "Next Hex" table from PDF p.8
 */
export function generateNextBiome(neighborBiomes: BiomeType[]): BiomeType {
  const result = rollOnTable(NEXT_HEX_BIOME);
  
  if (result.value === 'same') {
    // Use a random neighbor's biome
    if (neighborBiomes.length > 0) {
      return pickRandom(neighborBiomes);
    }
    // No neighbors, generate a starting biome
    return generateStartingBiome();
  }
  
  return result.value as BiomeType;
}

/**
 * Convert biome type to terrain ID used in the map
 */
export function biomeToTerrainId(biome: BiomeType): string {
  return BIOME_TO_TERRAIN[biome] || 'unknown';
}

/**
 * Options for terrain generation
 */
export interface TerrainGeneratorOptions {
  // Use neighbor influence (PDF algorithm) or pure random
  useNeighborInfluence: boolean;
  // If set, force all hexes to this biome
  forceBiome?: BiomeType;
}

/**
 * Result of terrain generation for a single hex
 */
export interface TerrainGenerationResult {
  coord: HexCoord;
  biome: BiomeType;
  terrainId: string;
}

/**
 * Generate terrain for a set of hexes
 * 
 * @param targetCoords - The hexes to generate terrain for
 * @param existingTerrain - Map of existing hex terrain (coord key -> terrain ID)
 * @param options - Generation options
 */
export function generateTerrain(
  targetCoords: HexCoord[],
  existingTerrain: Map<string, string>,
  options: TerrainGeneratorOptions
): TerrainGenerationResult[] {
  const results: TerrainGenerationResult[] = [];
  
  // If forcing a biome, just apply it to all
  if (options.forceBiome) {
    for (const coord of targetCoords) {
      results.push({
        coord,
        biome: options.forceBiome,
        terrainId: biomeToTerrainId(options.forceBiome),
      });
    }
    return results;
  }
  
  // Track what we've generated so far (for neighbor influence)
  const generatedBiomes = new Map<string, BiomeType>();
  
  // Copy existing terrain to biomes (reverse mapping)
  const terrainToBiome: Record<string, BiomeType> = {
    plains: 'grassland',
    forest: 'forest',
    hills: 'hills',
    swamp: 'marsh',
    marsh: 'marsh',
    mountain: 'mountains',
  };
  
  for (const [key, terrainId] of existingTerrain) {
    const biome = terrainToBiome[terrainId];
    if (biome) {
      generatedBiomes.set(key, biome);
    }
  }
  
  // Process hexes - if using neighbor influence, order matters
  // We'll process in the order given, using already-generated neighbors
  for (const coord of targetCoords) {
    const key = coordToKey(coord);
    let biome: BiomeType;
    
    if (options.useNeighborInfluence) {
      // Get neighbor biomes (from existing + already generated)
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
    } else {
      // Pure random - use starting biome table
      biome = generateStartingBiome();
    }
    
    generatedBiomes.set(key, biome);
    results.push({
      coord,
      biome,
      terrainId: biomeToTerrainId(biome),
    });
  }
  
  return results;
}

/**
 * Generate terrain for hexes in a spiral pattern from center
 * This gives better neighbor influence results
 */
export function generateTerrainSpiral(
  centerCoord: HexCoord,
  allCoords: HexCoord[],
  existingTerrain: Map<string, string>,
  options: TerrainGeneratorOptions
): TerrainGenerationResult[] {
  // Sort coords by distance from center (closest first)
  const sortedCoords = [...allCoords].sort((a, b) => {
    const distA = Math.abs(a.q - centerCoord.q) + Math.abs(a.r - centerCoord.r);
    const distB = Math.abs(b.q - centerCoord.q) + Math.abs(b.r - centerCoord.r);
    return distA - distB;
  });
  
  return generateTerrain(sortedCoords, existingTerrain, options);
}

export default {
  generateStartingBiome,
  generateNextBiome,
  biomeToTerrainId,
  generateTerrain,
  generateTerrainSpiral,
};
