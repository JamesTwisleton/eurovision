import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "jury_session";

export interface SessionData {
  memberId: string;
  juryId: string;
  juryKey: string;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    // In a production app, this should be a signed/encrypted JWT.
    // For this Eurovision app, we'll keep it simple but functional.
    return JSON.parse(atob(sessionCookie.value));
  } catch {
    return null;
  }
}

export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  const value = btoa(JSON.stringify(data));

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
