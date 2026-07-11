import { Router } from "express";
import { getHotel, getHotelRoomTypes, getHotelSimilar } from "../controllers/hotels.controller";

const router = Router();
router.get("/:id", getHotel);
router.get("/:id/room-types", getHotelRoomTypes);
router.get("/:id/similar", getHotelSimilar);

export default router;
