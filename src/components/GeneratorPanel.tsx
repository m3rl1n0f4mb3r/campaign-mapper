import React, { useState, useCallback } from 'react';
import type { HexCoord, Hex, Faction, CampaignMap } from '@/lib/types';
import { coordToKey } from '@/lib/types';
import { axialToOffset } from '@/lib/hexUtils';
import type { BiomeType, SettlementType, FeatureType } from '@/lib/generator/types';
import { generateTerrain } from '@/lib/generator/biomeGenerator';
import { generateFeature } from '@/lib/generator/featureGenerator';
import { generateNameOptions } from '@/lib/generator/nameGenerator';
import { createFactionFromSettlement, generateFactionRelationships } from '@/lib/generator/politicalGenerator';

type GeneratorTab = 'terrain' | 'feature' | 'political' | 'detail';

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

// Helper to format a key for display
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .replace(/npc/gi, 'NPC');
}

// Helper to convert generated details into feature notes
function detailsToFeatureNotes(details: Record<string, unknown>): Record<string, string> {
  const notes: Record<string, string> = {};
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'details') continue; // Skip nested details object
    if (key === 'name') continue; // Name is displayed separately in Hex Info
    if (typeof value === 'object') continue; // Skip complex objects

    const label = formatLabel(key);
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    notes[label] = displayValue;
  }
  return notes;
}

interface GeneratorPanelProps {
  map: CampaignMap;
  selectedCoords: HexCoord[];
  onUpdateHexes: (updates: Array<{ coord: HexCoord; changes: Partial<Hex> }>) => void;
  onAddFaction: (faction: Faction) => void;
  onClose: () => void;
}

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

