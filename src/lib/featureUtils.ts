// ============================================
// FEATURE UTILITIES
// Shared helper functions for feature generation and display
// ============================================

/**
 * Format a key for display (camelCase/snake_case → Title Case)
 * Handles special cases like NPC and subcategory suffixes (flora_a → Flora (A))
 */
export function formatLabel(key: string): string {
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
    // For landmarks, the 'name' field contains the rolled landmark (e.g., "Fallen tree")
    const landmark = data as { name?: string; [key: string]: unknown };
    return {
      details: data as Record<string, unknown>,
      featureName: landmark.name,
    };
  }
  // For other feature types, use data directly
  return {
    details: data as Record<string, unknown>,
  };
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
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
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

    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    lines.push(`${formatLabel(key)}: ${displayValue}`);
  }
  return lines.join('\n');
}
