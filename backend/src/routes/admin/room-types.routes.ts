import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { validateRequest } from "../../middlewares/validateRequest";
import { upload } from "../../middlewares/multerUpload";
import { reorderRoomTypeImagesSchema, updateRoomTypeSchema } from "../../types/room-type.schemas";
import { createRateOverrideRangeSchema, deleteRateOverrideRangeSchema } from "../../types/room-type.schemas";
import {
  deleteRoomType,
  deleteRoomTypeImage,
  getRoomType,
  reorderRoomTypeImages,
  updateRoomType,
  uploadRoomTypeImage,
} from "../../controllers/admin/room-types.controller";
import {
  createRateOverrideRange,
  deleteRateOverrideRange,
  listRateOverrides,
} from "../../controllers/admin/rate-overrides.controller";

const router = Router();

router.use(requireAdmin);

router.get("/:id", getRoomType);
router.patch("/:id", validateRequest(updateRoomTypeSchema), updateRoomType);
router.delete("/:id", deleteRoomType);

router.post("/:id/images", upload.single("file"), uploadRoomTypeImage);
router.patch("/:id/images", validateRequest(reorderRoomTypeImagesSchema), reorderRoomTypeImages);
router.delete("/:id/images/:imageId", deleteRoomTypeImage);

router.get("/:id/rate-overrides", listRateOverrides);
router.post("/:id/rate-overrides", validateRequest(createRateOverrideRangeSchema), createRateOverrideRange);
router.delete("/:id/rate-overrides", validateRequest(deleteRateOverrideRangeSchema), deleteRateOverrideRange);

export default router;
