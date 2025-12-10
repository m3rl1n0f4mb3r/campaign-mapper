import React, { useState, useCallback, useMemo } from 'react';
import type { Faction, FactionRelationshipStatus, FactionType, Hex, HexCoord, GridConfig, TerrainType } from '@/lib/types';
import { DEFAULT_TERRAIN_TYPES, getEffectiveTerrain } from '@/lib/types';
import { generateFactionNameOptions } from '@/lib/generator/nameGenerator';
import { axialToOffset, getHexAt } from '@/lib/hexUtils';

function getTerrainInfo(terrainId: string, customTerrains: TerrainType[]): TerrainType {
  const allTerrains = [...DEFAULT_TERRAIN_TYPES, ...customTerrains];
  return allTerrains.find(t => t.id === terrainId) || {
    id: terrainId,
    name: terrainId,
    color: '#808080',
  };
}

// Accordion component for collapsible sections
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
        <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>▶</span>
      </button>
      {isOpen && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
};

interface FactionPanelProps {
  factions: Faction[];
  hexes: Hex[];
  gridConfig: GridConfig;
  customTerrainTypes: TerrainType[];
  onUpdateFaction: (faction: Faction) => void;
  onDeleteFaction: (factionId: string) => void;
  onAddFaction: (faction: Faction) => void;
  onHexClick: (coord: HexCoord) => void;
  onClose: () => void;
}

const RELATIONSHIP_LABELS: Record<FactionRelationshipStatus, { label: string; color: string }> = {
  'open_war': { label: 'War', color: '#ef4444' },
  'hostility': { label: 'Hostile', color: '#f97316' },
  'indifference': { label: 'Neutral', color: '#6b7280' },
  'peace_trade': { label: 'Trade', color: '#22c55e' },
  'alliance': { label: 'Allied', color: '#3b82f6' },
};

const FACTION_COLORS = [
  '#e94560', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa',
  '#f472b6', '#34d399', '#38bdf8', '#fb923c', '#c084fc',
  '#f87171', '#22d3d3', '#818cf8', '#facc15', '#f97316',
  '#ec4899', '#14b8a6', '#8b5cf6', '#84cc16', '#06b6d4',
];

// Default note keys for factions
const DEFAULT_FACTION_NOTE_KEYS = ['Description', 'Goals', 'History'];

