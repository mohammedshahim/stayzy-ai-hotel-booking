import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
