import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GridConfig, Hex, HexCoord, Marker } from '@/lib/types';
import { coordToKey } from '@/lib/types';
import { coordEquals, getDisplayCoord } from '@/lib/hexUtils';
import { MarkerChip, MarkerSwatch } from './MarkerChip';
import MarkerForm, { type MarkerFormValues } from './MarkerForm';

interface MarkerStripProps {
  markers: Marker[];
  hexes: Hex[];
  gridConfig: GridConfig;
  /** The selected hex */
  coord: HexCoord;
  onMove: (markerId: string, coord: HexCoord | null) => void;
  /** Create a marker placed on the selected hex */
  onCreate: (values: MarkerFormValues) => void;
}

const CHIP_GAP = 4; // Keep in sync with .marker-strip-row gap

/** Where a marker is, as text: hex number, "not on map" or "off grid" */
export function describeMarkerLocation(
  marker: Marker,
  hexKeys: Set<string>,
  gridConfig: GridConfig
): string {
  if (!marker.coord) return 'not on map';
  if (!hexKeys.has(coordToKey(marker.coord))) return 'off grid';
  return getDisplayCoord(marker.coord, gridConfig);
}

/**
 * One-line marker controls for the selected hex: markers here (click to
 * remove), quick chips for markers elsewhere (click to move here), a ▾ list
 * for the ones that don't fit, and + to create one here.
 */
const MarkerStrip: React.FC<MarkerStripProps> = ({
  markers,
  hexes,
  gridConfig,
  coord,
  onMove,
  onCreate,
}) => {
  const [visibleCount, setVisibleCount] = useState(markers.length);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  const hexKeys = useMemo(() => new Set(hexes.map(h => coordToKey(h.coord))), [hexes]);

  const isHere = (m: Marker) => !!m.coord && coordEquals(m.coord, coord);

  // Markers on this hex first, then the rest; each group in list order
  const ordered = [...markers.filter(isHere), ...markers.filter(m => !isHere(m))];

  // Close the popover and form when another hex is selected
  useEffect(() => {
    setPopoverOpen(false);
    setFormOpen(false);
  }, [coord.q, coord.r]);

  // Fit as many chips as the line allows. Chips are measured from hidden
  // copies so the visible row never wraps, even mid-resize.
  const layoutKey = ordered.map(m => `${m.id}:${m.name}:${isHere(m)}`).join('|');
  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const compute = () => {
      const fixed = Array.from(row.querySelectorAll<HTMLElement>('[data-strip-fixed]'))
        .reduce((sum, el) => sum + el.offsetWidth + CHIP_GAP, 0);
      const available = row.clientWidth - fixed;
      const chipWidths = Array.from(measure.querySelectorAll<HTMLElement>('[data-measure-chip]'))
        .map(el => el.offsetWidth + CHIP_GAP);
      const total = chipWidths.reduce((a, b) => a + b, 0);

      if (total <= available) {
        setVisibleCount(chipWidths.length);
        return;
      }
      const moreEl = measure.querySelector<HTMLElement>('[data-measure-more]');
      let room = available - ((moreEl?.offsetWidth ?? 0) + CHIP_GAP);
      let count = 0;
      for (const w of chipWidths) {
        if (w > room) break;
        room -= w;
        count++;
      }
      setVisibleCount(count);
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(row);
    return () => observer.disconnect();
  }, [layoutKey]);

  // Esc or a click/tap outside closes the popover
  useEffect(() => {
    if (!popoverOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || moreRef.current?.contains(target)) return;
      setPopoverOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopoverOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [popoverOpen]);

  const toggleMarker = (m: Marker) => onMove(m.id, isHere(m) ? null : coord);

  const chipLabel = (m: Marker) => isHere(m)
    ? `${m.name}: remove from this hex`
    : `${m.name}: move to this hex`;

  const visible = ordered.slice(0, visibleCount);
  const hiddenCount = ordered.length - visible.length;

  const filtered = markers.filter(m => m.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div className="marker-strip">
      <div className="marker-strip-row" ref={rowRef}>
        <span className="marker-strip-label" data-strip-fixed>Markers</span>

        {visible.map(m => (
          <MarkerChip
            key={m.id}
            marker={m}
            filled={isHere(m)}
            label={chipLabel(m)}
            onClick={() => toggleMarker(m)}
          />
        ))}

        {hiddenCount > 0 && (
          <button
            ref={moreRef}
            type="button"
            className="btn btn-secondary btn-sm marker-strip-more"
            aria-expanded={popoverOpen}
            onClick={() => {
              setFilter('');
              setPopoverOpen(open => !open);
            }}
          >
            ▾ {hiddenCount}
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm marker-strip-add"
          data-strip-fixed
          onClick={() => setFormOpen(open => !open)}
          aria-expanded={formOpen}
        >
          {markers.length === 0 ? '+ Add marker' : '+'}
        </button>
      </div>

      {/* Hidden copies used only to measure chip widths */}
      <div className="marker-strip-measure" ref={measureRef} aria-hidden="true">
        {ordered.map(m => (
          <span key={m.id} data-measure-chip>
            <MarkerChip marker={m} filled={isHere(m)} />
          </span>
        ))}
        <span data-measure-more className="btn btn-secondary btn-sm marker-strip-more">
          ▾ {ordered.length}
        </span>
      </div>

      {popoverOpen && (
        <div className="marker-popover" ref={popoverRef}>
          <input
            className="form-input marker-popover-filter"
            placeholder="Filter markers…"
            aria-label="Filter markers"
            value={filter}
            autoFocus
            onChange={e => setFilter(e.target.value)}
          />
          <div className="marker-popover-list">
            {filtered.length === 0 && (
              <div className="text-sm text-muted marker-popover-empty">No markers match.</div>
            )}
            {filtered.map(m => (
              <div key={m.id} className="marker-popover-row">
                <MarkerSwatch marker={m} />
                <span className="marker-row-name">{m.name}</span>
                <span className="marker-row-location">
                  {isHere(m) ? 'here' : describeMarkerLocation(m, hexKeys, gridConfig)}
                </span>
                <button
                  type="button"
                  className={`btn btn-sm ${isHere(m) ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => toggleMarker(m)}
                >
                  {isHere(m) ? 'Remove' : 'Move here'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {formOpen && (
        <MarkerForm
          markers={markers}
          onSave={values => {
            onCreate(values);
            setFormOpen(false);
          }}
          onCancel={() => setFormOpen(false)}
        />
      )}
    </div>
  );
};

export default MarkerStrip;
