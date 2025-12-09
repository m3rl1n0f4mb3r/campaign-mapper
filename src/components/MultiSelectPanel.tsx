import React, { useState, useCallback, useMemo } from 'react';
import type { HexCoord, TerrainType, GridConfig, CampaignMap } from '@/lib/types';
import { DEFAULT_TERRAIN_TYPES } from '@/lib/types';
import { axialToOffset } from '@/lib/hexUtils';

interface MultiSelectPanelProps {
  selectedCoords: HexCoord[];
  gridConfig: GridConfig;
  map: CampaignMap;
  customTerrainTypes: TerrainType[];
  onBulkSetTerrain: (terrainId: string) => void;
  onBulkAddTags: (tags: string[]) => void;
  onBulkSetExplored: (explored: boolean) => void;
  onClearSelection: () => void;
}

const MultiSelectPanel: React.FC<MultiSelectPanelProps> = ({
  selectedCoords,
  gridConfig,
  map,
  customTerrainTypes,
  onBulkSetTerrain,
  onBulkAddTags,
  onBulkSetExplored,
  onClearSelection,
}) => {
  const [selectedTerrain, setSelectedTerrain] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const allTerrains = [...DEFAULT_TERRAIN_TYPES, ...customTerrainTypes];

  // Collect all unique tags used across all hexes in the map (for autocomplete)
  const allUsedTags = useMemo(() => {
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
  
  const handleApplyTerrain = useCallback(() => {
    if (selectedTerrain) {
      onBulkSetTerrain(selectedTerrain);
      setSelectedTerrain('');
    }
  }, [selectedTerrain, onBulkSetTerrain]);
  
  const handleAddTag = useCallback(() => {
    const tag = selectedTag.trim();
    if (tag) {
      onBulkAddTags([tag]);
      setSelectedTag('');
    }
  }, [selectedTag, onBulkAddTags]);
  
  return (
    <div>
      {/* Header */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Multi-Selection</span>
          <button className="btn btn-ghost btn-sm" onClick={onClearSelection}>
            Clear
          </button>
        </div>
        <div className="panel-content">
          <p className="text-sm mb-2">
            {selectedCoords.length} hex{selectedCoords.length !== 1 ? 'es' : ''} selected
          </p>
          
          {/* Show selected coords (limited) */}
          <div className="tags-container">
            {selectedCoords.slice(0, 12).map(coord => {
              const { col, row } = axialToOffset(coord, gridConfig);
              const displayCoord = `${String(col).padStart(2, '0')}${String(row).padStart(2, '0')}`;
              return (
                <span key={`${coord.q},${coord.r}`} className="tag" style={{ fontFamily: 'monospace' }}>
                  {displayCoord}
                </span>
              );
            })}
            {selectedCoords.length > 12 && (
              <span className="tag text-muted">
                +{selectedCoords.length - 12} more
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Bulk Actions */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Bulk Actions</span>
        </div>
        <div className="panel-content">
          {/* Set Terrain */}
          <div className="form-group">
            <label className="form-label">Set Terrain</label>
            <div className="flex gap-2">
              <select
                className="form-select"
                value={selectedTerrain}
                onChange={e => setSelectedTerrain(e.target.value)}
              >
                <option value="">Select terrain...</option>
                {allTerrains.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleApplyTerrain}
                disabled={!selectedTerrain}
              >
                Apply
              </button>
            </div>
          </div>
          
          {/* Add Tag */}
          <div className="form-group">
            <label className="form-label">Add Tag</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="form-input flex-1"
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedTag.trim()) {
                    handleAddTag();
                  }
                }}
                placeholder="Type a tag..."
                list="bulk-tag-suggestions"
              />
              <datalist id="bulk-tag-suggestions">
                {allUsedTags.map(tag => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAddTag}
                disabled={!selectedTag.trim()}
              >
                Add
              </button>
            </div>
          </div>
          
          {/* Explored Status */}
          <div className="form-group">
            <label className="form-label">Explored Status</label>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm flex-1"
                onClick={() => onBulkSetExplored(true)}
              >
                Mark Explored
              </button>
              <button
                className="btn btn-secondary btn-sm flex-1"
                onClick={() => onBulkSetExplored(false)}
              >
                Mark Unexplored
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Terrain Palette */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Quick Terrain</span>
        </div>
        <div className="panel-content">
          <div className="terrain-palette">
            {allTerrains.slice(0, 12).map(terrain => (
              <button
                key={terrain.id}
                className={`terrain-swatch ${selectedTerrain === terrain.id ? 'selected' : ''}`}
                onClick={() => {
                  onBulkSetTerrain(terrain.id);
                }}
                title={terrain.name}
              >
                <div 
                  className="terrain-color" 
                  style={{ backgroundColor: terrain.color }}
                />
                <span className="terrain-name">{terrain.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSelectPanel;
