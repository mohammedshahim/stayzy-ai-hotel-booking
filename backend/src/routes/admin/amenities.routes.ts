import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { listAmenities } from "../../controllers/admin/amenities.controller";

const router = Router();

router.use(requireAdmin);
router.get("/", listAmenities);

export default router;
