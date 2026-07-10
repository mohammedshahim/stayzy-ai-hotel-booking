import type { NextFunction, Request, Response } from "express";
import { getTrendingDestinations } from "../services/trending-destinations.service";

export async function getTrendingDestinationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: await getTrendingDestinations() });
  } catch (error) {
    next(error);
  }
}
