import { Router } from "express";
import { getRecentSearches } from "../controllers/recent-searches.controller";

const router = Router();
router.get("/", getRecentSearches);

export default router;
