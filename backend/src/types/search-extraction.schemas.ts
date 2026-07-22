import { z } from "zod";
import { SEARCH_SORT_OPTIONS } from "./search.schemas";

export const MAX_EXTRACTION_PROMPT_LENGTH = 500;

export const searchExtractionBodySchema = z.object({
  prompt: z.string().trim().min(1).max(MAX_EXTRACTION_PROMPT_LENGTH),
});

const extractedDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const extractedFiltersSchema = z.object({
  destination: z.string().trim().min(1).optional(),
  checkIn: extractedDateSchema.optional(),
  checkOut: extractedDateSchema.optional(),
  adults: z.number().int().min(1).optional(),
  kids: z.number().int().min(0).optional(),
  rooms: z.number().int().min(1).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  starRatings: z.array(z.number().int().min(1).max(5)).optional(),
  minGuestRating: z.number().min(0).max(10).optional(),
  amenities: z.array(z.string()).optional(),
  roomFeatures: z.array(z.string()).optional(),
  mealPlans: z.array(z.string()).optional(),
  freeCancellationOnly: z.boolean().optional(),
  sort: z.enum(SEARCH_SORT_OPTIONS).optional(),
});

// Taxonomy arrays hold names here; the service resolves them to ids.
export const agentExtractionSchema = z.object({
  filters: extractedFiltersSchema,
  unmapped: z.array(z.string()),
});

export type ExtractedSearchFilters = z.infer<typeof extractedFiltersSchema>;

export interface SearchFilterExtraction {
  filters: ExtractedSearchFilters;
  unmapped: string[];
}
