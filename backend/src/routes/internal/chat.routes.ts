import { Router } from "express";
import { requireInternalService } from "../../middlewares/requireInternalService";
import { internalRateLimit } from "../../middlewares/rateLimit";
import { saveAssistantMessage } from "../../controllers/internal/chat.controller";

const router = Router();

// Order matters: the limiter keys on the acting user this guard sets.
router.use(requireInternalService);
router.use(internalRateLimit);

router.post("/messages", saveAssistantMessage);

export default router;
