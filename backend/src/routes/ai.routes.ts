import { Router } from "express";
import { aiRateLimit } from "../middlewares/rateLimit";
import { extractSearchQuery, getCompareAiSummary, getHotelAiSummary } from "../controllers/ai.controller";

const router = Router();

// Public, like the hotel page it renders on. The limiter is the only gate.
router.use(aiRateLimit);

router.post("/search/extract", extractSearchQuery);
router.get("/hotels/compare-summary", getCompareAiSummary);
router.get("/hotels/:id/summary", getHotelAiSummary);

export default router;
