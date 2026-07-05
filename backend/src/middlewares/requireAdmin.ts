import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { authAdmin } from "../config/auth-admin";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await authAdmin.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }
  req.adminUser = session.user;
  next();
}
