import type { NextFunction, Request, Response } from "express";
import { buildSuggestions, listRecentSearches } from "../services/recent-search.service";
import { searchSuggestionsQuerySchema } from "../types/recent-search.schemas";
import { resolveOwner } from "../utils/resolveOwner";

export async function getRecentSearches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const owner = await resolveOwner(req, res);
    res.json({ success: true, data: await listRecentSearches(owner) });
  } catch (error) {
    next(error);
  }
}

export async function getSearchSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = searchSuggestionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid search query" });
      return;
    }

    const owner = await resolveOwner(req, res);
    res.json({ success: true, data: await buildSuggestions(owner, parsed.data.q) });
  } catch (error) {
    next(error);
  }
}
