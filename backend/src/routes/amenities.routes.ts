import { Router } from "express";
import { listAmenities } from "../controllers/amenities.controller";

const router = Router();
router.get("/", listAmenities);

export default router;
