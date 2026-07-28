"use client";

import Link from "next/link";
import { MapPinIcon } from "lucide-react";

import { useTrendingDestinations } from "@/features/trending-destinations/hooks/useTrendingDestinations";

export function TrendingDestinations() {
  const trendingDestinations = useTrendingDestinations();

  if (trendingDestinations.length === 0) return null;

  return (
    <section className="border-y border-border-default bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <span className="text-sm text-accent-text">Explore</span>
        <h2 className="mt-1 text-3xl font-semibold text-text-primary">Trending Destinations</h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          The most booked cities on Stayzy right now.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {trendingDestinations.map((destination) => (
            <Link
              key={`${destination.city}-${destination.country}`}
              href={`/search?destination=${encodeURIComponent(`${destination.city}, ${destination.country}`)}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-elevated"
            >
              {destination.mainImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet
                <img
                  src={destination.mainImageUrl}
                  alt={destination.city}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPinIcon className="h-10 w-10 text-text-faint" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="font-medium text-white">{destination.city}</p>
                <p className="text-xs text-white/70">{destination.country}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
