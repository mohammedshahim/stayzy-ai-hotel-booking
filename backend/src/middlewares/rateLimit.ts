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

// Keyed on the user: chat is authenticated, so it cannot ride the IP-keyed limiter below.
export const chatRateLimit = rateLimit({
  windowMs: env.CHAT_RATE_LIMIT_WINDOW_MS,
  limit: env.CHAT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? "chat:anonymous",
  handler: (_req, res) => {
    res.status(429).json({ success: false, error: "Rate limit exceeded" });
  },
});

// Keyed on IP (the library default), the opposite of internalRateLimit above and
// deliberately so: these are real browsers on a public route, with no user to key
// on. Behind a production proxy this needs `trust proxy` or every visitor collapses
// into one bucket — see architecture.md.
export const aiRateLimit = rateLimit({
  windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
  limit: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ success: false, error: "Rate limit exceeded" });
  },
});
