import type { NextFunction, Request, Response } from "express";
import { listAmenitiesForPicker } from "../services/amenity.service";

export async function listAmenities(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: await listAmenitiesForPicker() });
  } catch (error) {
    next(error);
  }
}
