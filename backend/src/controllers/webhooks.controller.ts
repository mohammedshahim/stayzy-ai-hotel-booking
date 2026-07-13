import type { NextFunction, Request, Response } from "express";
import { constructStripeEvent, handleStripeEvent } from "../services/webhook.service";

export async function handleStripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = req.header("stripe-signature");
    if (!signature) {
      res.status(400).json({ success: false, error: "Missing stripe-signature header" });
      return;
    }

    const event = constructStripeEvent(req.body as Buffer, signature);
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
}
