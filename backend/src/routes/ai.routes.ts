import { Router } from "express";
import { aiRateLimit, chatRateLimit } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/requireAuth";
import {
  endWidgetChat,
  extractSearchQuery,
  getAssistantPending,
  getCompareAiSummary,
  getHotelAiSummary,
  getWidgetSession,
  streamAssistantChat,
  streamWidgetChat,
} from "../controllers/ai.controller";

const router = Router();

// Per-route, not router-wide: the three below key on IP, chat keys on the user.
router.post("/search/extract", aiRateLimit, extractSearchQuery);
router.get("/hotels/compare-summary", aiRateLimit, getCompareAiSummary);
router.get("/hotels/:id/summary", aiRateLimit, getHotelAiSummary);

router.post("/chat/widget", requireAuth, chatRateLimit, streamWidgetChat);
// No chatRateLimit: neither reaches the model, and both are needed to recover from one.
router.get("/chat/widget/session", requireAuth, getWidgetSession);
router.post("/chat/widget/session/end", requireAuth, endWidgetChat);

router.post("/chat/assistant", requireAuth, chatRateLimit, streamAssistantChat);
// No chatRateLimit: reading a pending confirmation never reaches the model.
router.get("/chat/assistant/pending", requireAuth, getAssistantPending);

export default router;
