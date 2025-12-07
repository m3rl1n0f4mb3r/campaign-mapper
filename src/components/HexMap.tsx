import React, { useMemo, useCallback, useState, useRef } from 'react';
import type { Hex, HexCoord, GridConfig, TerrainType, Faction, ImageOverlay, CampaignSettings } from '@/lib/types';
import { coordToKey, hexHasUserData, getEffectiveTerrain, DEFAULT_TERRAIN_TYPES } from '@/lib/types';
import { 
  hexToPixel, 
  getHexPoints, 
  getHexDimensions,
  calculateViewBox,
  coordEquals,
  getNeighbors,
  axialToOffset,
} from '@/lib/hexUtils';

interface HexMapProps {
  hexes: Hex[];
  gridConfig: GridConfig;
  settings: CampaignSettings;
  imageOverlay?: ImageOverlay;
  selectedCoord: HexCoord | null;
  multiSelectedCoords: HexCoord[];
  highlightedNeighbors?: HexCoord[];
  factions: Faction[];
  zoom: number;
  onHexClick: (coord: HexCoord, event: React.MouseEvent) => void;
  onHexHover?: (coord: HexCoord | null) => void;
  onBoxSelect?: (coords: HexCoord[]) => void;
  onZoomChange?: (zoom: number) => void;
}

