import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env";
import * as adminAuthSchema from "../models/admin-auth.schema";
import * as authSchema from "../models/auth.schema";
import * as bookingSchema from "../models/booking.schema";
import * as favoriteSchema from "../models/favorite.schema";
import * as hotelSchema from "../models/hotel.schema";
import * as roomTypeSchema from "../models/room-type.schema";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const schema = {
  ...hotelSchema,
  ...roomTypeSchema,
  ...bookingSchema,
  ...favoriteSchema,
  ...authSchema,
  ...adminAuthSchema,
};

export const db = drizzle(pool, { schema });
