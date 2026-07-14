import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { validateRequest } from "../../middlewares/validateRequest";
import { reallocateBookingSchema } from "../../types/booking.schemas";
import {
  cancelBooking,
  confirmBooking,
  getBooking,
  listBookings,
  reallocateBooking,
} from "../../controllers/admin/bookings.controller";

const router = Router();

router.use(requireAdmin);

router.get("/", listBookings);
router.get("/:id", getBooking);
router.post("/:id/confirm", confirmBooking);
router.post("/:id/cancel", cancelBooking);
router.post("/:id/reallocate", validateRequest(reallocateBookingSchema), reallocateBooking);

export default router;
