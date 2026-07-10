import { Router } from "express";
import { getHotel, getHotelRoomTypes } from "../controllers/hotels.controller";

const router = Router();
router.get("/:id", getHotel);
router.get("/:id/room-types", getHotelRoomTypes);

export default router;
