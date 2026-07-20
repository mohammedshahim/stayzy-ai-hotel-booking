import { timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

// Constant-time compare so response timing can't leak the secret byte-by-byte.
function isValidSecret(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

// The acting user is trusted, not verified — agent/ is a first-party service.
// Optional because not every internal route is user-scoped.
export function requireInternalService(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header("x-internal-secret");
  if (!provided || !isValidSecret(provided, env.INTERNAL_SERVICE_SECRET)) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  const actingUserId = req.header("x-acting-user-id");
  if (actingUserId) req.actingUserId = actingUserId;

  next();
}
