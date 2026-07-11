import { z } from "zod";

export const hotelReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(5),
});

export type HotelReviewsQuery = z.infer<typeof hotelReviewsQuerySchema>;
