import { z } from "zod";

export const MAX_CHAT_MESSAGE_LENGTH = 1000;

const pageContextSchema = z.object({
  path: z.string().min(1),
  hotelId: z.string().uuid().optional(),
  hotelName: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
});

export const chatWidgetBodySchema = z.object({
  message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
  context: pageContextSchema.optional(),
});

export type ChatWidgetBody = z.infer<typeof chatWidgetBodySchema>;
