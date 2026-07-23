import { z } from "zod";
import {
  DEFAULT_SEARCH_RADIUS_KM,
  MAX_SEARCH_RADIUS_KM,
  SEARCH_SORT_OPTIONS,
} from "./search.schemas";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format");

function csvNames() {
  return z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
        : [],
    );
}

export const INTERNAL_SEARCH_MAX_PAGE_SIZE = 10;

// Smaller than the public default: every result is spent as model context.
export const INTERNAL_SEARCH_DEFAULT_PAGE_SIZE = 5;

export const internalSearchQuerySchema = z
  .object({
    destination: z.string().default(""),
    near: z.string().trim().min(1).optional(),
    radiusKm: z.coerce.number().positive().max(MAX_SEARCH_RADIUS_KM).default(DEFAULT_SEARCH_RADIUS_KM),
    checkIn: dateSchema.optional(),
    checkOut: dateSchema.optional(),
    adults: z.coerce.number().int().min(1).default(2),
    kids: z.coerce.number().int().min(0).default(0),
    rooms: z.coerce.number().int().min(1).default(1),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    starRatings: z
      .string()
      .optional()
      .transform((value) => (value ? value.split(",").filter(Boolean) : []))
      .pipe(z.array(z.coerce.number().int().min(1).max(5))),
    minGuestRating: z.coerce.number().min(0).max(10).optional(),
    amenities: csvNames(),
    roomFeatures: csvNames(),
    mealPlans: csvNames(),
    freeCancellationOnly: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    sort: z.enum(SEARCH_SORT_OPTIONS).default("recommended"),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(INTERNAL_SEARCH_MAX_PAGE_SIZE)
      .default(INTERNAL_SEARCH_DEFAULT_PAGE_SIZE),
  })
  .refine((data) => !data.checkIn || !data.checkOut || data.checkIn < data.checkOut, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export type InternalSearchQuery = z.infer<typeof internalSearchQuerySchema>;
