// ============================================================
// OAuth DB — CRUD for OAuthAccount linking table.
// ============================================================

import { randomBytes } from "crypto";
import { sql } from "./connection";

export type OAuthProvider = "google" | "apple";

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

/** Find an existing OAuth link by provider + providerAccountId. */
export async function findOAuthAccount(
  provider: OAuthProvider,
  providerAccountId: string,
): Promise<OAuthAccount | null> {
  const rows = await sql<OAuthAccount>`
    SELECT * FROM "OAuthAccount"
    WHERE "provider" = ${provider} AND "providerAccountId" = ${providerAccountId}
  `;
  if (rows.length === 0) return null;
  return rows[0];
}

/** Create a new OAuth link for an existing user. */
export async function createOAuthAccount(data: {
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<OAuthAccount> {
  const id = randomBytes(16).toString("hex");
  const rows = await sql<OAuthAccount>`
    INSERT INTO "OAuthAccount" ("id", "userId", "provider", "providerAccountId", "email", "name", "avatarUrl")
    VALUES (${id}, ${data.userId}, ${data.provider}, ${data.providerAccountId},
            ${data.email ?? null}, ${data.name ?? null}, ${data.avatarUrl ?? null})
    RETURNING *
  `;
  return rows[0];
}

/** Get all OAuth accounts linked to a user. */
export async function getOAuthAccountsByUserId(
  userId: string,
): Promise<OAuthAccount[]> {
  const rows = await sql<OAuthAccount>`
    SELECT * FROM "OAuthAccount" WHERE "userId" = ${userId} ORDER BY "createdAt"
  `;
  return rows;
}

/** Unlink an OAuth account (user must have a password or another OAuth link). */
export async function deleteOAuthAccount(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await sql`
    DELETE FROM "OAuthAccount" WHERE "id" = ${id} AND "userId" = ${userId}
  `;
  return result.length > 0;
}
