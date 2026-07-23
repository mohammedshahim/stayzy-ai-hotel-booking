import { Router } from "express";
import { aiRateLimit, chatRateLimit } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/requireAuth";
import {
  extractSearchQuery,
  getCompareAiSummary,
  getHotelAiSummary,
  streamWidgetChat,
} from "../controllers/ai.controller";

const router = Router();

// Per-route, not router-wide: the three below key on IP, chat keys on the user.
router.post("/search/extract", aiRateLimit, extractSearchQuery);
router.get("/hotels/compare-summary", aiRateLimit, getCompareAiSummary);
router.get("/hotels/:id/summary", aiRateLimit, getHotelAiSummary);

router.post("/chat/widget", requireAuth, chatRateLimit, streamWidgetChat);

export default router;
