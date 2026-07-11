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

interface HotelSeed {
  name: string;
  slug: string;
  description: string;
  addressLine1: string;
  city: string;
  country: string;
  postalCode: string;
  lat: number;
  lng: number;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
  freeCancellation: boolean;
  cancellationPolicy: string;
  amenities: string[];
  images: string[];
  roomTypes: {
    name: string;
    description: string;
    maxAdults: number;
    maxKids: number;
    basePrice: number;
    totalInventory: number;
    mealPlan: string;
    features: string[];
    images: string[];
  }[];
}

// Reviews requires a booking, but Booking Creation (Feature 19) doesn't exist yet — these
// demo reviewer accounts and their bookings exist purely to satisfy the FK chain for
// Feature 16's seed reviews below. Additive only: never truncated, never modified.
const DEMO_REVIEWERS = [
  { id: "seed-reviewer-amara-chen", name: "Amara Chen", email: "amara.chen@stayzy-seed.example" },
  { id: "seed-reviewer-diego-alvarez", name: "Diego Alvarez", email: "diego.alvarez@stayzy-seed.example" },
  { id: "seed-reviewer-priya-nair", name: "Priya Nair", email: "priya.nair@stayzy-seed.example" },
] as const;

interface ReviewSeed {
  hotelSlug: string;
  reviewerId: string;
  rating: number;
  description: string;
  checkIn: string;
  checkOut: string;
  nightlyRate: number;
  reviewCreatedAt: string;
}

// Only 2 of the 5 hotels get seeded reviews on purpose — the rest exercise the
// "no reviews yet" empty state. hotel-marais-charme also gets 6 (more than the
// pageSize of 5) so "load more" pagination has something real to fetch.
const REVIEWS: ReviewSeed[] = [
  {
    hotelSlug: "hotel-marais-charme",
    reviewerId: "seed-reviewer-amara-chen",
    rating: 5,
    description: "Loved the location right in the Marais — walked everywhere. Room was small but charming.",
    checkIn: "2026-04-10",
    checkOut: "2026-04-13",
    nightlyRate: 145,
    reviewCreatedAt: "2026-04-15T09:00:00.000Z",
  },
  {
    hotelSlug: "hotel-marais-charme",
    reviewerId: "seed-reviewer-diego-alvarez",
    rating: 4,
    description: "Great breakfast and friendly staff, though the walls are a bit thin.",
    checkIn: "2026-04-20",
    checkOut: "2026-04-22",
    nightlyRate: 145,
    reviewCreatedAt: "2026-04-24T14:30:00.000Z",
  },
  {
    hotelSlug: "hotel-marais-charme",
    reviewerId: "seed-reviewer-priya-nair",
    rating: 5,
    description: "Beautiful boutique hotel, felt like staying in a real Parisian apartment.",
    checkIn: "2026-05-02",
    checkOut: "2026-05-05",
    nightlyRate: 145,
    reviewCreatedAt: "2026-05-07T11:15:00.000Z",
  },
  {
    hotelSlug: "hotel-marais-charme",
    reviewerId: "seed-reviewer-amara-chen",
    rating: 3,
    description: "Second stay wasn't as good — the AC struggled during the heatwave.",
    checkIn: "2026-06-01",
    checkOut: "2026-06-03",
    nightlyRate: 145,
    reviewCreatedAt: "2026-06-05T18:45:00.000Z",
  },
  {
    hotelSlug: "hotel-marais-charme",
    reviewerId: "seed-reviewer-diego-alvarez",
    rating: 5,
    description: "Perfect base for exploring the city, would come back in a heartbeat.",
    checkIn: "2026-06-15",
    checkOut: "2026-06-18",
    nightlyRate: 145,
    reviewCreatedAt: "2026-06-20T08:20:00.000Z",
  },
  {
    hotelSlug: "hotel-marais-charme",
    reviewerId: "seed-reviewer-priya-nair",
    rating: 4,
    description: "Cozy and well located, just wish the elevator was faster.",
    checkIn: "2026-07-01",
    checkOut: "2026-07-03",
    nightlyRate: 145,
    reviewCreatedAt: "2026-07-05T10:00:00.000Z",
  },
  {
    hotelSlug: "midtown-manhattan-hotel",
    reviewerId: "seed-reviewer-diego-alvarez",
    rating: 4,
    description: "Solid Midtown location, easy walk to Times Square. Rooms are a bit compact.",
    checkIn: "2026-05-10",
    checkOut: "2026-05-13",
    nightlyRate: 190,
    reviewCreatedAt: "2026-05-15T16:00:00.000Z",
  },
  {
    hotelSlug: "midtown-manhattan-hotel",
    reviewerId: "seed-reviewer-priya-nair",
    rating: 5,
    description: "Skyline suite was worth every penny — incredible views toward the Hudson.",
    checkIn: "2026-06-08",
    checkOut: "2026-06-11",
    nightlyRate: 380,
    reviewCreatedAt: "2026-06-13T13:10:00.000Z",
  },
];

