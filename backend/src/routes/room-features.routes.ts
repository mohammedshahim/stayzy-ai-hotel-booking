import { Router } from "express";
import { listRoomFeatures } from "../controllers/room-features.controller";

const router = Router();
router.get("/", listRoomFeatures);

export default router;
