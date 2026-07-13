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

// Keyed by amenities.icon slugs (backend/src/config/seed.ts); unknown slugs fall back to a checkmark.
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
