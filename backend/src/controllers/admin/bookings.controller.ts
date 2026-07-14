import type { NextFunction, Request, Response } from "express";
import { listBookingsForAdmin } from "../../services/booking.service";

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
