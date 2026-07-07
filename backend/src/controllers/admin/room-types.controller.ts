import type { NextFunction, Request, Response } from "express";
import * as roomTypeService from "../../services/room-type.service";
import { requireParam } from "../../utils/requireParam";

export async function listRoomTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hotelId = requireParam(req.params.hotelId, "hotelId");
    const roomTypes = await roomTypeService.listRoomTypesForHotel(hotelId);
    res.json({ success: true, data: roomTypes });
  } catch (error) {
    next(error);
  }
}

export async function createRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hotelId = requireParam(req.params.hotelId, "hotelId");
    const roomType = await roomTypeService.createRoomType(hotelId, req.body);
    res.status(201).json({ success: true, data: roomType });
  } catch (error) {
    next(error);
  }
}

export async function getRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const roomType = await roomTypeService.getRoomTypeForAdmin(id);
    res.json({ success: true, data: roomType });
  } catch (error) {
    next(error);
  }
}

export async function updateRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const roomType = await roomTypeService.updateRoomTypeById(id, req.body);
    res.json({ success: true, data: roomType });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    await roomTypeService.deleteRoomTypeById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function uploadRoomTypeImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }
    const id = requireParam(req.params.id, "id");
    const image = await roomTypeService.addRoomTypeImage(id, req.file);
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
}

export async function reorderRoomTypeImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const { imageIds, mainImageId } = req.body;
    const images = await roomTypeService.reorderRoomTypeImages(id, imageIds, mainImageId);
    res.json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoomTypeImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = requireParam(req.params.id, "id");
    const imageId = requireParam(req.params.imageId, "imageId");
    await roomTypeService.removeRoomTypeImage(id, imageId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
