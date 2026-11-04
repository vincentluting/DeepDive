import { sql } from "@/lib/db/connection";
import { cookies } from "next/headers";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// Sliding-refresh threshold: extend expiresAt when the DB value is more than
// one day behind a fresh (now + TTL) target. Bounds DB writes to ≤1 per day
// per active session while preserving rolling expiry semantics.
const SLIDING_REFRESH_GAP_MS = 24 * 60 * 60 * 1000;

function generateId(): string {
  return crypto.randomUUID();
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

// Create a new session for authenticated user
export async function createSession(userId: string): Promise<Session> {
  const id = generateId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await sql`
    INSERT INTO "UserSession" ("id", "userId", "expiresAt", "createdAt")
    VALUES (${id}, ${userId}, ${expiresAt}, ${new Date()})
  `;

  return { id, userId, expiresAt };
}

// Get session by ID — applies sliding refresh atomically. A single
// UPDATE ... RETURNING avoids the TOCTOU race that a SELECT+UPDATE pair
// introduces under concurrent requests: every caller observes the same
// post-update row.
export async function getSession(sessionId: string): Promise<Session | null> {
  const target = new Date(Date.now() + SESSION_TTL_MS);
  const gapMs = SLIDING_REFRESH_GAP_MS;

  const result = await sql`
    UPDATE "UserSession"
    SET "expiresAt" = CASE
      WHEN ${target} - "expiresAt" > (${gapMs} || ' milliseconds')::interval
        THEN ${target}
      ELSE "expiresAt"
    END
    WHERE "id" = ${sessionId} AND "expiresAt" > NOW()
    RETURNING "id", "userId", "expiresAt"
  `;

  if (result.length === 0) {
    return null;
  }

  const session = result[0] as Session;

  // Refresh the browser cookie's maxAge to match the rolling DB expiry.
  // cookies().set() throws in read-only contexts (RSC render); swallow
  // that — the DB is source of truth and the cookie will be refreshed on
  // the next request that runs inside a route handler / proxy.
  try {
    await setSessionCookie(sessionId);
  } catch {
    // Read-only cookie context — ignore.
  }

  return session;
}

// Delete session (logout)
export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM "UserSession" WHERE "id" = ${sessionId}`;
}

// Set session cookie
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
