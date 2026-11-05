import React, { useMemo, useState } from 'react';
import type { GridConfig, Hex, HexCoord, Marker } from '@/lib/types';
import { coordToKey } from '@/lib/types';
import { MarkerSwatch } from './MarkerChip';
import MarkerForm, { type MarkerFormValues } from './MarkerForm';
import { describeMarkerLocation } from './MarkerStrip';

interface MarkerPanelProps {
  markers: Marker[];
  hexes: Hex[];
  gridConfig: GridConfig;
  /** Create a marker that isn't on the map yet */
  onAdd: (values: MarkerFormValues) => void;
  onAddStarters: () => void;
  onUpdate: (id: string, values: MarkerFormValues) => void;
  onMove: (id: string, coord: HexCoord | null) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  onDelete: (id: string) => void;
  onGoTo: (coord: HexCoord) => void;
  onClose: () => void;
}

/** Sidebar view to list, find, reorder, edit and delete markers */
const MarkerPanel: React.FC<MarkerPanelProps> = ({
  markers,
  hexes,
  gridConfig,
  onAdd,
  onAddStarters,
  onUpdate,
  onMove,
  onReorder,
  onDelete,
  onGoTo,
  onClose,
}) => {
  // 'new', a marker id being edited, or null
  const [formFor, setFormFor] = useState<string | null>(null);

  const hexKeys = useMemo(() => new Set(hexes.map(h => coordToKey(h.coord))), [hexes]);

  const handleDelete = (marker: Marker) => {
    if (confirm(`Delete marker "${marker.name}"? This cannot be undone.`)) {
      onDelete(marker.id);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Markers</span>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setFormFor('new')}
            disabled={formFor === 'new'}
          >
            + New
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="panel-content">
        {formFor === 'new' && (
          <MarkerForm
            markers={markers}
            onSave={values => {
              onAdd(values);
              setFormFor(null);
            }}
            onCancel={() => setFormFor(null)}
          />
        )}

        {markers.length === 0 && formFor !== 'new' && (
          <div className="marker-panel-empty">
            <p className="text-sm text-muted">
              Markers are movable icons for things like your party's location or destination.
            </p>
            <button className="btn btn-primary btn-sm" onClick={onAddStarters}>
              Add Party &amp; Destination
            </button>
          </div>
        )}

        <div className="marker-list">
          {markers.map((marker, index) => {
            if (formFor === marker.id) {
              return (
                <MarkerForm
                  key={marker.id}
                  markers={markers}
                  editing={marker}
                  onSave={values => {
                    onUpdate(marker.id, values);
                    setFormFor(null);
                  }}
                  onCancel={() => setFormFor(null)}
                />
              );
            }

            const location = describeMarkerLocation(marker, hexKeys, gridConfig);
            const onGrid = !!marker.coord && hexKeys.has(coordToKey(marker.coord));

            return (
              <div key={marker.id} className="marker-list-row">
                <div className="marker-list-main">
                  <MarkerSwatch marker={marker} />
                  <span className="marker-row-name">{marker.name}</span>
                  <span className="marker-row-location">{location}</span>
                </div>
                <div className="marker-list-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => marker.coord && onGoTo(marker.coord)}
                    disabled={!onGrid}
                  >
                    Go to
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onMove(marker.id, null)}
                    disabled={!marker.coord}
                  >
                    Remove
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onReorder(marker.id, 'up')}
                    disabled={index === 0}
                    aria-label={`Move ${marker.name} up`}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onReorder(marker.id, 'down')}
                    disabled={index === markers.length - 1}
                    aria-label={`Move ${marker.name} down`}
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setFormFor(marker.id)}
                    aria-label={`Edit ${marker.name}`}
                  >
                    ✎
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(marker)}
                    aria-label={`Delete ${marker.name}`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarkerPanel;
