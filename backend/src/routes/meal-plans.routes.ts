import { Router } from "express";
import { listMealPlans } from "../controllers/meal-plans.controller";

const router = Router();
router.get("/", listMealPlans);

export default router;
