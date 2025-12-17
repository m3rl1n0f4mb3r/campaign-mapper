import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { 
  CampaignMap, 
  HexCoord, 
  Hex,
  Faction,
  CampaignSettings,
  GridConfig,
  MapMode,
} from '@/lib/types';
import { coordToKey } from '@/lib/types';
import {
  coordEquals,
  getNeighbors,
  getHexAt,
  hexToPixel,
} from '@/lib/hexUtils';
import { 
  createMap, 
  updateHexCampaignData, 
  updateHex,
  bulkUpdateTerrain,
  bulkAddTags,
  updateGridConfig,
} from '@/lib/mapFactory';
import { 
  saveMap, 
  loadMap, 
  listMaps, 
  exportMap, 
  importMap,
  deleteMap,
  loadAppSettings,
} from '@/lib/storage';

import HexMap from '@/components/HexMap';
import HexDetailPanel from '@/components/HexDetailPanel';
import MultiSelectPanel from '@/components/MultiSelectPanel';
import SettingsPanel from '@/components/SettingsPanel';
import FactionPanel from '@/components/FactionPanel';
import HexListPanel from '@/components/HexListPanel';
import Toolbar, { type StatsFilterType } from '@/components/Toolbar';
import NewMapDialog from '@/components/NewMapDialog';

type SidebarView = 'hex' | 'multi-select' | 'settings' | 'factions' | 'none';

