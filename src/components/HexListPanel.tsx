import React, { useMemo } from 'react';
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
  factions: 'Factions',
};

const HexListPanel: React.FC<HexListPanelProps> = ({
  map,
  filter,
  customTerrainTypes,
  onHexClick,
  onClose,
}) => {
  const allTerrains = [...DEFAULT_TERRAIN_TYPES, ...customTerrainTypes];
  
  const getTerrainInfo = (terrainId: string): TerrainType => {
    return allTerrains.find(t => t.id === terrainId) || allTerrains[0];
  };
  
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
      default:
        return [];
    }
  }, [map, filter]);
  
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
        <p className="text-muted text-sm mb-2">
          {sortedHexes.length} hex{sortedHexes.length !== 1 ? 'es' : ''}
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
