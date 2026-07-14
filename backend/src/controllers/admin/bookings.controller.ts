import type { NextFunction, Request, Response } from "express";
import {
  cancelBookingForAdmin,
  confirmBookingForAdmin,
  getBookingForAdmin,
  listBookingsForAdmin,
  reallocateBookingForAdmin,
} from "../../services/booking.service";
import { requireParam } from "../../utils/requireParam";

function stringParam(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const result = await listBookingsForAdmin({
      status: stringParam(req.query.status),
      hotelId: stringParam(req.query.hotelId),
      checkInFrom: stringParam(req.query.checkInFrom),
      checkInTo: stringParam(req.query.checkInTo),
      page,
      pageSize,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const booking = await getBookingForAdmin(id);
    if (!booking) {
      res.status(404).json({ success: false, error: "Booking not found" });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function confirmBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const booking = await confirmBookingForAdmin(id);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const booking = await cancelBookingForAdmin(id);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function reallocateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const booking = await reallocateBookingForAdmin(id, req.body);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}
