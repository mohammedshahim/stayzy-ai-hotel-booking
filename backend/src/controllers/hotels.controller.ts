import type { NextFunction, Request, Response } from "express";
import { getHotelsForCompare, getPublishedHotelDetails, getSimilarHotels, searchHotelSuggestions } from "../services/hotel.service";
import { listRoomTypesWithAvailability } from "../services/room-type.service";
import { getHotelReviews as getHotelReviewsResult } from "../services/review.service";
import { roomTypeAvailabilityQuerySchema } from "../types/room-type.schemas";
import { hotelReviewsQuerySchema } from "../types/review.schemas";
import { compareHotelsQuerySchema, hotelSearchSuggestionsQuerySchema } from "../types/compare.schemas";
import { requireParam } from "../utils/requireParam";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function getHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const hotel = await getPublishedHotelDetails(id);
    if (!hotel) {
      res.status(404).json({ success: false, error: "Hotel not found" });
      return;
    }
    res.json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
}

export async function getHotelRoomTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const parsed = roomTypeAvailabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid query" });
      return;
    }
    const query = parsed.data;

    // Same post-default ordering re-check as /search's controller — the schema's refine only
    // validates ordering when both dates are supplied together.
    const checkIn = query.checkIn ?? todayIso();
    const checkOut = query.checkOut ?? tomorrowIso();
    if (checkOut <= checkIn) {
      res.status(400).json({ success: false, error: "checkOut must be after checkIn" });
      return;
    }

    const hotel = await getPublishedHotelDetails(id);
    if (!hotel) {
      res.status(404).json({ success: false, error: "Hotel not found" });
      return;
    }

    const roomTypes = await listRoomTypesWithAvailability({
      hotelId: id,
      checkIn,
      checkOut,
      adults: query.adults,
      kids: query.kids,
      rooms: query.rooms,
    });
    res.json({ success: true, data: roomTypes });
  } catch (error) {
    next(error);
  }
}

export async function getHotelSimilar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const hotel = await getPublishedHotelDetails(id);
    if (!hotel) {
      res.status(404).json({ success: false, error: "Hotel not found" });
      return;
    }
    const similarHotels = await getSimilarHotels(hotel);
    res.json({ success: true, data: similarHotels });
  } catch (error) {
    next(error);
  }
}

export async function getHotelReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const parsed = hotelReviewsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid query" });
      return;
    }

    const hotel = await getPublishedHotelDetails(id);
    if (!hotel) {
      res.status(404).json({ success: false, error: "Hotel not found" });
      return;
    }

    const result = await getHotelReviewsResult(hotel, parsed.data.page, parsed.data.pageSize);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getHotelsCompare(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = compareHotelsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid query" });
      return;
    }

    res.json({ success: true, data: await getHotelsForCompare(parsed.data.ids) });
  } catch (error) {
    next(error);
  }
}

export async function getHotelSearchSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = hotelSearchSuggestionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid query" });
      return;
    }

    res.json({ success: true, data: await searchHotelSuggestions(parsed.data.q, parsed.data.excludeIds) });
  } catch (error) {
    next(error);
  }
}
