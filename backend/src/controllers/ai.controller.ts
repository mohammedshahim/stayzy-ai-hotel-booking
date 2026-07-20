import type { NextFunction, Request, Response } from "express";
import { getHotelSummary } from "../services/ai.service";
import { requireParam } from "../utils/requireParam";

export async function getHotelAiSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const summary = await getHotelSummary(id);
    res.json({ success: true, data: { summary } });
  } catch (error) {
    next(error);
  }
}
