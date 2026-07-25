import { Readable } from "stream";
import type { NextFunction, Request, Response } from "express";
import { getCompareSummary, getHotelSummary, streamFromAgent } from "../services/ai.service";
import { extractSearchFilters } from "../services/search-extraction.service";
import {
  endWidgetSession,
  getWidgetThread,
  recordUserMessage,
  startWidgetSession,
} from "../services/chat-session.service";
import { compareSummaryQuerySchema } from "../types/compare.schemas";
import { searchExtractionBodySchema } from "../types/search-extraction.schemas";
import { chatWidgetBodySchema } from "../types/chat.schemas";
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
    const stream = await streamFromAgent(
      "/chat/widget",
      { sessionId, message: parsed.data.message, context: parsed.data.context },
      userId,
      upstream.signal,
    );

    if (!stream) {
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
    Readable.fromWeb(stream).pipe(res);
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
