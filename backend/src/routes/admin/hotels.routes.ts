import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { validateRequest } from "../../middlewares/validateRequest";
import { upload } from "../../middlewares/multerUpload";
import { createHotelSchema, reorderHotelImagesSchema, updateHotelSchema } from "../../types/hotel.schemas";
import {
  createHotel,
  deleteHotel,
  deleteHotelImage,
  getHotel,
  listHotels,
  reorderHotelImages,
  updateHotel,
  uploadHotelImage,
} from "../../controllers/admin/hotels.controller";

const router = Router();

router.use(requireAdmin);

router.get("/", listHotels);
router.post("/", validateRequest(createHotelSchema), createHotel);
router.get("/:id", getHotel);
router.patch("/:id", validateRequest(updateHotelSchema), updateHotel);
router.delete("/:id", deleteHotel);

router.post("/:id/images", upload.single("file"), uploadHotelImage);
router.patch("/:id/images", validateRequest(reorderHotelImagesSchema), reorderHotelImages);
router.delete("/:id/images/:imageId", deleteHotelImage);

export default router;
