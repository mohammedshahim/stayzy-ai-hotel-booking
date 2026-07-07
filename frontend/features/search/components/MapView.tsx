"use client";

import { useEffect, useRef } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPinIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { HotelCard } from "@/features/search/components/HotelCard";
import type { SearchResultHotel } from "@/features/search/types";

type Props = {
  hotels: SearchResultHotel[];
  selectedHotelId: string | null;
  onSelectHotel: (hotelId: string) => void;
};

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export function MapView({ hotels, selectedHotelId, onSelectHotel }: Props) {
  const mapRef = useRef<MapRef>(null);
  // selectedHotelId is owned by SearchPageContent (so "View on map" from Grid/List can set it
  // before switching views) — fall back to the first result if it's unset or points at a hotel
  // that's no longer in the current (possibly re-filtered) result set.
  const effectiveSelectedId = hotels.some((hotel) => hotel.id === selectedHotelId)
    ? selectedHotelId
    : (hotels[0]?.id ?? null);

  useEffect(() => {
    const hotel = hotels.find((item) => item.id === effectiveSelectedId);
    if (hotel) {
      mapRef.current?.flyTo({ center: [hotel.longitude, hotel.latitude], zoom: 12, duration: 800 });
    }
  }, [effectiveSelectedId, hotels]);

  const initialHotel = hotels.find((item) => item.id === effectiveSelectedId) ?? hotels[0];
  if (!initialHotel) return null;

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_28rem]">
      <div className="flex flex-col gap-4">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            variant="list"
            isSelected={hotel.id === effectiveSelectedId}
            onLocate={() => onSelectHotel(hotel.id)}
          />
        ))}
      </div>

      <div className="h-80 overflow-hidden rounded-2xl border border-border-default lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          initialViewState={{
            longitude: initialHotel.longitude,
            latitude: initialHotel.latitude,
            zoom: 12,
          }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          style={{ width: "100%", height: "100%" }}
        >
          {hotels.map((hotel) => (
            <Marker
              key={hotel.id}
              longitude={hotel.longitude}
              latitude={hotel.latitude}
              onClick={() => onSelectHotel(hotel.id)}
            >
              <button
                type="button"
                aria-label={hotel.name}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-card transition-colors",
                  hotel.id === effectiveSelectedId
                    ? "border-accent-primary bg-accent-primary text-white"
                    : "border-border-default bg-elevated text-accent-primary",
                )}
              >
                <MapPinIcon className="h-4 w-4 fill-current" />
              </button>
            </Marker>
          ))}
        </Map>
      </div>
    </div>
  );
}
