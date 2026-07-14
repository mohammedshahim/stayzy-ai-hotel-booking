import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { getDashboard } from "../../controllers/admin/dashboard.controller";

const router = Router();

router.use(requireAdmin);

router.get("/", getDashboard);

export default router;
