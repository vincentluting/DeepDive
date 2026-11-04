import { sql } from "@/lib/db/connection";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

// Pre-computed dummy hash at the SAME cost factor as real password hashes.
// Used when an email is not registered to equalize login timing (bug-log #055):
// the previous hardcoded "$2b$10$..." ran at 10 rounds while real hashes use 12,
// leaking a ~4x timing difference that let an attacker enumerate which emails
// are registered. Computed once at module load so it tracks BCRYPT_ROUNDS even
// if the cost factor changes later.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "timing-attack-dummy-value-not-a-real-password",
  BCRYPT_ROUNDS,
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  // bcrypt hashes start with "$2a$" or "$2b$"; legacy SHA-256 hashes are 64-char hex
  if (hash.startsWith("$2")) {
    return bcrypt.compare(password, hash);
  }

  // Legacy SHA-256 verification for migration
  if (!process.env.AUTH_SECRET) {
    return false;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.AUTH_SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return legacyHash === hash;
}

export async function upgradePasswordHash(
  userId: string,
  password: string,
): Promise<void> {
  const newHash = await hashPassword(password);
  await sql`UPDATE "User" SET "passwordHash" = ${newHash} WHERE "id" = ${userId}`;
}
