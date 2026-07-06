import type { NextFunction, Request, Response } from "express";
import { listAmenitiesForPicker } from "../../services/amenity.service";

export async function listAmenities(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const amenities = await listAmenitiesForPicker();
    res.json({ success: true, data: amenities });
  } catch (error) {
    next(error);
  }
}
