import express, { Router } from "express";
import { handleStripeWebhook } from "../controllers/webhooks.controller";

const router = Router();
// Stripe signature verification needs the exact raw bytes, so this route must never pass through express.json().
router.post("/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);
export default router;
