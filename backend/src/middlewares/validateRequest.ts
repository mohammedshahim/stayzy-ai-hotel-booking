import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.issues[0]?.message ?? "Invalid request body" });
      return;
    }
    req.body = result.data;
    next();
  };
}
