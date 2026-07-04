import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export function cors(req: Request, res: Response, next: NextFunction): void {
  res.header("Access-Control-Allow-Origin", env.APP_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}
