import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { listMealPlans } from "../../controllers/admin/meal-plans.controller";

const router = Router();

router.use(requireAdmin);
router.get("/", listMealPlans);

export default router;
