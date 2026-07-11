import Map, { Marker } from "react-map-gl/mapbox";
import type { MarkerDragEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPinIcon } from "lucide-react";

type Props = {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
};

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export function HotelLocationPicker({ latitude, longitude, onChange }: Props) {
  return (
    <div className="h-64 overflow-hidden rounded-xl border border-border-default">
      <Map
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={{ longitude, latitude, zoom: 14 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: "100%", height: "100%" }}
      >
        <Marker
          longitude={longitude}
          latitude={latitude}
          draggable
          onDragEnd={(event: MarkerDragEvent) => onChange(event.lngLat.lat, event.lngLat.lng)}
        >
          <div className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full border-2 border-accent-primary bg-accent-primary text-white shadow-card active:cursor-grabbing">
            <MapPinIcon className="h-4 w-4 fill-current" />
          </div>
        </Marker>
      </Map>
    </div>
  );
}
