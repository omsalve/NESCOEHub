// src/lib/get-session.ts
import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";

interface SessionPayload extends JWTPayload {
  userId: number;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Verifies the JWT from the 'session' cookie and returns the session payload if valid.
 * Server-only util.
 */
export async function getSession(): Promise<SessionPayload | null> {
  // In Next 15+, cookies() is async. await also works on older versions.
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secret, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to verify session:", err);
    }
    return null;
  }
}