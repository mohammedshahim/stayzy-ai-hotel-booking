"use client";

import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPinIcon, NavigationIcon } from "lucide-react";

type Props = {
  latitude: number;
  longitude: number;
};

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export function LocationMapPanel({ latitude, longitude }: Props) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
      <div className="border-b border-border-default px-5 py-4">
        <h2 className="text-lg font-semibold text-text-primary">Location</h2>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="h-64 overflow-hidden rounded-xl border border-border-default">
          <Map
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
            initialViewState={{ longitude, latitude, zoom: 14 }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            style={{ width: "100%", height: "100%" }}
          >
            <Marker longitude={longitude} latitude={latitude}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent-primary bg-accent-primary text-white shadow-card">
                <MapPinIcon className="h-4 w-4 fill-current" />
              </div>
            </Marker>
          </Map>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-text transition-colors hover:text-accent-hover"
        >
          <NavigationIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
          Get directions
        </a>
      </div>
    </div>
  );
}
