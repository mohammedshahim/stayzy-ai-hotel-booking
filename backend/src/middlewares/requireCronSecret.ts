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

export function requireCronSecret(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header("x-cron-secret");
  if (!env.CRON_SECRET || !provided || !isValidSecret(provided, env.CRON_SECRET)) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }
  next();
}
