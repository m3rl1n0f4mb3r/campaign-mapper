import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { CampaignMap } from '@/lib/types';

export type StatsFilterType = 'all' | 'withData' | 'explored' | 'factions' | 'withFeatures';

interface ToolbarProps {
  map: CampaignMap | null;
  onNewMap: () => void;
  onOpenMap: () => void;
  onExportMap: () => void;
  onImportMap: () => void;
  onOpenSettings: () => void;
  onMapNameChange: (name: string) => void;
  onStatsClick: (filter: StatsFilterType) => void;
  selectedCount: number;
  onClearSelection: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

const Toolbar: React.FC<ToolbarProps> = ({
  map,
  onNewMap,
  onOpenMap,
  onExportMap,
  onImportMap,
  onOpenSettings,
  onMapNameChange,
  onStatsClick,
  selectedCount,
  onClearSelection,
  zoom,
  onZoomChange,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showMapsMenu, setShowMapsMenu] = useState(false);
  const mapsMenuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mapsMenuRef.current && !mapsMenuRef.current.contains(e.target as Node)) {
        setShowMapsMenu(false);
      }
    };
    if (showMapsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMapsMenu]);
  
  const handleStartEdit = useCallback(() => {
    if (map) {
      setEditedName(map.name);
      setIsEditingName(true);
    }
  }, [map]);
  
  const handleSaveName = useCallback(() => {
    if (editedName.trim()) {
      onMapNameChange(editedName.trim());
    }
    setIsEditingName(false);
  }, [editedName, onMapNameChange]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  }, [handleSaveName]);
  
  const stats = map && map.hexes ? {
    hexes: map.hexes.length,
    withData: map.hexes.filter(h => h.campaignData && (
      h.campaignData.name ||
      (h.campaignData.notes && Object.keys(h.campaignData.notes).length > 0) ||
      h.campaignData.tags?.length
    )).length,
    explored: map.hexes.filter(h => h.campaignData?.explored).length,
    withFeatures: map.hexes.filter(h => h.featureType).length,
    factions: map.factions?.length ?? 0,
  } : null;
  
  return (
    <div className="toolbar">
      {/* Left section */}
      <div className="toolbar-left">
        {/* Maps menu */}
        <div className="toolbar-section">
          <div className="toolbar-dropdown" ref={mapsMenuRef}>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowMapsMenu(!showMapsMenu)}
            >
              Maps ▾
            </button>
            {showMapsMenu && (
              <div className="toolbar-dropdown-menu">
                <button 
                  className="toolbar-dropdown-item"
                  onClick={() => { onNewMap(); setShowMapsMenu(false); }}
                >
                  + New Map
                </button>
                <button 
                  className="toolbar-dropdown-item"
                  onClick={() => { onOpenMap(); setShowMapsMenu(false); }}
                >
                  Open / Manage...
                </button>
                <div className="toolbar-dropdown-divider" />
                {map && (
                  <button 
                    className="toolbar-dropdown-item"
                    onClick={() => { onExportMap(); setShowMapsMenu(false); }}
                  >
                    Export
                  </button>
                )}
                <button 
                  className="toolbar-dropdown-item"
                  onClick={() => { onImportMap(); setShowMapsMenu(false); }}
                >
                  Import
                </button>
              </div>
            )}
          </div>
        </div>
        
        {map && (
          <>
            <div className="toolbar-divider" />
            
            {/* Map info */}
            <div className="toolbar-section">
              {isEditingName ? (
                <input
                  type="text"
                  className="toolbar-name-input"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              ) : (
                <span 
                  className="toolbar-title editable" 
                  onClick={handleStartEdit}
                  title="Click to rename"
                >
                  {map.name}
                </span>
              )}
              <span className="text-muted text-sm">
                ({map.gridConfig.cols} × {map.gridConfig.rows})
              </span>
            </div>
            
            {/* Selection info */}
            {selectedCount > 0 && (
              <>
                <div className="toolbar-divider" />
                <div className="toolbar-section">
                  <span className="text-sm">
                    {selectedCount} hex{selectedCount !== 1 ? 'es' : ''} selected
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={onClearSelection}>
                    Clear
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      {/* Center section */}
      <div className="toolbar-center">
        {/* Stats */}
        {stats && (
          <div className="toolbar-stats">
            <button 
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('all')}
              title="Total hexes - click to view all"
            >
              🗺 {stats.hexes}
            </button>
            <button 
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('withFeatures')}
              title="Hexes with features - click to view"
              style={{ color: 'var(--primary)' }}
            >
              ⬡ {stats.withFeatures}
            </button>
            <button 
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('withData')}
              title="Hexes with campaign data - click to view"
              style={{ color: 'var(--data-indicator)' }}
            >
              ✎ {stats.withData}
            </button>
            <button 
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('explored')}
              title="Explored hexes - click to view"
              style={{ color: 'var(--success)' }}
            >
              ✓ {stats.explored}
            </button>
            <button 
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('factions')}
              title="Factions - click to manage"
            >
              👥 {stats.factions}
            </button>
          </div>
        )}
        
        {/* Zoom controls */}
        {map && (
          <div className="toolbar-section zoom-controls">
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
              title="Zoom out"
              disabled={zoom <= 0.25}
            >
              −
            </button>
            <select
              className="zoom-select"
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              title="Zoom level"
            >
              {ZOOM_PRESETS.map(z => (
                <option key={z} value={z}>{Math.round(z * 100)}%</option>
              ))}
            </select>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => onZoomChange(Math.min(3, zoom + 0.25))}
              title="Zoom in"
              disabled={zoom >= 3}
            >
              +
            </button>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => onZoomChange(1)}
              title="Reset zoom to 100%"
            >
              100%
            </button>
          </div>
        )}
      </div>
      
      {/* Right section */}
      <div className="toolbar-right">
        <button className="btn btn-ghost btn-icon" onClick={onOpenSettings} title="Settings">
          ⚙
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