const HOTELS: HotelSeed[] = [
  {
    name: "Hotel Marais Charme",
    slug: "hotel-marais-charme",
    description: "A boutique hotel tucked into the historic Marais district, steps from the Seine.",
    addressLine1: "12 Rue des Archives",
    city: "Paris",
    country: "France",
    postalCode: "75004",
    lat: 48.8586,
    lng: 2.3603,
    starRating: 4,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    freeCancellation: true,
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    amenities: ["Free Wi-Fi", "Bar", "Restaurant"],
    images: [
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/hotel-marais-charme/81a2a292-69ac-40a1-88ff-79a259466e9d.jpg",
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/hotel-marais-charme/65056ea2-1672-486a-b3a5-3b294c1a4cc2.jpg",
    ],
    roomTypes: [
      {
        name: "Classic Double Room",
        description: "Cozy double room with parquet floors and a view over the rooftops.",
        maxAdults: 2,
        maxKids: 1,
        basePrice: 145,
        totalInventory: 10,
        mealPlan: "Room Only",
        features: ["City View", "Air Conditioning"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/hotel-marais-charme/room-classic/830847b5-d059-47c5-84c1-5e3155a3d231.jpg",
        ],
      },
      {
        name: "Deluxe Suite",
        description: "Spacious suite with a separate sitting area and Juliet balcony.",
        maxAdults: 3,
        maxKids: 1,
        basePrice: 245,
        totalInventory: 5,
        mealPlan: "Breakfast Included",
        features: ["City View", "Balcony", "Air Conditioning"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/hotel-marais-charme/room-suite/7460567e-2e68-4676-903e-011e1794216b.jpg",
        ],
      },
    ],
  },
  {
    name: "Le Louvre Riverside",
    slug: "le-louvre-riverside",
    description: "Riverside stay a short walk from the Louvre, favored for its rooftop terrace.",
    addressLine1: "5 Quai Voltaire",
    city: "Paris",
    country: "France",
    postalCode: "75007",
    lat: 48.8598,
    lng: 2.3282,
    starRating: 5,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    freeCancellation: false,
    cancellationPolicy: "Non-refundable within 7 days of check-in.",
    amenities: ["Free Wi-Fi", "Spa", "Gym", "Restaurant", "Bar"],
    images: [
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/le-louvre-riverside/3d8ac5d7-1762-4b07-a2de-52dbe91f7f78.jpg",
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/le-louvre-riverside/b80bc355-0440-40c7-9436-c1ee0163938e.jpg",
    ],
    roomTypes: [
      {
        name: "Superior King Room",
        description: "King bed room with river-facing windows.",
        maxAdults: 2,
        maxKids: 0,
        basePrice: 320,
        totalInventory: 8,
        mealPlan: "Breakfast Included",
        features: ["Sea View", "Air Conditioning"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/le-louvre-riverside/room-king/46f7dd6a-90e4-4d33-8eaf-6ff26a2adb87.jpg",
        ],
      },
      {
        name: "Executive Suite",
        description: "Top-floor suite with a private terrace and full board dining.",
        maxAdults: 4,
        maxKids: 2,
        basePrice: 520,
        totalInventory: 3,
        mealPlan: "Full Board",
        features: ["Sea View", "Balcony", "Extra Bed"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/le-louvre-riverside/room-suite/ac1b8d86-7039-4c56-9f33-faa805015a01.jpg",
        ],
      },
    ],
  },
  {
    name: "Shibuya Sky Hotel",
    slug: "shibuya-sky-hotel",
    description: "Modern high-rise hotel above Shibuya's crossing, built for the city's energy.",
    addressLine1: "2-1 Dogenzaka",
    city: "Tokyo",
    country: "Japan",
    postalCode: "150-0043",
    lat: 35.6595,
    lng: 139.7005,
    starRating: 4,
    checkInTime: "15:00",
    checkOutTime: "10:00",
    freeCancellation: true,
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Air Conditioning"],
    images: [
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/shibuya-sky-hotel/6952dc3b-44c1-4066-8185-b7268a9df5de.jpg",
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/shibuya-sky-hotel/76a7c08d-0333-4eac-90e8-61890e082bc9.jpg",
    ],
    roomTypes: [
      {
        name: "Standard Twin Room",
        description: "Compact twin room with city-facing windows.",
        maxAdults: 2,
        maxKids: 0,
        basePrice: 110,
        totalInventory: 15,
        mealPlan: "Room Only",
        features: ["City View", "Air Conditioning"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/shibuya-sky-hotel/room-twin/e0dd81f5-0dbd-4493-861b-06c22cf50701.jpg",
        ],
      },
      {
        name: "Sky Corner Suite",
        description: "Corner suite with floor-to-ceiling views over the crossing.",
        maxAdults: 3,
        maxKids: 1,
        basePrice: 260,
        totalInventory: 4,
        mealPlan: "Half Board",
        features: ["City View", "Air Conditioning"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/shibuya-sky-hotel/room-suite/342debef-0d39-4239-b145-527db752341f.jpg",
        ],
      },
    ],
  },
  {
    name: "Asakusa Ryokan Inn",
    slug: "asakusa-ryokan-inn",
    description: "Traditional ryokan-style inn near Senso-ji Temple, blending old and new Tokyo.",
    addressLine1: "3-4 Asakusa",
    city: "Tokyo",
    country: "Japan",
    postalCode: "111-0032",
    lat: 35.7118,
    lng: 139.7967,
    starRating: 3,
    checkInTime: "16:00",
    checkOutTime: "10:00",
    freeCancellation: true,
    cancellationPolicy: "Free cancellation up to 72 hours before check-in.",
    amenities: ["Free Wi-Fi", "Parking"],
    images: [
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/asakusa-ryokan-inn/0b4c034d-6964-44da-b9bd-799a7f6fe3c3.jpg",
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/asakusa-ryokan-inn/211783ee-ceab-4534-987c-698bf4fde8e1.jpg",
    ],
    roomTypes: [
      {
        name: "Tatami Room",
        description: "Traditional tatami-mat room with futon bedding.",
        maxAdults: 2,
        maxKids: 2,
        basePrice: 85,
        totalInventory: 12,
        mealPlan: "Breakfast Included",
        features: ["City View"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/asakusa-ryokan-inn/room-tatami/34860bde-d1c3-4712-aca8-5ea766fd6a68.jpg",
        ],
      },
      {
        name: "Family Tatami Suite",
        description: "Larger tatami suite that sleeps a family of four.",
        maxAdults: 2,
        maxKids: 3,
        basePrice: 140,
        totalInventory: 6,
        mealPlan: "Half Board",
        features: ["City View", "Extra Bed"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/asakusa-ryokan-inn/room-family/9e0e5725-b8ce-4f01-8e1f-7ecb687aaafa.jpg",
        ],
      },
    ],
  },
  {
    name: "Midtown Manhattan Hotel",
    slug: "midtown-manhattan-hotel",
    description: "Classic Manhattan hotel a few blocks from Times Square and Central Park.",
    addressLine1: "225 W 46th St",
    city: "New York",
    country: "United States",
    postalCode: "10036",
    lat: 40.759,
    lng: -73.9845,
    starRating: 4,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    freeCancellation: false,
    cancellationPolicy: "Non-refundable within 5 days of check-in.",
    amenities: ["Free Wi-Fi", "Gym", "Bar", "Air Conditioning", "Parking"],
    images: [
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/midtown-manhattan-hotel/2418050f-555e-4a56-a781-f1722816d7d5.jpg",
      "https://stayzy-storage.s3.ap-south-1.amazonaws.com/hotels/seed/midtown-manhattan-hotel/b59e5468-d56e-4aea-810f-dfbd3e967859.jpg",
    ],
    roomTypes: [
      {
        name: "Queen Room",
        description: "Queen bed room with a compact work desk.",
        maxAdults: 2,
        maxKids: 1,
        basePrice: 190,
        totalInventory: 20,
        mealPlan: "Room Only",
        features: ["City View", "Air Conditioning"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/midtown-manhattan-hotel/room-queen/5345aa4a-9bda-4a87-b416-7b5c752bdc67.jpg",
        ],
      },
      {
        name: "Skyline Suite",
        description: "High-floor suite with skyline views toward the Hudson.",
        maxAdults: 3,
        maxKids: 2,
        basePrice: 380,
        totalInventory: 4,
        mealPlan: "Breakfast Included",
        features: ["City View", "Balcony", "Air Conditioning", "Extra Bed"],
        images: [
          "https://stayzy-storage.s3.ap-south-1.amazonaws.com/room-types/seed/midtown-manhattan-hotel/room-suite/19ebf543-4637-4356-bf68-ea9235e648b6.jpg",
        ],
      },
    ],
  },
];

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
        country: hotel.country,
        postalCode: hotel.postalCode,
        location: { latitude: hotel.lat, longitude: hotel.lng },
        starRating: hotel.starRating,
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
        freeCancellation: hotel.freeCancellation,
        cancellationPolicy: hotel.cancellationPolicy,
        status: "published",
      })
      .returning({ id: hotels.id });

    if (!hotelRow) throw new Error(`[seed] failed to insert hotel: ${hotel.slug}`);
    const hotelId = hotelRow.id;

    await db
      .insert(hotelImages)
      .values(hotel.images.map((url, index) => ({ hotelId, url, isMain: index === 0, sortOrder: index })));

    await db.insert(hotelAmenities).values(
      hotel.amenities.map((amenityName) => {
        const amenityId = amenityIdsByName.get(amenityName);
        if (!amenityId) throw new Error(`[seed] unknown amenity: ${amenityName}`);
        return { hotelId, amenityId };
      })
    );

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

      await db
        .insert(roomTypeImages)
        .values(roomType.images.map((url, index) => ({ roomTypeId, url, isMain: index === 0, sortOrder: index })));

      await db.insert(roomTypeFeatures).values(
        roomType.features.map((featureName) => {
          const roomFeatureId = roomFeatureIdsByName.get(featureName);
          if (!roomFeatureId) throw new Error(`[seed] unknown room feature: ${featureName}`);
          return { roomTypeId, roomFeatureId };
        })
      );
    }

    if (firstRoomTypeId) {
      hotelRefsBySlug.set(hotel.slug, { hotelId, roomTypeId: firstRoomTypeId });
    }
  }

  return hotelRefsBySlug;
}

