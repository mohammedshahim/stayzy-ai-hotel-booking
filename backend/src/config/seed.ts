import { db } from "./db";

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
      "https://images.stayzy.dev/seed/hotel-marais-charme/1.jpg",
      "https://images.stayzy.dev/seed/hotel-marais-charme/2.jpg",
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
        images: ["https://images.stayzy.dev/seed/hotel-marais-charme/room-classic.jpg"],
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
        images: ["https://images.stayzy.dev/seed/hotel-marais-charme/room-suite.jpg"],
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
      "https://images.stayzy.dev/seed/le-louvre-riverside/1.jpg",
      "https://images.stayzy.dev/seed/le-louvre-riverside/2.jpg",
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
        images: ["https://images.stayzy.dev/seed/le-louvre-riverside/room-king.jpg"],
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
        images: ["https://images.stayzy.dev/seed/le-louvre-riverside/room-suite.jpg"],
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
      "https://images.stayzy.dev/seed/shibuya-sky-hotel/1.jpg",
      "https://images.stayzy.dev/seed/shibuya-sky-hotel/2.jpg",
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
        images: ["https://images.stayzy.dev/seed/shibuya-sky-hotel/room-twin.jpg"],
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
        images: ["https://images.stayzy.dev/seed/shibuya-sky-hotel/room-suite.jpg"],
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
      "https://images.stayzy.dev/seed/asakusa-ryokan-inn/1.jpg",
      "https://images.stayzy.dev/seed/asakusa-ryokan-inn/2.jpg",
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
        images: ["https://images.stayzy.dev/seed/asakusa-ryokan-inn/room-tatami.jpg"],
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
        images: ["https://images.stayzy.dev/seed/asakusa-ryokan-inn/room-family.jpg"],
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
      "https://images.stayzy.dev/seed/midtown-manhattan-hotel/1.jpg",
      "https://images.stayzy.dev/seed/midtown-manhattan-hotel/2.jpg",
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
        images: ["https://images.stayzy.dev/seed/midtown-manhattan-hotel/room-queen.jpg"],
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
        images: ["https://images.stayzy.dev/seed/midtown-manhattan-hotel/room-suite.jpg"],
      },
    ],
  },
];

async function truncateSeededTables(): Promise<void> {
  await db.query(
    "TRUNCATE TABLE hotels, amenities, room_features, meal_plans RESTART IDENTITY CASCADE;"
  );
}

interface LookupRow {
  name: string;
  icon?: string;
}

async function insertLookupTable(
  table: "amenities" | "room_features" | "meal_plans",
  rows: readonly LookupRow[]
): Promise<Map<string, string>> {
  const idsByName = new Map<string, string>();

  for (const row of rows) {
    const columns = row.icon !== undefined ? ["name", "icon"] : ["name"];
    const values = row.icon !== undefined ? [row.name, row.icon] : [row.name];
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

    const { rows: inserted } = await db.query<{ id: string }>(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`,
      values
    );

    const insertedRow = inserted[0];
    if (!insertedRow) throw new Error(`[seed] failed to insert into ${table}: ${row.name}`);
    idsByName.set(row.name, insertedRow.id);
  }

  return idsByName;
}

async function seedHotels(
  amenityIdsByName: Map<string, string>,
  roomFeatureIdsByName: Map<string, string>,
  mealPlanIdsByName: Map<string, string>
): Promise<void> {
  for (const hotel of HOTELS) {
    const { rows: hotelRows } = await db.query<{ id: string }>(
      `INSERT INTO hotels (
        name, slug, description, address_line1, city, country, postal_code,
        location, star_rating, check_in_time, check_out_time,
        free_cancellation, cancellation_policy, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        ST_MakePoint($8, $9)::geography, $10, $11, $12,
        $13, $14, 'published'
      ) RETURNING id`,
      [
        hotel.name,
        hotel.slug,
        hotel.description,
        hotel.addressLine1,
        hotel.city,
        hotel.country,
        hotel.postalCode,
        hotel.lng,
        hotel.lat,
        hotel.starRating,
        hotel.checkInTime,
        hotel.checkOutTime,
        hotel.freeCancellation,
        hotel.cancellationPolicy,
      ]
    );

    const hotelRow = hotelRows[0];
    if (!hotelRow) throw new Error(`[seed] failed to insert hotel: ${hotel.slug}`);
    const hotelId = hotelRow.id;

    for (const [index, url] of hotel.images.entries()) {
      await db.query(
        `INSERT INTO hotel_images (hotel_id, url, is_main, sort_order) VALUES ($1, $2, $3, $4)`,
        [hotelId, url, index === 0, index]
      );
    }

    for (const amenityName of hotel.amenities) {
      const amenityId = amenityIdsByName.get(amenityName);
      if (!amenityId) throw new Error(`[seed] unknown amenity: ${amenityName}`);
      await db.query(`INSERT INTO hotel_amenities (hotel_id, amenity_id) VALUES ($1, $2)`, [
        hotelId,
        amenityId,
      ]);
    }

    for (const roomType of hotel.roomTypes) {
      const mealPlanId = mealPlanIdsByName.get(roomType.mealPlan);
      if (!mealPlanId) throw new Error(`[seed] unknown meal plan: ${roomType.mealPlan}`);

      const { rows: roomTypeRows } = await db.query<{ id: string }>(
        `INSERT INTO room_types (
          hotel_id, name, description, max_adults, max_kids,
          base_price, total_inventory, meal_plan_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          hotelId,
          roomType.name,
          roomType.description,
          roomType.maxAdults,
          roomType.maxKids,
          roomType.basePrice,
          roomType.totalInventory,
          mealPlanId,
        ]
      );

      const roomTypeRow = roomTypeRows[0];
      if (!roomTypeRow) throw new Error(`[seed] failed to insert room type: ${roomType.name}`);
      const roomTypeId = roomTypeRow.id;

      for (const [index, url] of roomType.images.entries()) {
        await db.query(
          `INSERT INTO room_type_images (room_type_id, url, is_main, sort_order) VALUES ($1, $2, $3, $4)`,
          [roomTypeId, url, index === 0, index]
        );
      }

      for (const featureName of roomType.features) {
        const featureId = roomFeatureIdsByName.get(featureName);
        if (!featureId) throw new Error(`[seed] unknown room feature: ${featureName}`);
        await db.query(
          `INSERT INTO room_type_features (room_type_id, room_feature_id) VALUES ($1, $2)`,
          [roomTypeId, featureId]
        );
      }
    }
  }
}

async function seed(): Promise<void> {
  await truncateSeededTables();

  const amenityIdsByName = await insertLookupTable("amenities", AMENITIES);
  const roomFeatureIdsByName = await insertLookupTable("room_features", ROOM_FEATURES);
  const mealPlanIdsByName = await insertLookupTable("meal_plans", MEAL_PLANS);

  await seedHotels(amenityIdsByName, roomFeatureIdsByName, mealPlanIdsByName);

  console.log(`[seed] inserted ${HOTELS.length} hotels across ${new Set(HOTELS.map((h) => h.city)).size} cities`);
}

seed()
  .then(() => db.end())
  .catch(async (error) => {
    console.error("[seed] error", error);
    await db.end();
    process.exit(1);
  });
