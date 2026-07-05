import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { authAdmin } from "../../config/auth-admin";

const router = Router();
router.all("/*", toNodeHandler(authAdmin));

export default router;
