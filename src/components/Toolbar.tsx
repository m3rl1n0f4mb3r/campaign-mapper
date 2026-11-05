import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { CampaignMap } from '@/lib/types';

export type StatsFilterType = 'all' | 'withData' | 'explored' | 'factions' | 'withFeatures' | 'withTags';

interface ToolbarProps {
  map: CampaignMap | null;
  onNewMap: () => void;
  onOpenMap: () => void;
  onExportMap: () => void;
  onExportMapAsImage: () => void;
  onImportMap: () => void;
  onOpenSettings: () => void;
  onMapNameChange: (name: string) => void;
  onStatsClick: (filter: StatsFilterType) => void;
  onOpenMarkers: () => void;
  onOpenWhatsNew: () => void;
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
  onExportMapAsImage,
  onImportMap,
  onOpenSettings,
  onMapNameChange,
  onStatsClick,
  onOpenMarkers,
  onOpenWhatsNew,
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
    withTags: map.hexes.filter(h => h.campaignData?.tags?.length).length,
    factions: map.factions?.filter(f => f.type !== 'region').length ?? 0,
    regions: map.factions?.filter(f => f.type === 'region').length ?? 0,
    markers: map.markers?.length ?? 0,
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
                <button
                  className="toolbar-dropdown-item"
                  onClick={() => { onImportMap(); setShowMapsMenu(false); }}
                >
                  Import (JSON)
                </button>
                {map && (
                  <button
                    className="toolbar-dropdown-item"
                    onClick={() => { onExportMap(); setShowMapsMenu(false); }}
                  >
                    Export (JSON)
                  </button>
                )}
                <div className="toolbar-dropdown-divider" />
                {map && (
                  <button
                    className="toolbar-dropdown-item"
                    onClick={() => { onExportMapAsImage(); setShowMapsMenu(false); }}
                  >
                    Export as Image
                  </button>
                )}
                <div className="toolbar-dropdown-divider" />
                <button
                  className="toolbar-dropdown-item"
                  onClick={() => { onOpenWhatsNew(); setShowMapsMenu(false); }}
                >
                  What's New
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
              <span className="toolbar-stat-value">⬢ {stats.hexes}</span>
              <span className="toolbar-stat-caption">Hexes</span>
            </button>
            <button 
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('withFeatures')}
              title="Hexes with features - click to view"
              style={{ color: 'var(--primary)' }}
            >
              <span className="toolbar-stat-value">⬡ {stats.withFeatures}</span>
              <span className="toolbar-stat-caption">Features</span>
            </button>
            <button 
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('withData')}
              title="Hexes with campaign data - click to view"
              style={{ color: 'var(--data-indicator)' }}
            >
              <span className="toolbar-stat-value">✎ {stats.withData}</span>
              <span className="toolbar-stat-caption">With data</span>
            </button>
            <button
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('explored')}
              title="Explored hexes - click to view"
              style={{ color: 'var(--success)' }}
            >
              <span className="toolbar-stat-value">✓ {stats.explored}</span>
              <span className="toolbar-stat-caption">Explored</span>
            </button>
            <button
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('withTags')}
              title="Hexes with tags - click to filter by tag"
              style={{ color: 'var(--warning, #f59e0b)' }}
            >
              <span className="toolbar-stat-value">🏷 {stats.withTags}</span>
              <span className="toolbar-stat-caption">Tagged</span>
            </button>
            <button
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('factions')}
              title="Factions - click to manage"
            >
              <span className="toolbar-stat-value">👥 {stats.factions}</span>
              <span className="toolbar-stat-caption">Factions</span>
            </button>
            <button
              className="toolbar-stat-btn"
              onClick={() => onStatsClick('factions')}
              title="Regions - click to manage"
            >
              <span className="toolbar-stat-value">🗺 {stats.regions}</span>
              <span className="toolbar-stat-caption">Regions</span>
            </button>
            <button
              className="toolbar-stat-btn"
              onClick={onOpenMarkers}
              title="Markers - click to manage"
            >
              <span className="toolbar-stat-value">📍 {stats.markers}</span>
              <span className="toolbar-stat-caption">Markers</span>
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
