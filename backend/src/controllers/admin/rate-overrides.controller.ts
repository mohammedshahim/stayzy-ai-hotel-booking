import type { NextFunction, Request, Response } from "express";
import * as rateOverrideService from "../../services/rate-override.service";
import { requireParam } from "../../utils/requireParam";

export async function listRateOverrides(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomTypeId = requireParam(req.params.id, "id");
    const ranges = await rateOverrideService.listRateOverridesForRoomType(roomTypeId);
    res.json({ success: true, data: ranges });
  } catch (error) {
    next(error);
  }
}

export async function createRateOverrideRange(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomTypeId = requireParam(req.params.id, "id");
    const ranges = await rateOverrideService.createRateOverrideRange(roomTypeId, req.body);
    res.status(201).json({ success: true, data: ranges });
  } catch (error) {
    next(error);
  }
}

export async function deleteRateOverrideRange(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomTypeId = requireParam(req.params.id, "id");
    const ranges = await rateOverrideService.deleteRateOverrideRange(roomTypeId, req.body);
    res.json({ success: true, data: ranges });
  } catch (error) {
    next(error);
  }
}
