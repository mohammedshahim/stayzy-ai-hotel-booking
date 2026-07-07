import type { NextFunction, Request, Response } from "express";
import { listRoomFeaturesForPicker } from "../services/room-feature.service";

export async function listRoomFeatures(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: await listRoomFeaturesForPicker() });
  } catch (error) {
    next(error);
  }
}