const GeneratorPanel: React.FC<GeneratorPanelProps> = ({
  map,
  selectedCoords,
  onUpdateHexes,
  onAddFaction,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('terrain');
  
  // Terrain generator state
  const [terrainMode, setTerrainMode] = useState<'auto' | 'force'>('auto');
  const [forceBiome, setForceBiome] = useState<BiomeType>('grassland');
  const [useNeighborInfluence, setUseNeighborInfluence] = useState(true);
  
  // Feature generator state
  const [featureMode, setFeatureMode] = useState<'auto' | 'force'>('auto');
  const [forceFeatureType, setForceFeatureType] = useState<FeatureType>('landmark');
  const [forceSettlementType, setForceSettlementType] = useState<SettlementType>('village');
  
  // Detail generator state
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>('');
  
  // Get display info for selected hexes
  const selectionInfo = selectedCoords.length === 1
    ? (() => {
        const hex = map.hexes.find(h => coordToKey(h.coord) === coordToKey(selectedCoords[0]));
        if (!hex) return null;
        const { col, row } = axialToOffset(hex.coord, map.gridConfig);
        return {
          coord: `${String(col).padStart(2, '0')}${String(row).padStart(2, '0')}`,
          terrain: hex.terrainId,
          hex,
        };
      })()
    : null;
  
  // ============================================
  // TERRAIN GENERATION
  // ============================================
  
  const handleGenerateTerrain = useCallback(() => {
    if (selectedCoords.length === 0) return;
    
    // Build existing terrain map
    const existingTerrain = new Map<string, string>();
    for (const hex of map.hexes) {
      existingTerrain.set(coordToKey(hex.coord), hex.terrainId);
    }
    
    const results = generateTerrain(
      selectedCoords,
      existingTerrain,
      {
        useNeighborInfluence: terrainMode === 'auto' ? useNeighborInfluence : false,
        forceBiome: terrainMode === 'force' ? forceBiome : undefined,
      }
    );
    
    const updates = results.map(result => ({
      coord: result.coord,
      changes: { terrainId: result.terrainId },
    }));
    
    onUpdateHexes(updates);
  }, [selectedCoords, map.hexes, terrainMode, forceBiome, useNeighborInfluence, onUpdateHexes]);
  
  // ============================================
  // FEATURE GENERATION
  // ============================================
  
  const handleGenerateFeature = useCallback(() => {
    if (selectedCoords.length === 0) return;
    
    // Build a map of coords to hexes for quick lookup
    const hexMap = new Map(map.hexes.map(h => [coordToKey(h.coord), h]));
    
    const updates: Array<{ coord: HexCoord; changes: Partial<Hex> }> = [];
    
    for (const coord of selectedCoords) {
      // Get the hex's terrain for lair monster generation
      const hex = hexMap.get(coordToKey(coord));
      const terrainId = hex?.terrainId;
      
      const feature = generateFeature(
        featureMode === 'force' ? forceFeatureType : undefined,
        forceFeatureType === 'settlement' && featureMode === 'force' ? forceSettlementType : undefined,
        terrainId // Pass terrain for lair monster generation
      );

      const { details, settlementName } = normalizeFeatureData(feature.type, feature.data);

      // Preserve original data if it exists, otherwise set it from this generation
      const originalDetails = hex?.feature?.originalDetails || details;
      const originalFeatureType = hex?.feature?.originalFeatureType || feature.type;
      const originalTerrainId = hex?.feature?.originalTerrainId || terrainId;

      // Convert generated details to feature notes
      const featureNotes = detailsToFeatureNotes(details);

      // Convert feature to hex data
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
          ...hex?.campaignData,
          name: settlementName || hex?.campaignData?.name,
          featureNotes,
          deletedFeatureNotes: undefined, // Clear deleted notes on regeneration
        },
      };

      updates.push({ coord, changes });
    }
    
    onUpdateHexes(updates);
  }, [selectedCoords, map.hexes, featureMode, forceFeatureType, forceSettlementType, onUpdateHexes]);
  
  // ============================================
  // NAME GENERATION
  // ============================================
  
  const handleGenerateNames = useCallback(() => {
    if (!selectionInfo?.hex) return;
    
    // Determine settlement type from hex
    let settlementType: SettlementType = 'village';
    if (selectionInfo.hex.feature?.type === 'settlement') {
      const details = selectionInfo.hex.feature.details as { type?: SettlementType };
      settlementType = details.type || 'village';
    }
    
    const names = generateNameOptions(settlementType, 5);
    setGeneratedNames(names);
    setSelectedName(names[0] || '');
  }, [selectionInfo]);
  
  const handleApplyName = useCallback(() => {
    if (!selectedName || selectedCoords.length !== 1) return;
    
    onUpdateHexes([{
      coord: selectedCoords[0],
      changes: {
        campaignData: {
          name: selectedName,
        },
      },
    }]);
  }, [selectedName, selectedCoords, onUpdateHexes]);
  
  // ============================================
  // POLITICAL GENERATION
  // ============================================
  
  const handleCreateFaction = useCallback(() => {
    if (selectedCoords.length !== 1 || !selectionInfo?.hex) return;
    
    const hex = selectionInfo.hex;
    const name = hex.campaignData?.name || 'Unnamed Settlement';
    
    // Determine settlement type
    let settlementType: SettlementType = 'city';
    if (hex.feature?.type === 'settlement') {
      const details = hex.feature.details as { type?: SettlementType };
      settlementType = details.type || 'city';
    }
    
    const faction = createFactionFromSettlement(name, settlementType, hex.coord);
    
    if (faction) {
      // Generate relationships with existing factions
      generateFactionRelationships(faction, map.factions);
      onAddFaction(faction);
    }
  }, [selectedCoords, selectionInfo, map.factions, onAddFaction]);
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="generator-panel">
      <div className="panel-header">
        <h3 className="panel-title">Generator</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      
      {/* Selection info */}
      <div className="panel-content" style={{ paddingBottom: 0 }}>
        <div className="text-sm text-muted mb-2">
          {selectedCoords.length === 0 ? (
            'No hexes selected. Select hexes to use the generator.'
          ) : selectedCoords.length === 1 ? (
            `Selected: Hex ${selectionInfo?.coord || '??'} (${selectionInfo?.terrain || 'unknown'})`
          ) : (
            `Selected: ${selectedCoords.length} hexes`
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'terrain' ? 'active' : ''}`}
          onClick={() => setActiveTab('terrain')}
        >
          Terrain
        </button>
        <button
          className={`tab ${activeTab === 'feature' ? 'active' : ''}`}
          onClick={() => setActiveTab('feature')}
        >
          Feature
        </button>
        <button
          className={`tab ${activeTab === 'political' ? 'active' : ''}`}
          onClick={() => setActiveTab('political')}
        >
          Political
        </button>
        <button
          className={`tab ${activeTab === 'detail' ? 'active' : ''}`}
          onClick={() => setActiveTab('detail')}
        >
          Detail
        </button>
      </div>
      
      <div className="panel-content">
        {/* TERRAIN TAB */}
        {activeTab === 'terrain' && (
          <div className="generator-tab-content">
            <p className="text-sm text-muted mb-3">
              Generate terrain/biome for selected hexes using the Sandbox Generator algorithm.
            </p>
            
            <div className="form-group">
              <label className="form-label">Mode</label>
              <div className="flex gap-2">
                <button
                  className={`btn flex-1 ${terrainMode === 'auto' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTerrainMode('auto')}
                >
                  Auto-Generate
                </button>
                <button
                  className={`btn flex-1 ${terrainMode === 'force' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTerrainMode('force')}
                >
                  Force Biome
                </button>
              </div>
            </div>
            
            {terrainMode === 'auto' && (
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useNeighborInfluence}
                    onChange={e => setUseNeighborInfluence(e.target.checked)}
                  />
                  <span className="text-sm">Use neighbor influence (50% same as neighbor)</span>
                </label>
              </div>
            )}
            
            {terrainMode === 'force' && (
              <div className="form-group">
                <label className="form-label">Biome</label>
                <select
                  className="form-select"
                  value={forceBiome}
                  onChange={e => setForceBiome(e.target.value as BiomeType)}
                >
                  {BIOME_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              className="btn btn-primary"
              onClick={handleGenerateTerrain}
              disabled={selectedCoords.length === 0}
              style={{ width: '100%' }}
            >
              Generate Terrain ({selectedCoords.length} hex{selectedCoords.length !== 1 ? 'es' : ''})
            </button>
          </div>
        )}
        
        {/* FEATURE TAB */}
        {activeTab === 'feature' && (
          <div className="generator-tab-content">
            <p className="text-sm text-muted mb-3">
              Generate features (landmarks, settlements, lairs, dungeons) for selected hexes.
            </p>
            
            <div className="form-group">
              <label className="form-label">Mode</label>
              <div className="flex gap-2">
                <button
                  className={`btn flex-1 ${featureMode === 'auto' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFeatureMode('auto')}
                >
                  Random
                </button>
                <button
                  className={`btn flex-1 ${featureMode === 'force' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFeatureMode('force')}
                >
                  Choose Type
                </button>
              </div>
            </div>
            
            {featureMode === 'force' && (
              <>
                <div className="form-group">
                  <label className="form-label">Feature Type</label>
                  <select
                    className="form-select"
                    value={forceFeatureType}
                    onChange={e => setForceFeatureType(e.target.value as FeatureType)}
                  >
                    {FEATURE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                {forceFeatureType === 'settlement' && (
                  <div className="form-group">
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
              </>
            )}
            
            <button
              className="btn btn-primary"
              onClick={handleGenerateFeature}
              disabled={selectedCoords.length === 0}
              style={{ width: '100%' }}
            >
              Generate Feature ({selectedCoords.length} hex{selectedCoords.length !== 1 ? 'es' : ''})
            </button>
          </div>
        )}
        
        {/* POLITICAL TAB */}
        {activeTab === 'political' && (
          <div className="generator-tab-content">
            <p className="text-sm text-muted mb-3">
              Create factions and domains from settlements. Cities/Castles control 7 hexes, Towers/Abbeys control 1 hex.
            </p>
            
            {selectedCoords.length !== 1 ? (
              <p className="text-sm" style={{ color: 'var(--warning)' }}>
                Select a single hex with a settlement to create a faction.
              </p>
            ) : (
              <>
                <div className="panel mb-3">
                  <div className="panel-content">
                    <div className="panel-row">
                      <span className="panel-row-label">Hex</span>
                      <span className="panel-row-value">{selectionInfo?.coord}</span>
                    </div>
                    <div className="panel-row">
                      <span className="panel-row-label">Name</span>
                      <span className="panel-row-value">
                        {selectionInfo?.hex?.campaignData?.name || 'Unnamed'}
                      </span>
                    </div>
                    <div className="panel-row">
                      <span className="panel-row-label">Feature</span>
                      <span className="panel-row-value">
                        {selectionInfo?.hex?.featureType || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  className="btn btn-primary"
                  onClick={handleCreateFaction}
                  style={{ width: '100%' }}
                >
                  Create Faction & Domain
                </button>
                
                <p className="text-sm text-muted mt-2">
                  This will create a faction centered on this hex and automatically generate relationships with neighboring factions.
                </p>
              </>
            )}
          </div>
        )}
        
        {/* DETAIL TAB */}
        {activeTab === 'detail' && (
          <div className="generator-tab-content">
            <p className="text-sm text-muted mb-3">
              Generate names and additional details for a selected hex.
            </p>
            
            {selectedCoords.length !== 1 ? (
              <p className="text-sm" style={{ color: 'var(--warning)' }}>
                Select a single hex to generate details.
              </p>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Generate Name</label>
                  <button
                    className="btn btn-secondary"
                    onClick={handleGenerateNames}
                    style={{ width: '100%' }}
                  >
                    Roll Name Options
                  </button>
                </div>
                
                {generatedNames.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Choose Name</label>
                    <div className="flex flex-col gap-1">
                      {generatedNames.map((name, i) => (
                        <button
                          key={i}
                          className={`btn ${selectedName === name ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setSelectedName(name)}
                          style={{ justifyContent: 'flex-start' }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      className="btn btn-primary mt-2"
                      onClick={handleApplyName}
                      disabled={!selectedName}
                      style={{ width: '100%' }}
                    >
                      Apply Name
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratorPanel;
