import React, { useMemo, useState } from 'react';
import type { Hex, HexCoord, CampaignMap, TerrainType } from '@/lib/types';
import { coordToKey, DEFAULT_TERRAIN_TYPES } from '@/lib/types';
import { axialToOffset } from '@/lib/hexUtils';
import type { StatsFilterType } from './Toolbar';

interface HexListPanelProps {
  map: CampaignMap;
  filter: StatsFilterType;
  customTerrainTypes: TerrainType[];
  onHexClick: (coord: HexCoord) => void;
  onClose: () => void;
}

const FILTER_TITLES: Record<StatsFilterType, string> = {
  all: 'All Hexes',
  withData: 'Hexes with Campaign Data',
  explored: 'Explored Hexes',
  withFeatures: 'Hexes with Features',
  withTags: 'Hexes with Tags',
  factions: 'Factions',
};

const HexListPanel: React.FC<HexListPanelProps> = ({
  map,
  filter,
  customTerrainTypes,
  onHexClick,
  onClose,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('');

  const allTerrains = [...DEFAULT_TERRAIN_TYPES, ...customTerrainTypes];

  const getTerrainInfo = (terrainId: string): TerrainType => {
    return allTerrains.find(t => t.id === terrainId) || allTerrains[0];
  };

  // Collect all unique tags used in the map
  const usedTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const hex of map.hexes) {
      if (hex.campaignData?.tags) {
        for (const tag of hex.campaignData.tags) {
          tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [map.hexes]);

  const filteredHexes = useMemo(() => {
    switch (filter) {
      case 'all':
        return map.hexes;
      case 'withData':
        return map.hexes.filter(h => h.campaignData && (
          h.campaignData.name ||
          (h.campaignData.notes && Object.keys(h.campaignData.notes).length > 0) ||
          h.campaignData.tags?.length
        ));
      case 'explored':
        return map.hexes.filter(h => h.campaignData?.explored);
      case 'withFeatures':
        return map.hexes.filter(h => h.featureType);
      case 'withTags':
        if (selectedTag) {
          // Filter by specific tag
          return map.hexes.filter(h => h.campaignData?.tags?.includes(selectedTag));
        }
        // Show all hexes with any tags
        return map.hexes.filter(h => h.campaignData?.tags?.length);
      default:
        return [];
    }
  }, [map, filter, selectedTag]);
  
  // Sort by coordinates
  const sortedHexes = useMemo(() => {
    return [...filteredHexes].sort((a, b) => {
      const aOffset = axialToOffset(a.coord, map.gridConfig);
      const bOffset = axialToOffset(b.coord, map.gridConfig);
      if (aOffset.row !== bOffset.row) return aOffset.row - bOffset.row;
      return aOffset.col - bOffset.col;
    });
  }, [filteredHexes, map.gridConfig]);
  
  const formatCoord = (hex: Hex): string => {
    const offset = axialToOffset(hex.coord, map.gridConfig);
    return `${offset.col},${offset.row}`;
  };
  
  const getFeatureLabel = (hex: Hex): string => {
    if (!hex.featureType) return '';
    const type = hex.featureType.charAt(0).toUpperCase() + hex.featureType.slice(1);
    
    // For settlements, include the settlement type
    if (hex.featureType === 'settlement' && hex.feature?.details) {
      const details = hex.feature.details as { type?: string };
      if (details.type) {
        return details.type.charAt(0).toUpperCase() + details.type.slice(1);
      }
    }
    
    return type;
  };

  return (
    <div className="hex-list-panel">
      <div className="panel-header">
        <span className="panel-title">{FILTER_TITLES[filter]}</span>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        {/* Tag filter dropdown */}
        {filter === 'withTags' && usedTags.length > 0 && (
          <div className="mb-2">
            <select
              className="form-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">All tags ({usedTags.length})</option>
              {usedTags.map(tag => {
                const count = map.hexes.filter(h => h.campaignData?.tags?.includes(tag)).length;
                return (
                  <option key={tag} value={tag}>
                    {tag} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <p className="text-muted text-sm mb-2">
          {sortedHexes.length} hex{sortedHexes.length !== 1 ? 'es' : ''}
          {selectedTag && ` tagged "${selectedTag}"`}
        </p>

        <div className="hex-list">
          {sortedHexes.map(hex => {
            const terrain = getTerrainInfo(hex.terrainId);
            const displayName = hex.campaignData?.name || getFeatureLabel(hex) || terrain.name;
            
            return (
              <div
                key={coordToKey(hex.coord)}
                className="hex-list-item"
                onClick={() => onHexClick(hex.coord)}
              >
                <span
                  className="hex-list-terrain-dot"
                  style={{ backgroundColor: terrain.color }}
                />
                <span className="hex-list-coord">{formatCoord(hex)}</span>
                <span className="hex-list-name">{displayName}</span>
                {hex.featureType && (
                  <span className="hex-list-feature-badge">
                    {hex.featureType.charAt(0).toUpperCase()}
                  </span>
                )}
                {hex.campaignData?.explored && (
                  <span className="hex-list-explored-badge" title="Explored">✓</span>
                )}
              </div>
            );
          })}
          
          {sortedHexes.length === 0 && (
            <p className="text-muted text-sm" style={{ padding: 'var(--spacing-md)' }}>
              No hexes match this filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HexListPanel;
