import { Router } from "express";
import { getHotel } from "../controllers/hotels.controller";

const router = Router();
router.get("/:id", getHotel);

export default router;
