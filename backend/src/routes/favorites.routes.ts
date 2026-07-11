import { Router } from "express";
import { deleteFavoriteById, getFavoriteHotelIds, getFavorites, postFavorite } from "../controllers/favorites.controller";

const router = Router();
router.get("/", getFavorites);
router.get("/hotel-ids", getFavoriteHotelIds);
router.post("/", postFavorite);
router.delete("/:hotelId", deleteFavoriteById);

export default router;
