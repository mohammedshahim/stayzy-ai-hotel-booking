import { z } from "zod";

export const hotelReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(5),
});

export type HotelReviewsQuery = z.infer<typeof hotelReviewsQuerySchema>;

export const writeReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  description: z.string().trim().min(1),
});

export type WriteReviewInput = z.infer<typeof writeReviewSchema>;
