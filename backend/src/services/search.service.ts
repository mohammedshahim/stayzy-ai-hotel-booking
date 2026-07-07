import { findCandidateHotels } from "../queries/search.queries";
import { findQualifyingRoomTypes, pickCheapestPerHotel } from "./availability.service";
import { listMealPlansForPicker } from "./meal-plan.service";
import { listRoomFeaturesForPicker } from "./room-feature.service";
import type { SearchQuery } from "../types/search.schemas";

export type SortOption = SearchQuery["sort"];

export interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  minPrice: number | null;
  maxPrice: number | null;
  starRatings: number[];
  minGuestRating: number | null;
  amenityIds: string[];
  mealPlanIds: string[];
  roomFeatureIds: string[];
  freeCancellationOnly: boolean;
  sort: SortOption;
  page: number;
  pageSize: number;
}

export interface SearchResultHotel {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  image: string | null;
  starRating: number;
  guestRating: number;
  reviewCount: number;
  amenities: string[];
  roomType: string;
  mealPlan: string;
  roomFeatures: string[];
  freeCancellation: boolean;
  pricePerNight: number;
}

export interface SearchResponse {
  items: SearchResultHotel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_MEAL_PLAN_LABEL = "Room Only";
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * sinLon ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// "distance" sort has no landmark/destination reference point to measure from (see
// build-plan.md Feature 09's /architect session) — it sorts against the centroid of the
// matched result set itself, computed here rather than via an external geocoding call.
function sortResults(results: SearchResultHotel[], sort: SortOption): SearchResultHotel[] {
  const sorted = [...results];

  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
    case "price_desc":
      return sorted.sort((a, b) => b.pricePerNight - a.pricePerNight);
    case "guest_rating":
      return sorted.sort((a, b) => b.guestRating - a.guestRating);
    case "star_rating":
      return sorted.sort((a, b) => b.starRating - a.starRating);
    case "distance": {
      if (sorted.length === 0) return sorted;
      const centroid = {
        latitude: sorted.reduce((sum, hotel) => sum + hotel.latitude, 0) / sorted.length,
        longitude: sorted.reduce((sum, hotel) => sum + hotel.longitude, 0) / sorted.length,
      };
      return sorted.sort((a, b) => distanceKm(centroid, a) - distanceKm(centroid, b));
    }
    case "recommended":
    default:
      return sorted.sort((a, b) => b.guestRating - a.guestRating || b.reviewCount - a.reviewCount);
  }
}

export async function searchHotels(params: SearchParams): Promise<SearchResponse> {
  const candidates = await findCandidateHotels({
    destination: params.destination,
    starRatings: params.starRatings,
    minGuestRating: params.minGuestRating,
    amenityIds: params.amenityIds,
  });

  if (candidates.length === 0) {
    return { items: [], total: 0, page: 1, pageSize: params.pageSize, totalPages: 1 };
  }

  const hotelsById = new Map(candidates.map((hotel) => [hotel.id, hotel]));
  const qualifyingRoomTypes = await findQualifyingRoomTypes({
    hotelsById,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    kids: params.kids,
    rooms: params.rooms,
    mealPlanIds: params.mealPlanIds,
    roomFeatureIds: params.roomFeatureIds,
    freeCancellationOnly: params.freeCancellationOnly,
  });
  const cheapestByHotel = pickCheapestPerHotel(qualifyingRoomTypes);

  const [mealPlans, roomFeatures] = await Promise.all([listMealPlansForPicker(), listRoomFeaturesForPicker()]);
  const mealPlanNameById = new Map(mealPlans.map((mealPlan) => [mealPlan.id, mealPlan.name]));
  const roomFeatureNameById = new Map(roomFeatures.map((roomFeature) => [roomFeature.id, roomFeature.name]));

  let results: SearchResultHotel[] = [];
  for (const hotel of candidates) {
    const roomType = cheapestByHotel.get(hotel.id);
    if (!roomType) continue;

    const pricePerNight = Math.round(roomType.avgNightlyPrice);
    if (params.minPrice !== null && pricePerNight < params.minPrice) continue;
    if (params.maxPrice !== null && pricePerNight > params.maxPrice) continue;

    results.push({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      image: hotel.mainImageUrl,
      starRating: hotel.starRating,
      guestRating: hotel.averageRating,
      reviewCount: hotel.reviewCount,
      amenities: hotel.amenities,
      roomType: roomType.name,
      mealPlan: roomType.mealPlanId ? (mealPlanNameById.get(roomType.mealPlanId) ?? DEFAULT_MEAL_PLAN_LABEL) : DEFAULT_MEAL_PLAN_LABEL,
      roomFeatures: roomType.roomFeatureIds
        .map((id) => roomFeatureNameById.get(id))
        .filter((name): name is string => Boolean(name)),
      freeCancellation: roomType.freeCancellation,
      pricePerNight,
    });
  }

  results = sortResults(results, params.sort);

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;

  return {
    items: results.slice(start, start + params.pageSize),
    total,
    page,
    pageSize: params.pageSize,
    totalPages,
  };
}
