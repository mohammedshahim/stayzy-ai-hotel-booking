import type { NextFunction, Request, Response } from "express";
import { listMealPlansForPicker } from "../services/meal-plan.service";

export async function listMealPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: await listMealPlansForPicker() });
  } catch (error) {
    next(error);
  }
}
