import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { listBookings } from "../../controllers/admin/bookings.controller";

const router = Router();

router.use(requireAdmin);

router.get("/", listBookings);

export default router;
