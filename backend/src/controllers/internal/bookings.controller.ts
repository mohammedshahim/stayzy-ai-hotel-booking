import type { NextFunction, Request, Response } from "express";
import { listBookingsForOwner } from "../../services/booking.service";

export async function getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actingUserId = req.actingUserId;
    if (!actingUserId) {
      res.status(400).json({ success: false, error: "x-acting-user-id is required" });
      return;
    }

    const bookings = await listBookingsForOwner(actingUserId);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
}
