import React, { useState, useCallback, useEffect } from 'react';
import type { CampaignSettings } from '@/lib/types';

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export interface ImageExportOptions {
  filename: string;
  format: ImageFormat;
  quality: number;
  includeBackground: boolean;
  backgroundOpacity: number;
  showGrid: boolean;
  gridOpacity: number;
  hexFillOpacity: number;
  showTerrainColors: boolean;
  showCoordinates: boolean;
  showFeatureMarkers: boolean;
  showLinkIndicators: boolean;
  showFactionTerritories: boolean;
  showFogOfWar: boolean;
  scale: number;
}

interface ExportImageDialogProps {
  isOpen: boolean;
  mapName: string;
  hasBackgroundImage: boolean;
  backgroundImageVisible?: boolean;
  backgroundImageOpacity?: number;
  mapSettings?: CampaignSettings;
  onClose: () => void;
  onExport: (options: ImageExportOptions) => void;
}

const DEFAULT_OPTIONS: ImageExportOptions = {
  filename: '',
  format: 'png',
  quality: 85,
  includeBackground: true,
  backgroundOpacity: 100,
  showGrid: true,
  gridOpacity: 30,
  hexFillOpacity: 50,
  showTerrainColors: true,
  showCoordinates: true,
  showFeatureMarkers: true,
  showLinkIndicators: true,
  showFactionTerritories: true,
  showFogOfWar: false,
  scale: 1,
};

