import type { NextFunction, Request, Response } from "express";
import { getCompareSummary, getHotelSummary } from "../services/ai.service";
import { compareSummaryQuerySchema } from "../types/compare.schemas";
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

export async function getCompareAiSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = compareSummaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid query" });
      return;
    }

    const summary = await getCompareSummary(parsed.data.ids);
    res.json({ success: true, data: { summary } });
  } catch (error) {
    next(error);
  }
}
