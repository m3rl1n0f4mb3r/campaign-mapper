import type { CampaignMap, AppSettings, MapReference } from './types';
import { DEFAULT_APP_SETTINGS } from './types';

const STORAGE_PREFIX = 'campaign-mapper';
const SETTINGS_KEY = `${STORAGE_PREFIX}-settings`;
const MAP_PREFIX = `${STORAGE_PREFIX}-map-`;
const IMAGE_DB_NAME = 'campaign-mapper-images';
const IMAGE_STORE_NAME = 'images';

// ============================================
// INDEXEDDB FOR IMAGES
// ============================================

let imageDb: IDBDatabase | null = null;

async function getImageDb(): Promise<IDBDatabase> {
  if (imageDb) return imageDb;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, 1);
    
    request.onerror = () => reject(new Error('Failed to open image database'));
    
    request.onsuccess = () => {
      imageDb = request.result;
      resolve(imageDb);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function saveImageToDb(id: string, dataUrl: string): Promise<void> {
  const db = await getImageDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IMAGE_STORE_NAME);
    const request = store.put({ id, dataUrl });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save image'));
  });
}

async function loadImageFromDb(id: string): Promise<string | null> {
  const db = await getImageDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE_NAME, 'readonly');
    const store = tx.objectStore(IMAGE_STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result?.dataUrl || null);
    };
    request.onerror = () => reject(new Error('Failed to load image'));
  });
}

async function deleteImageFromDb(id: string): Promise<void> {
  const db = await getImageDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IMAGE_STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete image'));
  });
}

// ============================================
// APP SETTINGS
// ============================================

export function loadAppSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load app settings:', e);
  }
  return { ...DEFAULT_APP_SETTINGS };
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save app settings:', e);
  }
}

// ============================================
// MAP STORAGE
// ============================================

function getMapKey(id: string): string {
  return `${MAP_PREFIX}${id}`;
}

function getImageKey(mapId: string): string {
  return `${mapId}-image`;
}

export async function loadMap(id: string): Promise<CampaignMap | null> {
  try {
    const saved = localStorage.getItem(getMapKey(id));
    if (saved) {
      const map = JSON.parse(saved) as CampaignMap;
      
      // Load image from IndexedDB if this is an overlay map
      if (map.imageOverlay && !map.imageOverlay.src) {
        const imageSrc = await loadImageFromDb(getImageKey(id));
        if (imageSrc) {
          map.imageOverlay.src = imageSrc;
        }
      }
      
      return map;
    }
  } catch (e) {
    console.error(`Failed to load map ${id}:`, e);
  }
  return null;
}

export async function saveMap(map: CampaignMap): Promise<void> {
  try {
    map.updatedAt = new Date().toISOString();
    
    // If there's an image overlay, store the image separately in IndexedDB
    let mapToSave = map;
    if (map.imageOverlay?.src) {
      // Save image to IndexedDB
      await saveImageToDb(getImageKey(map.id), map.imageOverlay.src);
      
      // Save map without the image data (just keep metadata)
      mapToSave = {
        ...map,
        imageOverlay: {
          ...map.imageOverlay,
          src: '', // Clear src from localStorage copy
        },
      };
    }
    
    localStorage.setItem(getMapKey(map.id), JSON.stringify(mapToSave));
    
    // Update recent maps in settings
    const settings = loadAppSettings();
    const ref: MapReference = {
      id: map.id,
      name: map.name,
      updatedAt: map.updatedAt,
      mode: map.mode,
      hexCount: map.hexes.length,
    };
    
    // Remove existing reference and add to front
    settings.recentMaps = settings.recentMaps.filter(r => r.id !== map.id);
    settings.recentMaps.unshift(ref);
    
    // Keep only last 10 maps
    settings.recentMaps = settings.recentMaps.slice(0, 10);
    
    saveAppSettings(settings);
  } catch (e) {
    console.error('Failed to save map:', e);
    throw new Error('Failed to save map. Storage may be full.');
  }
}

export async function deleteMap(id: string): Promise<void> {
  try {
    localStorage.removeItem(getMapKey(id));
    
    // Also delete image from IndexedDB
    try {
      await deleteImageFromDb(getImageKey(id));
    } catch {
      // Ignore if image doesn't exist
    }
    
    // Remove from recent maps
    const settings = loadAppSettings();
    settings.recentMaps = settings.recentMaps.filter(r => r.id !== id);
    saveAppSettings(settings);
  } catch (e) {
    console.error(`Failed to delete map ${id}:`, e);
  }
}

export function listMaps(): MapReference[] {
  const settings = loadAppSettings();
  
  // Verify maps still exist and update references
  const validMaps: MapReference[] = [];
  for (const ref of settings.recentMaps) {
    if (localStorage.getItem(getMapKey(ref.id))) {
      validMaps.push(ref);
    }
  }
  
  // Update settings if we removed any stale references
  if (validMaps.length !== settings.recentMaps.length) {
    settings.recentMaps = validMaps;
    saveAppSettings(settings);
  }
  
  return validMaps;
}

// ============================================
// EXPORT / IMPORT
// ============================================

export async function exportMap(map: CampaignMap): Promise<void> {
  // For export, include the full image data
  const exportData = { ...map };
  
  // If image was stored separately, load it for export
  if (map.imageOverlay && !map.imageOverlay.src) {
    const imageSrc = await loadImageFromDb(getImageKey(map.id));
    if (imageSrc && exportData.imageOverlay) {
      exportData.imageOverlay.src = imageSrc;
    }
  }
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${map.name.replace(/\s+/g, '_')}.campmap.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

export function importMap(file: File): Promise<CampaignMap> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const map = JSON.parse(event.target?.result as string) as CampaignMap;
        
        // Validate required fields
        if (!map.id || !map.name || !map.hexes || !map.gridConfig) {
          throw new Error('Invalid map file: missing required fields');
        }
        
        // Generate new ID to avoid conflicts
        map.id = `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        map.updatedAt = new Date().toISOString();
        
        resolve(map);
      } catch {
        reject(new Error('Failed to parse map file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

// ============================================
// IMAGE HANDLING
// ============================================

/**
 * Load and optionally compress an image file
 */
export function loadImageAsDataUrl(
  file: File, 
  maxSize?: number
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      // Load into an image to get dimensions
      const img = new Image();
      img.onload = () => {
        // If maxSize is specified and image is larger, compress it
        if (maxSize && (img.naturalWidth > maxSize || img.naturalHeight > maxSize)) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate new dimensions
          const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight);
          canvas.width = Math.floor(img.naturalWidth * scale);
          canvas.height = Math.floor(img.naturalHeight * scale);
          
          // Draw scaled image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Get compressed data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          resolve({
            dataUrl: compressedDataUrl,
            width: canvas.width,
            height: canvas.height,
          });
        } else {
          resolve({
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        }
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = dataUrl;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(file);
  });
}

// ============================================
// STORAGE STATS
// ============================================

export function getStorageUsage(): { used: number; available: number; percentage: number } {
  let used = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    }
  }
  
  // Estimate available (most browsers allow ~5-10MB)
  const estimatedTotal = 5 * 1024 * 1024; // 5MB in characters
  
  return {
    used,
    available: estimatedTotal - used,
    percentage: (used / estimatedTotal) * 100,
  };
}
