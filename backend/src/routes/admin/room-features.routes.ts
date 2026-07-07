import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { listRoomFeatures } from "../../controllers/admin/room-features.controller";

const router = Router();

router.use(requireAdmin);
router.get("/", listRoomFeatures);

export default router;
