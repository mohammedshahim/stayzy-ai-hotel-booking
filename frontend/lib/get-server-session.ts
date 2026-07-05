import { headers } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
};

type GetSessionResponse = { user: SessionUser; session: { id: string; expiresAt: string } } | null;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getServerSession(): Promise<SessionUser | null> {
  const cookie = (await headers()).get("cookie");
  if (!cookie) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as GetSessionResponse;
    return data?.user ?? null;
  } catch (error) {
    console.error("[lib/get-server-session]", error);
    return null;
  }
}
