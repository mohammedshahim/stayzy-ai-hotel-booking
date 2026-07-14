import type { NextFunction, Request, Response } from "express";
import { getAdminDashboard } from "../../services/dashboard.service";

function stringParam(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await getAdminDashboard(stringParam(req.query.checkInFrom), stringParam(req.query.checkInTo));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
