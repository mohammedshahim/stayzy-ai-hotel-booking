import { listMealPlans } from "../queries/meal-plans.queries";
import type { MealPlan } from "../models/room-type.schema";

export async function listMealPlansForPicker(): Promise<MealPlan[]> {
  return listMealPlans();
}
