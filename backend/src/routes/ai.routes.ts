import { Router } from "express";
import { aiRateLimit, chatRateLimit } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/requireAuth";
import {
  endAssistantChat,
  endWidgetChat,
  extractSearchQuery,
  getAssistantPending,
  getAssistantSession,
  getAssistantSessions,
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
// No chatRateLimit: none of these reach the model, and the first is needed to recover from one.
router.get("/chat/assistant/pending", requireAuth, getAssistantPending);
router.get("/chat/assistant/sessions", requireAuth, getAssistantSessions);
router.get("/chat/assistant/sessions/:id", requireAuth, getAssistantSession);
router.post("/chat/assistant/session/end", requireAuth, endAssistantChat);

export default router;
