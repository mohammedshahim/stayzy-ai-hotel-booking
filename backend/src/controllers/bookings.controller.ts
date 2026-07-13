import type { NextFunction, Request, Response } from "express";
import {
  cancelBookingForUser,
  completePastBookings,
  createBookingForUser,
  expireStaleBookings,
  getBookingSummaryForOwner,
  listBookingsForOwner,
} from "../services/booking.service";
import {
  createReviewForBooking,
  deleteReviewForBooking,
  getOwnReviewForBooking,
  updateReviewForBooking,
} from "../services/review.service";
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

export async function completePast(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const completed = await completePastBookings();
    res.json({ success: true, data: { count: completed.length, bookingIds: completed.map((b) => b.id) } });
  } catch (error) {
    next(error);
  }
}

export async function getReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const id = requireParam(req.params.id, "id");
    const review = await getOwnReviewForBooking(id, user.id);
    if (!review) {
      res.status(404).json({ success: false, error: "Review not found" });
      return;
    }
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const id = requireParam(req.params.id, "id");
    const review = await createReviewForBooking(id, user.id, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function updateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const id = requireParam(req.params.id, "id");
    const review = await updateReviewForBooking(id, user.id, req.body);
    if (!review) {
      res.status(404).json({ success: false, error: "Review not found" });
      return;
    }
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const id = requireParam(req.params.id, "id");
    const deleted = await deleteReviewForBooking(id, user.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Review not found" });
      return;
    }
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
