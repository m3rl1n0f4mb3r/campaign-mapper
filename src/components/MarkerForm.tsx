import React, { useState } from 'react';
import type { Marker } from '@/lib/types';
import { MARKER_ICONS, MARKER_ICON_KEYS, findLookAlike, getDefaultLook } from '@/lib/markerIcons';
import { MARKER_COLORS, getContrastText } from '@/lib/palette';

export interface MarkerFormValues {
  name: string;
  icon: string;
  color: string;
}

interface MarkerFormProps {
  /** All markers, for the look-alike warning and new-marker defaults */
  markers: Marker[];
  /** Marker being edited; omit to create a new one */
  editing?: Marker;
  onSave: (values: MarkerFormValues) => void;
  onCancel: () => void;
}

/** Inline form for creating or editing a marker's name, icon and color */
const MarkerForm: React.FC<MarkerFormProps> = ({ markers, editing, onSave, onCancel }) => {
  // Set once on open; later marker changes don't reset what's being typed
  const [values, setValues] = useState<MarkerFormValues>(() => editing
    ? { name: editing.name, icon: editing.icon, color: editing.color }
    : { name: '', ...getDefaultLook(markers) });

  const isCustomColor = !MARKER_COLORS.some(c => c.toLowerCase() === values.color.toLowerCase());
  const lookAlike = findLookAlike(markers, values.icon, values.color, editing?.id);
  const canSave = values.name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({ ...values, name: values.name.trim() });
  };

  return (
    <div className="marker-form">
      <div className="form-group">
        <label className="form-label" htmlFor="marker-form-name">Name</label>
        <input
          id="marker-form-name"
          className="form-input"
          value={values.name}
          placeholder="e.g. Party"
          autoFocus
          onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
          onKeyDown={e => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </div>

      <div className="form-group">
        <span className="form-label">Icon</span>
        <div className="marker-icon-grid" role="radiogroup" aria-label="Icon">
          {MARKER_ICON_KEYS.map(key => {
            const Icon = MARKER_ICONS[key];
            const selected = values.icon === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={key}
                className={`marker-icon-option ${selected ? 'selected' : ''}`}
                style={selected ? { background: values.color, borderColor: values.color } : undefined}
                onClick={() => setValues(v => ({ ...v, icon: key }))}
              >
                <Icon size={18} color={selected ? getContrastText(values.color) : 'currentColor'} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-group">
        <span className="form-label">Color</span>
        <div className="marker-color-row" role="radiogroup" aria-label="Color">
          {MARKER_COLORS.map(color => {
            const selected = values.color.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={color}
                className={`marker-color-option ${selected ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() => setValues(v => ({ ...v, color }))}
              />
            );
          })}
          {/* Custom color: rainbow circle until a custom color is picked */}
          <label
            className={`marker-color-option marker-color-custom ${isCustomColor ? 'selected' : ''}`}
            style={isCustomColor ? { background: values.color } : undefined}
          >
            <input
              type="color"
              aria-label="Custom color"
              value={values.color}
              onChange={e => setValues(v => ({ ...v, color: e.target.value }))}
            />
          </label>
        </div>
      </div>

      {lookAlike && (
        <div className="marker-form-warning" role="status">
          ⚠ Looks the same as "{lookAlike.name}": same icon and color.
        </div>
      )}

      <div className="marker-form-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!canSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default MarkerForm;
