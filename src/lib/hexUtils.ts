import type { HexCoord, GridConfig, Hex } from './types';
import { coordToKey } from './types';

// ============================================
// COORDINATE CONVERSIONS
// ============================================

/**
 * Convert offset coordinates (col, row) to axial coordinates (q, r)
 * Supports both flat-top and pointy-top orientations
 * Respects rowOffset/colOffset configuration
 */
export function offsetToAxial(
  col: number, 
  row: number, 
  config: GridConfig
): HexCoord {
  if (config.orientation === 'pointy-top') {
    // Pointy-top: rows are offset
    // odd-r: odd rows shifted right, even-r: even rows shifted right
    const isOddOffset = config.rowOffset === 'odd';
    const offset = isOddOffset 
      ? Math.floor(row / 2)           // odd-r: floor(r/2)
      : Math.floor((row + 1) / 2);    // even-r: floor((r+1)/2)
    return { q: col - offset, r: row };
  } else {
    // Flat-top: columns are offset
    const isOddOffset = config.colOffset === 'odd';
    const offset = isOddOffset
      ? Math.floor(col / 2)           // odd-q: floor(q/2)
      : Math.floor((col + 1) / 2);    // even-q: floor((q+1)/2)
    return { q: col, r: row - offset };
  }
}

/**
 * Convert axial coordinates (q, r) to offset coordinates (col, row)
 * Supports both flat-top and pointy-top orientations
 * Respects rowOffset/colOffset configuration
 */
export function axialToOffset(
  coord: HexCoord,
  config: GridConfig
): { col: number; row: number } {
  if (config.orientation === 'pointy-top') {
    // Pointy-top: rows are offset
    // odd-r: odd rows shifted right, even-r: even rows shifted right
    const isOddOffset = config.rowOffset === 'odd';
    const offset = isOddOffset 
      ? Math.floor(coord.r / 2)           // odd-r: floor(r/2)
      : Math.floor((coord.r + 1) / 2);    // even-r: floor((r+1)/2)
    const col = coord.q + offset;
    const row = coord.r;
    return { col, row };
  } else {
    // Flat-top: columns are offset
    const isOddOffset = config.colOffset === 'odd';
    const offset = isOddOffset
      ? Math.floor(coord.q / 2)           // odd-q: floor(q/2)
      : Math.floor((coord.q + 1) / 2);    // even-q: floor((q+1)/2)
    const col = coord.q;
    const row = coord.r + offset;
    return { col, row };
  }
}

/**
 * Get a human-readable coordinate string (CCRR format)
 */
export function getDisplayCoord(coord: HexCoord, config: GridConfig): string {
  const { col, row } = axialToOffset(coord, config);
  return `${String(col).padStart(2, '0')}${String(row).padStart(2, '0')}`;
}

/**
 * Parse a display coordinate string back to axial coordinates
 */
export function parseDisplayCoord(
  displayCoord: string, 
  config: GridConfig
): HexCoord | null {
  if (displayCoord.length !== 4) return null;
  const col = parseInt(displayCoord.substring(0, 2), 10);
  const row = parseInt(displayCoord.substring(2, 4), 10);
  if (isNaN(col) || isNaN(row)) return null;
  return offsetToAxial(col, row, config);
}

// ============================================
// PIXEL CONVERSIONS
// ============================================

/**
 * Calculate hex dimensions based on size and orientation
 */
export function getHexDimensions(config: GridConfig): { width: number; height: number } {
  const size = config.hexSize;
  if (config.orientation === 'pointy-top') {
    return {
      width: size * Math.sqrt(3),
      height: size * 2,
    };
  } else {
    return {
      width: size * 2,
      height: size * Math.sqrt(3),
    };
  }
}

/**
 * Get the spacing between hex centers
 */
export function getHexSpacing(config: GridConfig): { horizSpacing: number; vertSpacing: number } {
  const { width, height } = getHexDimensions(config);
  
  if (config.colSpacing !== undefined && config.rowSpacing !== undefined) {
    return {
      horizSpacing: config.colSpacing,
      vertSpacing: config.rowSpacing,
    };
  }
  
  if (config.orientation === 'pointy-top') {
    return {
      horizSpacing: config.colSpacing ?? width,
      vertSpacing: config.rowSpacing ?? (height * 0.75),
    };
  } else {
    return {
      horizSpacing: config.colSpacing ?? (width * 0.75),
      vertSpacing: config.rowSpacing ?? height,
    };
  }
}

/**
 * Convert offset coordinates to pixel position
 */
export function offsetToPixel(
  col: number,
  row: number,
  config: GridConfig
): { x: number; y: number } {
  const { horizSpacing, vertSpacing } = getHexSpacing(config);
  
  let x: number, y: number;
  
  if (config.orientation === 'pointy-top') {
    // Pointy-top: rows interlock, odd rows shift right
    const isOffsetRow = config.rowOffset === 'odd' ? row % 2 === 1 : row % 2 === 0;
    const xOffset = isOffsetRow ? horizSpacing / 2 : 0;
    
    x = config.originX + (col - config.startCol) * horizSpacing + xOffset;
    y = config.originY + (row - config.startRow) * vertSpacing;
  } else {
    // Flat-top: columns interlock, odd columns shift down
    const isOffsetCol = config.colOffset === 'odd' ? col % 2 === 1 : col % 2 === 0;
    const yOffset = isOffsetCol ? vertSpacing / 2 : 0;
    
    x = config.originX + (col - config.startCol) * horizSpacing;
    y = config.originY + (row - config.startRow) * vertSpacing + yOffset;
  }
  
  return { x, y };
}

