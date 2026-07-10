import { z } from "zod";

export const roomTypeInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  maxAdults: z.coerce.number().int().min(1),
  maxKids: z.coerce.number().int().min(0).default(0),
  basePrice: z.coerce.number().positive("Base price must be greater than 0"),
  totalInventory: z.coerce.number().int().min(0),
  freeCancellation: z.boolean().nullable().default(null),
  mealPlanId: z.string().uuid().nullable().default(null),
  roomFeatureIds: z.array(z.string().uuid()).default([]),
});

export const createRoomTypeSchema = roomTypeInputSchema;
export const updateRoomTypeSchema = roomTypeInputSchema;

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;

export const reorderRoomTypeImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1),
  mainImageId: z.string().uuid(),
});

export type ReorderRoomTypeImagesInput = z.infer<typeof reorderRoomTypeImagesSchema>;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format");

export const createRateOverrideRangeSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
    price: z.coerce.number().positive().nullable().default(null),
    availableOverride: z.coerce.number().int().min(0).nullable().default(null),
  })
  .refine((data) => data.price !== null || data.availableOverride !== null, {
    message: "Provide at least a price or an availability override",
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "startDate must be on or before endDate",
    path: ["endDate"],
  });

export type CreateRateOverrideRangeInput = z.infer<typeof createRateOverrideRangeSchema>;

export const deleteRateOverrideRangeSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "startDate must be on or before endDate",
    path: ["endDate"],
  });

export type DeleteRateOverrideRangeInput = z.infer<typeof deleteRateOverrideRangeSchema>;

export const roomTypeAvailabilityQuerySchema = z
  .object({
    checkIn: dateSchema.optional(),
    checkOut: dateSchema.optional(),
    adults: z.coerce.number().int().min(1).default(2),
    kids: z.coerce.number().int().min(0).default(0),
    rooms: z.coerce.number().int().min(1).default(1),
  })
  .refine((data) => !data.checkIn || !data.checkOut || data.checkIn < data.checkOut, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export type RoomTypeAvailabilityQuery = z.infer<typeof roomTypeAvailabilityQuerySchema>;
