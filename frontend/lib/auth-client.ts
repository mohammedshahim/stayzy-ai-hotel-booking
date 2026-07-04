import { createAuthClient } from "better-auth/react";

// No baseURL: defaults to same-origin "/api/auth", proxied to backend/ via next.config.ts rewrites.
export const authClient = createAuthClient();
