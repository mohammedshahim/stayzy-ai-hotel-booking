import {
  deleteFavorite as deleteFavoriteQuery,
  findFavoriteHotelIds,
  findFavoritesForOwner,
  insertFavorite,
  mergeGuestFavorites as mergeGuestFavoritesQuery,
} from "../queries/favorites.queries";
import type { FavoriteHotelRow } from "../queries/favorites.queries";
import type { Owner } from "../utils/resolveOwner";

const UNIQUE_VIOLATION = "23505";

export async function listFavorites(owner: Owner): Promise<FavoriteHotelRow[]> {
  return findFavoritesForOwner(owner);
}

export async function listFavoriteHotelIds(owner: Owner): Promise<string[]> {
  return findFavoriteHotelIds(owner);
}

// Idempotent by design — a double-click/race hitting the partial unique index is treated as a no-op success, not an error.
export async function addFavorite(owner: Owner, hotelId: string): Promise<void> {
  try {
    await insertFavorite(owner, hotelId);
  } catch (error) {
    // pg driver errors arrive wrapped in DrizzleQueryError's `.cause`, not on the error itself.
    const code = (error as { cause?: { code?: string } }).cause?.code;
    if (code === UNIQUE_VIOLATION) return;
    throw error;
  }
}

export async function removeFavorite(owner: Owner, hotelId: string): Promise<boolean> {
  return deleteFavoriteQuery(owner, hotelId);
}

export async function mergeGuestFavorites(sessionToken: string, userId: string): Promise<void> {
  await mergeGuestFavoritesQuery(sessionToken, userId);
}
