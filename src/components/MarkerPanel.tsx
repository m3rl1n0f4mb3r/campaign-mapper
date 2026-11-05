import React, { useMemo, useState } from 'react';
import type { GridConfig, Hex, HexCoord, Marker } from '@/lib/types';
import { coordToKey } from '@/lib/types';
import { MarkerSwatch } from './MarkerChip';
import MarkerForm, { type MarkerFormValues } from './MarkerForm';
import { describeMarkerLocation } from './MarkerStrip';
import { getTrailMoveCount } from '@/lib/mapFactory';

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
  onSetTrailVisible: (id: string, visible: boolean) => void;
  onUndoTrailStep: (id: string) => void;
  onClearTrail: (id: string) => void;
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
  onSetTrailVisible,
  onUndoTrailStep,
  onClearTrail,
  onGoTo,
  onClose,
}) => {
  // 'new', a marker id being edited, or null
  const [formFor, setFormFor] = useState<string | null>(null);

  const hexKeys = useMemo(() => new Set(hexes.map(h => coordToKey(h.coord))), [hexes]);

  const handleDelete = (marker: Marker) => {
    const steps = getTrailMoveCount(marker.trail);
    const trailNote = steps > 0 ? ` and its trail (${steps} ${steps === 1 ? 'step' : 'steps'})` : '';
    if (confirm(`Delete marker "${marker.name}"${trailNote}? This cannot be undone.`)) {
      onDelete(marker.id);
    }
  };

  const handleClearTrail = (marker: Marker) => {
    if (confirm(`Clear the trail for "${marker.name}"? Explored hexes stay explored.`)) {
      onClearTrail(marker.id);
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
                  onUndoTrailStep={() => onUndoTrailStep(marker.id)}
                  onClearTrail={() => handleClearTrail(marker)}
                />
              );
            }

            const location = describeMarkerLocation(marker, hexKeys, gridConfig);
            const onGrid = !!marker.coord && hexKeys.has(coordToKey(marker.coord));
            const trail = marker.trail;
            const stepCount = getTrailMoveCount(trail);
            const showTrailLine = !!trail && (trail.record || trail.steps.length > 0);
            const trailStatus = trail && [
              `${stepCount} ${stepCount === 1 ? 'step' : 'steps'}`,
              trail.record ? 'recording' : 'paused',
              ...(trail.visible ? [] : ['hidden']),
            ].join(' · ');

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
                {showTrailLine && trail && (
                  <div className="marker-list-trail">
                    <span className="marker-list-trail-status">Trail · {trailStatus}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSetTrailVisible(marker.id, !trail.visible)}
                    >
                      {trail.visible ? 'Hide trail' : 'Show trail'}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onUndoTrailStep(marker.id)}
                      disabled={stepCount === 0}
                    >
                      ↶ Undo step
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarkerPanel;
