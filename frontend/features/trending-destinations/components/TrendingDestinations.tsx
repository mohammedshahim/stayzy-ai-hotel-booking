import { MapPinIcon } from "lucide-react";

type Destination = {
  city: string;
  country: string;
};

const TRENDING_DESTINATIONS: Destination[] = [
  { city: "Paris", country: "France" },
  { city: "Tokyo", country: "Japan" },
  { city: "New York", country: "United States" },
  { city: "Rome", country: "Italy" },
  { city: "Barcelona", country: "Spain" },
  { city: "Dubai", country: "United Arab Emirates" },
  { city: "London", country: "United Kingdom" },
  { city: "Bali", country: "Indonesia" },
];

export function TrendingDestinations() {
  return (
    <section className="border-y border-border-default bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <span className="text-sm text-accent-text">Explore</span>
        <h2 className="mt-1 text-3xl font-semibold text-text-primary">Trending Destinations</h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          The most booked cities on Stayzy right now.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {TRENDING_DESTINATIONS.map((destination) => (
            <div
              key={destination.city}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-elevated"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPinIcon className="h-10 w-10 text-text-faint" strokeWidth={1.5} />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="font-medium text-white">{destination.city}</p>
                <p className="text-xs text-white/70">{destination.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
