/**
 * Image export functionality for Campaign Mapper
 * Exports the hex map as a PNG image for use in VTT applications
 */

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export interface ImageExportOptions {
  filename?: string;
  format?: ImageFormat;
  quality?: number;
  backgroundImage?: string;
  includeBackground?: boolean;
  backgroundOpacity?: number;
  showGrid?: boolean;
  gridOpacity?: number;
  hexFillOpacity?: number;
  showTerrainColors?: boolean;
  showCoordinates?: boolean;
  showFeatureMarkers?: boolean;
  showFactionTerritories?: boolean;
  showFogOfWar?: boolean;
  scale?: number;
}

const DEFAULT_OPTIONS: Required<Omit<ImageExportOptions, 'backgroundImage'>> = {
  filename: 'map',
  format: 'png',
  quality: 85,
  includeBackground: true,
  backgroundOpacity: 100,
  showGrid: true,
  gridOpacity: 30,
  hexFillOpacity: 50,
  showTerrainColors: true,
  showCoordinates: true,
  showFeatureMarkers: true,
  showFactionTerritories: true,
  showFogOfWar: false,
  scale: 1,
};

/**
 * Create an SVG text element
 */
function createSvgText(
  content: string,
  x: number,
  y: number,
  className: string,
  styles: Record<string, string>
): SVGTextElement {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('class', className);
  text.setAttribute('x', String(x));
  text.setAttribute('y', String(y));
  text.textContent = content;
  Object.assign(text.style, styles);
  return text;
}

/**
 * Inline CSS styles into SVG elements for export
 * Uses data attributes to ensure terrain colors/symbols are available
 * even when display settings have them hidden
 */
function inlineStyles(svg: SVGSVGElement, options: ImageExportOptions): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Remove selection highlighting classes (shouldn't appear in export)
  clone.querySelectorAll('.selected, .multi-selected').forEach(el => {
    el.classList.remove('selected', 'multi-selected');
  });

  // Process each hex group
  clone.querySelectorAll('.hex').forEach(hexGroup => {
    const group = hexGroup as SVGGElement;
    const polygon = group.querySelector('.hex-polygon') as SVGPolygonElement | null;

    if (!polygon) return;

    // Get terrain data from data attributes
    const terrainColor = polygon.getAttribute('data-terrain-color') || '#808080';
    const terrainSymbol = polygon.getAttribute('data-terrain-symbol') || '';

    // Apply terrain fill color from data attribute (overrides current fill)
    // This ensures export works even when "Show Terrain Colors" is off
    if (opts.showTerrainColors) {
      polygon.setAttribute('fill', terrainColor);
      polygon.setAttribute('fill-opacity', String(opts.hexFillOpacity / 100));
    } else {
      polygon.setAttribute('fill', 'transparent');
    }

    // Handle hex grid outlines
    if (opts.showGrid) {
      // Only set stroke if not already inline-styled (faction borders)
      if (!polygon.style.stroke) {
        const gridAlpha = opts.gridOpacity / 100;
        polygon.style.stroke = `rgba(255, 255, 255, ${gridAlpha})`;
        polygon.style.strokeWidth = '1';
      }
    } else {
      // Remove outlines entirely (unless faction border)
      if (!polygon.style.stroke || polygon.style.stroke.includes('255, 255, 255')) {
        polygon.style.stroke = 'none';
      }
    }

    // Handle terrain symbols (tied to terrain colors setting)
    let symbolEl = group.querySelector('.hex-symbol') as SVGTextElement | null;
    if (opts.showTerrainColors && terrainSymbol) {
      if (!symbolEl) {
        // Create symbol element if it doesn't exist
        symbolEl = createSvgText(terrainSymbol, 0, 0, 'hex-symbol', {
          fontSize: '16px',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fill: 'rgba(255, 255, 255, 0.7)',
          pointerEvents: 'none',
        });
        group.appendChild(symbolEl);
      } else {
        // Style existing symbol
        symbolEl.style.fontSize = '16px';
        symbolEl.style.textAnchor = 'middle';
        symbolEl.style.dominantBaseline = 'central';
        symbolEl.style.fill = 'rgba(255, 255, 255, 0.7)';
        symbolEl.style.pointerEvents = 'none';
      }
    } else if (symbolEl) {
      symbolEl.remove();
    }

    // Handle coordinate labels
    const coordValue = group.getAttribute('data-coord');
    const coordX = parseFloat(group.getAttribute('data-coord-x') || '0');
    const coordY = parseFloat(group.getAttribute('data-coord-y') || '0');
    let coordEl = group.querySelector('.hex-coord') as SVGTextElement | null;

    if (opts.showCoordinates && coordValue) {
      if (!coordEl) {
        // Create coordinate element if it doesn't exist
        coordEl = createSvgText(coordValue, coordX, coordY, 'hex-coord', {
          fontSize: '10px',
          textAnchor: 'middle',
          fill: 'rgba(255, 255, 255, 0.5)',
          pointerEvents: 'none',
        });
        group.appendChild(coordEl);
      } else {
        // Style existing coordinate
        coordEl.style.fontSize = '10px';
        coordEl.style.textAnchor = 'middle';
        coordEl.style.fill = 'rgba(255, 255, 255, 0.5)';
        coordEl.style.pointerEvents = 'none';
      }
    } else if (coordEl) {
      coordEl.remove();
    }
  });

  // Handle feature markers
  if (opts.showFeatureMarkers) {
    // Style feature indicator text
    clone.querySelectorAll('.hex-feature-indicator text').forEach(el => {
      const text = el as SVGTextElement;
      text.style.pointerEvents = 'none';
    });
  } else {
    clone.querySelectorAll('.hex-feature-indicator').forEach(el => el.remove());
  }

  // Handle faction territories
  if (!opts.showFactionTerritories) {
    // Remove faction border styling
    clone.querySelectorAll('.hex-polygon').forEach(el => {
      const polygon = el as SVGPolygonElement;
      // Check if this has faction border (colored stroke that's not the default white grid)
      if (polygon.style.stroke && !polygon.style.stroke.includes('255, 255, 255')) {
        polygon.style.stroke = opts.showGrid ? `rgba(255, 255, 255, ${opts.gridOpacity / 100})` : 'none';
        polygon.style.strokeWidth = opts.showGrid ? '1' : '0';
      }
    });
  }

  // Handle fog of war (explored status)
  if (!opts.showFogOfWar) {
    clone.querySelectorAll('.hex-explored-dot').forEach(el => el.remove());
    clone.querySelectorAll('.hex-unexplored').forEach(el => {
      el.classList.remove('hex-unexplored');
    });
  }

  // Inline styles for explored dots
  clone.querySelectorAll('.hex-explored-dot').forEach(el => {
    const circle = el as SVGCircleElement;
    circle.style.fill = '#4ade80';
    circle.style.opacity = '0.8';
  });

  return clone;
}

