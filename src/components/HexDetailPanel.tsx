import React, { useState, useCallback } from 'react';
import type { Hex, HexCoord, TerrainType, Faction, HexCampaignData, GridConfig, CampaignMap } from '@/lib/types';
import { hexHasUserData, getEffectiveTerrain, DEFAULT_TERRAIN_TYPES, coordToKey } from '@/lib/types';
import { axialToOffset } from '@/lib/hexUtils';
import type { BiomeType, SettlementType, FeatureType } from '@/lib/generator/types';
import { generateTerrain } from '@/lib/generator/biomeGenerator';
import { generateFeature } from '@/lib/generator/featureGenerator';
import { generateNameOptions } from '@/lib/generator/nameGenerator';
import { createFactionFromSettlement, generateFactionRelationships } from '@/lib/generator/politicalGenerator';
import { generateRegion, generate19HexRegion, generateFeaturesOnly } from '@/lib/generator/mapGenerator';

// Accordion component for collapsible sections
interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="accordion">
      <button 
        className="accordion-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="accordion-title">{title}</span>
        <span className="accordion-icon">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
};

interface HexDetailPanelProps {
  hex: Hex;
  neighbors: Hex[];
  gridConfig: GridConfig;
  map: CampaignMap;
  factions: Faction[];
  availableTags: string[];
  customTerrainTypes: TerrainType[];
  onUpdate: (updates: Partial<HexCampaignData>) => void;
  onTerrainChange: (terrainId: string) => void;
  onNeighborClick: (coord: HexCoord) => void;
  onHexUpdate: (coord: HexCoord, changes: Partial<Hex>) => void;
  onBulkHexUpdate: (updates: Array<{ coord: HexCoord; changes: Partial<Hex> }>) => void;
  onAddFaction: (faction: Faction) => void;
  onUpdateFaction: (faction: Faction) => void;
  onClose: () => void;
}

type TabId = 'overview' | 'campaign' | 'details' | 'generate';

// Generator constants
const BIOME_OPTIONS: { value: BiomeType; label: string }[] = [
  { value: 'grassland', label: 'Grassland' },
  { value: 'forest', label: 'Forest' },
  { value: 'hills', label: 'Hills' },
  { value: 'marsh', label: 'Marsh' },
  { value: 'mountains', label: 'Mountains' },
];

const SETTLEMENT_OPTIONS: { value: SettlementType; label: string }[] = [
  { value: 'hamlet', label: 'Hamlet' },
  { value: 'village', label: 'Village' },
  { value: 'city', label: 'City' },
  { value: 'castle', label: 'Castle' },
  { value: 'tower', label: 'Tower' },
  { value: 'abbey', label: 'Abbey' },
];

const FEATURE_OPTIONS: { value: FeatureType; label: string }[] = [
  { value: 'landmark', label: 'Landmark' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'lair', label: 'Lair' },
  { value: 'dungeon', label: 'Dungeon' },
];

function getTerrainInfo(terrainId: string, customTerrains: TerrainType[]): TerrainType {
  const allTerrains = [...DEFAULT_TERRAIN_TYPES, ...customTerrains];
  return allTerrains.find(t => t.id === terrainId) || {
    id: terrainId,
    name: terrainId,
    color: '#808080',
  };
}

// Helper to format a key for display
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .replace(/npc/gi, 'NPC');
}

// Default feature note keys by feature type
// These provide a starting point; users can add/remove notes freely
const DEFAULT_FEATURE_NOTE_KEYS: Record<string, string[]> = {
  settlement: ['Description', 'Notable NPCs', 'Current Events'],
  landmark: ['Description', 'Contents', 'History'],
  lair: ['Description', 'Inhabitants', 'Treasure'],
  dungeon: ['Description', 'Levels', 'History'],
};

// Helper to normalize feature data for storage (flattens settlement structure)
function normalizeFeatureData(
  featureType: string,
  data: unknown
): { details: Record<string, unknown>; settlementName?: string } {
  if (featureType === 'settlement') {
    // For settlements, flatten the structure: merge type, name with details
    const settlement = data as { type: string; name: string; details?: Record<string, string> };
    return {
      details: {
        type: settlement.type,
        name: settlement.name,
        ...(settlement.details || {}),
      },
      settlementName: settlement.name,
    };
  }
  // For other feature types, use data directly
  return {
    details: data as Record<string, unknown>,
  };
}

// Helper to format generated feature details for display in collapsed section
function formatGeneratedDetails(details: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'details') continue; // Skip nested details object
    if (typeof value === 'object') continue; // Skip complex objects

    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    lines.push(`${formatLabel(key)}: ${displayValue}`);
  }
  return lines.join('\n');
}

// Default note keys that are shown initially (can be deleted by user)
const DEFAULT_NOTE_KEYS = ['Description', 'Points of Interest', 'Events'];

