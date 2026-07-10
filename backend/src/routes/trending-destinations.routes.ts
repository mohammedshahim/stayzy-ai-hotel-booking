import { Router } from "express";
import { getTrendingDestinationsHandler } from "../controllers/trending-destinations.controller";

const router = Router();
router.get("/", getTrendingDestinationsHandler);

export default router;
