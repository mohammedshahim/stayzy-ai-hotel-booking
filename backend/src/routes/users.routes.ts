import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { validateRequest } from "../middlewares/validateRequest";
import { setPasswordBodySchema } from "../types/user.schemas";
import { postSetPassword } from "../controllers/users.controller";

const router = Router();

router.use(requireAuth);
router.post("/set-password", validateRequest(setPasswordBodySchema), postSetPassword);

export default router;
