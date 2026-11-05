import {
  Anchor, Castle, Coins, Compass, Crosshair, Crown, Eye, Flag, Flame,
  Footprints, Gem, Ghost, Heart, House, Key, MapPin, Mountain, Scroll,
  Shield, Ship, Skull, Star, Swords, Tent, TreePine, User, Users, X,
  type LucideIcon,
} from 'lucide-react';
import type { Marker } from './types';
import { MARKER_COLORS } from './palette';

/** Curated marker icons. Keys are stored in saved maps, so don't rename them. */
export const MARKER_ICONS: Record<string, LucideIcon> = {
  users: Users,
  user: User,
  flag: Flag,
  'map-pin': MapPin,
  tent: Tent,
  castle: Castle,
  house: House,
  skull: Skull,
  swords: Swords,
  shield: Shield,
  crown: Crown,
  star: Star,
  gem: Gem,
  coins: Coins,
  key: Key,
  scroll: Scroll,
  compass: Compass,
  mountain: Mountain,
  'tree-pine': TreePine,
  anchor: Anchor,
  ship: Ship,
  flame: Flame,
  eye: Eye,
  ghost: Ghost,
  footprints: Footprints,
  crosshair: Crosshair,
  heart: Heart,
  x: X,
};

export const MARKER_ICON_KEYS = Object.keys(MARKER_ICONS);

/** Undefined for unknown keys (e.g. from a newer version); render a plain dot */
export function getMarkerIcon(key: string): LucideIcon | undefined {
  return MARKER_ICONS[key];
}

function sameLook(marker: Pick<Marker, 'icon' | 'color'>, icon: string, color: string): boolean {
  return marker.icon === icon && marker.color.toLowerCase() === color.toLowerCase();
}

/** Another marker with the same icon and color, if any (they'd look identical on the map) */
export function findLookAlike(
  markers: Marker[],
  icon: string,
  color: string,
  excludeId?: string
): Marker | undefined {
  return markers.find(m => m.id !== excludeId && sameLook(m, icon, color));
}

/** First preset icon + color combination no marker uses yet */
export function getDefaultLook(markers: Marker[]): { icon: string; color: string } {
  for (const icon of MARKER_ICON_KEYS) {
    for (const color of MARKER_COLORS) {
      if (!markers.some(m => sameLook(m, icon, color))) {
        return { icon, color };
      }
    }
  }
  return { icon: MARKER_ICON_KEYS[0], color: MARKER_COLORS[0] };
}

/** Names over 8 characters become 7 + "…" in chips */
export function shortMarkerName(name: string): string {
  return name.length > 8 ? `${name.slice(0, 7)}…` : name;
}
