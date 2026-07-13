import type { NextFunction, Request, Response } from "express";
import { searchQuerySchema } from "../types/search.schemas";
import { searchHotels } from "../services/search.service";
import { recordSearchIfChanged } from "../services/recent-search.service";
import { resolveOwner } from "../utils/resolveOwner";
import { todayIso, tomorrowIso } from "../utils/date";

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid search query" });
      return;
    }
    const query = parsed.data;

    // Re-check post-default: the schema's refine only validates ordering when both dates are supplied together.
    const checkIn = query.checkIn ?? todayIso();
    const checkOut = query.checkOut ?? tomorrowIso();
    if (checkOut <= checkIn) {
      res.status(400).json({ success: false, error: "checkOut must be after checkIn" });
      return;
    }

    const owner = await resolveOwner(req, res);

    const [result] = await Promise.all([
      searchHotels({
        destination: query.destination,
        checkIn,
        checkOut,
        adults: query.adults,
        kids: query.kids,
        rooms: query.rooms,
        minPrice: query.minPrice ?? null,
        maxPrice: query.maxPrice ?? null,
        starRatings: query.starRatings,
        minGuestRating: query.minGuestRating ?? null,
        amenityIds: query.amenities,
        mealPlanIds: query.mealPlans,
        roomFeatureIds: query.roomFeatures,
        freeCancellationOnly: query.freeCancellationOnly ?? false,
        sort: query.sort,
        page: query.page,
        pageSize: query.pageSize,
      }),
      recordSearchIfChanged(owner, {
        destinationQuery: query.destination,
        checkIn,
        checkOut,
        adults: query.adults,
        kids: query.kids,
        rooms: query.rooms,
      }),
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
