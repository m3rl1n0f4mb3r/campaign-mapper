import React, { useCallback, useMemo, useState } from 'react';
import type { CampaignSettings, GridConfig, TerrainType } from '@/lib/types';
import { DEFAULT_TERRAIN_TYPES } from '@/lib/types';
import { getHexSpacing, getHexDimensions } from '@/lib/hexUtils';

interface SettingsPanelProps {
  settings: CampaignSettings;
  gridConfig: GridConfig;
  onSettingsChange: (updates: Partial<CampaignSettings>) => void;
  onGridConfigChange: (updates: Partial<GridConfig>) => void;
  onClose: () => void;
}

// Accordion section component
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

// Increment control component for fine-tuning values
interface IncrementControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  fineStep?: number;
  min?: number;
  max?: number;
  decimals?: number;
}

const IncrementControl: React.FC<IncrementControlProps> = ({
  label,
  value,
  onChange,
  step = 1,
  fineStep = 0.1,
  min,
  max,
  decimals = 1,
}) => {
  const adjust = useCallback((delta: number) => {
    let newValue = value + delta;
    if (min !== undefined) newValue = Math.max(min, newValue);
    if (max !== undefined) newValue = Math.min(max, newValue);
    onChange(Number(newValue.toFixed(decimals)));
  }, [value, onChange, min, max, decimals]);

  return (
    <div className="increment-control">
      <label className="form-label">{label}</label>
      <div className="increment-control-row">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => adjust(-step)}
          title={`-${step}`}
        >
          ◀◀
        </button>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => adjust(-fineStep)}
          title={`-${fineStep}`}
        >
          ◀
        </button>
        <input
          type="number"
          className="form-input increment-input"
          value={value}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          step={fineStep}
          min={min}
          max={max}
        />
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => adjust(fineStep)}
          title={`+${fineStep}`}
        >
          ▶
        </button>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => adjust(step)}
          title={`+${step}`}
        >
          ▶▶
        </button>
      </div>
    </div>
  );
};

// Terrain Types Section
interface TerrainTypesSectionProps {
  customTerrainTypes: TerrainType[];
  onUpdate: (types: TerrainType[]) => void;
}