async function seedDemoReviewers(): Promise<void> {
  for (const reviewer of DEMO_REVIEWERS) {
    await db
      .insert(user)
      .values({ id: reviewer.id, name: reviewer.name, email: reviewer.email, emailVerified: true })
      .onConflictDoNothing({ target: user.id });
  }
}

async function seedReviews(hotelRefsBySlug: Map<string, HotelRef>): Promise<void> {
  for (const review of REVIEWS) {
    const ref = hotelRefsBySlug.get(review.hotelSlug);
    if (!ref) throw new Error(`[seed] unknown hotel slug for review seed: ${review.hotelSlug}`);

    const nights = Math.round(
      (new Date(review.checkOut).getTime() - new Date(review.checkIn).getTime()) / (24 * 60 * 60 * 1000)
    );

    const [bookingRow] = await db
      .insert(bookings)
      .values({
        userId: review.reviewerId,
        hotelId: ref.hotelId,
        roomTypeId: ref.roomTypeId,
        checkIn: review.checkIn,
        checkOut: review.checkOut,
        adults: 2,
        kids: 0,
        roomsBooked: 1,
        totalPrice: nights * review.nightlyRate,
        status: "completed",
      })
      .returning({ id: bookings.id });

    if (!bookingRow) throw new Error(`[seed] failed to insert booking for review seed: ${review.hotelSlug}`);

    await db.insert(reviews).values({
      bookingId: bookingRow.id,
      userId: review.reviewerId,
      hotelId: ref.hotelId,
      rating: review.rating,
      description: review.description,
      createdAt: review.reviewCreatedAt,
      updatedAt: review.reviewCreatedAt,
    });
  }
}

async function seed(): Promise<void> {
  await truncateSeededTables();

  const amenityIdsByName = await insertAmenities(AMENITIES);
  const roomFeatureIdsByName = await insertNamedLookup("room_features", roomFeatures, ROOM_FEATURES);
  const mealPlanIdsByName = await insertNamedLookup("meal_plans", mealPlans, MEAL_PLANS);

  const hotelRefsBySlug = await seedHotels(amenityIdsByName, roomFeatureIdsByName, mealPlanIdsByName);

  await seedDemoReviewers();
  await seedReviews(hotelRefsBySlug);

  console.log(`[seed] inserted ${HOTELS.length} hotels across ${new Set(HOTELS.map((h) => h.city)).size} cities`);
  console.log(`[seed] inserted ${REVIEWS.length} reviews across ${new Set(REVIEWS.map((r) => r.hotelSlug)).size} hotels`);
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("[seed] error", error);
    await pool.end();
    process.exit(1);
  });
