import React from 'react';
import type { Marker } from '@/lib/types';
import { getMarkerIcon, shortMarkerName } from '@/lib/markerIcons';
import { getContrastText } from '@/lib/palette';

/** Round icon badge in the marker's color (lists and popover rows) */
export const MarkerSwatch: React.FC<{ marker: Marker; size?: number }> = ({ marker, size = 24 }) => {
  const Icon = getMarkerIcon(marker.icon);
  const fg = getContrastText(marker.color);
  return (
    <span
      className="marker-swatch"
      style={{ background: marker.color, width: size, height: size }}
      aria-hidden="true"
    >
      {Icon && <Icon size={size * 0.6} color={fg} strokeWidth={2.5} />}
    </span>
  );
};

interface MarkerChipProps {
  marker: Marker;
  /** Filled = on this hex; outlined = elsewhere or off the map */
  filled: boolean;
  onClick?: () => void;
  /** Accessible label (never the only place the info appears) */
  label?: string;
}

/** Icon + short name chip used in the hex panel's marker strip */
export const MarkerChip: React.FC<MarkerChipProps> = ({ marker, filled, onClick, label }) => {
  const Icon = getMarkerIcon(marker.icon);
  const fg = filled ? getContrastText(marker.color) : undefined;
  return (
    <button
      type="button"
      className={`marker-chip ${filled ? 'filled' : 'outlined'}`}
      style={filled
        ? { background: marker.color, borderColor: marker.color, color: fg }
        : { borderColor: marker.color }}
      onClick={onClick}
      aria-label={label}
      aria-pressed={filled}
    >
      {Icon
        ? <Icon size={14} color={filled ? fg : marker.color} strokeWidth={2.5} />
        : <span className="marker-chip-dot" style={{ background: filled ? fg : marker.color }} />}
      <span className="marker-chip-name">{shortMarkerName(marker.name)}</span>
    </button>
  );
};
