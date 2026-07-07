import { Router } from "express";
import healthRoutes from "./health.routes";
import adminHotelsRoutes from "./admin/hotels.routes";
import adminAmenitiesRoutes from "./admin/amenities.routes";
import adminRoomTypesRoutes from "./admin/room-types.routes";
import adminRoomFeaturesRoutes from "./admin/room-features.routes";
import adminMealPlansRoutes from "./admin/meal-plans.routes";

const router = Router();
router.use("/health", healthRoutes);
router.use("/admin/hotels", adminHotelsRoutes);
router.use("/admin/amenities", adminAmenitiesRoutes);
router.use("/admin/room-types", adminRoomTypesRoutes);
router.use("/admin/room-features", adminRoomFeaturesRoutes);
router.use("/admin/meal-plans", adminMealPlansRoutes);

export default router;
