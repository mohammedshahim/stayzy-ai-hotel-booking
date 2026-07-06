import { z } from "zod";

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Expected time in HH:MM format");

export const hotelInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional(),
  starRating: z.coerce.number().int().min(1).max(5),
  checkInTime: timeSchema,
  checkOutTime: timeSchema,
  freeCancellation: z.boolean().default(false),
  cancellationPolicy: z.string().min(1, "Cancellation policy is required"),
  status: z.enum(["draft", "published"]).default("draft"),
  amenityIds: z.array(z.string().uuid()).default([]),
});

export const createHotelSchema = hotelInputSchema;
export const updateHotelSchema = hotelInputSchema;

export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;

export const reorderHotelImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1),
  mainImageId: z.string().uuid(),
});

export type ReorderHotelImagesInput = z.infer<typeof reorderHotelImagesSchema>;
