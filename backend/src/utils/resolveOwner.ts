import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth";
import { GUEST_SESSION_COOKIE, GUEST_SESSION_COOKIE_MAX_AGE_MS } from "./guestCookie";

export type Owner = { kind: "user"; userId: string } | { kind: "guest"; sessionToken: string };

export async function resolveOwner(req: Request, res: Response): Promise<Owner> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (session) {
    return { kind: "user", userId: session.user.id };
  }

  const existing = req.cookies[GUEST_SESSION_COOKIE];
  if (typeof existing === "string" && existing.length > 0) {
    return { kind: "guest", sessionToken: existing };
  }

  const sessionToken = randomUUID();
  res.cookie(GUEST_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GUEST_SESSION_COOKIE_MAX_AGE_MS,
  });
  return { kind: "guest", sessionToken };
}