const ExportImageDialog: React.FC<ExportImageDialogProps> = ({
  isOpen,
  mapName,
  hasBackgroundImage,
  backgroundImageVisible,
  backgroundImageOpacity,
  mapSettings,
  onClose,
  onExport,
}) => {
  const [options, setOptions] = useState<ImageExportOptions>({
    ...DEFAULT_OPTIONS,
    filename: mapName,
  });

  // Reset filename when map name changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setOptions(prev => ({ ...prev, filename: mapName }));
    }
  }, [isOpen, mapName]);

  const handleChange = useCallback(<K extends keyof ImageExportOptions>(
    key: K,
    value: ImageExportOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleUseMapSettings = useCallback(() => {
    if (!mapSettings) return;
    setOptions(prev => ({
      ...prev,
      includeBackground: backgroundImageVisible ?? true,
      backgroundOpacity: Math.round((backgroundImageOpacity ?? 1) * 100),
      showGrid: mapSettings.showGrid,
      gridOpacity: Math.round((mapSettings.gridOpacity ?? 0.3) * 100),
      hexFillOpacity: Math.round(mapSettings.hexFillOpacity * 100),
      showTerrainColors: mapSettings.showTerrainColors,
      showCoordinates: mapSettings.showCoordinates,
      showFeatureMarkers: mapSettings.showDataIndicators,
      showLinkIndicators: mapSettings.showLinkIndicators ?? true,
      showFactionTerritories: mapSettings.showFactionTerritories,
      showFogOfWar: mapSettings.showExploredStatus,
    }));
  }, [mapSettings, backgroundImageVisible, backgroundImageOpacity]);

  const handleExport = useCallback(() => {
    onExport(options);
  }, [options, onExport]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Export as Image</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Quick settings */}
          {mapSettings && (
            <div className="form-group">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleUseMapSettings}
              >
                Use Map Display Settings
              </button>
              <p className="text-muted text-sm mt-1">
                Copy current visibility settings from the map
              </p>
            </div>
          )}

          {/* Filename */}
          <div className="form-group">
            <label className="form-label">Filename</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                className="form-input"
                value={options.filename}
                onChange={e => handleChange('filename', e.target.value)}
                placeholder="map_export"
              />
              <span className="text-muted">.{options.format === 'jpeg' ? 'jpg' : options.format}</span>
            </div>
          </div>

          {/* Format & Quality */}
          <div className="form-group">
            <label className="form-label">Format</label>
            <div className="flex gap-2 mb-2">
              {(['jpeg', 'png', 'webp'] as const).map(fmt => (
                <button
                  key={fmt}
                  className={`btn btn-sm ${options.format === fmt ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleChange('format', fmt)}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
            {options.format !== 'png' && (
              <div className="panel-row">
                <span className="text-sm">Quality: {options.quality}%</span>
                <input
                  type="range"
                  className="form-range"
                  min="10"
                  max="100"
                  value={options.quality}
                  onChange={e => handleChange('quality', parseInt(e.target.value))}
                  style={{ width: '120px' }}
                />
              </div>
            )}
            <p className="text-muted text-sm mt-1">
              {options.format === 'png' && 'Lossless, larger file size'}
              {options.format === 'jpeg' && 'Smaller file size, good for photos'}
              {options.format === 'webp' && 'Modern format, smallest size'}
            </p>
          </div>

          {/* Background Image Section */}
          {hasBackgroundImage && (
            <>
              <div className="form-group">
                <label className="form-label">Background Image</label>
                <div className="panel-row mb-2">
                  <span className="text-sm">Include Background</span>
                  <button
                    className={`btn btn-sm ${options.includeBackground ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleChange('includeBackground', !options.includeBackground)}
                  >
                    {options.includeBackground ? 'Yes' : 'No'}
                  </button>
                </div>
                {options.includeBackground && (
                  <div className="panel-row">
                    <span className="text-sm">Opacity: {options.backgroundOpacity}%</span>
                    <input
                      type="range"
                      className="form-range"
                      min="0"
                      max="100"
                      value={options.backgroundOpacity}
                      onChange={e => handleChange('backgroundOpacity', parseInt(e.target.value))}
                      style={{ width: '120px' }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Hex Rendering Section */}
          <div className="form-group">
            <label className="form-label">Hex Rendering</label>

            <div className="panel-row mb-2">
              <span className="text-sm">Show Grid</span>
              <button
                className={`btn btn-sm ${options.showGrid ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('showGrid', !options.showGrid)}
              >
                {options.showGrid ? 'On' : 'Off'}
              </button>
            </div>

            {options.showGrid && (
              <div className="panel-row">
                <span className="text-sm">Grid Opacity: {options.gridOpacity}%</span>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="100"
                  value={options.gridOpacity}
                  onChange={e => handleChange('gridOpacity', parseInt(e.target.value))}
                  style={{ width: '120px' }}
                />
              </div>
            )}
          </div>

          {/* Labels & Markers Section */}
          <div className="form-group">
            <label className="form-label">Labels & Markers</label>

            <div className="panel-row mb-2">
              <span className="text-sm">Show Terrain Colors</span>
              <button
                className={`btn btn-sm ${options.showTerrainColors ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('showTerrainColors', !options.showTerrainColors)}
              >
                {options.showTerrainColors ? 'On' : 'Off'}
              </button>
            </div>

            {options.showTerrainColors && (
              <div className="panel-row mb-2">
                <span className="text-sm">Hex Fill Opacity: {options.hexFillOpacity}%</span>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="100"
                  value={options.hexFillOpacity}
                  onChange={e => handleChange('hexFillOpacity', parseInt(e.target.value))}
                  style={{ width: '120px' }}
                />
              </div>
            )}

            <div className="panel-row mb-2">
              <span className="text-sm">Show Coordinates</span>
              <button
                className={`btn btn-sm ${options.showCoordinates ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('showCoordinates', !options.showCoordinates)}
              >
                {options.showCoordinates ? 'On' : 'Off'}
              </button>
            </div>

            <div className="panel-row mb-2">
              <span className="text-sm">Feature Markers</span>
              <button
                className={`btn btn-sm ${options.showFeatureMarkers ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('showFeatureMarkers', !options.showFeatureMarkers)}
              >
                {options.showFeatureMarkers ? 'On' : 'Off'}
              </button>
            </div>

            <div className="panel-row mb-2">
              <span className="text-sm">Link Indicators</span>
              <button
                className={`btn btn-sm ${options.showLinkIndicators ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('showLinkIndicators', !options.showLinkIndicators)}
              >
                {options.showLinkIndicators ? 'On' : 'Off'}
              </button>
            </div>

            <div className="panel-row mb-2">
              <span className="text-sm">Faction Territories</span>
              <button
                className={`btn btn-sm ${options.showFactionTerritories ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('showFactionTerritories', !options.showFactionTerritories)}
              >
                {options.showFactionTerritories ? 'On' : 'Off'}
              </button>
            </div>

            <div className="panel-row">
              <span className="text-sm">Fog of War</span>
              <button
                className={`btn btn-sm ${options.showFogOfWar ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('showFogOfWar', !options.showFogOfWar)}
              >
                {options.showFogOfWar ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Resolution Section */}
          <div className="form-group">
            <label className="form-label">Resolution</label>
            <div className="flex gap-2 flex-wrap">
              {[0.25, 0.5, 1, 2, 3].map(scale => (
                <button
                  key={scale}
                  className={`btn btn-sm ${options.scale === scale ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleChange('scale', scale)}
                >
                  {scale}x
                </button>
              ))}
            </div>
            <p className="text-muted text-sm mt-1">
              Higher resolution = larger file size
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export {options.format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportImageDialog;
