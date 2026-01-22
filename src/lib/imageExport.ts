/**
 * Image export functionality for Campaign Mapper
 * Exports the hex map as a PNG image for use in VTT applications
 */

interface ExportOptions {
  backgroundImage?: string;  // data URL of background image
  filename?: string;
}

/**
 * Inline CSS styles into SVG elements for export
 * (External CSS won't be available when SVG is serialized)
 */
function inlineStyles(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;

  // Remove selection highlighting classes (shouldn't appear in export)
  clone.querySelectorAll('.selected, .multi-selected').forEach(el => {
    el.classList.remove('selected', 'multi-selected');
  });

  // Inline styles for hex polygons
  clone.querySelectorAll('.hex-polygon').forEach(el => {
    const polygon = el as SVGPolygonElement;

    // Only set stroke if not already inline-styled (faction borders)
    if (!polygon.style.stroke) {
      polygon.style.stroke = 'rgba(255, 255, 255, 0.3)';
      polygon.style.strokeWidth = '1';
    }
  });

  // Inline styles for terrain symbols
  clone.querySelectorAll('.hex-symbol').forEach(el => {
    const text = el as SVGTextElement;
    text.style.fontSize = '16px';
    text.style.textAnchor = 'middle';
    text.style.dominantBaseline = 'central';
    text.style.fill = 'rgba(255, 255, 255, 0.7)';
    text.style.pointerEvents = 'none';
  });

  // Inline styles for coordinate labels
  clone.querySelectorAll('.hex-coord').forEach(el => {
    const text = el as SVGTextElement;
    text.style.fontSize = '10px';
    text.style.textAnchor = 'middle';
    text.style.fill = 'rgba(255, 255, 255, 0.5)';
    text.style.pointerEvents = 'none';
  });

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
 * Export the map as a PNG image
 */
export async function exportMapAsImage(
  svgElement: SVGSVGElement,
  options: ExportOptions = {}
): Promise<void> {
  const { backgroundImage, filename = 'map' } = options;

  // Clone and inline styles
  const styledSvg = inlineStyles(svgElement);

  // Get dimensions from viewBox
  const viewBox = parseViewBox(svgElement.getAttribute('viewBox'));

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = viewBox.width;
  canvas.height = viewBox.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw background image if present
  if (backgroundImage) {
    try {
      const bgImg = await loadImage(backgroundImage);
      ctx.drawImage(bgImg, 0, 0, viewBox.width, viewBox.height);
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

  // Export as PNG
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\s+/g, '_')}.png`;
    a.click();

    URL.revokeObjectURL(url);
  }, 'image/png');
}
