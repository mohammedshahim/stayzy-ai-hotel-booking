import type { NextFunction, Request, Response } from "express";
import {
  cancelBookingForUser,
  createBookingForUser,
  listBookingsForOwner,
} from "../../services/booking.service";
import { createReviewForBooking } from "../../services/review.service";
import { requireParam } from "../../utils/requireParam";

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

export async function postBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actingUserId = req.actingUserId;
    if (!actingUserId) {
      res.status(400).json({ success: false, error: "x-acting-user-id is required" });
      return;
    }

    const booking = await createBookingForUser(actingUserId, req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function postCancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actingUserId = req.actingUserId;
    if (!actingUserId) {
      res.status(400).json({ success: false, error: "x-acting-user-id is required" });
      return;
    }

    const id = requireParam(req.params.id, "id");
    const booking = await cancelBookingForUser(id, actingUserId);
    if (!booking) {
      res.status(404).json({ success: false, error: "Booking not found" });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function postReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actingUserId = req.actingUserId;
    if (!actingUserId) {
      res.status(400).json({ success: false, error: "x-acting-user-id is required" });
      return;
    }

    const id = requireParam(req.params.id, "id");
    const review = await createReviewForBooking(id, actingUserId, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}
