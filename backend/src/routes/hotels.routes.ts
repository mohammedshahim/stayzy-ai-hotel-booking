import { Router } from "express";
import {
  getHotel,
  getHotelReviews,
  getHotelRoomTypes,
  getHotelSearchSuggestions,
  getHotelSimilar,
  getHotelsCompare,
} from "../controllers/hotels.controller";

const router = Router();
// Both static paths must come before "/:id" or Express matches them as ":id" instead.
router.get("/compare", getHotelsCompare);
router.get("/search-suggestions", getHotelSearchSuggestions);
router.get("/:id", getHotel);
router.get("/:id/room-types", getHotelRoomTypes);
router.get("/:id/similar", getHotelSimilar);
router.get("/:id/reviews", getHotelReviews);

export default router;
