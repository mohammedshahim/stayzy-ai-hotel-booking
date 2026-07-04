import { betterAuth } from "better-auth";
import { db } from "./db";
import { env } from "./env";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email.service";

export const auth = betterAuth({
  database: db,
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
});
