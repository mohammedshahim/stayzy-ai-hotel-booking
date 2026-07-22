import type { NextFunction, Request, Response } from "express";
import { getCompareSummary, getHotelSummary } from "../services/ai.service";
import { extractSearchFilters } from "../services/search-extraction.service";
import { compareSummaryQuerySchema } from "../types/compare.schemas";
import { searchExtractionBodySchema } from "../types/search-extraction.schemas";
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

export async function extractSearchQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = searchExtractionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid prompt" });
      return;
    }

    const extraction = await extractSearchFilters(parsed.data.prompt);
    res.json({ success: true, data: extraction });
  } catch (error) {
    next(error);
  }
}
