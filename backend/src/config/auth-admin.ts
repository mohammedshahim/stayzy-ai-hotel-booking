import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin_account, admin_session, admin_user, admin_verification } from "../models/admin-auth.schema";
import { db } from "./db";
import { env } from "./env";

export const authAdmin = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { admin_user, admin_session, admin_account, admin_verification },
  }),
  secret: env.BETTER_AUTH_ADMIN_SECRET,
  basePath: "/api/admin/auth",
  baseURL: `${env.API_URL}/api/admin/auth`,
  trustedOrigins: [env.ADMIN_APP_URL],
  // Both instances share the same host (backend/), so the default "better-auth"
  // cookie prefix would collide with the user instance's cookie of the same name.
  advanced: {
    cookiePrefix: "admin",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  // No socialProviders, no sign-up route is ever mounted — the only admin_user
  // rows come from seed-admin.ts.
  user: {
    modelName: "admin_user",
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "admin" },
    },
  },
  session: {
    modelName: "admin_session",
  },
  account: {
    modelName: "admin_account",
  },
  verification: {
    modelName: "admin_verification",
  },
});
