import type { NextFunction, Request, Response } from "express";
import { searchHotelsByFilterNames } from "../../services/internal-search.service";
import { internalSearchQuerySchema } from "../../types/internal-search.schemas";

export async function searchInternal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = internalSearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid search query" });
      return;
    }

    const result = await searchHotelsByFilterNames(parsed.data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
