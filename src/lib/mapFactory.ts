import type { 
  CampaignMap, 
  GridConfig, 
  Hex, 
  ImageOverlay,
  MapMode,
} from './types';
import { 
  DEFAULT_GRID_CONFIG, 
  DEFAULT_CAMPAIGN_SETTINGS,
} from './types';
import { generateGridCoords } from './hexUtils';

// ============================================
// MAP CREATION
// ============================================

export interface CreateMapOptions {
  name: string;
  mode: MapMode;
  gridConfig?: Partial<GridConfig>;
  imageOverlay?: ImageOverlay;
  defaultTerrain?: string;
}

/**
 * Create a new campaign map
 */
export function createMap(options: CreateMapOptions): CampaignMap {
  const id = `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const gridConfig: GridConfig = {
    ...DEFAULT_GRID_CONFIG,
    ...options.gridConfig,
  };
  
  // Generate hex coordinates
  const coords = generateGridCoords(gridConfig);
  
  // Create hex objects
  const hexes: Hex[] = coords.map(coord => ({
    coord,
    terrainId: options.defaultTerrain || 'unknown',
  }));
  
  return {
    id,
    name: options.name,
    createdAt: now,
    updatedAt: now,
    mode: options.mode,
    gridConfig,
    hexes,
    factions: [],
    imageOverlay: options.imageOverlay,
    settings: { ...DEFAULT_CAMPAIGN_SETTINGS },
  };
}

/**
 * Create a map for image overlay mode
 */
export function createOverlayMap(
  name: string,
  imageOverlay: ImageOverlay,
  gridConfig: Partial<GridConfig>
): CampaignMap {
  return createMap({
    name,
    mode: 'overlay',
    gridConfig,
    imageOverlay,
    defaultTerrain: 'unknown',
  });
}

/**
 * Create a blank map with specified dimensions
 */
export function createBlankMap(
  name: string,
  cols: number,
  rows: number,
  gridConfig?: Partial<GridConfig>
): CampaignMap {
  return createMap({
    name,
    mode: 'blank',
    gridConfig: {
      ...gridConfig,
      cols,
      rows,
    },
    defaultTerrain: 'plains',
  });
}

// ============================================
// MAP MODIFICATION
// ============================================

/**
 * Update grid configuration and regenerate hexes if dimensions changed
 */
export function updateGridConfig(
  map: CampaignMap,
  updates: Partial<GridConfig>
): CampaignMap {
  const newConfig = { ...map.gridConfig, ...updates };
  
  // Check if dimensions changed
  const dimensionsChanged = 
    updates.cols !== undefined && updates.cols !== map.gridConfig.cols ||
    updates.rows !== undefined && updates.rows !== map.gridConfig.rows ||
    updates.startCol !== undefined && updates.startCol !== map.gridConfig.startCol ||
    updates.startRow !== undefined && updates.startRow !== map.gridConfig.startRow;
  
  if (dimensionsChanged) {
    // Generate new coordinates
    const newCoords = generateGridCoords(newConfig);
    
    // Create a map of existing hexes for preservation
    const existingHexes = new Map<string, Hex>();
    for (const hex of map.hexes) {
      existingHexes.set(`${hex.coord.q},${hex.coord.r}`, hex);
    }
    
    // Create new hex array, preserving data for existing coordinates
    const newHexes: Hex[] = newCoords.map(coord => {
      const key = `${coord.q},${coord.r}`;
      const existing = existingHexes.get(key);
      if (existing) {
        return existing;
      }
      return {
        coord,
        terrainId: 'unknown',
      };
    });
    
    return {
      ...map,
      gridConfig: newConfig,
      hexes: newHexes,
      updatedAt: new Date().toISOString(),
    };
  }
  
  return {
    ...map,
    gridConfig: newConfig,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update a single hex
 */
export function updateHex(
  map: CampaignMap,
  coord: { q: number; r: number },
  updates: Partial<Hex>
): CampaignMap {
  const hexIndex = map.hexes.findIndex(
    h => h.coord.q === coord.q && h.coord.r === coord.r
  );
  
  if (hexIndex === -1) return map;
  
  const newHexes = [...map.hexes];
  newHexes[hexIndex] = {
    ...newHexes[hexIndex],
    ...updates,
  };
  
  return {
    ...map,
    hexes: newHexes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update hex campaign data
 */
export function updateHexCampaignData(
  map: CampaignMap,
  coord: { q: number; r: number },
  updates: Partial<Hex['campaignData']>
): CampaignMap {
  const hexIndex = map.hexes.findIndex(
    h => h.coord.q === coord.q && h.coord.r === coord.r
  );
  
  if (hexIndex === -1) return map;
  
  const hex = map.hexes[hexIndex];
  const newHexes = [...map.hexes];
  newHexes[hexIndex] = {
    ...hex,
    campaignData: {
      ...hex.campaignData,
      ...updates,
      modifiedAt: new Date().toISOString(),
    },
  };
  
  return {
    ...map,
    hexes: newHexes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Bulk update multiple hexes
 */
export function bulkUpdateHexes(
  map: CampaignMap,
  coords: Array<{ q: number; r: number }>,
  updates: Partial<Hex>
): CampaignMap {
  const coordSet = new Set(coords.map(c => `${c.q},${c.r}`));
  
  const newHexes = map.hexes.map(hex => {
    const key = `${hex.coord.q},${hex.coord.r}`;
    if (coordSet.has(key)) {
      return { ...hex, ...updates };
    }
    return hex;
  });
  
  return {
    ...map,
    hexes: newHexes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Bulk update terrain for multiple hexes
 */
export function bulkUpdateTerrain(
  map: CampaignMap,
  coords: Array<{ q: number; r: number }>,
  terrainId: string
): CampaignMap {
  const coordSet = new Set(coords.map(c => `${c.q},${c.r}`));
  
  const newHexes = map.hexes.map(hex => {
    const key = `${hex.coord.q},${hex.coord.r}`;
    if (coordSet.has(key)) {
      return {
        ...hex,
        terrainId,
        campaignData: {
          ...hex.campaignData,
          terrainOverride: undefined, // Clear override when setting base terrain
          modifiedAt: new Date().toISOString(),
        },
      };
    }
    return hex;
  });
  
  return {
    ...map,
    hexes: newHexes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Bulk add tags to multiple hexes
 */
export function bulkAddTags(
  map: CampaignMap,
  coords: Array<{ q: number; r: number }>,
  tags: string[]
): CampaignMap {
  const coordSet = new Set(coords.map(c => `${c.q},${c.r}`));
  
  const newHexes = map.hexes.map(hex => {
    const key = `${hex.coord.q},${hex.coord.r}`;
    if (coordSet.has(key)) {
      const existingTags = hex.campaignData?.tags || [];
      const newTags = [...new Set([...existingTags, ...tags])];
      return {
        ...hex,
        campaignData: {
          ...hex.campaignData,
          tags: newTags,
          modifiedAt: new Date().toISOString(),
        },
      };
    }
    return hex;
  });
  
  return {
    ...map,
    hexes: newHexes,
    updatedAt: new Date().toISOString(),
  };
}