const HexDetailPanel: React.FC<HexDetailPanelProps> = ({
  hex,
  neighbors,
  gridConfig,
  map,
  factions,
  availableTags,
  customTerrainTypes,
  onUpdate,
  onTerrainChange,
  onNeighborClick,
  onHexUpdate,
  onBulkHexUpdate,
  onAddFaction,
  onUpdateFaction,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [newTag, setNewTag] = useState('');
  
  // Notes state
  const [newNoteKey, setNewNoteKey] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Feature notes state
  const [newFeatureNoteKey, setNewFeatureNoteKey] = useState('');
  const [isAddingFeatureNote, setIsAddingFeatureNote] = useState(false);
  
  // Generator state
  const [forceBiome, setForceBiome] = useState<BiomeType>('grassland');
  const [forceFeatureType, setForceFeatureType] = useState<FeatureType>('landmark');
  const [forceSettlementType, setForceSettlementType] = useState<SettlementType>('village');
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>('');
  
  // Regional generation state
  const [regionIncludeLandmarks, setRegionIncludeLandmarks] = useState(true);
  const [regionIncludeSettlements, setRegionIncludeSettlements] = useState(true);
  const [regionIncludeLairs, setRegionIncludeLairs] = useState(true);
  const [regionIncludeDungeons, setRegionIncludeDungeons] = useState(true);
  const [regionFeatureChance, setRegionFeatureChance] = useState(15);
  const [regionGenerateFactions, setRegionGenerateFactions] = useState(false);
  
  const campaignData = hex.campaignData || {};
  const effectiveTerrain = getEffectiveTerrain(hex);
  const terrain = getTerrainInfo(effectiveTerrain, customTerrainTypes);
  const allTerrains = [...DEFAULT_TERRAIN_TYPES, ...customTerrainTypes];
  
  // Find factions that control this hex
  const hexKey = coordToKey(hex.coord);
  const controllingFactions = factions.filter(f => 
    f.domainHexes.some(h => coordToKey(h) === hexKey)
  );
  
  // Get display coordinate
  const { col, row } = axialToOffset(hex.coord, gridConfig);
  const displayCoord = `${String(col).padStart(2, '0')}${String(row).padStart(2, '0')}`;
  
  const handleFieldChange = useCallback((
    field: keyof HexCampaignData, 
    value: string | boolean | undefined
  ) => {
    onUpdate({ [field]: value || undefined });
  }, [onUpdate]);
  
  const handleAddTag = useCallback((tag: string) => {
    if (!tag) return;
    const currentTags = campaignData.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdate({ tags: [...currentTags, tag] });
    }
    setNewTag('');
  }, [campaignData.tags, onUpdate]);
  
  const handleRemoveTag = useCallback((tag: string) => {
    const currentTags = campaignData.tags || [];
    onUpdate({ tags: currentTags.filter(t => t !== tag) });
  }, [campaignData.tags, onUpdate]);
  
  const handleToggleExplored = useCallback(() => {
    onUpdate({
      explored: !campaignData.explored,
      lastVisited: !campaignData.explored ? new Date().toISOString() : undefined,
    });
  }, [campaignData.explored, onUpdate]);
  
  // Generator handlers
  const handleGenerateTerrain = useCallback((mode: 'auto' | 'force') => {
    const existingTerrain = new Map<string, string>();
    for (const h of map.hexes) {
      existingTerrain.set(coordToKey(h.coord), h.terrainId);
    }
    
    const results = generateTerrain(
      [hex.coord],
      existingTerrain,
      {
        useNeighborInfluence: mode === 'auto',
        forceBiome: mode === 'force' ? forceBiome : undefined,
      }
    );
    
    if (results.length > 0) {
      onHexUpdate(hex.coord, { terrainId: results[0].terrainId });
    }
  }, [hex.coord, map.hexes, forceBiome, onHexUpdate]);
  
  const handleGenerateFeature = useCallback((mode: 'auto' | 'force') => {
    const feature = generateFeature(
      mode === 'force' ? forceFeatureType : undefined,
      forceFeatureType === 'settlement' && mode === 'force' ? forceSettlementType : undefined,
      hex.terrainId // Pass terrain for lair monster generation
    );
    
    const { details, settlementName } = normalizeFeatureData(feature.type, feature.data);
    
    const changes: Partial<Hex> = {
      featureType: feature.type,
      feature: {
        type: feature.type,
        details,
      },
    };
    
    if (settlementName) {
      changes.campaignData = {
        ...hex.campaignData,
        name: settlementName,
      };
    }
    
    onHexUpdate(hex.coord, changes);
  }, [hex.coord, hex.campaignData, forceFeatureType, forceSettlementType, onHexUpdate]);
  
  const handleGenerateNames = useCallback(() => {
    let settlementType: SettlementType = 'village';
    if (hex.feature?.type === 'settlement') {
      const details = hex.feature.details as { type?: SettlementType };
      settlementType = details.type || 'village';
    }
    
    const names = generateNameOptions(settlementType, 5);
    setGeneratedNames(names);
    setSelectedName(names[0] || '');
  }, [hex.feature]);
  
  const handleApplyName = useCallback(() => {
    if (!selectedName) return;
    onUpdate({ name: selectedName });
    setGeneratedNames([]);
    setSelectedName('');
  }, [selectedName, onUpdate]);
  
  const handleCreateFaction = useCallback(() => {
    const name = hex.campaignData?.name || 'Unnamed';
    
    // Determine settlement type based on feature
    let settlementType: SettlementType;
    
    if (hex.feature?.type === 'settlement') {
      // For settlements, use the actual settlement type
      const details = hex.feature.details as { type?: SettlementType };
      settlementType = details.type || 'village';
    } else {
      // For non-settlements (lairs, dungeons, landmarks), default to 'tower' 
      // which gives 1 hex domain
      settlementType = 'tower';
    }
    
    const faction = createFactionFromSettlement(name, settlementType, hex.coord);
    
    if (faction) {
      generateFactionRelationships(faction, map.factions);
      onAddFaction(faction);
    }
  }, [hex.coord, hex.campaignData?.name, hex.feature, map.factions, onAddFaction]);
  
  // Feature type change handler
  const handleFeatureTypeChange = useCallback((newType: string) => {
    if (newType === '') {
      // Remove feature entirely
      onHexUpdate(hex.coord, {
        featureType: undefined,
        feature: undefined,
      });
      // Also clear feature-related campaign data
      const updates: Partial<HexCampaignData> = {};
      if (campaignData.featureOverride) updates.featureOverride = undefined;
      if (campaignData.featureNotes) updates.featureNotes = undefined;
      if (campaignData.deletedFeatureNotes) updates.deletedFeatureNotes = undefined;
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    } else if (newType !== hex.featureType) {
      // Change to a different feature type - create empty feature structure
      const featureType = newType as FeatureType;
      onHexUpdate(hex.coord, {
        featureType,
        feature: {
          type: featureType,
          details: { type: featureType },
        },
      });
      // Clear old feature-related campaign data since they may not apply to new type
      const updates: Partial<HexCampaignData> = {};
      if (campaignData.featureOverride) updates.featureOverride = undefined;
      if (campaignData.featureNotes) updates.featureNotes = undefined;
      if (campaignData.deletedFeatureNotes) updates.deletedFeatureNotes = undefined;
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    }
  }, [hex.coord, hex.featureType, campaignData.featureOverride, campaignData.featureNotes, campaignData.deletedFeatureNotes, onHexUpdate, onUpdate]);
  
  // Notes handlers
  const handleNoteChange = useCallback((key: string, value: string) => {
    const currentNotes = campaignData.notes || {};
    if (value === '') {
      // Keep the key but with empty value (user can delete explicitly)
      onUpdate({ notes: { ...currentNotes, [key]: value } });
    } else {
      onUpdate({ notes: { ...currentNotes, [key]: value } });
    }
  }, [campaignData.notes, onUpdate]);
  
  const handleDeleteNote = useCallback((key: string) => {
    const currentNotes = campaignData.notes || {};
    const { [key]: _, ...rest } = currentNotes;
    
    // Track if this was a default note being deleted
    const isDefaultNote = DEFAULT_NOTE_KEYS.includes(key);
    const currentDeleted = campaignData.deletedNotes || [];
    
    const updates: Partial<HexCampaignData> = {
      notes: Object.keys(rest).length > 0 ? rest : undefined,
    };
    
    // If deleting a default note, add it to deletedNotes so it doesn't come back
    if (isDefaultNote && !currentDeleted.includes(key)) {
      updates.deletedNotes = [...currentDeleted, key];
    }
    
    onUpdate(updates);
  }, [campaignData.notes, campaignData.deletedNotes, onUpdate]);
  
  const handleAddNote = useCallback(() => {
    if (!newNoteKey.trim()) return;
    const key = newNoteKey.trim();
    const currentNotes = campaignData.notes || {};
    // Don't overwrite existing notes
    if (!(key in currentNotes)) {
      onUpdate({ notes: { ...currentNotes, [key]: '' } });
    }
    setNewNoteKey('');
    setIsAddingNote(false);
  }, [newNoteKey, campaignData.notes, onUpdate]);
  
  // Get all note keys: existing notes + default keys (unless explicitly deleted)
  const noteKeys = React.useMemo(() => {
    const existing = Object.keys(campaignData.notes || {});
    const deleted = new Set(campaignData.deletedNotes || []);
    const allKeys = new Set(existing);
    
    // Add default keys unless they've been explicitly deleted
    DEFAULT_NOTE_KEYS.forEach(k => {
      if (!deleted.has(k)) {
        allKeys.add(k);
      }
    });
    
    // Sort: defaults first (in order), then custom notes alphabetically
    const sorted = Array.from(allKeys).sort((a, b) => {
      const aIsDefault = DEFAULT_NOTE_KEYS.includes(a);
      const bIsDefault = DEFAULT_NOTE_KEYS.includes(b);
      if (aIsDefault && bIsDefault) {
        return DEFAULT_NOTE_KEYS.indexOf(a) - DEFAULT_NOTE_KEYS.indexOf(b);
      }
      if (aIsDefault) return -1;
      if (bIsDefault) return 1;
      return a.localeCompare(b);
    });
    
    return sorted;
  }, [campaignData.notes, campaignData.deletedNotes]);

  // Feature notes handlers
  const handleFeatureNoteChange = useCallback((key: string, value: string) => {
    const currentNotes = campaignData.featureNotes || {};
    onUpdate({ featureNotes: { ...currentNotes, [key]: value } });
  }, [campaignData.featureNotes, onUpdate]);

  const handleDeleteFeatureNote = useCallback((key: string) => {
    const currentNotes = campaignData.featureNotes || {};
    const { [key]: _, ...rest } = currentNotes;

    // Get default keys for current feature type
    const defaultKeys = hex.featureType ? (DEFAULT_FEATURE_NOTE_KEYS[hex.featureType] || []) : [];
    const isDefaultNote = defaultKeys.includes(key);
    const currentDeleted = campaignData.deletedFeatureNotes || [];

    const updates: Partial<HexCampaignData> = {
      featureNotes: Object.keys(rest).length > 0 ? rest : undefined,
    };

    // If deleting a default note, add it to deletedFeatureNotes so it doesn't come back
    if (isDefaultNote && !currentDeleted.includes(key)) {
      updates.deletedFeatureNotes = [...currentDeleted, key];
    }

    onUpdate(updates);
  }, [hex.featureType, campaignData.featureNotes, campaignData.deletedFeatureNotes, onUpdate]);

  const handleAddFeatureNote = useCallback(() => {
    if (!newFeatureNoteKey.trim()) return;
    const key = newFeatureNoteKey.trim();
    const currentNotes = campaignData.featureNotes || {};
    // Don't overwrite existing notes
    if (!(key in currentNotes)) {
      onUpdate({ featureNotes: { ...currentNotes, [key]: '' } });
    }
    setNewFeatureNoteKey('');
    setIsAddingFeatureNote(false);
  }, [newFeatureNoteKey, campaignData.featureNotes, onUpdate]);

  // Get all feature note keys: existing notes + default keys for this feature type (unless explicitly deleted)
  const featureNoteKeys = React.useMemo(() => {
    if (!hex.featureType) return [];

    const existing = Object.keys(campaignData.featureNotes || {});
    const deleted = new Set(campaignData.deletedFeatureNotes || []);
    const allKeys = new Set(existing);

    // Add default keys for this feature type unless they've been explicitly deleted
    const defaultKeys = DEFAULT_FEATURE_NOTE_KEYS[hex.featureType] || [];
    defaultKeys.forEach(k => {
      if (!deleted.has(k)) {
        allKeys.add(k);
      }
    });

    // Sort: defaults first (in order), then custom notes alphabetically
    const sorted = Array.from(allKeys).sort((a, b) => {
      const aIsDefault = defaultKeys.includes(a);
      const bIsDefault = defaultKeys.includes(b);
      if (aIsDefault && bIsDefault) {
        return defaultKeys.indexOf(a) - defaultKeys.indexOf(b);
      }
      if (aIsDefault) return -1;
      if (bIsDefault) return 1;
      return a.localeCompare(b);
    });

    return sorted;
  }, [hex.featureType, campaignData.featureNotes, campaignData.deletedFeatureNotes]);

  // Faction territory handlers
  const handleAddToFaction = useCallback((factionId: string) => {
    const faction = factions.find(f => f.id === factionId);
    if (!faction) return;
    
    // Check if hex is already in faction's domain
    const hexKey = coordToKey(hex.coord);
    if (faction.domainHexes.some(h => coordToKey(h) === hexKey)) return;
    
    onUpdateFaction({
      ...faction,
      domainHexes: [...faction.domainHexes, hex.coord],
    });
  }, [hex.coord, factions, onUpdateFaction]);
  
  const handleRemoveFromFaction = useCallback((factionId: string) => {
    const faction = factions.find(f => f.id === factionId);
    if (!faction) return;
    
    const hexKey = coordToKey(hex.coord);
    onUpdateFaction({
      ...faction,
      domainHexes: faction.domainHexes.filter(h => coordToKey(h) !== hexKey),
    });
  }, [hex.coord, factions, onUpdateFaction]);
  
  // Regional generation handler (19-hex region)
  // mode: 'terrain' = terrain only, 'terrain+features' = both, 'features' = features only
  const handleGenerateRegion = useCallback((mode: 'terrain' | 'terrain+features' | 'features') => {
    // Get valid hex coords in this map
    const hexMap = new Map(map.hexes.map(h => [coordToKey(h.coord), h]));
    const regionCoords = generate19HexRegion(hex.coord);
    const validRegionCoords = regionCoords.filter(c => hexMap.has(coordToKey(c)));
    
    if (mode === 'features') {
      // Features-only mode: only target hexes without existing features
      const targetCoords = validRegionCoords.filter(c => {
        const h = hexMap.get(coordToKey(c));
        return h && !h.featureType;
      });
      
      // Build terrain map for lair monster generation
      const terrainMap = new Map<string, string>();
      for (const h of map.hexes) {
        terrainMap.set(coordToKey(h.coord), h.terrainId);
      }
      
      const results = generateFeaturesOnly(targetCoords, {
        featureChance: regionFeatureChance,
        includeLandmarks: regionIncludeLandmarks,
        includeSettlements: regionIncludeSettlements,
        includeLairs: regionIncludeLairs,
        includeDungeons: regionIncludeDungeons,
      }, terrainMap);
      
      // Convert results to updates (features only, no terrain changes)
      const updates: Array<{ coord: HexCoord; changes: Partial<Hex> }> = results
        .filter(result => result.featureType && result.feature)
        .map(result => {
          const featureData = 'data' in result.feature! 
            ? result.feature!.data 
            : result.feature;
          
          const { details, settlementName } = normalizeFeatureData(result.featureType!, featureData);
          
          const changes: Partial<Hex> = {
            featureType: result.featureType,
            feature: {
              type: result.featureType!,
              details,
            },
          };
          
          // Set name for settlements
          if (settlementName) {
            changes.campaignData = {
              name: settlementName,
            };
          }
          
          return { coord: result.coord, changes };
        });
      
      if (updates.length > 0) {
        onBulkHexUpdate(updates);
        
        // Generate factions for eligible settlements if enabled
        if (regionGenerateFactions) {
          for (const update of updates) {
            if (update.changes.featureType === 'settlement' && update.changes.feature) {
              const details = update.changes.feature.details as { type?: SettlementType; name?: string };
              const settlementType = details.type || 'village';
              
              // Only cities, castles, towers, and abbeys form factions
              if (['city', 'castle', 'tower', 'abbey'].includes(settlementType)) {
                const name = details.name || update.changes.campaignData?.name || 'Unnamed';
                const faction = createFactionFromSettlement(name, settlementType, update.coord);
                if (faction) {
                  generateFactionRelationships(faction, map.factions);
                  onAddFaction(faction);
                }
              }
            }
          }
        }
      }
    } else {
      // Terrain or terrain+features mode
      const existingTerrain = new Map<string, string>();
      for (const h of map.hexes) {
        existingTerrain.set(coordToKey(h.coord), h.terrainId);
      }
      
      // Build set of hexes with existing features (to skip feature generation)
      const existingFeatures = new Set(
        map.hexes
          .filter(h => h.featureType)
          .map(h => coordToKey(h.coord))
      );
      
      const results = generateRegion(hex.coord, existingTerrain, {
        generateTerrain: true,
        generateFeatures: mode === 'terrain+features',
        featureChance: regionFeatureChance,
        includeLandmarks: regionIncludeLandmarks,
        includeSettlements: regionIncludeSettlements,
        includeLairs: regionIncludeLairs,
        includeDungeons: regionIncludeDungeons,
      });
      
      // Convert results to updates, skipping feature generation for hexes with existing features
      const updates: Array<{ coord: HexCoord; changes: Partial<Hex> }> = results.map(result => {
        const changes: Partial<Hex> = {
          terrainId: result.terrainId,
        };
        
        // Only add feature if hex doesn't already have one
        const hasExistingFeature = existingFeatures.has(coordToKey(result.coord));
        if (result.featureType && result.feature && !hasExistingFeature) {
          changes.featureType = result.featureType;
          
          const featureData = 'data' in result.feature 
            ? result.feature.data 
            : result.feature;
          
          const { details, settlementName } = normalizeFeatureData(result.featureType, featureData);
          
          changes.feature = {
            type: result.featureType,
            details,
          };
          
          if (settlementName) {
            changes.campaignData = {
              name: settlementName,
            };
          }
        }
        
        return { coord: result.coord, changes };
      });
      
      if (updates.length > 0) {
        onBulkHexUpdate(updates);
        
        // Generate factions for eligible settlements if enabled
        if (regionGenerateFactions) {
          for (const update of updates) {
            if (update.changes.featureType === 'settlement' && update.changes.feature) {
              const details = update.changes.feature.details as { type?: SettlementType; name?: string };
              const settlementType = details.type || 'village';
              
              // Only cities, castles, towers, and abbeys form factions
              if (['city', 'castle', 'tower', 'abbey'].includes(settlementType)) {
                const name = details.name || update.changes.campaignData?.name || 'Unnamed';
                const faction = createFactionFromSettlement(name, settlementType, update.coord);
                if (faction) {
                  generateFactionRelationships(faction, map.factions);
                  onAddFaction(faction);
                }
              }
            }
          }
        }
      }
    }
  }, [hex.coord, map.hexes, map.factions, regionFeatureChance, regionIncludeLandmarks, regionIncludeSettlements, regionIncludeLairs, regionIncludeDungeons, regionGenerateFactions, onBulkHexUpdate, onAddFaction]);
  
  // Count hexes in region for different generation modes
  const regionCounts = React.useMemo(() => {
    const hexMap = new Map(map.hexes.map(h => [coordToKey(h.coord), h]));
    const regionCoords = generate19HexRegion(hex.coord);
    const validRegionCoords = regionCoords.filter(c => hexMap.has(coordToKey(c)));
    
    let needsTerrain = 0;
    let needsFeature = 0;
    
    for (const coord of validRegionCoords) {
      const h = hexMap.get(coordToKey(coord));
      if (h) {
        if (h.terrainId === 'unknown') needsTerrain++;
        if (!h.featureType) needsFeature++;
      }
    }
    
    return {
      total: validRegionCoords.length,
      needsTerrain,
      needsFeature,
    };
  }, [hex.coord, map.hexes]);
  
  return (
    <div>
      {/* Header */}
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span 
              className="neighbor-terrain-dot" 
              style={{ backgroundColor: terrain.color }}
            />
            <span className="panel-title" style={{ fontFamily: 'monospace' }}>
              {displayCoord}
            </span>
            {hex.featureType && (
              <span 
                className="tag" 
                style={{ 
                  fontSize: 10, 
                  textTransform: 'uppercase',
                  background: 'var(--bg-tertiary)',
                }}
              >
                {hex.featureType}
              </span>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'campaign' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaign')}
        >
          Campaign
        </button>
        <button
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Info */}
          <div className="panel">
            <div className="panel-content">
              {/* Name */}
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={campaignData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Give this hex a name..."
                />
              </div>
              
              {/* Terrain */}
              <div className="form-group">
                <label className="form-label">Terrain</label>
                <select
                  className="form-select"
                  value={effectiveTerrain}
                  onChange={(e) => onTerrainChange(e.target.value)}
                >
                  {allTerrains.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Explored */}
              <div className="panel-row">
                <span className="panel-row-label">Explored</span>
                <button
                  className={`btn btn-sm ${campaignData.explored ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={handleToggleExplored}
                >
                  {campaignData.explored ? 'Yes' : 'No'}
                </button>
              </div>
              
              {/* Factions */}
              <div className="mt-3">
                <label className="form-label">Controlled By</label>
                {controllingFactions.length === 0 ? (
                  <p className="text-sm text-muted">No faction controls this hex</p>
                ) : (
                  <div className="flex flex-col gap-1 mb-2">
                    {controllingFactions.map(f => (
                      <div key={f.id} className="faction-control-item">
                        <span 
                          className="color-dot"
                          style={{ backgroundColor: f.color }}
                        />
                        <span className="text-sm flex-1">{f.name}</span>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRemoveFromFaction(f.id)}
                          title="Remove from faction"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add to faction dropdown */}
                {factions.filter(f => !controllingFactions.some(cf => cf.id === f.id)).length > 0 && (
                  <select
                    className="form-select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddToFaction(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Add to faction...</option>
                    {factions
                      .filter(f => !controllingFactions.some(cf => cf.id === f.id))
                      .map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          </div>
          
          {/* Tags */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Tags</span>
            </div>
            <div className="panel-content">
              <div className="tags-container mb-2">
                {(campaignData.tags || []).length === 0 ? (
                  <span className="text-muted text-sm">No tags</span>
                ) : (
                  (campaignData.tags || []).map(tag => (
                    <span key={tag} className={`tag tag-${tag}`}>
                      {tag}
                      <span 
                        className="tag-remove" 
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </span>
                    </span>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <select
                  className="form-select"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                >
                  <option value="">Add tag...</option>
                  {availableTags
                    .filter(t => !(campaignData.tags || []).includes(t))
                    .map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddTag(newTag)}
                  disabled={!newTag}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          
          {/* Neighbors */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Neighbors</span>
            </div>
            <div className="panel-content">
              <div className="neighbors-grid">
                {neighbors.map(neighbor => {
                  const nTerrain = getTerrainInfo(
                    getEffectiveTerrain(neighbor), 
                    customTerrainTypes
                  );
                  const hasData = hexHasUserData(neighbor);
                  const { col: nCol, row: nRow } = axialToOffset(neighbor.coord, gridConfig);
                  const nDisplayCoord = `${String(nCol).padStart(2, '0')}${String(nRow).padStart(2, '0')}`;
                  
                  return (
                    <div
                      key={`${neighbor.coord.q},${neighbor.coord.r}`}
                      className={`neighbor-item ${hasData ? 'has-data' : ''}`}
                      onClick={() => onNeighborClick(neighbor.coord)}
                    >
                      <span
                        className="neighbor-terrain-dot"
                        style={{ backgroundColor: nTerrain.color }}
                      />
                      <span className="text-sm" style={{ fontFamily: 'monospace' }}>
                        {nDisplayCoord}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Campaign Tab */}
      {activeTab === 'campaign' && (
        <div className="panel">
          <div className="panel-content">
            {/* Render all notes */}
            {noteKeys.map(key => (
              <div key={key} className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label" style={{ marginBottom: 0 }}>{key}</label>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteNote(key)}
                    title={`Delete "${key}" note`}
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    ×
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  value={(campaignData.notes || {})[key] || ''}
                  onChange={(e) => handleNoteChange(key, e.target.value)}
                  placeholder={`Enter ${key.toLowerCase()}...`}
                  rows={3}
                />
              </div>
            ))}
            
            {/* Empty state */}
            {noteKeys.length === 0 && !isAddingNote && (
              <p className="text-muted text-sm mb-3">No notes yet. Add one below.</p>
            )}
            
            {/* Add new note */}
            {isAddingNote ? (
              <div className="form-group">
                <label className="form-label">New Note Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="form-input flex-1"
                    value={newNoteKey}
                    onChange={(e) => setNewNoteKey(e.target.value)}
                    placeholder="e.g., Rumors, NPCs, Treasure..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNote();
                      if (e.key === 'Escape') {
                        setIsAddingNote(false);
                        setNewNoteKey('');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNote}
                    disabled={!newNoteKey.trim()}
                  >
                    Add
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNoteKey('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddingNote(true)}
                style={{ width: '100%' }}
              >
                + Add Note
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Details Tab */}
      {activeTab === 'details' && (
        <>
          {/* Hex Info */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Hex Info</span>
            </div>
            <div className="panel-content">
              <div className="panel-row">
                <span className="panel-row-label">Coordinates</span>
                <span className="panel-row-value" style={{ fontFamily: 'monospace' }}>
                  {displayCoord} (q:{hex.coord.q}, r:{hex.coord.r})
                </span>
              </div>
              
              <div className="panel-row">
                <span className="panel-row-label">Terrain</span>
                <span className="panel-row-value">{terrain.name}</span>
              </div>
              
              {campaignData.lastVisited && (
                <div className="panel-row">
                  <span className="panel-row-label">Last Visited</span>
                  <span className="panel-row-value">
                    {new Date(campaignData.lastVisited).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {/* Feature Type selector */}
              <div className="form-group mt-3">
                <label className="form-label">Feature Type</label>
                <select
                  className="form-select"
                  value={hex.featureType || ''}
                  onChange={(e) => handleFeatureTypeChange(e.target.value)}
                >
                  <option value="">None</option>
                  {FEATURE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Feature Details - only show if hex has a feature */}
          {hex.featureType && hex.feature && (
            <>
              {/* Feature Notes */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">
                    {hex.featureType.charAt(0).toUpperCase() + hex.featureType.slice(1)} Notes
                  </span>
                </div>
                <div className="panel-content">
                  {/* Render all feature notes */}
                  {featureNoteKeys.map(key => (
                    <div key={key} className="form-group">
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label" style={{ marginBottom: 0 }}>{key}</label>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteFeatureNote(key)}
                          title={`Delete "${key}" note`}
                          style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                        >
                          ×
                        </button>
                      </div>
                      <textarea
                        className="form-textarea"
                        value={(campaignData.featureNotes || {})[key] || ''}
                        onChange={(e) => handleFeatureNoteChange(key, e.target.value)}
                        placeholder={`Enter ${key.toLowerCase()}...`}
                        rows={3}
                      />
                    </div>
                  ))}

                  {/* Empty state */}
                  {featureNoteKeys.length === 0 && !isAddingFeatureNote && (
                    <p className="text-muted text-sm mb-3">No notes yet. Add one below.</p>
                  )}

                  {/* Add new feature note */}
                  {isAddingFeatureNote ? (
                    <div className="form-group">
                      <label className="form-label">New Note Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="form-input flex-1"
                          value={newFeatureNoteKey}
                          onChange={(e) => setNewFeatureNoteKey(e.target.value)}
                          placeholder="e.g., Rumors, Secrets, Treasure..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddFeatureNote();
                            if (e.key === 'Escape') {
                              setIsAddingFeatureNote(false);
                              setNewFeatureNoteKey('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleAddFeatureNote}
                          disabled={!newFeatureNoteKey.trim()}
                        >
                          Add
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setIsAddingFeatureNote(false);
                            setNewFeatureNoteKey('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setIsAddingFeatureNote(true)}
                      style={{ width: '100%' }}
                    >
                      + Add Note
                    </button>
                  )}
                </div>
              </div>

              {/* Generated Details (collapsible) */}
              <div className="panel">
                <Accordion title="Generated Details" defaultOpen={false}>
                  <pre className="text-sm text-muted" style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    {formatGeneratedDetails(hex.feature.details) || 'No generated details'}
                  </pre>
                </Accordion>
              </div>
            </>
          )}
        </>
      )}
      
      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="panel">
          <div className="panel-content" style={{ padding: 0 }}>
            {/* This Hex - Terrain */}
            <Accordion title="This Hex: Terrain" defaultOpen={true}>
              <div className="flex gap-2 mb-2">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => handleGenerateTerrain('auto')}
                >
                  Auto
                </button>
                <select
                  className="form-select"
                  value={forceBiome}
                  onChange={e => setForceBiome(e.target.value as BiomeType)}
                  style={{ width: 'auto' }}
                >
                  {BIOME_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => handleGenerateTerrain('force')}
                >
                  Set
                </button>
              </div>
            </Accordion>
            
            {/* This Hex - Feature */}
            <Accordion title="This Hex: Feature" defaultOpen={true}>
              <div className="flex gap-2 mb-2">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => handleGenerateFeature('auto')}
                >
                  Random
                </button>
                <select
                  className="form-select"
                  value={forceFeatureType}
                  onChange={e => setForceFeatureType(e.target.value as FeatureType)}
                  style={{ width: 'auto' }}
                >
                  {FEATURE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => handleGenerateFeature('force')}
                >
                  Set
                </button>
              </div>
              
              {forceFeatureType === 'settlement' && (
                <div className="form-group mb-0">
                  <label className="form-label">Settlement Type</label>
                  <select
                    className="form-select"
                    value={forceSettlementType}
                    onChange={e => setForceSettlementType(e.target.value as SettlementType)}
                  >
                    {SETTLEMENT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </Accordion>
            
            {/* This Hex - Name */}
            <Accordion title="This Hex: Name" defaultOpen={false}>
              <button
                className="btn btn-secondary mb-2"
                onClick={handleGenerateNames}
                style={{ width: '100%' }}
              >
                Roll Names
              </button>
              
              {generatedNames.length > 0 && (
                <>
                  <div className="flex flex-col gap-1 mb-2">
                    {generatedNames.map((name, i) => (
                      <button
                        key={i}
                        className={`btn btn-sm ${selectedName === name ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSelectedName(name)}
                        style={{ justifyContent: 'flex-start' }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleApplyName}
                    disabled={!selectedName}
                    style={{ width: '100%' }}
                  >
                    Apply Name
                  </button>
                </>
              )}
            </Accordion>
            
            {/* This Hex - Faction */}
            <Accordion title="This Hex: Faction" defaultOpen={false}>
              <p className="text-sm text-muted mb-2">
                {hex.feature?.type === 'settlement' ? (
                  (() => {
                    const details = hex.feature?.details as { type?: SettlementType } | undefined;
                    const type = details?.type || 'village';
                    if (type === 'city' || type === 'castle') {
                      return 'Cities/Castles control 7 hexes (center + neighbors).';
                    } else if (type === 'tower' || type === 'abbey') {
                      return 'Towers/Abbeys control 1 hex.';
                    } else {
                      return 'Hamlets/Villages do not form factions.';
                    }
                  })()
                ) : (
                  'Non-settlements control 1 hex.'
                )}
              </p>
              <button
                className="btn btn-primary"
                onClick={handleCreateFaction}
                disabled={
                  hex.feature?.type === 'settlement' && 
                  (['hamlet', 'village'] as SettlementType[]).includes(
                    (hex.feature?.details as { type?: SettlementType })?.type || 'village'
                  )
                }
                style={{ width: '100%' }}
              >
                Create Faction
              </button>
            </Accordion>
            
            {/* Regional Generation (19-hex) */}
            <Accordion title="Regional Generation (19 Hex)" defaultOpen={false}>
              <p className="text-sm text-muted mb-2">
                Generate for a 19-hex region (center + 2 rings) around this hex.
                Existing features are preserved.
              </p>
              
              {/* Stats */}
              <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                <div>Region: {regionCounts.total} hexes</div>
                {regionCounts.needsTerrain > 0 && (
                  <div style={{ color: 'var(--accent)' }}>
                    {regionCounts.needsTerrain} need terrain
                  </div>
                )}
                {regionCounts.needsFeature > 0 && (
                  <div style={{ color: 'var(--accent)' }}>
                    {regionCounts.needsFeature} without features
                  </div>
                )}
              </div>
              
              {/* Feature Options */}
              <div className="form-group">
                <label className="form-label">Features to Include</label>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={regionIncludeLandmarks}
                      onChange={e => setRegionIncludeLandmarks(e.target.checked)}
                    />
                    Landmarks
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={regionIncludeSettlements}
                      onChange={e => setRegionIncludeSettlements(e.target.checked)}
                    />
                    Settlements
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={regionIncludeLairs}
                      onChange={e => setRegionIncludeLairs(e.target.checked)}
                    />
                    Lairs
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={regionIncludeDungeons}
                      onChange={e => setRegionIncludeDungeons(e.target.checked)}
                    />
                    Dungeons
                  </label>
                </div>
              </div>
              
              {/* Feature Chance */}
              <div className="form-group">
                <label className="form-label">
                  Feature Chance: {regionFeatureChance}%
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={regionFeatureChance}
                  onChange={e => setRegionFeatureChance(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Faction Generation */}
              <div className="form-group">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={regionGenerateFactions}
                    onChange={e => setRegionGenerateFactions(e.target.checked)}
                  />
                  Generate factions for settlements
                </label>
                <p className="text-xs text-muted mt-1">
                  Creates factions for cities, castles, towers, and abbeys
                </p>
              </div>
              
              {/* Generate Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleGenerateRegion('terrain')}
                  disabled={regionCounts.needsTerrain === 0}
                >
                  Terrain Only
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleGenerateRegion('features')}
                  disabled={regionCounts.needsFeature === 0}
                >
                  Features Only
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleGenerateRegion('terrain+features')}
                >
                  Terrain + Features
                </button>
              </div>
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
};

export default HexDetailPanel;
