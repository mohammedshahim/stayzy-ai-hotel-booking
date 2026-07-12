import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { validateRequest } from "../middlewares/validateRequest";
import { createBookingSchema } from "../types/booking.schemas";
import { createBooking, getBooking } from "../controllers/bookings.controller";

const router = Router();
router.post("/", requireAuth, validateRequest(createBookingSchema), createBooking);
router.get("/:id", requireAuth, getBooking);
export default router;
