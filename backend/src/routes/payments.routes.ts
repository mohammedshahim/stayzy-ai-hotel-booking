import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { validateRequest } from "../middlewares/validateRequest";
import { createPaymentIntentSchema } from "../types/payment.schemas";
import { createPaymentIntent } from "../controllers/payments.controller";

const router = Router();
router.post("/intent", requireAuth, validateRequest(createPaymentIntentSchema), createPaymentIntent);
export default router;
