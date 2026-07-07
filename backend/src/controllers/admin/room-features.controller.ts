import type { NextFunction, Request, Response } from "express";
import { listRoomFeaturesForPicker } from "../../services/room-feature.service";

export async function listRoomFeatures(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomFeatures = await listRoomFeaturesForPicker();
    res.json({ success: true, data: roomFeatures });
  } catch (error) {
    next(error);
  }
}
