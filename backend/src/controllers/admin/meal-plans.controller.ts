import type { NextFunction, Request, Response } from "express";
import { listMealPlansForPicker } from "../../services/meal-plan.service";

export async function listMealPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const mealPlans = await listMealPlansForPicker();
    res.json({ success: true, data: mealPlans });
  } catch (error) {
    next(error);
  }
}
