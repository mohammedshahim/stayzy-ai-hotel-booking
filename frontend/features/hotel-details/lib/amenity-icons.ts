import {
  BadgeCheckIcon,
  DumbbellIcon,
  Flower2Icon,
  SnowflakeIcon,
  SquareParkingIcon,
  UtensilsIcon,
  WavesIcon,
  WifiIcon,
  WineIcon,
  type LucideIcon,
} from "lucide-react";

// Keyed by amenities.icon (seeded as short slugs, not lucide names) — see
// backend/src/config/seed.ts's AMENITIES list. Falls back to a generic checkmark
// for any admin-entered icon slug not in this map.
const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: WifiIcon,
  pool: WavesIcon,
  dumbbell: DumbbellIcon,
  parking: SquareParkingIcon,
  spa: Flower2Icon,
  utensils: UtensilsIcon,
  glass: WineIcon,
  snowflake: SnowflakeIcon,
};

export function getAmenityIcon(icon: string): LucideIcon {
  return AMENITY_ICONS[icon] ?? BadgeCheckIcon;
}
