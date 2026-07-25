import { Router } from "express";
import { requireInternalService } from "../../middlewares/requireInternalService";
import { internalRateLimit } from "../../middlewares/rateLimit";
import { validateRequest } from "../../middlewares/validateRequest";
import { addFavoriteBodySchema } from "../../types/favorite.schemas";
import { getFavorites, postFavorite } from "../../controllers/internal/favorites.controller";

const router = Router();

// Order matters: the limiter keys on the acting user this guard sets.
router.use(requireInternalService);
router.use(internalRateLimit);

router.get("/", getFavorites);
router.post("/", validateRequest(addFavoriteBodySchema), postFavorite);

export default router;
