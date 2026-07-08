import { HotelIcon } from "lucide-react";

import { Footer } from "@/components/layout/Footer";
import { HeroSearchWidget } from "@/features/search/components/HeroSearchWidget";
import { RecentSearches } from "@/features/recent-searches/components/RecentSearches";
import { TrendingDestinations } from "@/features/trending-destinations/components/TrendingDestinations";

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h1 className="text-4xl leading-tight font-semibold text-text-primary md:text-5xl xl:text-6xl">
              Find your next stay, without the tab juggling.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary">
              Search, compare, and book hotels in one flow — from destination to confirmed
              reservation.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-elevated">
            <div className="absolute inset-0 flex items-center justify-center">
              <HotelIcon className="h-16 w-16 text-text-faint" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-8 lg:-mt-16">
          <HeroSearchWidget />
        </div>
      </section>
      <RecentSearches />
      <TrendingDestinations />
      <Footer />
    </>
  );
}
