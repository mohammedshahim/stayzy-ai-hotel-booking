import { asc } from "drizzle-orm";
import { db } from "../config/db";
import { mealPlans } from "../models/room-type.schema";
import type { MealPlan } from "../models/room-type.schema";

export async function listMealPlans(): Promise<MealPlan[]> {
  return db.select({ id: mealPlans.id, name: mealPlans.name }).from(mealPlans).orderBy(asc(mealPlans.name));
}
