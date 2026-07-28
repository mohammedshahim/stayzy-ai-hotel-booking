import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db, pool } from "./db";
import { amenities, hotelAmenities, hotelImages, hotels } from "../models/hotel.schema";
import { mealPlans, roomFeatures, roomTypeFeatures, roomTypeImages, roomTypes } from "../models/room-type.schema";
import { bookings, reviews } from "../models/booking.schema";
import { user } from "../models/auth.schema";

const AMENITIES = [
  { name: "Free Wi-Fi", icon: "wifi" },
  { name: "Swimming Pool", icon: "pool" },
  { name: "Gym", icon: "dumbbell" },
  { name: "Parking", icon: "parking" },
  { name: "Spa", icon: "spa" },
  { name: "Restaurant", icon: "utensils" },
  { name: "Bar", icon: "glass" },
  { name: "Air Conditioning", icon: "snowflake" },
] as const;

const ROOM_FEATURES = [
  { name: "City View" },
  { name: "Sea View" },
  { name: "Balcony" },
  { name: "Air Conditioning" },
  { name: "Extra Bed" },
] as const;

const MEAL_PLANS = [
  { name: "Room Only" },
  { name: "Breakfast Included" },
  { name: "Half Board" },
  { name: "Full Board" },
] as const;

interface RoomTypeSeed {
  name: string;
  description: string;
  maxAdults: number;
  maxKids: number;
  basePrice: number;
  totalInventory: number;
  mealPlan: string;
  features: string[];
  images: string[];
}

interface ReviewSeed {
  reviewerName: string;
  rating: number;
  description: string;
  checkIn: string;
  checkOut: string;
  reviewCreatedAt: string;
}

interface HotelSeed {
  name: string;
  slug: string;
  description: string;
  addressLine1: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  lat: number;
  lng: number;
  starRating: number;
  averageRating: number;
  reviewCount: number;
  checkInTime: string;
  checkOutTime: string;
  freeCancellation: boolean;
  cancellationPolicy: string;
  amenities: string[];
  images: string[];
  roomTypes: RoomTypeSeed[];
  reviews: ReviewSeed[];
}

const HOTELS: HotelSeed[] = JSON.parse(readFileSync(join(__dirname, "seed-hotels.json"), "utf8"));

function reviewerIdFor(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `seed-reviewer-${slug || "guest"}`;
}