function App() {
  // Core state
  const [currentMap, setCurrentMap] = useState<CampaignMap | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<HexCoord | null>(null);
  const [multiSelectedCoords, setMultiSelectedCoords] = useState<HexCoord[]>([]);
  const [sidebarView, setSidebarView] = useState<SidebarView>('none');
  const [showNewMapDialog, setShowNewMapDialog] = useState(false);
  const [showMapList, setShowMapList] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hexListFilter, setHexListFilter] = useState<StatsFilterType | null>(null);

  // Ref for map container (for scrolling to hexes)
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load last map on mount
  useEffect(() => {
    async function loadLastMap() {
      const settings = loadAppSettings();
      if (settings.recentMaps.length > 0) {
        const lastMap = await loadMap(settings.recentMaps[0].id);
        if (lastMap) {
          setCurrentMap(lastMap);
        }
      }
    }
    loadLastMap();
  }, []);
  
  // Auto-save on map changes
  useEffect(() => {
    if (currentMap) {
      const timer = setTimeout(() => {
        saveMap(currentMap).catch(err => {
          console.error('Auto-save failed:', err);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentMap]);
  
  // Get selected hex
  const selectedHex = useMemo(() => {
    if (!currentMap || !selectedCoord) return null;
    return getHexAt(currentMap.hexes, selectedCoord) || null;
  }, [currentMap, selectedCoord]);
  
  // Get neighbors of selected hex
  const neighborHexes = useMemo(() => {
    if (!currentMap || !selectedHex) return [];
    return getNeighbors(selectedHex.coord)
      .map(coord => getHexAt(currentMap.hexes, coord))
      .filter((h): h is Hex => h !== undefined);
  }, [currentMap, selectedHex]);
  
  // Neighbor coords for highlighting
  const highlightedNeighbors = useMemo(() => {
    return neighborHexes.map(h => h.coord);
  }, [neighborHexes]);
  
  // Handlers
  const handleHexClick = useCallback((coord: HexCoord, event: React.MouseEvent) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      // Multi-select
      setMultiSelectedCoords(prev => {
        // If first multi-select with a single selection, include it
        let current = prev;
        if (prev.length === 0 && selectedCoord) {
          current = [selectedCoord];
        }
        
        const exists = current.some(c => coordEquals(c, coord));
        if (exists) {
          return current.filter(c => !coordEquals(c, coord));
        }
        return [...current, coord];
      });
      setSelectedCoord(null);
      setSidebarView('multi-select');
    } else {
      // Single select
      setSelectedCoord(coord);
      setMultiSelectedCoords([]);
      setSidebarView('hex');
    }
  }, [selectedCoord]);
  
  const handleClearSelection = useCallback(() => {
    setSelectedCoord(null);
    setMultiSelectedCoords([]);
    setSidebarView('none');
  }, []);
  
  const handleBoxSelect = useCallback((coords: HexCoord[]) => {
    if (coords.length === 0) return;
    setSelectedCoord(null);
    setMultiSelectedCoords(coords);
    setSidebarView('multi-select');
  }, []);
  
  const handleHexUpdate = useCallback((updates: Partial<Hex['campaignData']>) => {
    if (!currentMap || !selectedCoord) return;
    setCurrentMap(updateHexCampaignData(currentMap, selectedCoord, updates));
  }, [currentMap, selectedCoord]);
  
  const handleTerrainChange = useCallback((terrainId: string) => {
    if (!currentMap || !selectedCoord) return;
    setCurrentMap(updateHex(currentMap, selectedCoord, { terrainId }));
  }, [currentMap, selectedCoord]);
  
  const handleNeighborClick = useCallback((coord: HexCoord) => {
    setSelectedCoord(coord);
    setMultiSelectedCoords([]);
    setSidebarView('hex');
  }, []);
  
  const handleCloseSidebar = useCallback(() => {
    setSelectedCoord(null);
    setMultiSelectedCoords([]);
    setSidebarView('none');
  }, []);
  
  // Bulk operations
  const handleBulkSetTerrain = useCallback((terrainId: string) => {
    if (!currentMap || multiSelectedCoords.length === 0) return;
    setCurrentMap(bulkUpdateTerrain(currentMap, multiSelectedCoords, terrainId));
  }, [currentMap, multiSelectedCoords]);
  
  const handleBulkAddTags = useCallback((tags: string[]) => {
    if (!currentMap || multiSelectedCoords.length === 0) return;
    setCurrentMap(bulkAddTags(currentMap, multiSelectedCoords, tags));
  }, [currentMap, multiSelectedCoords]);
  
  const handleBulkSetExplored = useCallback((explored: boolean) => {
    if (!currentMap || multiSelectedCoords.length === 0) return;
    
    const coordSet = new Set(multiSelectedCoords.map(c => coordToKey(c)));
    const newHexes = currentMap.hexes.map(hex => {
      if (coordSet.has(coordToKey(hex.coord))) {
        return {
          ...hex,
          campaignData: {
            ...hex.campaignData,
            explored,
            lastVisited: explored ? new Date().toISOString() : undefined,
            modifiedAt: new Date().toISOString(),
          },
        };
      }
      return hex;
    });
    
    setCurrentMap({
      ...currentMap,
      hexes: newHexes,
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap, multiSelectedCoords]);

  const handleBulkAddToFaction = useCallback((factionId: string) => {
    if (!currentMap || multiSelectedCoords.length === 0) return;

    const faction = currentMap.factions.find(f => f.id === factionId);
    if (!faction) return;

    // Get existing domain hex keys
    const existingKeys = new Set(faction.domainHexes.map(h => coordToKey(h)));

    // Add new coords that aren't already in the domain
    const newDomainHexes = [...faction.domainHexes];
    for (const coord of multiSelectedCoords) {
      const key = coordToKey(coord);
      if (!existingKeys.has(key)) {
        newDomainHexes.push(coord);
        existingKeys.add(key);
      }
    }

    const updatedFaction = { ...faction, domainHexes: newDomainHexes };
    const newFactions = currentMap.factions.map(f =>
      f.id === factionId ? updatedFaction : f
    );

    setCurrentMap({
      ...currentMap,
      factions: newFactions,
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap, multiSelectedCoords]);

  // Settings
  const handleSettingsChange = useCallback((updates: Partial<CampaignSettings>) => {
    if (!currentMap) return;
    setCurrentMap({
      ...currentMap,
      settings: { ...currentMap.settings, ...updates },
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap]);
  
  const handleGridConfigChange = useCallback((updates: Partial<GridConfig>) => {
    if (!currentMap) return;
    setCurrentMap(updateGridConfig(currentMap, updates));
  }, [currentMap]);
  
  // Map operations
  const handleNewMap = useCallback(() => {
    setShowNewMapDialog(true);
  }, []);
  
  const handleCreateMap = useCallback(async (options: {
    name: string;
    mode: MapMode;
    gridConfig: Partial<GridConfig>;
    imageData?: { src: string; width: number; height: number; fileName: string };
    defaultTerrain?: string;
    generation?: {
      generateTerrain: boolean;
      generateFeatures: boolean;
      featureChance: number;
      includeLandmarks: boolean;
      includeSettlements: boolean;
      includeLairs: boolean;
      includeDungeons: boolean;
      generateFactions: boolean;
      startingBiome?: string;
    };
  }) => {
    let newMap = createMap({
      name: options.name,
      mode: options.mode,
      gridConfig: options.gridConfig,
      imageOverlay: options.imageData ? {
        src: options.imageData.src,
        width: options.imageData.width,
        height: options.imageData.height,
        fileName: options.imageData.fileName,
        opacity: 1,
        visible: true,
      } : undefined,
      defaultTerrain: options.defaultTerrain,
    });
    
    // Apply generation if requested
    if (options.generation?.generateTerrain) {
      const { generateFullMap, applyGenerationResults } = await import('@/lib/generator/mapGenerator');
      const { createFactionFromSettlement, generateFactionRelationships } = await import('@/lib/generator/politicalGenerator');
      
      // Find center of the map
      const centerCol = Math.floor(newMap.gridConfig.cols / 2) + newMap.gridConfig.startCol;
      const centerRow = Math.floor(newMap.gridConfig.rows / 2) + newMap.gridConfig.startRow;
      const { offsetToAxial } = await import('@/lib/hexUtils');
      const centerCoord = offsetToAxial(centerCol, centerRow, newMap.gridConfig);
      
      const allCoords = newMap.hexes.map(h => h.coord);
      
      const results = generateFullMap(allCoords, centerCoord, {
        generateTerrain: true,
        generateFeatures: options.generation.generateFeatures,
        featureChance: options.generation.featureChance,
        includeLandmarks: options.generation.includeLandmarks,
        includeSettlements: options.generation.includeSettlements,
        includeLairs: options.generation.includeLairs,
        includeDungeons: options.generation.includeDungeons,
        startingBiome: options.generation.startingBiome as import('@/lib/generator/types').BiomeType | undefined,
      });
      
      newMap = {
        ...newMap,
        hexes: applyGenerationResults(newMap.hexes, results),
      };
      
      // Generate factions for eligible settlements if enabled
      if (options.generation.generateFactions && options.generation.generateFeatures) {
        const factions: Faction[] = [];
        
        for (const hex of newMap.hexes) {
          if (hex.featureType === 'settlement' && hex.feature) {
            const details = hex.feature.details as { type?: string; name?: string };
            const settlementType = details.type || 'village';
            
            // Only cities, castles, towers, and abbeys form factions
            if (['city', 'castle', 'tower', 'abbey'].includes(settlementType)) {
              const name = details.name || hex.campaignData?.name || 'Unnamed';
              const faction = createFactionFromSettlement(
                name, 
                settlementType as import('@/lib/generator/types').SettlementType, 
                hex.coord
              );
              if (faction) {
                // Generate relationships with existing factions
                generateFactionRelationships(faction, factions);
                factions.push(faction);
              }
            }
          }
        }
        
        newMap = {
          ...newMap,
          factions,
        };
      }
    }
    
    try {
      await saveMap(newMap);
      setCurrentMap(newMap);
      setShowNewMapDialog(false);
      setSelectedCoord(null);
      setMultiSelectedCoords([]);
      setSidebarView('none');
    } catch (err) {
      alert('Failed to save map: ' + (err as Error).message);
    }
  }, []);
  
  const handleOpenMap = useCallback(() => {
    setShowMapList(true);
  }, []);
  
  const handleExportMap = useCallback(async () => {
    if (currentMap) {
      try {
        await exportMap(currentMap);
      } catch (err) {
        alert('Failed to export map: ' + (err as Error).message);
      }
    }
  }, [currentMap]);
  
  const handleImportMap = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.campmap';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const map = await importMap(file);
        await saveMap(map);
        setCurrentMap(map);
        setSelectedCoord(null);
        setMultiSelectedCoords([]);
        setSidebarView('none');
      } catch (err) {
        alert('Failed to import map: ' + (err as Error).message);
      }
    };
    input.click();
  }, []);
  
  const handleOpenSettings = useCallback(() => {
    setSidebarView('settings');
    setSelectedCoord(null);
    setMultiSelectedCoords([]);
  }, []);
  
  const handleMapNameChange = useCallback((name: string) => {
    if (!currentMap) return;
    setCurrentMap({
      ...currentMap,
      name,
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap]);
  
  const handleStatsClick = useCallback((filter: StatsFilterType) => {
    if (filter === 'factions') {
      // Open factions panel in sidebar
      setSidebarView('factions');
      setSelectedCoord(null);
      setMultiSelectedCoords([]);
      setHexListFilter(null);
    } else {
      // Show hex list panel
      setHexListFilter(filter);
    }
  }, []);
  
  // Scroll the map to center on a specific hex
  const scrollToHex = useCallback((coord: HexCoord) => {
    if (!mapContainerRef.current || !currentMap) return;

    const container = mapContainerRef.current;
    const { x, y } = hexToPixel(coord, currentMap.gridConfig);

    // Account for zoom level
    const scaledX = x * zoom;
    const scaledY = y * zoom;

    // Center the hex in the viewport
    const scrollX = scaledX - container.clientWidth / 2;
    const scrollY = scaledY - container.clientHeight / 2;

    container.scrollTo({
      left: scrollX,
      top: scrollY,
      behavior: 'smooth',
    });
  }, [currentMap, zoom]);

  const handleHexListClick = useCallback((coord: HexCoord) => {
    // Close hex list, select the clicked hex, and scroll to it
    setHexListFilter(null);
    setSelectedCoord(coord);
    setMultiSelectedCoords([]);
    setSidebarView('hex');
    scrollToHex(coord);
  }, [scrollToHex]);



  
  // Full hex update handler (for generator and other direct hex modifications)
  const handleFullHexUpdate = useCallback((coord: HexCoord, changes: Partial<Hex>) => {
    if (!currentMap) return;
    
    const targetKey = coordToKey(coord);
    
    const newHexes = currentMap.hexes.map(hex => {
      if (coordToKey(hex.coord) === targetKey) {
        return {
          ...hex,
          ...changes,
          campaignData: changes.campaignData 
            ? { ...hex.campaignData, ...changes.campaignData }
            : hex.campaignData,
        };
      }
      return hex;
    });
    
    setCurrentMap({
      ...currentMap,
      hexes: newHexes,
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap]);
  
  // Bulk hex update handler (for regional generation)
  const handleBulkHexUpdate = useCallback((updates: Array<{ coord: HexCoord; changes: Partial<Hex> }>) => {
    console.log('[App] handleBulkHexUpdate called with', updates.length, 'updates');
    
    if (!currentMap || updates.length === 0) return;
    
    // Create a map of coord key -> changes for quick lookup
    const updateMap = new Map<string, Partial<Hex>>();
    for (const update of updates) {
      updateMap.set(coordToKey(update.coord), update.changes);
    }
    
    const newHexes = currentMap.hexes.map(hex => {
      const changes = updateMap.get(coordToKey(hex.coord));
      if (changes) {
        return {
          ...hex,
          ...changes,
          campaignData: changes.campaignData 
            ? { ...hex.campaignData, ...changes.campaignData }
            : hex.campaignData,
        };
      }
      return hex;
    });
    
    console.log('[App] handleBulkHexUpdate: updating', newHexes.filter((h, i) => h !== currentMap.hexes[i]).length, 'hexes');
    
    setCurrentMap({
      ...currentMap,
      hexes: newHexes,
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap]);
  
  const handleAddFaction = useCallback((faction: Faction) => {
    if (!currentMap) return;
    
    setCurrentMap({
      ...currentMap,
      factions: [...currentMap.factions, faction],
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap]);
  
  // Bulk update hexes and add factions in a single state update to avoid race conditions
  const handleBulkHexUpdateWithFactions = useCallback((
    hexUpdates: Array<{ coord: HexCoord; changes: Partial<Hex> }>,
    newFactions: Faction[]
  ) => {
    if (!currentMap) return;
    
    console.log('[App] handleBulkHexUpdateWithFactions: updating', hexUpdates.length, 'hexes and adding', newFactions.length, 'factions');
    
    // Apply hex updates
    const updateMap = new Map<string, Partial<Hex>>();
    for (const update of hexUpdates) {
      updateMap.set(coordToKey(update.coord), update.changes);
    }
    
    const newHexes = currentMap.hexes.map(hex => {
      const changes = updateMap.get(coordToKey(hex.coord));
      if (changes) {
        return {
          ...hex,
          ...changes,
          campaignData: changes.campaignData 
            ? { ...hex.campaignData, ...changes.campaignData }
            : hex.campaignData,
        };
      }
      return hex;
    });
    
    // Update map with both new hexes and new factions
    setCurrentMap({
      ...currentMap,
      hexes: newHexes,
      factions: [...currentMap.factions, ...newFactions],
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap]);
  
  const handleUpdateFaction = useCallback((faction: Faction) => {
    if (!currentMap) return;
    
    setCurrentMap({
      ...currentMap,
      factions: currentMap.factions.map(f => f.id === faction.id ? faction : f),
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap]);
  
  const handleDeleteFaction = useCallback((factionId: string) => {
    if (!currentMap) return;
    
    setCurrentMap({
      ...currentMap,
      factions: currentMap.factions.filter(f => f.id !== factionId),
      updatedAt: new Date().toISOString(),
    });
  }, [currentMap]);
  
  const sidebarOpen = currentMap && sidebarView !== 'none';

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Main Content */}
      <div className="main-content">
        <Toolbar
          map={currentMap}
          onNewMap={handleNewMap}
          onOpenMap={handleOpenMap}
          onExportMap={handleExportMap}
          onImportMap={handleImportMap}
          onOpenSettings={handleOpenSettings}
          onMapNameChange={handleMapNameChange}
          onStatsClick={handleStatsClick}
          selectedCount={multiSelectedCoords.length}
          onClearSelection={handleClearSelection}
          zoom={zoom}
          onZoomChange={setZoom}
        />
        
        <div className="map-container" ref={mapContainerRef}>
          {currentMap ? (
            <>
              <HexMap
                hexes={currentMap.hexes}
                gridConfig={currentMap.gridConfig}
                settings={currentMap.settings}
                imageOverlay={currentMap.imageOverlay}
                selectedCoord={selectedCoord}
                multiSelectedCoords={multiSelectedCoords}
                highlightedNeighbors={highlightedNeighbors}
                factions={currentMap.factions}
                zoom={zoom}
                onHexClick={handleHexClick}
                onBoxSelect={handleBoxSelect}
                onZoomChange={setZoom}
              />
              
              {/* Hex List Panel (floating) */}
              {hexListFilter && (
                <HexListPanel
                  map={currentMap}
                  filter={hexListFilter}
                  customTerrainTypes={currentMap.settings.customTerrainTypes}
                  onHexClick={handleHexListClick}
                  onClose={() => setHexListFilter(null)}
                />
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🗺</div>
              <h2 className="empty-state-title">Welcome to Campaign Mapper</h2>
              <p className="empty-state-description">
                Create hex maps for your TTRPG campaigns. Overlay images with hex grids, 
                track terrain, factions, and campaign notes.
              </p>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={handleNewMap}>
                  + New Map
                </button>
                <button className="btn btn-secondary" onClick={handleImportMap}>
                  Import Map
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar */}
      {currentMap && sidebarView !== 'none' && (
        <div className="sidebar">
          <div className="sidebar-content">
            {sidebarView === 'hex' && selectedHex && (
              <HexDetailPanel
                hex={selectedHex}
                neighbors={neighborHexes}
                gridConfig={currentMap.gridConfig}
                map={currentMap}
                factions={currentMap.factions}
                customTerrainTypes={currentMap.settings.customTerrainTypes}
                onUpdate={handleHexUpdate}
                onTerrainChange={handleTerrainChange}
                onNeighborClick={handleNeighborClick}
                onHexUpdate={handleFullHexUpdate}
                onBulkHexUpdate={handleBulkHexUpdate}
                onBulkHexUpdateWithFactions={handleBulkHexUpdateWithFactions}
                onAddFaction={handleAddFaction}
                onUpdateFaction={handleUpdateFaction}
                onClose={handleCloseSidebar}
              />
            )}
            
            {sidebarView === 'multi-select' && multiSelectedCoords.length > 0 && (
              <MultiSelectPanel
                selectedCoords={multiSelectedCoords}
                gridConfig={currentMap.gridConfig}
                map={currentMap}
                customTerrainTypes={currentMap.settings.customTerrainTypes}
                factions={currentMap.factions}
                onBulkSetTerrain={handleBulkSetTerrain}
                onBulkAddTags={handleBulkAddTags}
                onBulkSetExplored={handleBulkSetExplored}
                onBulkAddToFaction={handleBulkAddToFaction}
                onClearSelection={handleClearSelection}
              />
            )}
            
            {sidebarView === 'settings' && (
              <SettingsPanel
                settings={currentMap.settings}
                gridConfig={currentMap.gridConfig}
                onSettingsChange={handleSettingsChange}
                onGridConfigChange={handleGridConfigChange}
                onClose={handleCloseSidebar}
              />
            )}
            
            {sidebarView === 'factions' && (
              <FactionPanel
                factions={currentMap.factions}
                hexes={currentMap.hexes}
                gridConfig={currentMap.gridConfig}
                customTerrainTypes={currentMap.settings.customTerrainTypes || []}
                onAddFaction={handleAddFaction}
                onUpdateFaction={handleUpdateFaction}
                onDeleteFaction={handleDeleteFaction}
                onHexClick={(coord) => {
                  setSelectedCoord(coord);
                  setMultiSelectedCoords([]);
                  setSidebarView('hex');
                }}
                onClose={handleCloseSidebar}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Dialogs */}
      <NewMapDialog
        isOpen={showNewMapDialog}
        onClose={() => setShowNewMapDialog(false)}
        onCreate={handleCreateMap}
      />
      
      {/* Map List Modal */}
      {showMapList && (
        <div className="modal-overlay" onClick={() => setShowMapList(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Open Map</h2>
              <button className="modal-close" onClick={() => setShowMapList(false)}>×</button>
            </div>
            <div className="modal-content">
              {listMaps().length === 0 ? (
                <p className="text-muted text-center">No saved maps found</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {listMaps().map(ref => (
                    <div
                      key={ref.id}
                      className="flex items-center gap-2"
                    >
                      <button
                        className="btn btn-secondary flex-1"
                        style={{ justifyContent: 'flex-start' }}
                        onClick={async () => {
                          const map = await loadMap(ref.id);
                          if (map) {
                            setCurrentMap(map);
                            setSelectedCoord(null);
                            setMultiSelectedCoords([]);
                            setSidebarView('none');
                          }
                          setShowMapList(false);
                        }}
                      >
                        <span style={{ flex: 1, textAlign: 'left' }}>{ref.name}</span>
                        <span className="text-muted text-sm">
                          {ref.hexCount} hexes • {new Date(ref.updatedAt).toLocaleDateString()}
                        </span>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        title="Delete map"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${ref.name}"? This cannot be undone.`)) {
                            await deleteMap(ref.id);
                            // If we deleted the current map, clear it
                            if (currentMap?.id === ref.id) {
                              setCurrentMap(null);
                              setSelectedCoord(null);
                              setMultiSelectedCoords([]);
                              setSidebarView('none');
                            }
                            // Force re-render by closing and reopening
                            setShowMapList(false);
                            setTimeout(() => setShowMapList(true), 0);
                          }
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
