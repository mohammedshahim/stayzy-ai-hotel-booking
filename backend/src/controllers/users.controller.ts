import type { NextFunction, Request, Response } from "express";
import { APIError } from "better-auth";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth";

export async function postSetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await auth.api.setPassword({
      headers: fromNodeHeaders(req.headers),
      body: { newPassword: req.body.newPassword },
    });
    res.json({ success: true, data: null });
  } catch (error) {
    if (error instanceof APIError) {
      res.status(error.statusCode).json({ success: false, error: error.body?.message ?? error.message });
      return;
    }
    next(error);
  }
}
