import type { NextFunction, Request, Response } from "express";
import { listFavorites } from "../../services/favorite.service";

export async function getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actingUserId = req.actingUserId;
    if (!actingUserId) {
      res.status(400).json({ success: false, error: "x-acting-user-id is required" });
      return;
    }

    const favorites = await listFavorites({ kind: "user", userId: actingUserId });
    res.json({ success: true, data: favorites });
  } catch (error) {
    next(error);
  }
}
