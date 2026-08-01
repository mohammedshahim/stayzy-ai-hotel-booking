import { z } from "zod";

export const setPasswordBodySchema = z.object({
  newPassword: z.string().min(8),
});

export type SetPasswordBody = z.infer<typeof setPasswordBodySchema>;
