import type { NextFunction, Request, Response } from "express";
import {
  cancelBookingForUser,
  createBookingForUser,
  expireStaleBookings,
  getBookingSummaryForOwner,
  listBookingsForOwner,
} from "../services/booking.service";
import { requireParam } from "../utils/requireParam";

export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    if (!user.emailVerified) {
      res.status(403).json({ success: false, error: "email_not_verified" });
      return;
    }

    const booking = await createBookingForUser(user.id, req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const id = requireParam(req.params.id, "id");
    const booking = await getBookingSummaryForOwner(id, user.id);
    if (!booking) {
      res.status(404).json({ success: false, error: "Booking not found" });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const bookings = await listBookingsForOwner(user.id);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const id = requireParam(req.params.id, "id");
    const booking = await cancelBookingForUser(id, user.id);
    if (!booking) {
      res.status(404).json({ success: false, error: "Booking not found" });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function expireStale(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expired = await expireStaleBookings();
    res.json({ success: true, data: { count: expired.length, bookingIds: expired.map((b) => b.id) } });
  } catch (error) {
    next(error);
  }
}
