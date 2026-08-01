import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

// No baseURL: defaults to same-origin "/api/auth", proxied to backend/ via next.config.ts rewrites.
// Mirrors backend/src/config/auth.ts's `user.additionalFields` so session.user.avatarUrl is typed here.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({ user: { avatarUrl: { type: "string", required: false } } })],
});
