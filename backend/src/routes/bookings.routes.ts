import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireCronSecret } from "../middlewares/requireCronSecret";
import { validateRequest } from "../middlewares/validateRequest";
import { createBookingSchema } from "../types/booking.schemas";
import { writeReviewSchema } from "../types/review.schemas";
import {
  cancelBooking,
  completePast,
  createBooking,
  createReview,
  deleteReview,
  expireStale,
  getBooking,
  getBookings,
  getReview,
  updateReview,
} from "../controllers/bookings.controller";

const router = Router();
router.get("/", requireAuth, getBookings);
router.post("/", requireAuth, validateRequest(createBookingSchema), createBooking);
router.post("/expire-stale", requireCronSecret, expireStale);
router.post("/complete-past", requireCronSecret, completePast);
router.get("/:id", requireAuth, getBooking);
router.post("/:id/cancel", requireAuth, cancelBooking);
router.get("/:id/review", requireAuth, getReview);
router.post("/:id/review", requireAuth, validateRequest(writeReviewSchema), createReview);
router.patch("/:id/review", requireAuth, validateRequest(writeReviewSchema), updateReview);
router.delete("/:id/review", requireAuth, deleteReview);
export default router;
