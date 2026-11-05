import React, { useMemo, useCallback, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Hex, HexCoord, GridConfig, TerrainType, Faction, ImageOverlay, CampaignSettings, Marker } from '@/lib/types';
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
import { BASE_DECORATION_SIZES as SIZES, getHexScale } from '@/lib/hexDecorations';
import { FACTION_COLORS, getContrastText } from '@/lib/palette';
import { getMarkerIcon } from '@/lib/markerIcons';

interface HexMapProps {
  hexes: Hex[];
  gridConfig: GridConfig;
  settings: CampaignSettings;
  imageOverlay?: ImageOverlay;
  selectedCoord: HexCoord | null;
  multiSelectedCoords: HexCoord[];
  highlightedNeighbors?: HexCoord[];
  factions: Faction[];
  markers: Marker[];
  zoom: number;
  onHexClick: (coord: HexCoord, event: React.MouseEvent) => void;
  onHexHover?: (coord: HexCoord | null) => void;
  onBoxSelect?: (coords: HexCoord[]) => void;
  onZoomChange?: (zoom: number) => void;
}

// Handle for accessing HexMap internals (used for image export)
export interface HexMapHandle {
  getSvgElement: () => SVGSVGElement | null;
  getBackgroundImage: () => string | undefined;
}

// Generate a consistent color for a faction
function getFactionColor(factionId: string, factions: Faction[]): string {
  const faction = factions.find(f => f.id === factionId);
  if (faction?.color) return faction.color;
  
  const colors = FACTION_COLORS;
  
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
  showGrid: boolean;
  factionColor?: string;
  isExplored: boolean;
  showExploredStatus: boolean;
  fillOpacity: number;
  gridOpacity: number;
  /** Decoration size multiplier from getHexScale() */
  scale: number;
  onClick: (event: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Bottom layer of a hex: fill, border and highlight. Handles clicks and hover.
 * Labels and badges are drawn separately (HexDecorations) above the trails.
 */
const HexCell: React.FC<HexCellProps> = React.memo(({
  hex,
  gridConfig,
  terrain,
  isSelected,
  isMultiSelected,
  isNeighbor,
  showTerrainColors,
  showDataIndicator,
  showGrid,
  factionColor,
  isExplored,
  showExploredStatus,
  fillOpacity,
  gridOpacity,
  scale,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { x, y } = hexToPixel(hex.coord, gridConfig);
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
        data-terrain-color={terrain.color}
        data-grid-opacity={gridOpacity}
        style={factionColor && !isSelected && !isMultiSelected ? {
          stroke: factionColor,
          strokeWidth: SIZES.factionBorder * scale,
        } : showGrid ? {
          strokeOpacity: gridOpacity,
        } : {
          stroke: 'none',
        }}
      />
    </g>
  );
});

HexCell.displayName = 'HexCell';

interface HexDecorationsProps {
  hex: Hex;
  gridConfig: GridConfig;
  terrain: TerrainType;
  showTerrainColors: boolean;
  showCoordinates: boolean;
  showLinkIndicators: boolean;
  hasLinks: boolean;
  isExplored: boolean;
  showExploredStatus: boolean;
  showExploredIndicator: boolean;
  scale: number;
  /** A marker is on this hex (marked on the group for image export) */
  hasMarker: boolean;
  /** Markers are drawn, so the terrain symbol under the badge is hidden */
  showMarkers: boolean;
}

/**
 * Top layer of a hex: terrain symbol, feature and link badges, explored dot
 * and coordinate label. Drawn above trails so lines never cover them.
 * Always rendered (even when empty) so image export can add labels to it.
 */
const HexDecorations: React.FC<HexDecorationsProps> = React.memo(({
  hex,
  gridConfig,
  terrain,
  showTerrainColors,
  showCoordinates,
  showLinkIndicators,
  hasLinks,
  isExplored,
  showExploredStatus,
  showExploredIndicator,
  scale,
  hasMarker,
  showMarkers,
}) => {
  const { x, y } = hexToPixel(hex.coord, gridConfig);
  const { height: hexHeight } = getHexDimensions(gridConfig);
  const visible = !showExploredStatus || isExplored;

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
      className="hex-decorations"
      transform={`translate(${x}, ${y})`}
      data-coord={displayCoord}
      data-coord-x={coordOffset.x}
      data-coord-y={coordOffset.y}
      data-terrain-symbol={terrain.symbol || ''}
      data-has-marker={hasMarker || undefined}
    >
      {/* Terrain symbol */}
      {showTerrainColors && terrain.symbol && visible && !(hasMarker && showMarkers) && (
        <text className="hex-symbol" x={0} y={0} fontSize={SIZES.symbolFont * scale}>
          {terrain.symbol}
        </text>
      )}
      
      {/* Feature indicator */}
      {hex.featureType && visible && (
        <g className="hex-feature-indicator">
          <circle
            cx={featureOffset.cx}
            cy={featureOffset.cy}
            r={SIZES.featureRadius * scale}
            fill={FEATURE_COLORS[hex.featureType] || '#888'}
          />
          <text
            x={featureOffset.cx}
            y={featureOffset.cy}
            fill="#000"
            fontSize={SIZES.featureFont * scale}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {FEATURE_SYMBOLS[hex.featureType] || '?'}
          </text>
        </g>
      )}
      
      {/* Explored indicator */}
      {/* Always rendered for explored hexes (hidden when off) so image export can include it */}
      {hex.campaignData?.explored && (
        <circle
          className="hex-explored-dot"
          display={!showExploredStatus && showExploredIndicator ? undefined : 'none'}
          cx={gridConfig.hexSize * 0.5}
          cy={gridConfig.orientation === 'pointy-top' ? hexHeight * 0.2 : gridConfig.hexSize * 0.5}
          r={SIZES.exploredRadius * scale}
        />
      )}

      {/* Link indicator */}
      {showLinkIndicators && hasLinks && visible && (
        <g className="hex-link-indicator">
          <circle
            cx={gridConfig.orientation === 'pointy-top' ? gridConfig.hexSize * 0.55 : gridConfig.hexSize * 0.5}
            cy={gridConfig.orientation === 'pointy-top' ? -hexHeight * 0.15 : gridConfig.hexSize * 0.5}
            r={SIZES.linkRadius * scale}
            fill="#4a90d9"
          />
          <text
            x={gridConfig.orientation === 'pointy-top' ? gridConfig.hexSize * 0.55 : gridConfig.hexSize * 0.5}
            y={gridConfig.orientation === 'pointy-top' ? -hexHeight * 0.15 : gridConfig.hexSize * 0.5}
            fill="#fff"
            fontSize={SIZES.linkFont * scale}
            textAnchor="middle"
            dominantBaseline="central"
          >
            🔗
          </text>
        </g>
      )}

      {/* Coordinate label */}
      {showCoordinates && visible && (
        <text
          className="hex-coord"
          x={coordOffset.x}
          y={coordOffset.y}
          fontSize={SIZES.coordFont * scale}
        >
          {displayCoord}
        </text>
      )}
    </g>
  );
});

HexDecorations.displayName = 'HexDecorations';

// ============================================
// MARKERS
// ============================================

/** Base sizes at a 32px hex; multiplied by the hex scale */
const MARKER_BADGE_RADIUS = 11;
const MARKER_SHARED_FACTOR = 0.8;   // badge size when 2+ markers share a hex

interface MarkerBadgeProps {
  marker: Marker;
  cx: number;
  cy: number;
  r: number;
  scale: number;
}

const MarkerBadge: React.FC<MarkerBadgeProps> = ({ marker, cx, cy, r, scale }) => {
  const Icon = getMarkerIcon(marker.icon);
  const iconSize = r * 1.2;
  return (
    <g className="marker-badge">
      {/* Dark halo so the badge stands out on light and dark images */}
      <circle cx={cx} cy={cy} r={r + 2.5 * scale} fill="#000" fillOpacity={0.5} />
      <circle cx={cx} cy={cy} r={r} fill={marker.color} stroke="#fff" strokeWidth={1.5 * scale} />
      {/* Unknown icon keys render as a plain dot */}
      {Icon && (
        <Icon
          x={cx - iconSize / 2}
          y={cy - iconSize / 2}
          size={iconSize}
          color={getContrastText(marker.color)}
          strokeWidth={2.5}
        />
      )}
    </g>
  );
};

interface MarkerClusterProps {
  markers: Marker[];         // In list order; non-empty
  gridConfig: GridConfig;
  scale: number;
}

/** 1 marker: centered. 2: side by side. 3+: first two plus a "+N" pill. */
const MarkerCluster: React.FC<MarkerClusterProps> = React.memo(({ markers, gridConfig, scale }) => {
  const { x, y } = hexToPixel(markers[0].coord!, gridConfig);
  const fullR = MARKER_BADGE_RADIUS * scale;

  if (markers.length === 1) {
    return <MarkerBadge marker={markers[0]} cx={x} cy={y} r={fullR} scale={scale} />;
  }

  const r = fullR * MARKER_SHARED_FACTOR;
  const dx = r * 1.1;
  const extra = markers.length - 2;
  // Lift the pair a little to make room for the pill
  const cy = extra > 0 ? y - r * 0.35 : y;
  const pillW = 16 * scale;
  const pillH = 9 * scale;
  const pillY = cy + r + 1.5 * scale;

  return (
    <g>
      <MarkerBadge marker={markers[0]} cx={x - dx} cy={cy} r={r} scale={scale} />
      <MarkerBadge marker={markers[1]} cx={x + dx} cy={cy} r={r} scale={scale} />
      {extra > 0 && (
        <g className="marker-more">
          <rect
            x={x - pillW / 2}
            y={pillY}
            width={pillW}
            height={pillH}
            rx={pillH / 2}
            fill="#000"
            fillOpacity={0.75}
          />
          <text
            x={x}
            y={pillY + pillH / 2}
            fill="#fff"
            fontSize={7 * scale}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            +{extra}
          </text>
        </g>
      )}
    </g>
  );
});

MarkerCluster.displayName = 'MarkerCluster';

// ============================================
// TRAILS
// ============================================

/** Base sizes at a 32px hex; multiplied by the hex scale */
const TRAIL_WIDTH = 3;
const TRAIL_HALO_WIDTH = 5;
const TRAIL_START_RADIUS = 4;
const TRAIL_CHEVRON_ARM = 4;

interface MarkerTrailPathProps {
  marker: Marker;
  hexKeys: Set<string>;
  gridConfig: GridConfig;
  scale: number;
}

/** One marker's trail: line through hex centers, direction chevrons, start circle */
const MarkerTrailPath: React.FC<MarkerTrailPathProps> = React.memo(({ marker, hexKeys, gridConfig, scale }) => {
  const steps = marker.trail?.steps ?? [];

  // Split into runs of steps whose hexes exist; segments touching a removed
  // hex (grid shrunk) aren't drawn
  const runs: Array<Array<{ x: number; y: number }>> = [];
  let run: Array<{ x: number; y: number }> = [];
  for (const step of steps) {
    if (hexKeys.has(coordToKey(step.coord))) {
      run.push(hexToPixel(step.coord, gridConfig));
    } else {
      if (run.length > 0) runs.push(run);
      run = [];
    }
  }
  if (run.length > 0) runs.push(run);
  if (runs.length === 0) return null;

  const color = marker.color;
  const arm = TRAIL_CHEVRON_ARM * scale;
  // Adjacent hex centers are ~1.7 × hexSize apart; shorter segments get no chevron
  const minChevronLength = gridConfig.hexSize * 1.2;

  const chevrons: string[] = [];
  for (const points of runs) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      if (length < minChevronLength) continue;
      // ">" pointing from a to b, centered on the segment midpoint
      const ux = dx / length;
      const uy = dy / length;
      const tipX = (a.x + b.x) / 2 + ux * arm / 2;
      const tipY = (a.y + b.y) / 2 + uy * arm / 2;
      const backX = tipX - ux * arm;
      const backY = tipY - uy * arm;
      chevrons.push(
        `M ${backX - uy * arm} ${backY + ux * arm} L ${tipX} ${tipY} L ${backX + uy * arm} ${backY - ux * arm}`
      );
    }
  }
  const chevronPath = chevrons.join(' ');
  const start = runs[0][0];
  const lineProps = { fill: 'none', strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

  return (
    <g className="marker-trail">
      {/* Dark halo underneath keeps the line visible on any background */}
      {runs.map((points, i) => (
        <polyline
          key={`halo-${i}`}
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          stroke="#000"
          strokeOpacity={0.5}
          strokeWidth={TRAIL_HALO_WIDTH * scale}
          {...lineProps}
        />
      ))}
      {runs.map((points, i) => (
        <polyline
          key={`line-${i}`}
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          stroke={color}
          strokeOpacity={0.9}
          strokeWidth={TRAIL_WIDTH * scale}
          {...lineProps}
        />
      ))}
      {chevronPath && (
        <>
          <path d={chevronPath} stroke="#000" strokeOpacity={0.5} strokeWidth={4 * scale} {...lineProps} />
          <path d={chevronPath} stroke={color} strokeWidth={2 * scale} {...lineProps} />
        </>
      )}
      {/* Start of the trail */}
      <circle
        cx={start.x}
        cy={start.y}
        r={TRAIL_START_RADIUS * scale}
        fill="#000"
        fillOpacity={0.5}
        stroke={color}
        strokeWidth={2 * scale}
      />
    </g>
  );
});

