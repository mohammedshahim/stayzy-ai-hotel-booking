import { Router } from "express";
import { aiRateLimit } from "../middlewares/rateLimit";
import { getHotelAiSummary } from "../controllers/ai.controller";

const router = Router();

// Public, like the hotel page it renders on. The limiter is the only gate.
router.use(aiRateLimit);

router.get("/hotels/:id/summary", getHotelAiSummary);

export default router;
