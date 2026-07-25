import { Router } from "express";
import { requireInternalService } from "../../middlewares/requireInternalService";
import { internalRateLimit } from "../../middlewares/rateLimit";
import { validateRequest } from "../../middlewares/validateRequest";
import { createBookingSchema } from "../../types/booking.schemas";
import { writeReviewSchema } from "../../types/review.schemas";
import {
  getBookings,
  postBooking,
  postCancel,
  postReview,
} from "../../controllers/internal/bookings.controller";

const router = Router();

// Order matters: the limiter keys on the acting user this guard sets.
router.use(requireInternalService);
router.use(internalRateLimit);

router.get("/", getBookings);
router.post("/", validateRequest(createBookingSchema), postBooking);
router.post("/:id/cancel", postCancel);
router.post("/:id/review", validateRequest(writeReviewSchema), postReview);

export default router;
