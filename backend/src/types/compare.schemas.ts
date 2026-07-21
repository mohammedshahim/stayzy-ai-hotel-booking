import { z } from "zod";

// Mirrors search.schemas.ts's csvList but kept local — not worth sharing for a single query param.
const MAX_COMPARE_IDS = 10;

export const compareHotelsQuerySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(",").filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(1).max(MAX_COMPARE_IDS)),
});

export type CompareHotelsQuery = z.infer<typeof compareHotelsQuerySchema>;

export const MIN_COMPARE_SUMMARY_HOTELS = 2;
// Mirrors MAX_COMPARE_HOTELS in the frontend's CompareProvider.
export const MAX_COMPARE_SUMMARY_HOTELS = 4;

export const compareSummaryQuerySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(",").filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(MIN_COMPARE_SUMMARY_HOTELS).max(MAX_COMPARE_SUMMARY_HOTELS)),
});

export type CompareSummaryQuery = z.infer<typeof compareSummaryQuerySchema>;

export const hotelSearchSuggestionsQuerySchema = z.object({
  q: z.string().min(1),
  excludeIds: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(",").filter(Boolean) : []))
    .pipe(z.array(z.string().uuid())),
});

export type HotelSearchSuggestionsQuery = z.infer<typeof hotelSearchSuggestionsQuerySchema>;