const TerrainTypesSection: React.FC<TerrainTypesSectionProps> = ({
  customTerrainTypes,
  onUpdate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTerrain, setNewTerrain] = useState<TerrainType>({
    id: '',
    name: '',
    color: '#808080',
    symbol: '',
  });

  const handleAddTerrain = useCallback(() => {
    if (!newTerrain.name.trim()) return;
    
    // Generate id from name
    const id = newTerrain.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Check for duplicate id
    const allIds = [...DEFAULT_TERRAIN_TYPES, ...customTerrainTypes].map(t => t.id);
    if (allIds.includes(id)) {
      alert('A terrain type with this name already exists.');
      return;
    }
    
    const terrain: TerrainType = {
      id,
      name: newTerrain.name.trim(),
      color: newTerrain.color,
      symbol: newTerrain.symbol?.trim() || undefined,
    };
    
    onUpdate([...customTerrainTypes, terrain]);
    setNewTerrain({ id: '', name: '', color: '#808080', symbol: '' });
    setIsAdding(false);
  }, [newTerrain, customTerrainTypes, onUpdate]);

  const handleUpdateTerrain = useCallback((id: string, updates: Partial<TerrainType>) => {
    onUpdate(customTerrainTypes.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  }, [customTerrainTypes, onUpdate]);

  const handleDeleteTerrain = useCallback((id: string) => {
    if (confirm('Delete this terrain type? Hexes using it will show as "unknown".')) {
      onUpdate(customTerrainTypes.filter(t => t.id !== id));
    }
  }, [customTerrainTypes, onUpdate]);

  return (
    <Accordion title={`Terrain Types (${DEFAULT_TERRAIN_TYPES.length} + ${customTerrainTypes.length} custom)`} defaultOpen={false}>
      {/* Default terrain types (read-only) */}
      <div className="mb-3">
        <div className="text-sm mb-2" style={{ fontWeight: 500 }}>Default Types</div>
        <div className="terrain-type-list">
          {DEFAULT_TERRAIN_TYPES.map(terrain => (
            <div key={terrain.id} className="terrain-type-item readonly">
              <span 
                className="terrain-color-swatch"
                style={{ backgroundColor: terrain.color }}
              />
              <span className="terrain-name">{terrain.name}</span>
              {terrain.symbol && (
                <span className="terrain-symbol">{terrain.symbol}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Custom terrain types */}
      <div className="mb-3">
        <div className="text-sm mb-2" style={{ fontWeight: 500 }}>Custom Types</div>
        {customTerrainTypes.length === 0 && !isAdding ? (
          <p className="text-muted text-sm">No custom terrain types yet.</p>
        ) : (
          <div className="terrain-type-list">
            {customTerrainTypes.map(terrain => (
              <div key={terrain.id} className="terrain-type-item editable">
                {editingId === terrain.id ? (
                  <>
                    <input
                      type="color"
                      className="terrain-color-input"
                      value={terrain.color}
                      onChange={e => handleUpdateTerrain(terrain.id, { color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input terrain-name-input"
                      value={terrain.name}
                      onChange={e => handleUpdateTerrain(terrain.id, { name: e.target.value })}
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      className="form-input terrain-symbol-input"
                      value={terrain.symbol || ''}
                      onChange={e => handleUpdateTerrain(terrain.id, { symbol: e.target.value || undefined })}
                      placeholder="Symbol"
                      maxLength={2}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingId(null)}
                      title="Done editing"
                    >
                      ✓
                    </button>
                  </>
                ) : (
                  <>
                    <span 
                      className="terrain-color-swatch"
                      style={{ backgroundColor: terrain.color }}
                    />
                    <span className="terrain-name">{terrain.name}</span>
                    {terrain.symbol && (
                      <span className="terrain-symbol">{terrain.symbol}</span>
                    )}
                    <div className="terrain-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingId(terrain.id)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteTerrain(terrain.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add new terrain type */}
      {isAdding ? (
        <div className="terrain-add-form">
          <div className="terrain-add-row">
            <input
              type="color"
              className="terrain-color-input"
              value={newTerrain.color}
              onChange={e => setNewTerrain(prev => ({ ...prev, color: e.target.value }))}
            />
            <input
              type="text"
              className="form-input terrain-name-input"
              value={newTerrain.name}
              onChange={e => setNewTerrain(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Terrain name"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTerrain();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewTerrain({ id: '', name: '', color: '#808080', symbol: '' });
                }
              }}
            />
            <input
              type="text"
              className="form-input terrain-symbol-input"
              value={newTerrain.symbol || ''}
              onChange={e => setNewTerrain(prev => ({ ...prev, symbol: e.target.value }))}
              placeholder="Sym"
              maxLength={2}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              className="btn btn-primary btn-sm flex-1"
              onClick={handleAddTerrain}
              disabled={!newTerrain.name.trim()}
            >
              Add
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setIsAdding(false);
                setNewTerrain({ id: '', name: '', color: '#808080', symbol: '' });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn btn-secondary"
          onClick={() => setIsAdding(true)}
          style={{ width: '100%' }}
        >
          + Add Terrain Type
        </button>
      )}
    </Accordion>
  );
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  gridConfig,
  onSettingsChange,
  onGridConfigChange,
  onClose,
}) => {
  // Get current spacing (either custom or calculated)
  const currentSpacing = getHexSpacing(gridConfig);
  const effectiveColSpacing = gridConfig.colSpacing ?? currentSpacing.horizSpacing;
  const effectiveRowSpacing = gridConfig.rowSpacing ?? currentSpacing.vertSpacing;
  
  // Calculate actual hex dimensions for display
  const hexDimensions = useMemo(() => {
    const { width, height } = getHexDimensions(gridConfig);
    return { width: Math.round(width * 10) / 10, height: Math.round(height * 10) / 10 };
  }, [gridConfig]);

  return (
    <div>
      {/* Header */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Settings</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
      </div>
      
      {/* Grid Alignment Accordion */}
      <Accordion title="Grid Alignment" defaultOpen={false}>
        <p className="text-muted text-sm mb-3">
          Fine-tune the hex grid position and spacing
        </p>
        
        {/* Origin Position */}
        <div className="mb-3">
          <div className="text-sm mb-2" style={{ fontWeight: 500 }}>Position</div>
          <IncrementControl
            label="Origin X"
            value={gridConfig.originX}
            onChange={v => onGridConfigChange({ originX: v })}
            step={10}
            fineStep={1}
            decimals={0}
          />
          <IncrementControl
            label="Origin Y"
            value={gridConfig.originY}
            onChange={v => onGridConfigChange({ originY: v })}
            step={10}
            fineStep={1}
            decimals={0}
          />
        </div>
        
        {/* Hex Size */}
        <div className="mb-3">
          <div className="text-sm mb-2" style={{ fontWeight: 500 }}>Size</div>
          <IncrementControl
            label="Hex Radius (center to vertex)"
            value={gridConfig.hexSize}
            onChange={v => onGridConfigChange({ hexSize: v })}
            step={5}
            fineStep={1}
            min={10}
            max={200}
            decimals={0}
          />
          <div className="text-muted text-sm mt-1 mb-2" style={{ marginLeft: 4 }}>
            Resulting size: {hexDimensions.width}px wide x {hexDimensions.height}px tall
          </div>
          
          {/* Quick size helpers */}
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Set from {gridConfig.orientation === 'flat-top' ? 'height' : 'width'} (px)</label>
              <input
                type="number"
                className="form-input"
                placeholder={gridConfig.orientation === 'flat-top' ? 'e.g. 152' : 'e.g. 100'}
                style={{ width: 100 }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const px = parseFloat(target.value);
                    if (!isNaN(px) && px > 0) {
                      const newSize = Math.round(px / Math.sqrt(3));
                      onGridConfigChange({ hexSize: newSize });
                      target.value = '';
                    }
                  }
                }}
              />
            </div>
            <span className="text-muted text-sm" style={{ marginBottom: 8 }}>Press Enter</span>
          </div>
        </div>
        
        {/* Spacing */}
        <div className="mb-3">
          <div className="text-sm mb-2" style={{ fontWeight: 500 }}>Spacing (px between hex centers)</div>
          <IncrementControl
            label="Column Spacing (horizontal)"
            value={effectiveColSpacing}
            onChange={v => onGridConfigChange({ colSpacing: v })}
            step={5}
            fineStep={0.5}
            min={1}
            decimals={1}
          />
          <IncrementControl
            label="Row Spacing (vertical)"
            value={effectiveRowSpacing}
            onChange={v => onGridConfigChange({ rowSpacing: v })}
            step={5}
            fineStep={0.5}
            min={1}
            decimals={1}
          />
          <div className="text-muted text-sm mt-1" style={{ marginLeft: 4 }}>
            Auto values: {Math.round(currentSpacing.horizSpacing * 10) / 10}px x {Math.round(currentSpacing.vertSpacing * 10) / 10}px
          </div>
          <button
            className="btn btn-secondary btn-sm mt-2"
            onClick={() => onGridConfigChange({ 
              colSpacing: undefined, 
              rowSpacing: undefined 
            })}
          >
            Reset to Auto
          </button>
        </div>
        
        {/* Orientation & Offset */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Orientation</label>
            <select
              className="form-select"
              value={gridConfig.orientation}
              onChange={e => onGridConfigChange({ 
                orientation: e.target.value as 'pointy-top' | 'flat-top' 
              })}
            >
              <option value="pointy-top">Pointy Top</option>
              <option value="flat-top">Flat Top</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              {gridConfig.orientation === 'pointy-top' ? 'Row Offset' : 'Col Offset'}
            </label>
            <select
              className="form-select"
              value={gridConfig.orientation === 'pointy-top' ? gridConfig.rowOffset : gridConfig.colOffset}
              onChange={e => {
                const value = e.target.value as 'odd' | 'even';
                if (gridConfig.orientation === 'pointy-top') {
                  onGridConfigChange({ rowOffset: value });
                } else {
                  onGridConfigChange({ colOffset: value });
                }
              }}
            >
              <option value="odd">Odd (1, 3, 5...)</option>
              <option value="even">Even (2, 4, 6...)</option>
            </select>
          </div>
        </div>
      </Accordion>
      
      {/* Display Settings Accordion */}
      <Accordion title="Display" defaultOpen={false}>
        <div className="panel-row mb-2">
          <span className="panel-row-label">Show Terrain Colors</span>
          <button
            className={`btn btn-sm ${settings?.showTerrainColors ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSettingsChange({ showTerrainColors: !settings?.showTerrainColors })}
          >
            {settings?.showTerrainColors ? 'On' : 'Off'}
          </button>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Hex Fill Opacity: {Math.round((settings?.hexFillOpacity ?? 0.5) * 100)}%
          </label>
          <input
            type="range"
            className="form-range"
            min="0"
            max="1"
            step="0.05"
            value={settings?.hexFillOpacity ?? 0.5}
            onChange={e => onSettingsChange({ hexFillOpacity: parseFloat(e.target.value) })}
          />
        </div>
        
        <div className="panel-row mb-2">
          <span className="panel-row-label">Show Coordinates</span>
          <button
            className={`btn btn-sm ${settings?.showCoordinates ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSettingsChange({ showCoordinates: !settings?.showCoordinates })}
          >
            {settings?.showCoordinates ? 'On' : 'Off'}
          </button>
        </div>
        
        <div className="panel-row mb-2">
          <span className="panel-row-label">Show Data Indicators</span>
          <button
            className={`btn btn-sm ${settings?.showDataIndicators ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSettingsChange({ showDataIndicators: !settings?.showDataIndicators })}
          >
            {settings?.showDataIndicators ? 'On' : 'Off'}
          </button>
        </div>
        
        <div className="panel-row mb-2">
          <span className="panel-row-label">Faction Territories</span>
          <button
            className={`btn btn-sm ${settings?.showFactionTerritories ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSettingsChange({ showFactionTerritories: !settings?.showFactionTerritories })}
          >
            {settings?.showFactionTerritories ? 'On' : 'Off'}
          </button>
        </div>
        
        <div className="panel-row mb-2">
          <span className="panel-row-label">Fog of War</span>
          <button
            className={`btn btn-sm ${settings?.showExploredStatus ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSettingsChange({ showExploredStatus: !settings?.showExploredStatus })}
          >
            {settings?.showExploredStatus ? 'On' : 'Off'}
          </button>
        </div>
      </Accordion>
      
      {/* Terrain Types Accordion */}
      <TerrainTypesSection 
        customTerrainTypes={settings?.customTerrainTypes || []}
        onUpdate={(types) => onSettingsChange({ customTerrainTypes: types })}
      />
    </div>
  );
};

export default SettingsPanel;
