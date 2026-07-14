import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format");

export const createBookingSchema = z
  .object({
    hotelId: z.string().uuid(),
    roomTypeId: z.string().uuid(),
    checkIn: dateSchema,
    checkOut: dateSchema,
    adults: z.coerce.number().int().min(1),
    kids: z.coerce.number().int().min(0).default(0),
    rooms: z.coerce.number().int().min(1),
  })
  .refine((data) => data.checkIn < data.checkOut, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const reallocateBookingSchema = z.object({
  roomTypeId: z.string().uuid(),
});

export type ReallocateBookingInput = z.infer<typeof reallocateBookingSchema>;
