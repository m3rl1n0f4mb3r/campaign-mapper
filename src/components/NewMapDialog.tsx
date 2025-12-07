import React, { useState, useCallback } from 'react';
import type { MapMode, GridConfig, HexOrientation, OffsetType } from '@/lib/types';
import { DEFAULT_TERRAIN_TYPES } from '@/lib/types';
import { loadImageAsDataUrl } from '@/lib/storage';
import type { BiomeType } from '@/lib/generator/types';

export interface GenerationOptions {
  generateTerrain: boolean;
  generateFeatures: boolean;
  featureChance: number;
  includeLandmarks: boolean;
  includeSettlements: boolean;
  includeLairs: boolean;
  includeDungeons: boolean;
  generateFactions: boolean;
  startingBiome?: BiomeType;
}

interface NewMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (options: {
    name: string;
    mode: MapMode;
    gridConfig: Partial<GridConfig>;
    imageData?: { src: string; width: number; height: number; fileName: string };
    defaultTerrain?: string;
    generation?: GenerationOptions;
  }) => void;
}

const NewMapDialog: React.FC<NewMapDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [mode, setMode] = useState<MapMode>('blank');
  const [name, setName] = useState('');
  const [cols, setCols] = useState(10);
  const [rows, setRows] = useState(10);
  const [hexSize, setHexSize] = useState(32);
  const [orientation, setOrientation] = useState<HexOrientation>('pointy-top');
  const [rowOffset, setRowOffset] = useState<OffsetType>('odd');
  const [colOffset, setColOffset] = useState<OffsetType>('odd');
  
  // Image overlay options
  const [imageData, setImageData] = useState<{
    src: string;
    width: number;
    height: number;
    fileName: string;
  } | null>(null);
  const [originX, setOriginX] = useState(50);
  const [originY, setOriginY] = useState(50);
  const [colSpacing, setColSpacing] = useState<number | undefined>(undefined);
  const [rowSpacing, setRowSpacing] = useState<number | undefined>(undefined);
  const [defaultTerrain, setDefaultTerrain] = useState('unknown');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generation options
  const [generateTerrain, setGenerateTerrain] = useState(false);
  const [generateFeatures, setGenerateFeatures] = useState(false);
  const [featureChance, setFeatureChance] = useState(15);
  const [includeLandmarks, setIncludeLandmarks] = useState(true);
  const [includeSettlements, setIncludeSettlements] = useState(true);
  const [includeLairs, setIncludeLairs] = useState(true);
  const [includeDungeons, setIncludeDungeons] = useState(true);
  const [generateFactions, setGenerateFactions] = useState(true);
  const [startingBiome, setStartingBiome] = useState<BiomeType | ''>('');
  
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await loadImageAsDataUrl(file);
      setImageData({
        src: result.dataUrl,
        width: result.width,
        height: result.height,
        fileName: file.name,
      });
      
      // Auto-set name from file if not set
      if (!name) {
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        setName(baseName);
      }
    } catch (err) {
      setError('Failed to load image');
    } finally {
      setIsLoading(false);
    }
  }, [name]);
  
  const handleCreate = useCallback(() => {
    if (!name.trim()) {
      setError('Please enter a map name');
      return;
    }
    
    if (mode === 'overlay' && !imageData) {
      setError('Please select an image for overlay mode');
      return;
    }
    
    const generation = generateTerrain ? {
      generateTerrain,
      generateFeatures,
      featureChance,
      includeLandmarks,
      includeSettlements,
      includeLairs,
      includeDungeons,
      generateFactions,
      startingBiome: startingBiome || undefined,
    } : undefined;
    
    onCreate({
      name: name.trim(),
      mode,
      gridConfig: {
        cols,
        rows,
        hexSize,
        orientation,
        rowOffset,
        colOffset,
        originX,
        originY,
        colSpacing,
        rowSpacing,
        startCol: 1,
        startRow: 1,
      },
      imageData: imageData || undefined,
      defaultTerrain: generateTerrain ? undefined : defaultTerrain,
      generation,
    });
    
    // Reset form
    setName('');
    setImageData(null);
    setDefaultTerrain('unknown');
    setGenerateTerrain(false);
    setGenerateFeatures(false);
    setError(null);
  }, [name, mode, cols, rows, hexSize, orientation, rowOffset, colOffset, originX, originY, colSpacing, rowSpacing, imageData, defaultTerrain, generateTerrain, generateFeatures, featureChance, includeLandmarks, includeSettlements, includeLairs, includeDungeons, generateFactions, startingBiome, onCreate]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Map</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {error && (
            <div className="mb-3" style={{ 
              padding: 'var(--spacing-sm)', 
              background: 'var(--danger)', 
              borderRadius: 'var(--radius-sm)',
              color: 'white',
            }}>
              {error}
            </div>
          )}
          
          {/* Mode Selection */}
          <div className="form-group">
            <label className="form-label">Map Type</label>
            <div className="flex gap-2">
              <button
                className={`btn flex-1 ${mode === 'blank' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('blank')}
              >
                Blank Map
              </button>
              <button
                className={`btn flex-1 ${mode === 'overlay' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('overlay')}
              >
                Image Overlay
              </button>
            </div>
            <p className="text-muted text-sm mt-1">
              {mode === 'blank' 
                ? 'Create an empty hex grid to build from scratch'
                : 'Overlay a hex grid on an existing map image'}
            </p>
          </div>
          
          {/* Image Upload (overlay mode) */}
          {mode === 'overlay' && (
            <div className="form-group">
              <label className="form-label">Map Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label 
                htmlFor="image-upload" 
                className="btn btn-secondary"
                style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}
              >
                {isLoading ? 'Loading...' : imageData ? `✓ ${imageData.fileName}` : 'Select Image...'}
              </label>
              {imageData && (
                <p className="text-muted text-sm mt-1">
                  {imageData.width} × {imageData.height} pixels
                </p>
              )}
            </div>
          )}
          
          {/* Map Name */}
          <div className="form-group">
            <label className="form-label">Map Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Campaign Map"
            />
          </div>
          
          {/* Generation Options (blank mode only) */}
          {mode === 'blank' && (
            <div className="form-group">
              <label className="form-label">Terrain Generation</label>
              <div className="flex gap-2 mb-2">
                <button
                  className={`btn flex-1 ${!generateTerrain ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setGenerateTerrain(false)}
                >
                  Manual
                </button>
                <button
                  className={`btn flex-1 ${generateTerrain ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setGenerateTerrain(true)}
                >
                  Auto-Generate
                </button>
              </div>
              <p className="text-muted text-sm">
                {generateTerrain 
                  ? 'Generate random terrain using the Sandbox Generator algorithm'
                  : 'Start with a uniform terrain type'}
              </p>
            </div>
          )}
          
          {/* Default Terrain (manual mode) */}
          {(!generateTerrain || mode === 'overlay') && (
            <div className="form-group">
              <label className="form-label">Default Terrain</label>
              <select
                className="form-select"
                value={defaultTerrain}
                onChange={e => setDefaultTerrain(e.target.value)}
              >
                {DEFAULT_TERRAIN_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="text-muted text-sm mt-1">
                All hexes will start with this terrain type
              </p>
            </div>
          )}
          
          {/* Auto-Generation Options */}
          {mode === 'blank' && generateTerrain && (
            <>
              <div className="form-group">
                <label className="form-label">Starting Biome (optional)</label>
                <select
                  className="form-select"
                  value={startingBiome}
                  onChange={e => setStartingBiome(e.target.value as BiomeType | '')}
                >
                  <option value="">Random</option>
                  <option value="grassland">Grassland</option>
                  <option value="forest">Forest</option>
                  <option value="hills">Hills</option>
                  <option value="marsh">Marsh</option>
                  <option value="mountains">Mountains</option>
                </select>
              </div>
              
              <div className="form-group">
                <div className="panel-row mb-2">
                  <span className="panel-row-label">Generate Features</span>
                  <button
                    className={`btn btn-sm ${generateFeatures ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setGenerateFeatures(!generateFeatures)}
                  >
                    {generateFeatures ? 'On' : 'Off'}
                  </button>
                </div>
                
                {generateFeatures && (
                  <div style={{ marginLeft: 'var(--spacing-md)' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Feature Chance: {featureChance}%
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="5"
                        max="50"
                        step="5"
                        value={featureChance}
                        onChange={e => setFeatureChance(parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeLandmarks}
                          onChange={e => setIncludeLandmarks(e.target.checked)}
                        />
                        <span className="text-sm">Landmarks</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeSettlements}
                          onChange={e => setIncludeSettlements(e.target.checked)}
                        />
                        <span className="text-sm">Settlements</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeLairs}
                          onChange={e => setIncludeLairs(e.target.checked)}
                        />
                        <span className="text-sm">Lairs</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeDungeons}
                          onChange={e => setIncludeDungeons(e.target.checked)}
                        />
                        <span className="text-sm">Dungeons</span>
                      </label>
                    </div>
                    
                    <div className="mt-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={generateFactions}
                          onChange={e => setGenerateFactions(e.target.checked)}
                        />
                        <span className="text-sm">Generate Factions</span>
                      </label>
                      <p className="text-xs text-muted mt-1" style={{ marginLeft: '1.5rem' }}>
                        Creates factions for cities, castles, towers, and abbeys
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Grid Size */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Columns</label>
              <input
                type="number"
                className="form-input"
                value={cols}
                onChange={e => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={100}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rows</label>
              <input
                type="number"
                className="form-input"
                value={rows}
                onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={100}
              />
            </div>
          </div>
          
          {/* Hex Options */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hex Size (px)</label>
              <input
                type="number"
                className="form-input"
                value={hexSize}
                onChange={e => setHexSize(Math.max(10, parseInt(e.target.value) || 32))}
                min={10}
                max={100}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Orientation</label>
              <select
                className="form-select"
                value={orientation}
                onChange={e => setOrientation(e.target.value as HexOrientation)}
              >
                <option value="pointy-top">Pointy Top</option>
                <option value="flat-top">Flat Top</option>
              </select>
            </div>
          </div>
          
          {/* Offset Options */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                {orientation === 'pointy-top' ? 'Row Offset' : 'Column Offset'}
              </label>
              <select
                className="form-select"
                value={orientation === 'pointy-top' ? rowOffset : colOffset}
                onChange={e => {
                  const value = e.target.value as OffsetType;
                  if (orientation === 'pointy-top') {
                    setRowOffset(value);
                  } else {
                    setColOffset(value);
                  }
                }}
              >
                <option value="odd">Odd (1, 3, 5...)</option>
                <option value="even">Even (2, 4, 6...)</option>
              </select>
            </div>
          </div>
          
          {/* Origin Position (overlay mode) */}
          {mode === 'overlay' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Origin X</label>
                  <input
                    type="number"
                    className="form-input"
                    value={originX}
                    onChange={e => setOriginX(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Origin Y</label>
                  <input
                    type="number"
                    className="form-input"
                    value={originY}
                    onChange={e => setOriginY(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Col Spacing (optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={colSpacing ?? ''}
                    onChange={e => setColSpacing(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Auto"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Row Spacing (optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={rowSpacing ?? ''}
                    onChange={e => setRowSpacing(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Auto"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            disabled={isLoading}
          >
            Create Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMapDialog;
