import { sql } from "@/lib/db/connection";
import {
  hashPassword,
  verifyPassword,
  upgradePasswordHash,
  DUMMY_PASSWORD_HASH,
} from "./passwords";

function generateId(): string {
  return crypto.randomUUID();
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  isAdmin?: boolean;
  researchGroup?: "classic" | "immersive" | null;
  researchParticipantId?: string | null;
  researchConsentAt?: Date | null;
  cohort?: string | null;
}

// Create a new user
export async function createUser(
  email: string,
  password: string,
  name?: string,
  isAdmin = false,
  registrationIp?: string,
  careerStage?: string,
): Promise<User> {
  const id = generateId();
  const profileId = generateId();
  const passwordHash = await hashPassword(password);
  const now = new Date();

  const result = await sql`
    WITH new_user AS (
      INSERT INTO "User" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt", "isAdmin", "registrationIp", "careerStage")
      VALUES (${id}, ${email.toLowerCase()}, ${passwordHash}, ${name || null}, ${now}, ${now}, ${isAdmin}, ${registrationIp || null}, ${careerStage || null})
      RETURNING "id", "email", "name", "createdAt", "isAdmin"
    ),
    profile_seed AS (
      INSERT INTO "UserProfile" ("id", "userId", "insightsJson", "createdAt", "lastUpdated")
      SELECT ${profileId}, "id", '[]'::jsonb, ${now}, ${now}
      FROM new_user
      ON CONFLICT ("userId") DO NOTHING
    )
    SELECT "id", "email", "name", "createdAt", "isAdmin"
    FROM new_user
  `;

  return result[0] as User;
}

// Create a new user via OAuth (no password)
export async function createOAuthUser(
  email: string,
  name?: string | null,
): Promise<User> {
  const id = generateId();
  const profileId = generateId();
  const now = new Date();

  const result = await sql`
    WITH new_user AS (
      INSERT INTO "User" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt")
      VALUES (${id}, ${email.toLowerCase()}, ${null}, ${name || null}, ${now}, ${now})
      RETURNING "id", "email", "name", "createdAt", "isAdmin"
    ),
    profile_seed AS (
      INSERT INTO "UserProfile" ("id", "userId", "insightsJson", "createdAt", "lastUpdated")
      SELECT ${profileId}, "id", '[]'::jsonb, ${now}, ${now}
      FROM new_user
      ON CONFLICT ("userId") DO NOTHING
    )
    SELECT "id", "email", "name", "createdAt", "isAdmin"
    FROM new_user
  `;

  return result[0] as User;
}

// Check if an IP is localhost / private (skip geo resolution)
function isLocalIp(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("127.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.") ||
    ip === "unknown"
  );
}

// Resolve an IP address to a country code via ipapi.co (HTTPS, free tier 1k/day)
export async function resolveIpCountry(ip: string): Promise<string | null> {
  if (!ip || isLocalIp(ip)) return "LOCAL";
  try {
    const res = await fetch(
      `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
      {
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.country_code as string) || null;
  } catch {
    return null;
  }
}

// Update the registrationCountry for a user (called after geo resolution)
export async function updateUserRegistrationCountry(
  userId: string,
  country: string,
): Promise<void> {
  await sql`
    UPDATE "User" SET "registrationCountry" = ${country} WHERE "id" = ${userId}
  `;
}

// Authenticate user with email and password
export async function authenticateUser(
  email: string,
  password: string,
): Promise<User | null> {
  const result = await sql`
    SELECT "id", "email", "name", "passwordHash", "createdAt", "isAdmin"
    FROM "User"
    WHERE "email" = ${email.toLowerCase()}
  `;

  if (result.length === 0) {
    // Perform a dummy bcrypt comparison to prevent a timing side-channel that
    // could reveal whether an email is registered (bug-log #055). DUMMY_PASSWORD_HASH
    // is computed at the real cost factor (12 rounds) so the timing matches a
    // genuine login attempt; the old hardcoded hash ran at 10 rounds and leaked.
    await verifyPassword(password, DUMMY_PASSWORD_HASH).catch(() => {});
    return null;
  }

  const user = result[0];
  const storedHash = user.passwordHash as string | null;

  // OAuth-only users have no password — reject password login.
  // Run the same dummy compare as the no-such-email branch so an attacker
  // can't distinguish OAuth-only accounts from password accounts by timing
  // (bug-log #055, codex review: this early-return previously skipped padding).
  if (!storedHash) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH).catch(() => {});
    return null;
  }

  const isValid = await verifyPassword(password, storedHash);

  if (!isValid) {
    return null;
  }

  // Rehash legacy SHA-256 passwords to bcrypt on successful login
  if (!storedHash.startsWith("$2")) {
    await upgradePasswordHash(user.id as string, password);
  }

  return {
    id: user.id as string,
    email: user.email as string,
    name: user.name as string | null,
    createdAt: user.createdAt as Date,
    isAdmin: user.isAdmin === true,
  };
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const result = await sql`
    SELECT "id", "email", "name", "createdAt", "isAdmin",
           "researchGroup", "researchParticipantId", "researchConsentAt", "cohort"
    FROM "User"
    WHERE "id" = ${userId}
  `;

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) || null,
    createdAt: row.createdAt as Date,
    isAdmin: row.isAdmin === true,
    researchGroup: (row.researchGroup as "classic" | "immersive") || null,
    researchParticipantId: (row.researchParticipantId as string) || null,
    researchConsentAt: row.researchConsentAt
      ? new Date(row.researchConsentAt as string)
      : null,
    cohort: (row.cohort as string) || null,
  };
}

// Check if email exists
export async function emailExists(email: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM "User" WHERE "email" = ${email.toLowerCase()}
  `;
  return result.length > 0;
}

// Find user by email (for password reset — returns minimal info)
export async function findUserByEmail(
  email: string,
): Promise<{ id: string; name: string | null } | null> {
  const result = await sql`
    SELECT "id", "name" FROM "User" WHERE "email" = ${email.toLowerCase()}
  `;
  if (result.length === 0) return null;
  return {
    id: result[0].id as string,
    name: (result[0].name as string) || null,
  };
}
