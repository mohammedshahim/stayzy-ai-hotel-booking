import type { NextFunction, Request, Response } from "express";
import { getPublishedHotelDetails } from "../services/hotel.service";
import { requireParam } from "../utils/requireParam";

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
