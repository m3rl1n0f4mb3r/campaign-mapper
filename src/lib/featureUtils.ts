// ============================================
// FEATURE UTILITIES
// Shared helper functions for feature generation and display
// ============================================

/**
 * Format a key for display (camelCase/snake_case → Title Case)
 * Handles special cases like NPC and subcategory suffixes (flora_a → Flora (A))
 */
export function formatLabel(key: string): string {
  // If string already has spaces, it's likely already formatted - just capitalize first letter
  if (key.includes(' ')) {
    return key.replace(/^./, str => str.toUpperCase());
  }

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_([a-z])$/g, (_, letter) => ` (${letter.toUpperCase()})`) // flora_a → Flora (A)
    .replace(/_/g, ' ')
    .replace(/npc/gi, 'NPC');
}

/**
 * Normalize feature data for storage
 * Flattens settlement/landmark structure and extracts feature name
 */
export function normalizeFeatureData(
  featureType: string,
  data: unknown
): { details: Record<string, unknown>; featureName?: string } {
  if (featureType === 'settlement') {
    // For settlements, flatten the structure: merge type, name with details
    const settlement = data as { type: string; name: string; details?: Record<string, string> };
    return {
      details: {
        type: settlement.type,
        name: settlement.name,
        ...(settlement.details || {}),
      },
      featureName: settlement.name,
    };
  }
  if (featureType === 'landmark') {
    // For landmarks, use data directly - 'nature' field will display in feature notes
    return {
      details: data as Record<string, unknown>,
    };
  }
  // For other feature types, use data directly
  return {
    details: data as Record<string, unknown>,
  };
}

/**
 * Format a value for display
 * Applies formatLabel to snake_case strings, handles booleans
 */
function formatValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'string') {
    // Apply formatLabel to handle snake_case values like "small_structure" or "flora_a"
    // Already formatted strings like "Fallen tree" pass through unchanged
    return formatLabel(value);
  }
  return String(value);
}

/**
 * Convert generated details into feature notes
 * Filters out internal fields and converts values to strings
 */
export function detailsToFeatureNotes(details: Record<string, unknown>): Record<string, string> {
  const notes: Record<string, string> = {};
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'details') continue; // Skip nested details object
    if (key === 'name') continue; // Name is displayed separately in Hex Info
    if (typeof value === 'object') continue; // Skip complex objects

    const label = formatLabel(key);
    const displayValue = formatValue(value);
    notes[label] = displayValue;
  }
  return notes;
}

/**
 * Format generated feature details for display in collapsed section
 */
export function formatGeneratedDetails(details: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'details') continue; // Skip nested details object
    if (typeof value === 'object') continue; // Skip complex objects

    lines.push(`${formatLabel(key)}: ${formatValue(value)}`);
  }
  return lines.join('\n');
}