// Generate a consistent color for a faction
function getFactionColor(factionId: string, factions: Faction[]): string {
  const faction = factions.find(f => f.id === factionId);
  if (faction?.color) return faction.color;
  
  const colors = [
    '#e94560', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa',
    '#f472b6', '#34d399', '#38bdf8', '#fb923c', '#c084fc',
  ];
  
  let hash = 0;
  for (let i = 0; i < factionId.length; i++) {
    hash = ((hash << 5) - hash) + factionId.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get terrain type info
function getTerrainInfo(terrainId: string, customTerrains: TerrainType[]): TerrainType {
  const allTerrains = [...DEFAULT_TERRAIN_TYPES, ...customTerrains];
  return allTerrains.find(t => t.id === terrainId) || {
    id: terrainId,
    name: terrainId,
    color: '#808080',
  };
}

// Feature type colors
const FEATURE_COLORS: Record<string, string> = {
  landmark: '#60a5fa',
  settlement: '#fbbf24',
  lair: '#f87171',
  dungeon: '#a78bfa',
};

// Feature symbols
const FEATURE_SYMBOLS: Record<string, string> = {
  landmark: '◎',
  settlement: '⌂',
  lair: '☠',
  dungeon: '⚓',
};

interface HexCellProps {
  hex: Hex;
  gridConfig: GridConfig;
  terrain: TerrainType;
  isSelected: boolean;
  isMultiSelected: boolean;
  isNeighbor: boolean;
  showTerrainColors: boolean;
  showDataIndicator: boolean;
  showCoordinates: boolean;
  factionColor?: string;
  isExplored: boolean;
  showExploredStatus: boolean;
  fillOpacity: number;
  onClick: (event: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const HexCell: React.FC<HexCellProps> = React.memo(({
  hex,
  gridConfig,
  terrain,
  isSelected,
  isMultiSelected,
  isNeighbor,
  showTerrainColors,
  showDataIndicator,
  showCoordinates,
  factionColor,
  isExplored,
  showExploredStatus,
  fillOpacity,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { x, y } = hexToPixel(hex.coord, gridConfig);
  const { height: hexHeight } = getHexDimensions(gridConfig);
  const hasData = hexHasUserData(hex);
  
  // Determine fill color and opacity
  let fillColor = showTerrainColors ? terrain.color : 'transparent';
  let opacity = showTerrainColors ? fillOpacity : 0;
  
  // Apply fog of war
  if (showExploredStatus && !isExplored) {
    fillColor = '#1a1a2e';
    opacity = 1;
  }
  
  // Build class names
  const classNames = [
    'hex',
    isSelected && 'selected',
    isMultiSelected && 'multi-selected',
    isNeighbor && 'neighbor',
    showDataIndicator && hasData && 'has-data',
    showExploredStatus && !isExplored && 'fog-hidden',
  ].filter(Boolean).join(' ');
  
  // Feature indicator position (top of hex for pointy-top, right for flat-top)
  const featureOffset = gridConfig.orientation === 'pointy-top'
    ? { cx: 0, cy: -hexHeight * 0.32 }
    : { cx: gridConfig.hexSize * 0.7, cy: -gridConfig.hexSize * 0.4 };
  
  // Coordinate position (bottom for pointy-top)
  const coordOffset = gridConfig.orientation === 'pointy-top'
    ? { x: 0, y: hexHeight * 0.35 }
    : { x: 0, y: gridConfig.hexSize * 0.8 };
  
  // Get display coordinate
  const { col, row } = axialToOffset(hex.coord, gridConfig);
  const displayCoord = `${String(col).padStart(2, '0')}${String(row).padStart(2, '0')}`;
  
  return (
    <g
      className={classNames}
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main hex polygon */}
      <polygon
        className="hex-polygon hex-terrain-fill"
        points={getHexPoints(0, 0, gridConfig)}
        fill={fillColor}
        fillOpacity={opacity}
        style={factionColor && !isSelected && !isMultiSelected ? {
          stroke: factionColor,
          strokeWidth: 3,
        } : undefined}
      />
      
      {/* Terrain symbol */}
      {showTerrainColors && terrain.symbol && (!showExploredStatus || isExplored) && (
        <text className="hex-symbol" x={0} y={0}>
          {terrain.symbol}
        </text>
      )}
      
      {/* Feature indicator */}
      {hex.featureType && (!showExploredStatus || isExplored) && (
        <g className="hex-feature-indicator">
          <circle
            cx={featureOffset.cx}
            cy={featureOffset.cy}
            r={8}
            fill={FEATURE_COLORS[hex.featureType] || '#888'}
          />
          <text
            x={featureOffset.cx}
            y={featureOffset.cy}
            fill="#000"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {FEATURE_SYMBOLS[hex.featureType] || '?'}
          </text>
        </g>
      )}
      
      {/* Explored indicator */}
      {hex.campaignData?.explored && !showExploredStatus && (
        <circle
          className="hex-explored-dot"
          cx={gridConfig.hexSize * 0.5}
          cy={gridConfig.orientation === 'pointy-top' ? hexHeight * 0.2 : gridConfig.hexSize * 0.5}
          r={4}
        />
      )}
      
      {/* Coordinate label */}
      {showCoordinates && (!showExploredStatus || isExplored) && (
        <text
          className="hex-coord"
          x={coordOffset.x}
          y={coordOffset.y}
        >
          {displayCoord}
        </text>
      )}
    </g>
  );
});

HexCell.displayName = 'HexCell';

// Selection box component
interface SelectionBoxProps {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const SelectionBox: React.FC<SelectionBoxProps> = ({ startX, startY, currentX, currentY }) => {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(66, 135, 245, 0.2)"
      stroke="rgba(66, 135, 245, 0.8)"
      strokeWidth={2}
      strokeDasharray="5,5"
      pointerEvents="none"
    />
  );
};

const HexMap: React.FC<HexMapProps> = ({
  hexes,
  gridConfig,
  settings,
  imageOverlay,
  selectedCoord,
  multiSelectedCoords,
  highlightedNeighbors = [],
  factions,
  zoom,
  onHexClick,
  onHexHover,
  onBoxSelect,
  onZoomChange,
}) => {
  // Box selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false); // Track if we just completed a drag
  
  // Native wheel event listener for zoom (needs passive: false to preventDefault)
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !onZoomChange) return;
    
    const handleWheel = (event: WheelEvent) => {
      // Only zoom if Ctrl/Cmd key is held
      if (!event.ctrlKey && !event.metaKey) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.25, Math.min(3, zoom + delta));
      onZoomChange(newZoom);
    };
    
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [zoom, onZoomChange]);
  
  // Create sets for quick lookups
  const multiSelectedSet = useMemo(() => {
    return new Set(multiSelectedCoords.map(c => coordToKey(c)));
  }, [multiSelectedCoords]);
  
  const neighborSet = useMemo(() => {
    return new Set(highlightedNeighbors.map(c => coordToKey(c)));
  }, [highlightedNeighbors]);
  
  // Create faction color map for hexes
  const hexFactionColors = useMemo(() => {
    if (!settings?.showFactionTerritories) return new Map<string, string>();
    
    const map = new Map<string, string>();
    for (const faction of (factions || [])) {
      const color = getFactionColor(faction.id, factions || []);
      for (const coord of (faction.domainHexes || [])) {
        const key = coordToKey(coord);
        if (!map.has(key)) {
          map.set(key, color);
        }
      }
    }
    return map;
  }, [factions, settings?.showFactionTerritories]);
  
  // Calculate explored hexes and their neighbors
  const exploredInfo = useMemo(() => {
    if (!settings?.showExploredStatus) {
      return { explored: new Set<string>(), visible: new Set<string>() };
    }
    
    const explored = new Set<string>();
    const visible = new Set<string>();
    
    for (const hex of hexes) {
      const key = coordToKey(hex.coord);
      if (hex.campaignData?.explored) {
        explored.add(key);
        visible.add(key);
        
        // Add neighbors as visible (partial)
        for (const neighbor of getNeighbors(hex.coord)) {
          visible.add(coordToKey(neighbor));
        }
      }
    }
    
    return { explored, visible };
  }, [hexes, settings?.showExploredStatus]);
  
  // Calculate viewBox
  const viewBox = useMemo(() => {
    // For image overlay mode, use image dimensions so coordinates match pixels
    if (imageOverlay?.visible && imageOverlay.width && imageOverlay.height) {
      return `0 0 ${imageOverlay.width} ${imageOverlay.height}`;
    }
    // For non-overlay mode, fit to hex bounds
    const box = calculateViewBox(hexes, gridConfig, gridConfig.hexSize);
    return `${box.minX} ${box.minY} ${box.width} ${box.height}`;
  }, [hexes, gridConfig, imageOverlay]);
  
  // Convert screen coordinates to SVG coordinates
  const screenToSvg = useCallback((screenX: number, screenY: number): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = screenX;
    pt.y = screenY;
    
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);
  
  // Handler callbacks
  const handleHexClick = useCallback((hex: Hex, event: React.MouseEvent) => {
    // Don't trigger click if we just finished a drag
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onHexClick(hex.coord, event);
  }, [onHexClick]);
  
  const handleMouseEnter = useCallback((hex: Hex) => {
    onHexHover?.(hex.coord);
  }, [onHexHover]);
  
  const handleMouseLeave = useCallback(() => {
    onHexHover?.(null);
  }, [onHexHover]);
  
  // Box selection handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // Only start drag on left click without modifiers (shift/ctrl used for multi-select clicking)
    if (event.button !== 0) return;
    if (event.shiftKey || event.ctrlKey || event.metaKey) return;
    
    const svgCoords = screenToSvg(event.clientX, event.clientY);
    if (!svgCoords) return;
    
    setDragStart(svgCoords);
    setDragCurrent(svgCoords);
    setIsDragging(false); // Not dragging yet - will become true if mouse moves enough
  }, [screenToSvg]);
  
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragStart) return;
    
    const svgCoords = screenToSvg(event.clientX, event.clientY);
    if (!svgCoords) return;
    
    // Check if we've moved enough to start a drag (threshold of 10px)
    const dx = Math.abs(svgCoords.x - dragStart.x);
    const dy = Math.abs(svgCoords.y - dragStart.y);
    
    if (!isDragging && (dx > 10 || dy > 10)) {
      setIsDragging(true);
    }
    
    if (isDragging || dx > 10 || dy > 10) {
      setDragCurrent(svgCoords);
    }
  }, [isDragging, dragStart, screenToSvg]);
  
  const handleMouseUp = useCallback(() => {
    // If we were dragging (moved enough), do box selection
    if (isDragging && dragStart && dragCurrent && onBoxSelect) {
      didDragRef.current = true; // Prevent the click event from firing
      
      // Calculate selection box bounds
      const minX = Math.min(dragStart.x, dragCurrent.x);
      const maxX = Math.max(dragStart.x, dragCurrent.x);
      const minY = Math.min(dragStart.y, dragCurrent.y);
      const maxY = Math.max(dragStart.y, dragCurrent.y);
      
      // Find all hexes within the selection box
      const selectedHexes: HexCoord[] = [];
      
      for (const hex of hexes) {
        const { x, y } = hexToPixel(hex.coord, gridConfig);
        
        // Check if hex center is within selection box
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          selectedHexes.push(hex.coord);
        }
      }
      
      if (selectedHexes.length > 0) {
        onBoxSelect(selectedHexes);
      }
    }
    // If not dragging, the hex click handler will handle the click
    
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  }, [isDragging, dragStart, dragCurrent, hexes, gridConfig, onBoxSelect]);
  

  
  // Calculate container size for image overlay
  const containerStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
    };
    
    if (imageOverlay?.visible) {
      return {
        ...baseStyle,
        width: imageOverlay.width,
        height: imageOverlay.height,
      };
    }
    return baseStyle;
  }, [imageOverlay, zoom]);
  
  return (
    <div 
      ref={viewportRef}
      className="map-viewport" 
      style={containerStyle}
    >
      {/* Background image (overlay mode) */}
      {imageOverlay?.visible && (
        <img
          className="map-image"
          src={imageOverlay.src}
          alt="Map background"
          style={{ opacity: imageOverlay.opacity }}
          draggable={false}
        />
      )}
      
      {/* Hex overlay */}
      <svg
        ref={svgRef}
        className="hex-overlay"
        viewBox={viewBox}
        style={{
          width: containerStyle?.width || '100%',
          height: containerStyle?.height || '100%',
          position: imageOverlay?.visible ? 'absolute' : 'relative',
          cursor: isDragging ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g style={{ pointerEvents: 'all' }}>
          {hexes.map(hex => {
            const key = coordToKey(hex.coord);
            const effectiveTerrain = getEffectiveTerrain(hex);
            const terrain = getTerrainInfo(effectiveTerrain, settings?.customTerrainTypes || []);
            const isSelected = selectedCoord && coordEquals(hex.coord, selectedCoord);
            const isMultiSelected = multiSelectedSet.has(key);
            const isNeighbor = neighborSet.has(key);
            const factionColor = hexFactionColors.get(key);
            const isExplored = settings?.showExploredStatus 
              ? exploredInfo.explored.has(key) || exploredInfo.visible.has(key)
              : true;
            
            return (
              <HexCell
                key={key}
                hex={hex}
                gridConfig={gridConfig}
                terrain={terrain}
                isSelected={!!isSelected}
                isMultiSelected={isMultiSelected}
                isNeighbor={isNeighbor}
                showTerrainColors={settings?.showTerrainColors ?? true}
                showDataIndicator={settings?.showDataIndicators ?? true}
                showCoordinates={settings?.showCoordinates ?? true}
                factionColor={factionColor}
                isExplored={isExplored}
                showExploredStatus={settings?.showExploredStatus ?? false}
                fillOpacity={settings?.hexFillOpacity ?? 0.5}
                onClick={(e) => handleHexClick(hex, e)}
                onMouseEnter={() => handleMouseEnter(hex)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </g>
        
        {/* Selection box */}
        {isDragging && dragStart && dragCurrent && (
          <SelectionBox
            startX={dragStart.x}
            startY={dragStart.y}
            currentX={dragCurrent.x}
            currentY={dragCurrent.y}
          />
        )}
      </svg>
    </div>
  );
};

export default HexMap;
