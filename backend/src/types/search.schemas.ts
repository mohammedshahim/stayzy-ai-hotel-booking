import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format");

function csvList<T extends z.ZodTypeAny>(itemSchema: T) {
  return z
    .string()
    .optional()
    .transform((value) => (value ? value.split(",").filter(Boolean) : []))
    .pipe(z.array(itemSchema));
}

export const searchQuerySchema = z
  .object({
    destination: z.string().default(""),
    checkIn: dateSchema.optional(),
    checkOut: dateSchema.optional(),
    adults: z.coerce.number().int().min(1).default(2),
    kids: z.coerce.number().int().min(0).default(0),
    rooms: z.coerce.number().int().min(1).default(1),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    starRatings: csvList(z.coerce.number().int().min(1).max(5)),
    minGuestRating: z.coerce.number().min(0).max(10).optional(),
    amenities: csvList(z.string().uuid()),
    roomFeatures: csvList(z.string().uuid()),
    mealPlans: csvList(z.string().uuid()),
    freeCancellationOnly: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    sort: z
      .enum(["recommended", "price_asc", "price_desc", "guest_rating", "star_rating", "distance"])
      .default("recommended"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(9),
  })
  .refine((data) => !data.checkIn || !data.checkOut || data.checkIn < data.checkOut, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export type SearchQuery = z.infer<typeof searchQuerySchema>;
