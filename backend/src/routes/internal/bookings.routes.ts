import { Router } from "express";
import { requireInternalService } from "../../middlewares/requireInternalService";
import { internalRateLimit } from "../../middlewares/rateLimit";
import { getBookings } from "../../controllers/internal/bookings.controller";

const router = Router();

// Order matters: the limiter keys on the acting user this guard sets.
router.use(requireInternalService);
router.use(internalRateLimit);

router.get("/", getBookings);

export default router;
