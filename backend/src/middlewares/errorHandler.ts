import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[${req.method} ${req.path}]`, err);
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({ success: false, error: err.message ?? "Internal server error" });
}