/**
 * Parse SVG viewBox attribute into dimensions
 */
function parseViewBox(viewBox: string | null): { x: number; y: number; width: number; height: number } {
  if (!viewBox) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  const parts = viewBox.split(/\s+/).map(Number);
  return {
    x: parts[0] || 0,
    y: parts[1] || 0,
    width: parts[2] || 800,
    height: parts[3] || 600,
  };
}

/**
 * Load an image from a data URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Export the map as an image (PNG, JPEG, or WebP)
 */
export async function exportMapAsImage(
  svgElement: SVGSVGElement,
  options: ImageExportOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { backgroundImage } = options;

  // Clone and inline styles
  const styledSvg = inlineStyles(svgElement, opts);

  // Get dimensions from viewBox
  const viewBox = parseViewBox(svgElement.getAttribute('viewBox'));

  // Apply scale to canvas dimensions
  const scale = opts.scale;
  const canvasWidth = Math.round(viewBox.width * scale);
  const canvasHeight = Math.round(viewBox.height * scale);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Scale the context to match resolution
  ctx.scale(scale, scale);

  // Draw background image if present and enabled
  if (backgroundImage && opts.includeBackground) {
    try {
      const bgImg = await loadImage(backgroundImage);

      // Apply background opacity
      ctx.globalAlpha = opts.backgroundOpacity / 100;
      ctx.drawImage(bgImg, 0, 0, viewBox.width, viewBox.height);
      ctx.globalAlpha = 1;
    } catch (e) {
      console.warn('Failed to draw background image:', e);
      // Continue without background
    }
  }

  // Serialize SVG to data URL
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(styledSvg);
  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

  // Draw SVG onto canvas
  const svgImg = await loadImage(svgDataUrl);
  ctx.drawImage(svgImg, 0, 0, viewBox.width, viewBox.height);

  // Determine MIME type and file extension
  const mimeTypes: Record<ImageFormat, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  const extensions: Record<ImageFormat, string> = {
    png: 'png',
    jpeg: 'jpg',
    webp: 'webp',
  };
  const mimeType = mimeTypes[opts.format];
  const extension = extensions[opts.format];

  // Quality only applies to jpeg and webp (0-1 range)
  const quality = opts.format === 'png' ? undefined : opts.quality / 100;

  // Export image
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${opts.filename.replace(/\s+/g, '_')}.${extension}`;
    a.click();

    URL.revokeObjectURL(url);
  }, mimeType, quality);
}