/**
 * Convert axial coordinates to pixel position
 */
export function hexToPixel(coord: HexCoord, config: GridConfig): { x: number; y: number } {
  const { col, row } = axialToOffset(coord, config);
  return offsetToPixel(col, row, config);
}

/**
 * Convert pixel position to the nearest hex coordinate
 */
export function pixelToHex(
  px: number, 
  py: number, 
  config: GridConfig
): HexCoord {
  const size = config.hexSize;
  
  // Adjust for origin
  const x = px - config.originX;
  const y = py - config.originY;
  
  let q: number, r: number;
  
  if (config.orientation === 'pointy-top') {
    q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
    r = (2 / 3 * y) / size;
  } else {
    q = (2 / 3 * x) / size;
    r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
  }
  
  return axialRound({ q, r });
}

/**
 * Round fractional axial coordinates to nearest hex
 */
function axialRound(coord: { q: number; r: number }): HexCoord {
  const s = -coord.q - coord.r;
  
  let rq = Math.round(coord.q);
  let rr = Math.round(coord.r);
  const rs = Math.round(s);
  
  const qDiff = Math.abs(rq - coord.q);
  const rDiff = Math.abs(rr - coord.r);
  const sDiff = Math.abs(rs - s);
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  
  return { q: rq, r: rr };
}

// ============================================
// HEX GEOMETRY
// ============================================

/**
 * Generate hex polygon points for SVG
 */
export function getHexPoints(cx: number, cy: number, config: GridConfig): string {
  const size = config.hexSize;
  const points: string[] = [];
  
  for (let i = 0; i < 6; i++) {
    let angle: number;
    if (config.orientation === 'pointy-top') {
      // Pointy-top: first vertex at top (270 degrees / -90 degrees)
      angle = (Math.PI / 3) * i - Math.PI / 2;
    } else {
      // Flat-top: first vertex at right (0 degrees)
      angle = (Math.PI / 3) * i;
    }
    
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  return points.join(' ');
}

// ============================================
// HEX NEIGHBORS
// ============================================

// Axial direction vectors (same for both orientations)
const AXIAL_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },   // E / SE
  { q: 1, r: -1 },  // NE / E
  { q: 0, r: -1 },  // NW / NE
  { q: -1, r: 0 },  // W / NW
  { q: -1, r: 1 },  // SW / W
  { q: 0, r: 1 },   // SE / SW
];

/**
 * Get neighboring hex coordinates
 */
export function getNeighbors(coord: HexCoord): HexCoord[] {
  return AXIAL_DIRECTIONS.map(dir => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r,
  }));
}

/**
 * Check if two coordinates are the same
 */
export function coordEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/**
 * Calculate distance between two hexes (in hex units)
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Get hex at coordinate from array
 */
export function getHexAt(hexes: Hex[], coord: HexCoord): Hex | undefined {
  return hexes.find(h => coordEquals(h.coord, coord));
}

// ============================================
// GRID GENERATION
// ============================================

/**
 * Generate all hex coordinates for a rectangular grid
 */
export function generateGridCoords(config: GridConfig): HexCoord[] {
  const coords: HexCoord[] = [];
  
  for (let row = config.startRow; row < config.startRow + config.rows; row++) {
    for (let col = config.startCol; col < config.startCol + config.cols; col++) {
      coords.push(offsetToAxial(col, row, config));
    }
  }
  
  return coords;
}

/**
 * Create a hex lookup map for efficient coordinate lookups
 */
export function createHexMap(hexes: Hex[]): Map<string, Hex> {
  const map = new Map<string, Hex>();
  for (const hex of hexes) {
    map.set(coordToKey(hex.coord), hex);
  }
  return map;
}

// ============================================
// VIEWPORT CALCULATIONS
// ============================================

/**
 * Calculate the bounding box for a set of hexes
 */
export function calculateViewBox(
  hexes: Hex[], 
  config: GridConfig,
  padding: number = 20
): { minX: number; minY: number; width: number; height: number } {
  if (hexes.length === 0) {
    return { minX: 0, minY: 0, width: 400, height: 400 };
  }
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  const { width: hexWidth, height: hexHeight } = getHexDimensions(config);
  
  for (const hex of hexes) {
    const { x, y } = hexToPixel(hex.coord, config);
    minX = Math.min(minX, x - hexWidth / 2);
    maxX = Math.max(maxX, x + hexWidth / 2);
    minY = Math.min(minY, y - hexHeight / 2);
    maxY = Math.max(maxY, y + hexHeight / 2);
  }
  
  return {
    minX: minX - padding,
    minY: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
