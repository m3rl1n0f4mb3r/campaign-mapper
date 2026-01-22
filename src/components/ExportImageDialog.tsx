import React, { useState, useCallback, useEffect } from 'react';

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export interface ImageExportOptions {
  filename: string;
  format: ImageFormat;
  quality: number;
  includeBackground: boolean;
  backgroundOpacity: number;
  includeHexOutlines: boolean;
  hexOutlineOpacity: number;
  hexFillOpacity: number;
  includeCoordinates: boolean;
  includeFeatureMarkers: boolean;
  includeTerrainSymbols: boolean;
  scale: number;
}

interface ExportImageDialogProps {
  isOpen: boolean;
  mapName: string;
  hasBackgroundImage: boolean;
  onClose: () => void;
  onExport: (options: ImageExportOptions) => void;
}

const DEFAULT_OPTIONS: ImageExportOptions = {
  filename: '',
  format: 'png',
  quality: 85,
  includeBackground: true,
  backgroundOpacity: 100,
  includeHexOutlines: true,
  hexOutlineOpacity: 30,
  hexFillOpacity: 50,
  includeCoordinates: true,
  includeFeatureMarkers: true,
  includeTerrainSymbols: true,
  scale: 1,
};

const ExportImageDialog: React.FC<ExportImageDialogProps> = ({
  isOpen,
  mapName,
  hasBackgroundImage,
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
              <span className="text-sm">Show Hex Outlines</span>
              <button
                className={`btn btn-sm ${options.includeHexOutlines ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('includeHexOutlines', !options.includeHexOutlines)}
              >
                {options.includeHexOutlines ? 'Yes' : 'No'}
              </button>
            </div>

            {options.includeHexOutlines && (
              <div className="panel-row mb-2">
                <span className="text-sm">Outline Opacity: {options.hexOutlineOpacity}%</span>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="100"
                  value={options.hexOutlineOpacity}
                  onChange={e => handleChange('hexOutlineOpacity', parseInt(e.target.value))}
                  style={{ width: '120px' }}
                />
              </div>
            )}

            <div className="panel-row">
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
          </div>

          {/* Labels & Markers Section */}
          <div className="form-group">
            <label className="form-label">Labels & Markers</label>

            <div className="panel-row mb-2">
              <span className="text-sm">Hex Coordinates</span>
              <button
                className={`btn btn-sm ${options.includeCoordinates ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('includeCoordinates', !options.includeCoordinates)}
              >
                {options.includeCoordinates ? 'Show' : 'Hide'}
              </button>
            </div>

            <div className="panel-row mb-2">
              <span className="text-sm">Terrain Symbols</span>
              <button
                className={`btn btn-sm ${options.includeTerrainSymbols ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('includeTerrainSymbols', !options.includeTerrainSymbols)}
              >
                {options.includeTerrainSymbols ? 'Show' : 'Hide'}
              </button>
            </div>

            <div className="panel-row">
              <span className="text-sm">Feature Markers</span>
              <button
                className={`btn btn-sm ${options.includeFeatureMarkers ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleChange('includeFeatureMarkers', !options.includeFeatureMarkers)}
              >
                {options.includeFeatureMarkers ? 'Show' : 'Hide'}
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
            Export PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportImageDialog;
