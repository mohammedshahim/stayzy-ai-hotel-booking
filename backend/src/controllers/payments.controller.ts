import type { NextFunction, Request, Response } from "express";
import { createPaymentIntentForBooking } from "../services/payment.service";
import type { CreatePaymentIntentInput } from "../types/payment.schemas";

export async function createPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const { bookingId } = req.body as CreatePaymentIntentInput;
    const result = await createPaymentIntentForBooking(user.id, bookingId);
    if (!result) {
      res.status(404).json({ success: false, error: "Booking not found" });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
