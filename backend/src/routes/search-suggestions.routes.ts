import { Router } from "express";
import { getSearchSuggestions } from "../controllers/recent-searches.controller";

const router = Router();
router.get("/", getSearchSuggestions);

export default router;