async function truncateSeededTables(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE hotels, amenities, room_features, meal_plans RESTART IDENTITY CASCADE;`);
}

async function insertAmenities(rows: readonly { name: string; icon: string }[]): Promise<Map<string, string>> {
  const idsByName = new Map<string, string>();
  for (const row of rows) {
    const [inserted] = await db.insert(amenities).values(row).returning({ id: amenities.id });
    if (!inserted) throw new Error(`[seed] failed to insert amenity: ${row.name}`);
    idsByName.set(row.name, inserted.id);
  }
  return idsByName;
}

async function insertNamedLookup(
  table: "room_features" | "meal_plans",
  target: typeof roomFeatures | typeof mealPlans,
  rows: readonly { name: string }[]
): Promise<Map<string, string>> {
  const idsByName = new Map<string, string>();
  for (const row of rows) {
    const [inserted] = await db.insert(target).values(row).returning({ id: target.id });
    if (!inserted) throw new Error(`[seed] failed to insert into ${table}: ${row.name}`);
    idsByName.set(row.name, inserted.id);
  }
  return idsByName;
}

interface HotelRef {
  hotelId: string;
  roomTypeId: string;
}

async function seedHotels(
  amenityIdsByName: Map<string, string>,
  roomFeatureIdsByName: Map<string, string>,
  mealPlanIdsByName: Map<string, string>
): Promise<Map<string, HotelRef>> {
  const hotelRefsBySlug = new Map<string, HotelRef>();

  for (const hotel of HOTELS) {
    const [hotelRow] = await db
      .insert(hotels)
      .values({
        name: hotel.name,
        slug: hotel.slug,
        description: hotel.description,
        addressLine1: hotel.addressLine1,
        city: hotel.city,
        state: hotel.state,
        country: hotel.country,
        postalCode: hotel.postalCode,
        location: { latitude: hotel.lat, longitude: hotel.lng },
        starRating: hotel.starRating,
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
        freeCancellation: hotel.freeCancellation,
        cancellationPolicy: hotel.cancellationPolicy,
        averageRating: hotel.averageRating,
        reviewCount: hotel.reviewCount,
        status: "published",
      })
      .returning({ id: hotels.id });

    if (!hotelRow) throw new Error(`[seed] failed to insert hotel: ${hotel.slug}`);
    const hotelId = hotelRow.id;

    if (hotel.images.length > 0) {
      await db
        .insert(hotelImages)
        .values(hotel.images.map((url, index) => ({ hotelId, url, isMain: index === 0, sortOrder: index })));
    }

    if (hotel.amenities.length > 0) {
      await db.insert(hotelAmenities).values(
        hotel.amenities.map((amenityName) => {
          const amenityId = amenityIdsByName.get(amenityName);
          if (!amenityId) throw new Error(`[seed] unknown amenity: ${amenityName}`);
          return { hotelId, amenityId };
        })
      );
    }

    let firstRoomTypeId: string | null = null;

    for (const roomType of hotel.roomTypes) {
      const mealPlanId = mealPlanIdsByName.get(roomType.mealPlan);
      if (!mealPlanId) throw new Error(`[seed] unknown meal plan: ${roomType.mealPlan}`);

      const [roomTypeRow] = await db
        .insert(roomTypes)
        .values({
          hotelId,
          name: roomType.name,
          description: roomType.description,
          maxAdults: roomType.maxAdults,
          maxKids: roomType.maxKids,
          basePrice: roomType.basePrice,
          totalInventory: roomType.totalInventory,
          mealPlanId,
        })
        .returning({ id: roomTypes.id });

      if (!roomTypeRow) throw new Error(`[seed] failed to insert room type: ${roomType.name}`);
      const roomTypeId = roomTypeRow.id;
      firstRoomTypeId ??= roomTypeId;

      if (roomType.images.length > 0) {
        await db
          .insert(roomTypeImages)
          .values(roomType.images.map((url, index) => ({ roomTypeId, url, isMain: index === 0, sortOrder: index })));
      }

      if (roomType.features.length > 0) {
        await db.insert(roomTypeFeatures).values(
          roomType.features.map((featureName) => {
            const roomFeatureId = roomFeatureIdsByName.get(featureName);
            if (!roomFeatureId) throw new Error(`[seed] unknown room feature: ${featureName}`);
            return { roomTypeId, roomFeatureId };
          })
        );
      }
    }

    if (firstRoomTypeId) {
      hotelRefsBySlug.set(hotel.slug, { hotelId, roomTypeId: firstRoomTypeId });
    }
  }

  return hotelRefsBySlug;
}

async function seedDemoReviewers(): Promise<void> {
  const byId = new Map<string, string>();
  for (const hotel of HOTELS) {
    for (const review of hotel.reviews) byId.set(reviewerIdFor(review.reviewerName), review.reviewerName);
  }

  for (const [id, name] of byId) {
    await db
      .insert(user)
      .values({ id, name, email: `${id}@stayzy-seed.example`, emailVerified: true })
      .onConflictDoNothing({ target: user.id });
  }
}

async function seedReviews(hotelRefsBySlug: Map<string, HotelRef>): Promise<number> {
  let inserted = 0;

  for (const hotel of HOTELS) {
    const ref = hotelRefsBySlug.get(hotel.slug);
    if (!ref) continue;

    for (const review of hotel.reviews) {
      const nights = Math.round(
        (new Date(review.checkOut).getTime() - new Date(review.checkIn).getTime()) / (24 * 60 * 60 * 1000)
      );
      const nightlyRate = hotel.roomTypes[0]?.basePrice ?? 100;

      const [bookingRow] = await db
        .insert(bookings)
        .values({
          userId: reviewerIdFor(review.reviewerName),
          hotelId: ref.hotelId,
          roomTypeId: ref.roomTypeId,
          checkIn: review.checkIn,
          checkOut: review.checkOut,
          adults: 2,
          kids: 0,
          roomsBooked: 1,
          totalPrice: nights * nightlyRate,
          status: "completed",
        })
        .returning({ id: bookings.id });

      if (!bookingRow) throw new Error(`[seed] failed to insert booking for review seed: ${hotel.slug}`);

      await db.insert(reviews).values({
        bookingId: bookingRow.id,
        userId: reviewerIdFor(review.reviewerName),
        hotelId: ref.hotelId,
        rating: review.rating,
        description: review.description,
        createdAt: review.reviewCreatedAt,
        updatedAt: review.reviewCreatedAt,
      });
      inserted++;
    }
  }

  return inserted;
}

async function seed(): Promise<void> {
  await truncateSeededTables();

  const amenityIdsByName = await insertAmenities(AMENITIES);
  const roomFeatureIdsByName = await insertNamedLookup("room_features", roomFeatures, ROOM_FEATURES);
  const mealPlanIdsByName = await insertNamedLookup("meal_plans", mealPlans, MEAL_PLANS);

  const hotelRefsBySlug = await seedHotels(amenityIdsByName, roomFeatureIdsByName, mealPlanIdsByName);

  await seedDemoReviewers();
  const reviewCount = await seedReviews(hotelRefsBySlug);

  const roomTypeCount = HOTELS.reduce((sum, hotel) => sum + hotel.roomTypes.length, 0);
  console.log(`[seed] inserted ${HOTELS.length} hotels across ${new Set(HOTELS.map((h) => h.city)).size} cities`);
  console.log(`[seed] inserted ${roomTypeCount} room types`);
  console.log(`[seed] inserted ${reviewCount} reviews`);
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("[seed] error", error);
    await pool.end();
    process.exit(1);
  });
