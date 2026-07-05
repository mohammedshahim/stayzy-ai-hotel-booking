import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const allowedOrigins = [env.APP_URL, env.ADMIN_APP_URL];

export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.header("Origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}
