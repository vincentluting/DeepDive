// ============================================================
// Admin Bootstrap — one-off promotion helpers.
//
// NOTE (2026-04-08): This file used to be `schema-init.ts` and
// contained an 885-line `initTables()` function that duplicated
// `scripts/schema.sql`. That function was dead code — never
// called at runtime — and was the single largest source of
// schema drift in the project. It was deleted as part of the
// Phase 1 schema source-of-truth consolidation. See
// `scripts/schema.sql` (canonical DDL) and
// `scripts/migrations/*.sql` (incremental evolution).
// ============================================================

import { sql } from "./connection";

export async function ensureAdminColumn(): Promise<void> {
  await sql`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE
  `;
}

export async function bootstrapAdmin(email: string): Promise<{
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
} | null> {
  await ensureAdminColumn();

  const result = await sql`
    UPDATE "User" SET "isAdmin" = TRUE WHERE "email" = ${email}
    RETURNING "id", "email", "name", "isAdmin"
  `;

  if (result.length === 0) return null;
  return {
    id: result[0].id as string,
    email: result[0].email as string,
    name: (result[0].name as string) || null,
    isAdmin: result[0].isAdmin as boolean,
  };
}
