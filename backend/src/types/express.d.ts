import type { auth } from "../config/auth";
import type { authAdmin } from "../config/auth-admin";

declare global {
  namespace Express {
    interface Request {
      user?: typeof auth.$Infer.Session.user;
      adminUser?: typeof authAdmin.$Infer.Session.user;
      actingUserId?: string;
    }
  }
}

export {};
