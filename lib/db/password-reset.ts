// ============================================================
// Password Reset — DB operations for reset token lifecycle.
//
// Flow: user requests reset → token created (hashed) →
//       email sent with raw token → user clicks link →
//       token validated & consumed → password updated.
//
// Security: tokens are SHA-256 hashed before storage.
//           Tokens expire after 1 hour.
//           Each token can only be used once.
// ============================================================

import { randomBytes, createHash } from 'crypto';
import { sql } from './connection';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/** Generate a cryptographically secure reset token (raw + hash). */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/** Create a password reset token for a user. Invalidates any previous tokens. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Invalidate existing unused tokens for this user
  await sql`
    UPDATE "PasswordResetToken"
    SET "usedAt" = NOW()
    WHERE "userId" = ${userId} AND "usedAt" IS NULL
  `;

  const { raw, hash } = generateResetToken();
  const id = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await sql`
    INSERT INTO "PasswordResetToken" ("id", "userId", "tokenHash", "expiresAt")
    VALUES (${id}, ${userId}, ${hash}, ${expiresAt})
  `;

  return raw;
}

/** Validate a reset token. Returns userId if valid, null otherwise. */
export async function validateResetToken(rawToken: string): Promise<string | null> {
  const hash = createHash('sha256').update(rawToken).digest('hex');

  const rows = await sql`
    SELECT "userId" FROM "PasswordResetToken"
    WHERE "tokenHash" = ${hash}
      AND "usedAt" IS NULL
      AND "expiresAt" > NOW()
  `;

  if (rows.length === 0) return null;
  return rows[0].userId as string;
}

/** Mark a reset token as used. */
export async function consumeResetToken(rawToken: string): Promise<void> {
  const hash = createHash('sha256').update(rawToken).digest('hex');

  await sql`
    UPDATE "PasswordResetToken"
    SET "usedAt" = NOW()
    WHERE "tokenHash" = ${hash}
  `;
}
