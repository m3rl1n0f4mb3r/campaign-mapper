// ============================================
// CORE COORDINATE SYSTEM
// ============================================

/**
 * Hex coordinate using axial coordinates (q, r)
 * This is the internal representation for all hex operations
 */
export interface HexCoord {
  q: number;
  r: number;
}

/**
 * Convert hex coordinate to string key for Map/Set lookups
 */
export function coordToKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

/**
 * Parse string key back to coordinate
 */
export function keyToCoord(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

// ============================================
// TERRAIN SYSTEM
// ============================================

/**
 * Terrain type definition
 */
export interface TerrainType {
  id: string;
  name: string;
  color: string;           // Hex color for filling
  symbol?: string;         // Optional symbol/icon
  description?: string;
}

/**
 * Default terrain types
 */
export const DEFAULT_TERRAIN_TYPES: TerrainType[] = [
  { id: 'plains', name: 'Plains', color: '#90EE90', symbol: '~' },
  { id: 'forest', name: 'Forest', color: '#228B22', symbol: 'T' },
  { id: 'deciduous_forest', name: 'Deciduous Forest', color: '#5a8a4a', symbol: 't' },
  { id: 'dense_forest', name: 'Dense Forest', color: '#1a3d1a', symbol: 'T' },
  { id: 'hills', name: 'Hills', color: '#D2B48C', symbol: '^' },
  { id: 'mountain', name: 'Mountain', color: '#8B4513', symbol: 'M' },
  { id: 'swamp', name: 'Swamp', color: '#708090', symbol: '=' },
  { id: 'marsh', name: 'Marsh', color: '#6B8E23', symbol: '=' },
  { id: 'water', name: 'Water', color: '#4A90D9', symbol: 'w' },
  { id: 'desert', name: 'Desert', color: '#EDC9AF', symbol: '.' },
  { id: 'wasteland', name: 'Wasteland', color: '#C4B454', symbol: 'x' },
  { id: 'tundra', name: 'Tundra', color: '#B0C4DE', symbol: '*' },
  { id: 'unknown', name: 'Unknown', color: '#808080', symbol: '?' },
];

// ============================================
// FEATURE SYSTEM (from generator)
// ============================================

export type FeatureType = 'landmark' | 'settlement' | 'lair' | 'dungeon';

export interface GeneratedFeature {
  type: FeatureType;
  name?: string;
  details: Record<string, unknown>;
  originalDetails?: Record<string, unknown>;  // Preserved copy of first-generated details
  originalFeatureType?: FeatureType;  // Original feature type when first generated
  originalTerrainId?: string;  // Terrain when feature was first generated
}

// ============================================
// HEX DATA
// ============================================

/**
 * Campaign data for a single hex - all user-editable content
 */
export interface HexCampaignData {
  // Core campaign fields
  name?: string;
  tags?: string[];

  // Arbitrary notes - key-value pairs for user content
  // Users can add/remove any notes they want
  notes?: Record<string, string>;
  // Track which default notes the user has explicitly deleted
  deletedNotes?: string[];

  // Feature notes - separate from campaign notes, tied to the hex's feature
  featureNotes?: Record<string, string>;
  // Track which default feature notes the user has explicitly deleted
  deletedFeatureNotes?: string[];

  // Overrides
  terrainOverride?: string;          // Override detected/generated terrain
  featureOverride?: Record<string, unknown>;

  // Custom user-defined fields (for programmatic use)
  customFields?: Record<string, string | number | boolean>;

  // State tracking
  explored?: boolean;
  hidden?: boolean;
  lastVisited?: string;
  modifiedAt?: string;
}

/**
 * A hex on the map
 */
export interface Hex {
  coord: HexCoord;
  
  // Terrain
  terrainId: string;                 // Current terrain type ID
  detectedTerrain?: string;          // Original terrain (from image detection)
  
  // Generated content (optional)
  featureType?: FeatureType;
  feature?: GeneratedFeature;
  
  // Faction associations
  factionIds?: string[];
  
  // Campaign data
  campaignData?: HexCampaignData;
}

/**
 * Check if a hex has any user-entered campaign data
 */
export function hexHasUserData(hex: Hex): boolean {
  if (!hex.campaignData) return false;
  const data = hex.campaignData;
  return !!(
    data.name ||
    (data.notes && Object.keys(data.notes).length > 0) ||
    (data.tags && data.tags.length > 0) ||
    data.terrainOverride ||
    data.featureOverride ||
    (data.customFields && Object.keys(data.customFields).length > 0) ||
    data.explored ||
    data.hidden
  );
}

/**
 * Get the effective terrain for a hex (override or base)
 */
export function getEffectiveTerrain(hex: Hex): string {
  return hex.campaignData?.terrainOverride || hex.terrainId;
}

// ============================================
// GRID CONFIGURATION
// ============================================

export type HexOrientation = 'flat-top' | 'pointy-top';
export type OffsetType = 'odd' | 'even';

/**
 * Grid configuration for positioning hexes
 */
export interface GridConfig {
  // Hex geometry
  orientation: HexOrientation;
  hexSize: number;                   // Radius of hex (center to vertex)
  
  // Grid positioning
  originX: number;                   // X position of first hex center
  originY: number;                   // Y position of first hex center
  
  // Offset configuration (which rows/cols are offset)
  rowOffset: OffsetType;             // For flat-top: which rows are shifted
  colOffset: OffsetType;             // For pointy-top: which cols are shifted
  
  // Grid bounds
  cols: number;
  rows: number;
  startCol: number;
  startRow: number;
  
  // Optional rotation (degrees, for aligning with images)
  rotation?: number;
  
  // Spacing adjustments (for fine-tuning alignment with images)
  colSpacing?: number;               // Override calculated column spacing
  rowSpacing?: number;               // Override calculated row spacing
}

/**
 * Default grid configuration
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  orientation: 'pointy-top',
  hexSize: 32,
  originX: 50,
  originY: 50,
  rowOffset: 'odd',
  colOffset: 'odd',
  cols: 10,
  rows: 10,
  startCol: 1,
  startRow: 1,
};

// ============================================
// FACTIONS
// ============================================

export type FactionRelationshipStatus = 
  | 'open_war' 
  | 'hostility' 
  | 'indifference' 
  | 'peace_trade' 
  | 'alliance';

export interface FactionRelationship {
  factionId: string;
  status: FactionRelationshipStatus;
}

export interface Faction {
  id: string;
  name: string;
  color?: string;
  sourceHexCoord: HexCoord;
  domainHexes: HexCoord[];
  relationships: FactionRelationship[];
  
  // Arbitrary notes - key-value pairs for user content
  notes?: Record<string, string>;
  // Track which default notes the user has explicitly deleted
  deletedNotes?: string[];
  
  customFields?: Record<string, string | number | boolean>;
}

// ============================================
// MAP
// ============================================

export type MapMode = 'overlay' | 'generated' | 'blank';

/**
 * Image overlay configuration
 */
export interface ImageOverlay {
  // Image data (base64 or URL)
  src: string;
  fileName?: string;
  
  // Image dimensions (natural size)
  width: number;
  height: number;
  
  // Display settings
  opacity: number;                   // 0-1
  visible: boolean;
}

/**
 * Campaign settings
 */
export interface CampaignSettings {
  // Display
  showDataIndicators: boolean;
  showFactionTerritories: boolean;
  showExploredStatus: boolean;
  showTerrainColors: boolean;
  showGrid: boolean;
  showCoordinates: boolean;
  hexFillOpacity: number;
  
  // Available tags for quick selection
  availableTags: string[];
  
  // Custom terrain types (in addition to defaults)
  customTerrainTypes: TerrainType[];
}

export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  showDataIndicators: true,
  showFactionTerritories: true,
  showExploredStatus: false,
  showTerrainColors: true,
  showGrid: true,
  showCoordinates: true,
  hexFillOpacity: 0.5,
  availableTags: [], // User-defined tags only
  customTerrainTypes: [],
};

/**
 * Complete campaign map
 */
export interface CampaignMap {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Mode
  mode: MapMode;
  
  // Grid configuration
  gridConfig: GridConfig;
  
  // Hexes
  hexes: Hex[];
  
  // Factions
  factions: Faction[];
  
  // Image overlay (for overlay mode)
  imageOverlay?: ImageOverlay;
  
  // Settings
  settings: CampaignSettings;
  
  // Campaign-level notes
  notes?: string;
}

// ============================================
// APP STATE
// ============================================

/**
 * Reference to a saved map
 */
export interface MapReference {
  id: string;
  name: string;
  updatedAt: string;
  mode: MapMode;
  hexCount: number;
}

/**
 * Application settings (persisted)
 */
export interface AppSettings {
  theme: 'dark' | 'light';
  recentMaps: MapReference[];
  defaultGridConfig: Partial<GridConfig>;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  recentMaps: [],
  defaultGridConfig: {},
};
