import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { account, session, user, verification } from "../models/auth.schema";
import { mergeGuestRecentSearches } from "../services/recent-search.service";
import { mergeGuestFavorites } from "../services/favorite.service";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email.service";
import { GUEST_SESSION_COOKIE } from "../utils/guestCookie";
import { db } from "./db";
import { env } from "./env";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: `${env.APP_URL}/api/auth`,
  trustedOrigins: [env.APP_URL],
  emailAndPassword: {
    enabled: true,
    // false, not true: verification is enforced only at booking creation (architecture.md),
    // not as a login gate — true would block sign-up from creating a session at all.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  user: {
    additionalFields: {
      avatarUrl: { type: "string", required: false },
    },
  },
  hooks: {
    // Guest→account merge (recent searches, favorites) runs here rather than from the
    // frontend so it covers email/password sign-in/up and the Google OAuth callback
    // identically — every path that creates a new session flows through this hook.
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      if (!newSession) return;

      const guestSessionToken = ctx.getCookie(GUEST_SESSION_COOKIE);
      if (!guestSessionToken) return;

      try {
        await Promise.all([
          mergeGuestRecentSearches(guestSessionToken, newSession.user.id),
          mergeGuestFavorites(guestSessionToken, newSession.user.id),
        ]);
        ctx.setCookie(GUEST_SESSION_COOKIE, "", { maxAge: 0 });
      } catch (error) {
        console.error("[config/auth hooks.after] failed to merge guest data", error);
      }
    }),
  },
});
