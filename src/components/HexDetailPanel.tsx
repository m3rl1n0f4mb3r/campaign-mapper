import React, { useState, useCallback } from 'react';
import type { Hex, HexCoord, TerrainType, Faction, HexCampaignData, GridConfig, CampaignMap } from '@/lib/types';
import { hexHasUserData, getEffectiveTerrain, DEFAULT_TERRAIN_TYPES, coordToKey } from '@/lib/types';
import { axialToOffset } from '@/lib/hexUtils';
import { normalizeFeatureData, detailsToFeatureNotes, formatGeneratedDetails } from '@/lib/featureUtils';
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
  customTerrainTypes: TerrainType[];
  onUpdate: (updates: Partial<HexCampaignData>) => void;
  onTerrainChange: (terrainId: string) => void;
  onNeighborClick: (coord: HexCoord) => void;
  onHexUpdate: (coord: HexCoord, changes: Partial<Hex>) => void;
  onBulkHexUpdate: (updates: Array<{ coord: HexCoord; changes: Partial<Hex> }>) => void;
  onBulkHexUpdateWithFactions: (hexUpdates: Array<{ coord: HexCoord; changes: Partial<Hex> }>, newFactions: Faction[]) => void;
  onAddFaction: (faction: Faction) => void;
  onUpdateFaction: (faction: Faction) => void;
  onClose: () => void;
}

type TabId = 'overview' | 'campaign' | 'generate';

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

// Default note keys that are shown initially (can be deleted by user)
const DEFAULT_NOTE_KEYS = ['Description', 'Points of Interest', 'Events'];

