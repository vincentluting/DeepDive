import { sql } from "@/lib/db/connection";
import { cookies } from "next/headers";
import { getSession } from "./sessions";
import { getUserById } from "./users";
import type { User } from "./users";

// Get current user from session cookie.
// Returns null when there is no session cookie or the session/user is not found.
// Throws when the DB query itself fails — callers should NOT swallow DB errors
// as "unauthenticated" (that would redirect logged-in users to login during
// transient DB outages).
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) {
    return null; // no cookie → genuinely unauthenticated
  }

  // getSession / getUserById may throw on DB errors — let it propagate
  const session = await getSession(sessionId);
  if (!session) {
    return null; // expired or invalid session
  }

  return getUserById(session.userId);
}

/**
 * Check if an email is in the ADMIN_EMAILS env var (comma-separated list).
 */
function isEnvAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return false;
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

// Get current user with admin status
export async function getCurrentUserWithAdmin(): Promise<
  (User & { isAdmin: boolean }) | null
> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) {
    return null;
  }

  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  try {
    const result = await sql`
      SELECT "id", "email", "name", "isAdmin", "createdAt", "cohort", "researchGroup"
      FROM "User"
      WHERE "id" = ${session.userId}
    `;

    if (result.length === 0) {
      return null;
    }

    const dbIsAdmin = result[0].isAdmin === true;
    const email = result[0].email as string;
    const envAdmin = isEnvAdmin(email);

    // Auto-promote: if env says admin but DB doesn't, update DB
    if (envAdmin && !dbIsAdmin) {
      try {
        await sql`UPDATE "User" SET "isAdmin" = TRUE WHERE "id" = ${result[0].id}`;
      } catch {
        // Column may not exist yet — still grant access via env
      }
    }

    return {
      id: result[0].id as string,
      email,
      name: result[0].name as string | null,
      createdAt: result[0].createdAt as Date,
      isAdmin: dbIsAdmin || envAdmin,
      cohort: (result[0].cohort as string | null) ?? null,
      researchGroup:
        (result[0].researchGroup as "classic" | "immersive" | null) ?? null,
    };
  } catch (error) {
    // Fallback: if isAdmin column doesn't exist yet, query without it
    console.warn(
      "getCurrentUserWithAdmin: falling back to query without isAdmin column:",
      error,
    );
    const fallback = await getUserById(session.userId);
    if (!fallback) return null;
    return { ...fallback, isAdmin: isEnvAdmin(fallback.email) };
  }
}
