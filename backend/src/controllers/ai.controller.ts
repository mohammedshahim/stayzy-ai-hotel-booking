import { Readable } from "stream";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { getCompareSummary, getFromAgent, getHotelSummary, streamFromAgent } from "../services/ai.service";
import { extractSearchFilters } from "../services/search-extraction.service";
import {
  endChatbotSession,
  endWidgetSession,
  findChatbotSessionId,
  getChatbotThread,
  getWidgetThread,
  listChatbotSessions,
  ownsSession,
  recordUserMessage,
  startChatbotSession,
  startWidgetSession,
} from "../services/chat-session.service";
import { compareSummaryQuerySchema } from "../types/compare.schemas";
import { searchExtractionBodySchema } from "../types/search-extraction.schemas";
import { chatbotBodySchema, chatbotPendingQuerySchema, chatWidgetBodySchema } from "../types/chat.schemas";
import { requireParam } from "../utils/requireParam";

export async function getHotelAiSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const summary = await getHotelSummary(id);
    res.json({ success: true, data: { summary } });
  } catch (error) {
    next(error);
  }
}

export async function getCompareAiSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = compareSummaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid query" });
      return;
    }

    const summary = await getCompareSummary(parsed.data.ids);
    res.json({ success: true, data: { summary } });
  } catch (error) {
    next(error);
  }
}

export async function streamWidgetChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = chatWidgetBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid message" });
      return;
    }

    const userId = req.user!.id;
    const upstream = new AbortController();
    req.on("close", () => upstream.abort());

    const sessionId = await startWidgetSession(userId, parsed.data.message);
    const result = await streamFromAgent(
      "/chat/widget",
      { sessionId, message: parsed.data.message, context: parsed.data.context },
      userId,
      upstream.signal,
    );

    if (!result.ok) {
      res.status(502).json({ success: false, error: "The assistant is unavailable right now" });
      return;
    }

    // Recorded only once the agent has the turn, so a 502 leaves no unanswerable question in history.
    await recordUserMessage(sessionId, parsed.data.message);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Piped through untouched — backend never parses or buffers the stream.
    Readable.fromWeb(result.stream).pipe(res);
  } catch (error) {
    next(error);
  }
}

export async function getWidgetSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await getWidgetThread(req.user!.id);
    res.json({ success: true, data: { messages } });
  } catch (error) {
    next(error);
  }
}

export async function endWidgetChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await endWidgetSession(req.user!.id);
    res.json({ success: true, data: { ended: true } });
  } catch (error) {
    next(error);
  }
}

export async function streamAssistantChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = chatbotBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid message" });
      return;
    }

    const user = req.user!;
    // The booking tool writes as this user, so the guard POST /bookings applies has to hold here too.
    if (!user.emailVerified) {
      res.status(403).json({ success: false, error: "email_not_verified" });
      return;
    }

    const { sessionId: requested, message, decision } = parsed.data;
    if (requested && !(await ownsSession(requested, user.id))) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }

    const sessionId =
      requested ??
      (message !== undefined ? await startChatbotSession(user.id, message) : await findChatbotSessionId(user.id));
    if (!sessionId) {
      res.status(409).json({ success: false, error: "Nothing is waiting to be confirmed" });
      return;
    }

    const upstream = new AbortController();
    req.on("close", () => upstream.abort());

    const result = await streamFromAgent("/chat/assistant", { sessionId, message, decision }, user.id, upstream.signal);

    if (!result.ok) {
      const pending = result.status === 409;
      res.status(pending ? 409 : 502).json({
        success: false,
        error: pending ? "Answer the confirmation on screen first" : "The assistant is unavailable right now",
      });
      return;
    }

    // Recorded only once the agent has the turn, so a 502 leaves no unanswerable question in history.
    if (message !== undefined) {
      await recordUserMessage(sessionId, message);
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Piped through untouched — backend never parses or buffers the stream.
    Readable.fromWeb(result.stream).pipe(res);
  } catch (error) {
    next(error);
  }
}

export async function getAssistantPending(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = chatbotPendingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid conversation" });
      return;
    }

    const userId = req.user!.id;
    const requested = parsed.data.sessionId;
    if (requested && !(await ownsSession(requested, userId))) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }

    const sessionId = requested ?? (await findChatbotSessionId(userId));
    if (!sessionId) {
      res.json({ success: true, data: { pending: null } });
      return;
    }

    const data = await getFromAgent<{ pending: unknown }>(
      `/chat/assistant/pending?session_id=${sessionId}`,
      userId,
      env.AI_REQUEST_TIMEOUT_MS,
    );
    if (!data) {
      res.status(502).json({ success: false, error: "The assistant is unavailable right now" });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getAssistantSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await listChatbotSessions(req.user!.id);
    res.json({ success: true, data: { sessions } });
  } catch (error) {
    next(error);
  }
}

export async function getAssistantSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    if (!(await ownsSession(id, req.user!.id))) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }

    const messages = await getChatbotThread(id);
    res.json({ success: true, data: { messages } });
  } catch (error) {
    next(error);
  }
}

export async function endAssistantChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await endChatbotSession(req.user!.id);
    res.json({ success: true, data: { ended: true } });
  } catch (error) {
    next(error);
  }
}

export async function extractSearchQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = searchExtractionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid prompt" });
      return;
    }

    const extraction = await extractSearchFilters(parsed.data.prompt);
    res.json({ success: true, data: extraction });
  } catch (error) {
    next(error);
  }
}
