import { Router } from "express";
import healthRoutes from "./health.routes";
import adminHotelsRoutes from "./admin/hotels.routes";
import adminAmenitiesRoutes from "./admin/amenities.routes";

const router = Router();
router.use("/health", healthRoutes);
router.use("/admin/hotels", adminHotelsRoutes);
router.use("/admin/amenities", adminAmenitiesRoutes);

export default router;
