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

export const chatbotBodySchema = z
  .object({
    sessionId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH).optional(),
    decision: z.object({ approved: z.boolean() }).optional(),
  })
  .refine((body) => (body.message === undefined) !== (body.decision === undefined), {
    message: "Send either a message or a decision, not both",
  });

export type ChatbotBody = z.infer<typeof chatbotBodySchema>;

export const chatbotPendingQuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
});

const hotelActionSchema = z.object({
  label: z.string().min(1),
  hotelId: z.string().uuid(),
  hotelName: z.string().min(1),
});

export const chatActionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("navigate"),
    label: z.string().min(1),
    filters: z.record(z.unknown()),
  }),
  hotelActionSchema.extend({ kind: z.literal("open_hotel") }),
  hotelActionSchema.extend({ kind: z.literal("compare") }),
  z.object({
    kind: z.literal("checkout"),
    label: z.string().min(1),
    path: z.string().startsWith("/checkout/"),
  }),
]);

export const assistantMessageBodySchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().trim().min(1),
  actions: z.array(chatActionSchema).optional(),
});

export type ChatAction = z.infer<typeof chatActionSchema>;
export type AssistantMessageBody = z.infer<typeof assistantMessageBodySchema>;
