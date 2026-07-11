import type { NextFunction, Request, Response } from "express";
import { addFavorite, listFavoriteHotelIds, listFavorites, removeFavorite } from "../services/favorite.service";
import { addFavoriteBodySchema } from "../types/favorite.schemas";
import { requireParam } from "../utils/requireParam";
import { resolveOwner } from "../utils/resolveOwner";

export async function getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const owner = await resolveOwner(req, res);
    res.json({ success: true, data: await listFavorites(owner) });
  } catch (error) {
    next(error);
  }
}

export async function getFavoriteHotelIds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const owner = await resolveOwner(req, res);
    res.json({ success: true, data: await listFavoriteHotelIds(owner) });
  } catch (error) {
    next(error);
  }
}

export async function postFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = addFavoriteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" });
      return;
    }

    const owner = await resolveOwner(req, res);
    await addFavorite(owner, parsed.data.hotelId);
    res.status(201).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function deleteFavoriteById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hotelId = requireParam(req.params.hotelId, "hotelId");
    const owner = await resolveOwner(req, res);
    const removed = await removeFavorite(owner, hotelId);
    if (!removed) {
      res.status(404).json({ success: false, error: "Favorite not found" });
      return;
    }
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
