import type { NextFunction, Request, Response } from "express";
import { appendAssistantMessage } from "../../services/chat-session.service";
import { assistantMessageBodySchema } from "../../types/chat.schemas";

export async function saveAssistantMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actingUserId = req.actingUserId;
    if (!actingUserId) {
      res.status(400).json({ success: false, error: "x-acting-user-id is required" });
      return;
    }

    const parsed = assistantMessageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid message" });
      return;
    }

    const saved = await appendAssistantMessage(
      parsed.data.sessionId,
      parsed.data.content,
      parsed.data.actions ?? [],
      actingUserId,
    );
    if (!saved) {
      res.status(404).json({ success: false, error: "Session not found" });
      return;
    }

    res.json({ success: true, data: { saved: true } });
  } catch (error) {
    next(error);
  }
}
