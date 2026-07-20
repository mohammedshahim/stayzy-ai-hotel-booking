import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Keyed on the acting user, never IP: all internal traffic comes from the one
// agent/ process, so an IP key would collapse every user into one bucket.
export const internalRateLimit = rateLimit({
  windowMs: env.INTERNAL_RATE_LIMIT_WINDOW_MS,
  limit: env.INTERNAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.actingUserId ?? "internal:no-acting-user",
  handler: (_req, res) => {
    res.status(429).json({ success: false, error: "Rate limit exceeded" });
  },
});
