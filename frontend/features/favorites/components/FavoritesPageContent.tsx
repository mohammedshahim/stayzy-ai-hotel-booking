"use client";

import Link from "next/link";
import { HeartIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { useFavoritesList } from "@/features/favorites/hooks/useFavoritesList";
import { FavoritesCard } from "@/features/favorites/components/FavoritesCard";

export function FavoritesPageContent() {
  const { favorites, isLoading, removeFavorite } = useFavoritesList();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">Favorites</h1>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-text-muted">Loading favorites…</p>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          heading="No favorites yet"
          body="Hotels you favorite while browsing will show up here."
          action={
            <Button
              render={<Link href="/search" />}
              nativeButton={false}
              className="h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
            >
              Browse hotels
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((hotel) => (
            <FavoritesCard key={hotel.id} hotel={hotel} onRemove={() => removeFavorite(hotel.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