function generateFactionId(): string {
  return `faction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const FactionPanel: React.FC<FactionPanelProps> = ({
  factions,
  hexes,
  gridConfig,
  customTerrainTypes,
  onUpdateFaction,
  onDeleteFaction,
  onAddFaction,
  onHexClick,
  onClose,
}) => {
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  
  // New faction state
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(FACTION_COLORS[0]);
  const [newType, setNewType] = useState<FactionType>('faction');
  
  // Notes state
  const [newNoteKey, setNewNoteKey] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const selectedFaction = factions.find(f => f.id === selectedFactionId);
  
  // Get all note keys for selected faction: existing notes + default keys (unless explicitly deleted)
  const noteKeys = useMemo(() => {
    if (!selectedFaction) return [];
    const existing = Object.keys(selectedFaction.notes || {});
    const deleted = new Set(selectedFaction.deletedNotes || []);
    const allKeys = new Set(existing);
    
    // Add default keys unless they've been explicitly deleted
    DEFAULT_FACTION_NOTE_KEYS.forEach(k => {
      if (!deleted.has(k)) {
        allKeys.add(k);
      }
    });
    
    // Sort: defaults first (in order), then custom notes alphabetically
    const sorted = Array.from(allKeys).sort((a, b) => {
      const aIsDefault = DEFAULT_FACTION_NOTE_KEYS.includes(a);
      const bIsDefault = DEFAULT_FACTION_NOTE_KEYS.includes(b);
      if (aIsDefault && bIsDefault) {
        return DEFAULT_FACTION_NOTE_KEYS.indexOf(a) - DEFAULT_FACTION_NOTE_KEYS.indexOf(b);
      }
      if (aIsDefault) return -1;
      if (bIsDefault) return 1;
      return a.localeCompare(b);
    });
    
    return sorted;
  }, [selectedFaction]);
  
  const handleGenerateNames = useCallback(() => {
    const names = generateFactionNameOptions(6);
    setGeneratedNames(names);
  }, []);
  
  const handleCreateFaction = useCallback(() => {
    if (!newName.trim()) return;

    const faction: Faction = {
      id: generateFactionId(),
      name: newName.trim(),
      type: newType,
      color: newColor,
      sourceHexCoord: { q: 0, r: 0 }, // Will be set when assigning territory
      domainHexes: [],
      relationships: [],
    };

    onAddFaction(faction);
    setNewName('');
    setNewType('faction');
    setGeneratedNames([]);
    setIsCreating(false);
  }, [newName, newType, newColor, onAddFaction]);
  
  const handleUpdateFaction = useCallback((updates: Partial<Faction>) => {
    if (!selectedFaction) return;
    onUpdateFaction({ ...selectedFaction, ...updates });
  }, [selectedFaction, onUpdateFaction]);
  
  // Notes handlers
  const handleNoteChange = useCallback((key: string, value: string) => {
    if (!selectedFaction) return;
    const currentNotes = selectedFaction.notes || {};
    handleUpdateFaction({ notes: { ...currentNotes, [key]: value } });
  }, [selectedFaction, handleUpdateFaction]);
  
  const handleDeleteNote = useCallback((key: string) => {
    if (!selectedFaction) return;
    const currentNotes = selectedFaction.notes || {};
    const { [key]: _, ...rest } = currentNotes;
    
    // Track if this was a default note being deleted
    const isDefaultNote = DEFAULT_FACTION_NOTE_KEYS.includes(key);
    const currentDeleted = selectedFaction.deletedNotes || [];
    
    const updates: Partial<Faction> = {
      notes: Object.keys(rest).length > 0 ? rest : undefined,
    };
    
    // If deleting a default note, add it to deletedNotes so it doesn't come back
    if (isDefaultNote && !currentDeleted.includes(key)) {
      updates.deletedNotes = [...currentDeleted, key];
    }
    
    handleUpdateFaction(updates);
  }, [selectedFaction, handleUpdateFaction]);
  
  const handleAddNote = useCallback(() => {
    if (!selectedFaction || !newNoteKey.trim()) return;
    const key = newNoteKey.trim();
    const currentNotes = selectedFaction.notes || {};
    // Don't overwrite existing notes
    if (!(key in currentNotes)) {
      handleUpdateFaction({ notes: { ...currentNotes, [key]: '' } });
    }
    setNewNoteKey('');
    setIsAddingNote(false);
  }, [selectedFaction, newNoteKey, handleUpdateFaction]);
  
  const handleDeleteFaction = useCallback(() => {
    if (!selectedFaction) return;
    const typeLabel = selectedFaction.type === 'region' ? 'region' : 'faction';
    if (confirm(`Delete ${typeLabel} "${selectedFaction.name}"? This cannot be undone.`)) {
      onDeleteFaction(selectedFaction.id);
      setSelectedFactionId(null);
    }
  }, [selectedFaction, onDeleteFaction]);
  
  const handleRelationshipChange = useCallback((
    targetFactionId: string, 
    status: FactionRelationshipStatus
  ) => {
    if (!selectedFaction) return;
    
    const existingIdx = selectedFaction.relationships.findIndex(
      r => r.factionId === targetFactionId
    );
    
    const newRelationships = [...selectedFaction.relationships];
    if (existingIdx >= 0) {
      newRelationships[existingIdx] = { factionId: targetFactionId, status };
    } else {
      newRelationships.push({ factionId: targetFactionId, status });
    }
    
    handleUpdateFaction({ relationships: newRelationships });
    
    // Update the reciprocal relationship
    const targetFaction = factions.find(f => f.id === targetFactionId);
    if (targetFaction) {
      const targetRelationships = [...targetFaction.relationships];
      const recipIdx = targetRelationships.findIndex(r => r.factionId === selectedFaction.id);
      if (recipIdx >= 0) {
        targetRelationships[recipIdx] = { factionId: selectedFaction.id, status };
      } else {
        targetRelationships.push({ factionId: selectedFaction.id, status });
      }
      onUpdateFaction({ ...targetFaction, relationships: targetRelationships });
    }
  }, [selectedFaction, factions, handleUpdateFaction, onUpdateFaction]);

  return (
    <div>
      {/* Header */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Factions</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
      </div>
      
      {/* Faction List or Create Form */}
      {isCreating ? (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">New {newType === 'faction' ? 'Faction' : 'Region'}</span>
          </div>
          <div className="panel-content">
            {/* Type */}
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="flex gap-2">
                <button
                  className={`btn flex-1 ${newType === 'faction' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setNewType('faction')}
                >
                  Faction
                </button>
                <button
                  className={`btn flex-1 ${newType === 'region' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setNewType('region')}
                >
                  Region
                </button>
              </div>
              <p className="text-xs text-muted mt-1">
                {newType === 'faction'
                  ? 'Factions are political groups with relationships'
                  : 'Regions are geographic areas for organization'}
              </p>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={newType === 'faction' ? "Enter faction name..." : "Enter region name..."}
              />
            </div>

            {/* Name Generator */}
            <div className="form-group">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleGenerateNames}
                style={{ width: '100%' }}
              >
                Generate Names
              </button>
              {generatedNames.length > 0 && (
                <div className="flex flex-col gap-1 mt-2">
                  {generatedNames.map((name, i) => (
                    <button
                      key={i}
                      className={`btn btn-sm ${newName === name ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setNewName(name)}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Color */}
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-grid">
                {FACTION_COLORS.map(color => (
                  <button
                    key={color}
                    className={`color-swatch ${newColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-sm text-muted">
              Notes can be added after creating the faction.
            </p>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                className="btn btn-primary flex-1"
                onClick={handleCreateFaction}
                disabled={!newName.trim()}
              >
                Create {newType === 'faction' ? 'Faction' : 'Region'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsCreating(false);
                  setGeneratedNames([]);
                  setNewName('');
                  setNewType('faction');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : selectedFaction ? (
        /* Faction Detail View */
        <>
          {/* Header with back button */}
          <div className="panel">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span 
                  className="color-dot"
                  style={{ backgroundColor: selectedFaction.color }}
                />
                <span className="panel-title">{selectedFaction.name}</span>
              </div>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedFactionId(null)}
              >
                Back
              </button>
            </div>
          </div>
          
          <div className="panel">
            <div className="panel-content" style={{ padding: 0 }}>
              {/* General */}
              <Accordion title="General" defaultOpen={true}>
                {/* Type */}
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div className="flex gap-2">
                    <button
                      className={`btn btn-sm flex-1 ${selectedFaction.type !== 'region' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateFaction({ type: 'faction' })}
                    >
                      Faction
                    </button>
                    <button
                      className={`btn btn-sm flex-1 ${selectedFaction.type === 'region' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateFaction({ type: 'region' })}
                    >
                      Region
                    </button>
                  </div>
                </div>

                {/* Name Edit */}
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedFaction.name}
                    onChange={e => handleUpdateFaction({ name: e.target.value })}
                  />
                </div>

                {/* Color */}
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div className="color-grid">
                    {FACTION_COLORS.map(color => (
                      <button
                        key={color}
                        className={`color-swatch ${selectedFaction.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleUpdateFaction({ color })}
                      />
                    ))}
                  </div>
                </div>
              </Accordion>
              
              {/* Territory */}
              <Accordion title={`Territory (${selectedFaction.domainHexes.length} hex${selectedFaction.domainHexes.length !== 1 ? 'es' : ''})`} defaultOpen={false}>
                {selectedFaction.domainHexes.length === 0 ? (
                  <p className="text-sm text-muted">
                    No territory assigned. Select hexes on the map and assign them in the hex detail panel.
                  </p>
                ) : (
                  <>
                    <div className="territory-grid">
                      {selectedFaction.domainHexes.map(coord => {
                        const hex = getHexAt(hexes, coord);
                        if (!hex) return null;
                        const terrain = getTerrainInfo(
                          getEffectiveTerrain(hex),
                          customTerrainTypes
                        );
                        const { col, row } = axialToOffset(coord, gridConfig);
                        const displayCoord = `${String(col).padStart(2, '0')}${String(row).padStart(2, '0')}`;
                        
                        return (
                          <button
                            key={`${coord.q},${coord.r}`}
                            className="territory-hex-btn"
                            onClick={() => onHexClick(coord)}
                            title={`${displayCoord} - ${terrain.name}`}
                          >
                            <span
                              className="territory-terrain-dot"
                              style={{ backgroundColor: terrain.color }}
                            />
                            <span className="territory-coord">{displayCoord}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted mt-2">
                      Click a hex to select it. To modify territory, use the hex detail panel.
                    </p>
                  </>
                )}
              </Accordion>
              
              {/* Relationships - only for factions, not regions */}
              {selectedFaction.type !== 'region' && (
                <Accordion title="Relationships" defaultOpen={false}>
                  {factions.filter(f => f.id !== selectedFaction.id && f.type !== 'region').length === 0 ? (
                    <p className="text-sm text-muted">No other factions to have relationships with.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {factions
                        .filter(f => f.id !== selectedFaction.id && f.type !== 'region')
                        .map(otherFaction => {
                          const relationship = selectedFaction.relationships.find(
                            r => r.factionId === otherFaction.id
                          );
                          const status = relationship?.status || 'indifference';

                          return (
                            <div key={otherFaction.id} className="relationship-row">
                              <div className="flex items-center gap-2">
                                <span
                                  className="color-dot"
                                  style={{ backgroundColor: otherFaction.color }}
                                />
                                <span className="text-sm">{otherFaction.name}</span>
                              </div>
                              <select
                                className="form-select relationship-select"
                                value={status}
                                onChange={e => handleRelationshipChange(
                                  otherFaction.id,
                                  e.target.value as FactionRelationshipStatus
                                )}
                                style={{
                                  color: RELATIONSHIP_LABELS[status].color,
                                  borderColor: RELATIONSHIP_LABELS[status].color,
                                }}
                              >
                                {Object.entries(RELATIONSHIP_LABELS).map(([key, { label }]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </Accordion>
              )}
              
              {/* Notes */}
              <Accordion title="Notes" defaultOpen={true}>
                {/* Render all notes */}
                {noteKeys.map(key => (
                  <div key={key} className="form-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="form-label" style={{ marginBottom: 0 }}>{key}</label>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteNote(key)}
                        title={`Delete "${key}" note`}
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      className="form-textarea"
                      value={(selectedFaction.notes || {})[key] || ''}
                      onChange={(e) => handleNoteChange(key, e.target.value)}
                      placeholder={`Enter ${key.toLowerCase()}...`}
                      rows={3}
                    />
                  </div>
                ))}
                
                {/* Empty state */}
                {noteKeys.length === 0 && !isAddingNote && (
                  <p className="text-muted text-sm mb-3">No notes yet. Add one below.</p>
                )}
                
                {/* Add new note */}
                {isAddingNote ? (
                  <div className="form-group">
                    <label className="form-label">New Note Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="form-input flex-1"
                        value={newNoteKey}
                        onChange={(e) => setNewNoteKey(e.target.value)}
                        placeholder="e.g., Resources, Allies, Weaknesses..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNote();
                          if (e.key === 'Escape') {
                            setIsAddingNote(false);
                            setNewNoteKey('');
                          }
                        }}
                        autoFocus
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAddNote}
                        disabled={!newNoteKey.trim()}
                      >
                        Add
                      </button>
                      <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNoteKey('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsAddingNote(true)}
                  style={{ width: '100%' }}
                >
                  + Add Note
                </button>
              )}
              </Accordion>
            </div>
          </div>
          
          {/* Delete Button */}
          <div className="panel">
            <div className="panel-content">
              <button
                className="btn btn-danger"
                onClick={handleDeleteFaction}
                style={{ width: '100%' }}
              >
                Delete {selectedFaction.type === 'region' ? 'Region' : 'Faction'}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Faction List */
        <>
          <div className="panel">
            <div className="panel-content">
              <button
                className="btn btn-primary"
                onClick={() => setIsCreating(true)}
                style={{ width: '100%' }}
              >
                + New Faction / Region
              </button>
            </div>
          </div>

          {factions.length === 0 ? (
            <div className="panel">
              <div className="panel-content">
                <p className="text-sm text-muted text-center">
                  No factions or regions yet. Create one to get started.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Factions Section */}
              {factions.filter(f => f.type !== 'region').length > 0 && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">Factions ({factions.filter(f => f.type !== 'region').length})</span>
                  </div>
                  <div className="panel-content">
                    <div className="flex flex-col gap-1">
                      {factions.filter(f => f.type !== 'region').map(faction => (
                        <button
                          key={faction.id}
                          className="faction-list-item"
                          onClick={() => setSelectedFactionId(faction.id)}
                        >
                          <span
                            className="color-dot"
                            style={{ backgroundColor: faction.color }}
                          />
                          <span className="faction-name">{faction.name}</span>
                          <span className="faction-territory">
                            {faction.domainHexes.length} hex{faction.domainHexes.length !== 1 ? 'es' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Regions Section */}
              {factions.filter(f => f.type === 'region').length > 0 && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">Regions ({factions.filter(f => f.type === 'region').length})</span>
                  </div>
                  <div className="panel-content">
                    <div className="flex flex-col gap-1">
                      {factions.filter(f => f.type === 'region').map(region => (
                        <button
                          key={region.id}
                          className="faction-list-item"
                          onClick={() => setSelectedFactionId(region.id)}
                        >
                          <span
                            className="color-dot"
                            style={{ backgroundColor: region.color }}
                          />
                          <span className="faction-name">{region.name}</span>
                          <span className="faction-territory">
                            {region.domainHexes.length} hex{region.domainHexes.length !== 1 ? 'es' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FactionPanel;
