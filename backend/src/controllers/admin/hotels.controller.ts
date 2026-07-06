import type { NextFunction, Request, Response } from "express";
import * as hotelService from "../../services/hotel.service";
import { requireParam } from "../../utils/requireParam";

export async function listHotels(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const result = await hotelService.listHotelsForAdmin(page, pageSize);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const hotel = await hotelService.getHotelForAdmin(id);
    res.json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
}

export async function createHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hotel = await hotelService.createHotel(req.body);
    res.status(201).json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
}

export async function updateHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const hotel = await hotelService.updateHotelById(id, req.body);
    res.json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
}

export async function deleteHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    await hotelService.deleteHotelById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function uploadHotelImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }
    const id = requireParam(req.params.id, "id");
    const image = await hotelService.addHotelImage(id, req.file);
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
}

export async function reorderHotelImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const { imageIds, mainImageId } = req.body;
    const images = await hotelService.reorderHotelImages(id, imageIds, mainImageId);
    res.json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
}

export async function deleteHotelImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const imageId = requireParam(req.params.imageId, "imageId");
    await hotelService.removeHotelImage(id, imageId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