MarkerTrailPath.displayName = 'MarkerTrailPath';

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

const HexMap = forwardRef<HexMapHandle, HexMapProps>(({
  hexes,
  gridConfig,
  settings,
  imageOverlay,
  selectedCoord,
  multiSelectedCoords,
  highlightedNeighbors = [],
  factions,
  markers,
  zoom,
  onHexClick,
  onHexHover,
  onBoxSelect,
  onZoomChange,
}, ref) => {
  // Box selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false); // Track if we just completed a drag

  // Expose methods for image export
  useImperativeHandle(ref, () => ({
    getSvgElement: () => svgRef.current,
    getBackgroundImage: () => imageOverlay?.src,
  }));
  
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
  
  const hexScale = useMemo(
    () => getHexScale(gridConfig, settings),
    [gridConfig, settings]
  );

  const showMarkers = settings?.showMarkers ?? true;
  const showTrails = settings?.showTrails ?? true;
  const showTerrainColors = settings?.showTerrainColors ?? true;
  const showExploredStatus = settings?.showExploredStatus ?? false;

  const hexKeys = useMemo(() => new Set(hexes.map(h => coordToKey(h.coord))), [hexes]);

  // Trails to draw, in reverse list order so the first marker ends up on top
  const visibleTrails = useMemo(
    // A trail needs at least one move (two points) to draw anything
    () => markers.filter(m => m.trail?.visible && m.trail.steps.length > 1).reverse(),
    [markers]
  );

  // Placed markers grouped by hex, in list order. Markers on hexes that no
  // longer exist (grid shrunk) are left out.
  const markersByHex = useMemo(() => {
    const byHex = new Map<string, Marker[]>();
    for (const marker of markers) {
      if (!marker.coord) continue;
      const key = coordToKey(marker.coord);
      if (!hexKeys.has(key)) continue;
      const list = byHex.get(key);
      if (list) list.push(marker);
      else byHex.set(key, [marker]);
    }
    return byHex;
  }, [markers, hexKeys]);

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
  
  // Per-hex values shared by the fill layer and the decoration layer
  const hexItems = useMemo(() => hexes.map(hex => {
    const key = coordToKey(hex.coord);
    const terrain = getTerrainInfo(getEffectiveTerrain(hex), settings?.customTerrainTypes || []);
    const isExplored = showExploredStatus
      ? exploredInfo.explored.has(key) || exploredInfo.visible.has(key)
      : true;
    return { key, hex, terrain, isExplored };
  }), [hexes, settings?.customTerrainTypes, showExploredStatus, exploredInfo]);

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
        data-hex-scale={hexScale}
        style={{
          // Read by highlight stroke widths in index.css
          ['--hex-scale' as string]: hexScale,
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
        {/* Hex fills and borders (clickable) */}
        <g style={{ pointerEvents: 'all' }}>
          {hexItems.map(({ key, hex, terrain, isExplored }) => (
            <HexCell
              key={key}
              hex={hex}
              gridConfig={gridConfig}
              terrain={terrain}
              isSelected={!!selectedCoord && coordEquals(hex.coord, selectedCoord)}
              isMultiSelected={multiSelectedSet.has(key)}
              isNeighbor={neighborSet.has(key)}
              showTerrainColors={showTerrainColors}
              showDataIndicator={settings?.showDataIndicators ?? true}
              showGrid={settings?.showGrid ?? true}
              factionColor={hexFactionColors.get(key)}
              isExplored={isExplored}
              showExploredStatus={showExploredStatus}
              fillOpacity={settings?.hexFillOpacity ?? 0.5}
              gridOpacity={settings?.gridOpacity ?? 0.3}
              scale={hexScale}
              onClick={(e) => handleHexClick(hex, e)}
              onMouseEnter={() => handleMouseEnter(hex)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </g>

        {/* Trails: under the marker badges. Always rendered (hidden when the
            global toggle is off) so image export can include them. */}
        <g
          className="trail-layer"
          pointerEvents="none"
          display={showTrails ? undefined : 'none'}
        >
          {visibleTrails.map(marker => (
            <MarkerTrailPath
              key={marker.id}
              marker={marker}
              hexKeys={hexKeys}
              gridConfig={gridConfig}
              scale={hexScale}
            />
          ))}
        </g>

        {/* Hex labels and badges: above trails so lines never cover them.
            Clicks pass through to the hex fill below. */}
        <g className="hex-decorations-layer" pointerEvents="none">
          {hexItems.map(({ key, hex, terrain, isExplored }) => (
            <HexDecorations
              key={key}
              hex={hex}
              gridConfig={gridConfig}
              terrain={terrain}
              showTerrainColors={showTerrainColors}
              showCoordinates={settings?.showCoordinates ?? true}
              showLinkIndicators={settings?.showLinkIndicators ?? true}
              hasLinks={!!(hex.campaignData?.links && Object.keys(hex.campaignData.links).length > 0)}
              isExplored={isExplored}
              showExploredStatus={showExploredStatus}
              showExploredIndicator={settings?.showExploredIndicators ?? true}
              scale={hexScale}
              hasMarker={markersByHex.has(key)}
              showMarkers={showMarkers}
            />
          ))}
        </g>

        {/* Markers: above all hexes so borders and selection glow never cover
            them. Always rendered (hidden when off) so image export can
            include them even when they're hidden on screen. Clicks pass
            through to the hex below. */}
        <g
          className="marker-layer"
          pointerEvents="none"
          display={showMarkers ? undefined : 'none'}
        >
          {[...markersByHex].map(([key, hexMarkers]) => (
            <MarkerCluster
              key={key}
              markers={hexMarkers}
              gridConfig={gridConfig}
              scale={hexScale}
            />
          ))}
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
});

HexMap.displayName = 'HexMap';

export default HexMap;
