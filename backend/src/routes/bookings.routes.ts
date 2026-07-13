import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireCronSecret } from "../middlewares/requireCronSecret";
import { validateRequest } from "../middlewares/validateRequest";
import { createBookingSchema } from "../types/booking.schemas";
import { createBooking, expireStale, getBooking } from "../controllers/bookings.controller";

const router = Router();
router.post("/", requireAuth, validateRequest(createBookingSchema), createBooking);
router.post("/expire-stale", requireCronSecret, expireStale);
router.get("/:id", requireAuth, getBooking);
export default router;