const HexDetailPanel: React.FC<HexDetailPanelProps> = ({
  hex,
  neighbors,
  gridConfig,
  map,
  factions,
  customTerrainTypes,
  onUpdate,
  onTerrainChange,
  onNeighborClick,
  onHexUpdate,
  onBulkHexUpdate,
  onBulkHexUpdateWithFactions,
  onAddFaction,
  onUpdateFaction,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [newTag, setNewTag] = useState('');
  
  // Notes state
  const [newNoteKey, setNewNoteKey] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingCampaignNotes, setIsEditingCampaignNotes] = useState(false);

  // Feature notes state
  const [newFeatureNoteKey, setNewFeatureNoteKey] = useState('');
  const [isAddingFeatureNote, setIsAddingFeatureNote] = useState(false);
  const [isEditingFeatureNotes, setIsEditingFeatureNotes] = useState(false);

  // Overview edit mode state
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  
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
  const [regionOverwriteTerrain, setRegionOverwriteTerrain] = useState(false);
  const [regionOverwriteFeatures, setRegionOverwriteFeatures] = useState(false);
  
  const campaignData = hex.campaignData || {};
  const effectiveTerrain = getEffectiveTerrain(hex);
  const terrain = getTerrainInfo(effectiveTerrain, customTerrainTypes);
  const allTerrains = [...DEFAULT_TERRAIN_TYPES, ...customTerrainTypes];

  // Collect all unique tags used across all hexes in the map (for autocomplete)
  const allUsedTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    for (const h of map.hexes) {
      if (h.campaignData?.tags) {
        for (const tag of h.campaignData.tags) {
          tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [map.hexes]);

  // Collect all unique campaign note keys used across all hexes (for autocomplete)
  const allUsedCampaignNoteKeys = React.useMemo(() => {
    const keySet = new Set<string>();
    for (const h of map.hexes) {
      if (h.campaignData?.notes) {
        for (const key of Object.keys(h.campaignData.notes)) {
          keySet.add(key);
        }
      }
    }
    return Array.from(keySet).sort();
  }, [map.hexes]);

  // Collect all unique feature note keys used across all hexes (for autocomplete)
  const allUsedFeatureNoteKeys = React.useMemo(() => {
    const keySet = new Set<string>();
    for (const h of map.hexes) {
      if (h.campaignData?.featureNotes) {
        for (const key of Object.keys(h.campaignData.featureNotes)) {
          keySet.add(key);
        }
      }
    }
    return Array.from(keySet).sort();
  }, [map.hexes]);

  // Find factions and regions that control this hex
  const hexKey = coordToKey(hex.coord);
  const controllingFactions = factions.filter(f =>
    f.domainHexes.some(h => coordToKey(h) === hexKey)
  );
  const controllingActualFactions = controllingFactions.filter(f => f.type !== 'region');
  const controllingRegions = controllingFactions.filter(f => f.type === 'region');
  
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

    const { details, featureName } = normalizeFeatureData(feature.type, feature.data);

    // Preserve original data if it exists, otherwise set it from this generation
    const originalDetails = hex.feature?.originalDetails || details;
    const originalFeatureType = hex.feature?.originalFeatureType || feature.type;
    const originalTerrainId = hex.feature?.originalTerrainId || hex.terrainId;

    // Convert generated details to feature notes
    const featureNotes = detailsToFeatureNotes(details);

    const changes: Partial<Hex> = {
      featureType: feature.type,
      feature: {
        type: feature.type,
        details,
        originalDetails,
        originalFeatureType,
        originalTerrainId,
      },
      campaignData: {
        ...hex.campaignData,
        name: featureName || hex.campaignData?.name,
        featureNotes,
        deletedFeatureNotes: undefined, // Clear deleted notes on regeneration
      },
    };

    onHexUpdate(hex.coord, changes);
  }, [hex.coord, hex.terrainId, hex.campaignData, hex.feature, forceFeatureType, forceSettlementType, onHexUpdate]);
  
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
  // Note: Feature notes are intentionally preserved when changing feature types
  const handleFeatureTypeChange = useCallback((newType: string) => {
    if (newType === '') {
      // Remove feature entirely but preserve original data and notes for reference
      const newCampaignData = { ...campaignData };
      delete newCampaignData.featureOverride; // Clear overrides since they're type-specific

      onHexUpdate(hex.coord, {
        featureType: undefined,
        feature: hex.feature?.originalDetails ? {
          type: hex.feature.type,
          details: {},
          originalDetails: hex.feature.originalDetails,
          originalFeatureType: hex.feature.originalFeatureType,
          originalTerrainId: hex.feature.originalTerrainId,
        } : undefined,
        campaignData: newCampaignData,
      });
    } else if (newType !== hex.featureType) {
      // Change to a different feature type - preserve original data and notes
      const featureType = newType as FeatureType;
      const newCampaignData = { ...campaignData };
      delete newCampaignData.featureOverride; // Clear overrides since they're type-specific

      onHexUpdate(hex.coord, {
        featureType,
        feature: {
          type: featureType,
          details: { type: featureType },
          originalDetails: hex.feature?.originalDetails,
          originalFeatureType: hex.feature?.originalFeatureType,
          originalTerrainId: hex.feature?.originalTerrainId,
        },
        campaignData: newCampaignData,
      });
    }
  }, [hex.coord, hex.feature, hex.featureType, campaignData, onHexUpdate]);
  
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

    onUpdate({
      featureNotes: Object.keys(rest).length > 0 ? rest : undefined,
    });
  }, [campaignData.featureNotes, onUpdate]);

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

  // Get all feature note keys: existing notes only (defaults are added during generation, not here)
  const featureNoteKeys = React.useMemo(() => {
    if (!hex.featureType) return [];

    const existing = Object.keys(campaignData.featureNotes || {});

    // Only use existing notes - defaults are populated during feature generation
    // This ensures notes persist when changing feature types
    const allKeys = new Set(existing);

    // Sort alphabetically
    const sorted = Array.from(allKeys).sort((a, b) => {
      return a.localeCompare(b);
    });

    return sorted;
  }, [hex.featureType, campaignData.featureNotes]);

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
      // Features-only mode: target hexes without existing features (or all if overwrite enabled)
      const targetCoords = validRegionCoords.filter(c => {
        const h = hexMap.get(coordToKey(c));
        return h && (regionOverwriteFeatures || !h.featureType);
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

          const { details, featureName } = normalizeFeatureData(result.featureType!, featureData);

          // Convert generated details to feature notes
          const featureNotes = detailsToFeatureNotes(details);

          // Get the terrain for this hex
          const hexTerrainId = terrainMap.get(coordToKey(result.coord));

          const changes: Partial<Hex> = {
            featureType: result.featureType,
            feature: {
              type: result.featureType!,
              details,
              originalDetails: details,
              originalFeatureType: result.featureType!,
              originalTerrainId: hexTerrainId,
            },
            campaignData: {
              name: featureName,
              featureNotes,
            },
          };

          return { coord: result.coord, changes };
        });
      
      if (updates.length > 0) {
        console.log('[Features-Only] Total updates:', updates.length);
        
        // Generate factions for eligible settlements if enabled
        const newFactions: Faction[] = [];
        if (regionGenerateFactions) {
          console.log('[Features-Only] Faction generation enabled, checking', updates.length, 'updates');
          
          for (const update of updates) {
            const { col, row } = axialToOffset(update.coord, gridConfig);
            const displayCoord = `${String(col).padStart(2, '0')}${String(row).padStart(2, '0')}`;
            
            // Get current hex state BEFORE update
            const currentHex = hexMap.get(coordToKey(update.coord));
            
            console.log('[Features-Only] Checking update for hex', displayCoord, ':', {
              currentFeatureType: currentHex?.featureType,
              newFeatureType: update.changes.featureType,
              hasFeatureObject: !!update.changes.feature,
              featureDetails: update.changes.feature?.details,
            });
            
            if (update.changes.featureType === 'settlement' && update.changes.feature) {
              const details = update.changes.feature.details as { type?: SettlementType; name?: string };
              const settlementType = details.type || 'village';
              
              console.log('[Features-Only] Settlement found at hex', displayCoord, ':', {
                settlementType,
                name: details.name,
                eligible: ['city', 'castle', 'tower', 'abbey'].includes(settlementType),
              });
              
              // Only cities, castles, towers, and abbeys form factions
              if (['city', 'castle', 'tower', 'abbey'].includes(settlementType)) {
                const name = details.name || update.changes.campaignData?.name || 'Unnamed';
                const faction = createFactionFromSettlement(name, settlementType, update.coord);
                if (faction) {
                  console.log('[Features-Only] ✓ Creating faction:', faction.name, 'at hex', displayCoord, 'with', faction.domainHexes.length, 'hexes');
                  newFactions.push(faction);
                } else {
                  console.log('[Features-Only] ✗ createFactionFromSettlement returned null for', settlementType);
                }
              }
            }
          }
          
          // Generate relationships between new factions and existing ones
          for (const faction of newFactions) {
            generateFactionRelationships(faction, [...map.factions, ...newFactions.filter(f => f.id !== faction.id)]);
          }
        }
        
        // Apply hex updates and add factions in a single state update to avoid race conditions
        if (newFactions.length > 0) {
          onBulkHexUpdateWithFactions(updates, newFactions);
        } else {
          onBulkHexUpdate(updates);
        }
      }
    } else {
      // Terrain or terrain+features mode
      const existingTerrain = new Map<string, string>();
      for (const h of map.hexes) {
        // Only include in existing terrain map if not overwriting or if terrain is not 'unknown'
        if (!regionOverwriteTerrain && h.terrainId !== 'unknown') {
          existingTerrain.set(coordToKey(h.coord), h.terrainId);
        }
      }
      
      // Build set of hexes with existing features (to skip feature generation unless overwriting)
      const existingFeatures = new Set(
        map.hexes
          .filter(h => h.featureType && !regionOverwriteFeatures)
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
      
      // Convert results to updates
      const updates: Array<{ coord: HexCoord; changes: Partial<Hex> }> = results.map(result => {
        const changes: Partial<Hex> = {
          terrainId: result.terrainId,
        };
        
        // Add feature if generated and (no existing feature OR overwrite enabled)
        const hasExistingFeature = existingFeatures.has(coordToKey(result.coord));
        if (result.featureType && result.feature && !hasExistingFeature) {
          changes.featureType = result.featureType;

          const featureData = 'data' in result.feature
            ? result.feature.data
            : result.feature;

          const { details, featureName } = normalizeFeatureData(result.featureType, featureData);

          // Convert generated details to feature notes
          const featureNotes = detailsToFeatureNotes(details);

          changes.feature = {
            type: result.featureType,
            details,
            originalDetails: details,
            originalFeatureType: result.featureType,
            originalTerrainId: result.terrainId,
          };

          changes.campaignData = {
            name: featureName,
            featureNotes,
          };
        }
        
        return { coord: result.coord, changes };
      });
      
      if (updates.length > 0) {
        console.log('[Terrain/Terrain+Features] Total updates:', updates.length);
        
        // Generate factions for eligible settlements if enabled
        const newFactions: Faction[] = [];
        if (regionGenerateFactions) {
          console.log('[Terrain/Terrain+Features] Faction generation enabled, checking', updates.length, 'updates');
          
          for (const update of updates) {
            const { col, row } = axialToOffset(update.coord, gridConfig);
            const displayCoord = `${String(col).padStart(2, '0')}${String(row).padStart(2, '0')}`;
            
            console.log('[Terrain/Terrain+Features] Checking update:', {
              hex: displayCoord,
              featureType: update.changes.featureType,
              hasFeature: !!update.changes.feature,
              terrainId: update.changes.terrainId,
            });
            
            if (update.changes.featureType === 'settlement' && update.changes.feature) {
              const details = update.changes.feature.details as { type?: SettlementType; name?: string };
              const settlementType = details.type || 'village';
              
              console.log('[Terrain/Terrain+Features] Settlement found:', {
                hex: displayCoord,
                settlementType,
                name: details.name,
                eligible: ['city', 'castle', 'tower', 'abbey'].includes(settlementType),
              });
              
              // Only cities, castles, towers, and abbeys form factions
              if (['city', 'castle', 'tower', 'abbey'].includes(settlementType)) {
                const name = details.name || update.changes.campaignData?.name || 'Unnamed';
                const faction = createFactionFromSettlement(name, settlementType, update.coord);
                if (faction) {
                  console.log('[Terrain/Terrain+Features] ✓ Creating faction:', faction.name, 'at hex', displayCoord, 'with', faction.domainHexes.length, 'hexes');
                  newFactions.push(faction);
                } else {
                  console.log('[Terrain/Terrain+Features] ✗ createFactionFromSettlement returned null for', settlementType);
                }
              }
            }
          }
          
          // Generate relationships between new factions and existing ones
          for (const faction of newFactions) {
            generateFactionRelationships(faction, [...map.factions, ...newFactions.filter(f => f.id !== faction.id)]);
          }
        }
        
        // Apply hex updates and add factions in a single state update to avoid race conditions
        if (newFactions.length > 0) {
          onBulkHexUpdateWithFactions(updates, newFactions);
        } else {
          onBulkHexUpdate(updates);
        }
      }
    }
  }, [hex.coord, map.hexes, map.factions, regionFeatureChance, regionIncludeLandmarks, regionIncludeSettlements, regionIncludeLairs, regionIncludeDungeons, regionGenerateFactions, regionOverwriteTerrain, regionOverwriteFeatures, onBulkHexUpdate, onBulkHexUpdateWithFactions, onAddFaction, gridConfig]);
  
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
            <div className="panel-header">
              <span className="panel-title">Quick Info</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsEditingOverview(!isEditingOverview)}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                {isEditingOverview ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="panel-content">
              {isEditingOverview ? (
                <>
                  {/* Edit mode */}
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

                  {/* Factions */}
                  <div className="mt-3">
                    <label className="form-label">Factions</label>
                    {controllingActualFactions.length === 0 ? (
                      <p className="text-sm text-muted">No faction controls this hex</p>
                    ) : (
                      <div className="flex flex-col gap-1 mb-2">
                        {controllingActualFactions.map(f => (
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
                    {factions.filter(f => f.type !== 'region' && !controllingActualFactions.some(cf => cf.id === f.id)).length > 0 && (
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
                          .filter(f => f.type !== 'region' && !controllingActualFactions.some(cf => cf.id === f.id))
                          .map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                      </select>
                    )}
                  </div>

                  {/* Regions */}
                  <div className="mt-3">
                    <label className="form-label">Regions</label>
                    {controllingRegions.length === 0 ? (
                      <p className="text-sm text-muted">Not in any region</p>
                    ) : (
                      <div className="flex flex-col gap-1 mb-2">
                        {controllingRegions.map(r => (
                          <div key={r.id} className="faction-control-item">
                            <span
                              className="color-dot"
                              style={{ backgroundColor: r.color }}
                            />
                            <span className="text-sm flex-1">{r.name}</span>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleRemoveFromFaction(r.id)}
                              title="Remove from region"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add to region dropdown */}
                    {factions.filter(f => f.type === 'region' && !controllingRegions.some(cr => cr.id === f.id)).length > 0 && (
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
                        <option value="">Add to region...</option>
                        {factions
                          .filter(f => f.type === 'region' && !controllingRegions.some(cr => cr.id === f.id))
                          .map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                      </select>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* View mode */}
                  <div className="panel-row">
                    <span className="panel-row-label">Name</span>
                    <span className="panel-row-value">{campaignData.name || '—'}</span>
                  </div>

                  <div className="panel-row">
                    <span className="panel-row-label">Terrain</span>
                    <span className="panel-row-value">{terrain.name}</span>
                  </div>

                  <div className="panel-row">
                    <span className="panel-row-label">Explored</span>
                    <span className="panel-row-value">{campaignData.explored ? 'Yes' : 'No'}</span>
                  </div>

                  {hex.featureType && (
                    <div className="panel-row">
                      <span className="panel-row-label">Feature</span>
                      <span className="panel-row-value">
                        {hex.featureType.charAt(0).toUpperCase() + hex.featureType.slice(1)}
                      </span>
                    </div>
                  )}

                  {campaignData.lastVisited && (
                    <div className="panel-row">
                      <span className="panel-row-label">Last Visited</span>
                      <span className="panel-row-value">
                        {new Date(campaignData.lastVisited).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="panel-row" style={{ alignItems: 'flex-start' }}>
                    <span className="panel-row-label">Factions</span>
                    <span className="panel-row-value">
                      {controllingActualFactions.length === 0 ? (
                        '—'
                      ) : (
                        <span className="flex flex-col gap-1">
                          {controllingActualFactions.map(f => (
                            <span key={f.id} className="flex items-center gap-1">
                              <span
                                className="color-dot"
                                style={{ backgroundColor: f.color }}
                              />
                              {f.name}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="panel-row" style={{ alignItems: 'flex-start' }}>
                    <span className="panel-row-label">Regions</span>
                    <span className="panel-row-value">
                      {controllingRegions.length === 0 ? (
                        '—'
                      ) : (
                        <span className="flex flex-col gap-1">
                          {controllingRegions.map(r => (
                            <span key={r.id} className="flex items-center gap-1">
                              <span
                                className="color-dot"
                                style={{ backgroundColor: r.color }}
                              />
                              {r.name}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Tags */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Tags</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsEditingTags(!isEditingTags)}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                {isEditingTags ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="panel-content">
              {isEditingTags ? (
                <>
                  {/* Edit mode - show tags with remove buttons and add functionality */}
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
                    <input
                      type="text"
                      className="form-input flex-1"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag.trim()) {
                          handleAddTag(newTag.trim());
                        }
                      }}
                      placeholder="Type a tag..."
                      list="tag-suggestions"
                    />
                    <datalist id="tag-suggestions">
                      {allUsedTags
                        .filter(t => !(campaignData.tags || []).includes(t))
                        .map(tag => (
                          <option key={tag} value={tag} />
                        ))}
                    </datalist>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAddTag(newTag.trim())}
                      disabled={!newTag.trim()}
                    >
                      Add
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* View mode - show tags without edit controls */}
                  <div className="tags-container">
                    {(campaignData.tags || []).length === 0 ? (
                      <span className="text-muted text-sm">No tags</span>
                    ) : (
                      (campaignData.tags || []).map(tag => (
                        <span key={tag} className={`tag tag-${tag}`}>
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                </>
              )}
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

          {/* Feature Notes - only show if hex has a feature */}
          {hex.featureType && hex.feature && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">
                  {hex.featureType.charAt(0).toUpperCase() + hex.featureType.slice(1)} Notes
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsEditingFeatureNotes(!isEditingFeatureNotes)}
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  {isEditingFeatureNotes ? 'Done' : 'Edit'}
                </button>
              </div>
              <div className="panel-content">
                {isEditingFeatureNotes ? (
                  <>
                    {/* Edit mode - show textareas */}
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
                            list="feature-note-key-suggestions"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddFeatureNote();
                              if (e.key === 'Escape') {
                                setIsAddingFeatureNote(false);
                                setNewFeatureNoteKey('');
                              }
                            }}
                            autoFocus
                          />
                          <datalist id="feature-note-key-suggestions">
                            {allUsedFeatureNoteKeys
                              .filter(k => !featureNoteKeys.includes(k))
                              .map(key => (
                                <option key={key} value={key} />
                              ))}
                          </datalist>
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
                  </>
                ) : (
                  <>
                    {/* View mode - show read-only notes */}
                    {featureNoteKeys.length > 0 ? (
                      featureNoteKeys.map(key => {
                        const value = (campaignData.featureNotes || {})[key];
                        if (!value) return null;
                        return (
                          <div key={key} className="panel-row" style={{ alignItems: 'flex-start' }}>
                            <span className="panel-row-label">{key}</span>
                            <span className="panel-row-value" style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted text-sm">No notes yet. Click Edit to add some.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Original Generated Details (collapsible) - show even without feature type */}
          {hex.feature?.originalDetails && (
            <div className="panel">
              <Accordion title="Original Generated Details" defaultOpen={false}>
                {/* Show original terrain and feature type */}
                {(hex.feature.originalTerrainId || hex.feature.originalFeatureType) && (
                  <div className="mb-2 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {hex.feature.originalTerrainId && (
                      <div className="panel-row">
                        <span className="panel-row-label">Terrain</span>
                        <span className="panel-row-value">
                          {allTerrains.find(t => t.id === hex.feature!.originalTerrainId)?.name || hex.feature.originalTerrainId}
                        </span>
                      </div>
                    )}
                    {hex.feature.originalFeatureType && (
                      <div className="panel-row">
                        <span className="panel-row-label">Feature Type</span>
                        <span className="panel-row-value">
                          {hex.feature.originalFeatureType.charAt(0).toUpperCase() + hex.feature.originalFeatureType.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <pre className="text-sm text-muted" style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  {formatGeneratedDetails(hex.feature.originalDetails) || 'No generated details'}
                </pre>
              </Accordion>
            </div>
          )}
        </>
      )}
      
      {/* Campaign Tab */}
      {activeTab === 'campaign' && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Campaign Notes</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setIsEditingCampaignNotes(!isEditingCampaignNotes)}
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            >
              {isEditingCampaignNotes ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className="panel-content">
            {isEditingCampaignNotes ? (
              <>
                {/* Edit mode - show textareas */}
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
                        list="campaign-note-key-suggestions"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNote();
                          if (e.key === 'Escape') {
                            setIsAddingNote(false);
                            setNewNoteKey('');
                          }
                        }}
                        autoFocus
                      />
                      <datalist id="campaign-note-key-suggestions">
                        {allUsedCampaignNoteKeys
                          .filter(k => !noteKeys.includes(k))
                          .map(key => (
                            <option key={key} value={key} />
                          ))}
                      </datalist>
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
              </>
            ) : (
              <>
                {/* View mode - show read-only notes */}
                {noteKeys.length > 0 ? (
                  noteKeys.map(key => {
                    const value = (campaignData.notes || {})[key];
                    if (!value) return null;
                    return (
                      <div key={key} className="panel-row" style={{ alignItems: 'flex-start' }}>
                        <span className="panel-row-label">{key}</span>
                        <span className="panel-row-value" style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted text-sm">No notes yet. Click Edit to add some.</p>
                )}
              </>
            )}
          </div>
        </div>
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
              
              {/* Overwrite Options */}
              <div className="form-group">
                <label className="form-label">Overwrite Options</label>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={regionOverwriteTerrain}
                      onChange={e => setRegionOverwriteTerrain(e.target.checked)}
                    />
                    Overwrite existing terrain
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={regionOverwriteFeatures}
                      onChange={e => setRegionOverwriteFeatures(e.target.checked)}
                    />
                    Overwrite existing features
                  </label>
                </div>
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
                >
                  Terrain Only
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleGenerateRegion('features')}
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
