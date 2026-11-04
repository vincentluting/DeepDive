// ============================================================
// Admin Presets — AdminAnswerPreset CRUD
//
// Table: AdminAnswerPreset
// Stores admin's real questionnaire answers as reusable templates
// for reproducible test generation via auto-fill.
// ============================================================

import { sql } from './connection';
import { randomUUID } from 'crypto';

export interface AdminAnswerPreset {
  id: string;
  userId: string;
  name: string;
  quickDiveAnswers: Record<string, unknown> | null;
  deepDiveAnswers: Record<string, unknown> | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the admin's answer preset. Returns the most recent one.
 */
export async function getAdminPreset(userId: string): Promise<AdminAnswerPreset | null> {
  const rows = await sql`
    SELECT * FROM "AdminAnswerPreset"
    WHERE "userId" = ${userId}
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id as string,
    userId: row.userId as string,
    name: row.name as string,
    quickDiveAnswers: row.quickDiveAnswers as Record<string, unknown> | null,
    deepDiveAnswers: row.deepDiveAnswers as Record<string, unknown> | null,
    locale: row.locale as string,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

/**
 * Save or update the admin's answer preset (upsert by userId).
 * Only one preset per admin — replaces existing if present.
 */
export async function saveAdminPreset(params: {
  userId: string;
  name?: string;
  quickDiveAnswers?: Record<string, unknown> | null;
  deepDiveAnswers?: Record<string, unknown> | null;
  locale?: string;
}): Promise<string> {
  const existing = await getAdminPreset(params.userId);

  if (existing) {
    // Update existing preset
    await sql`
      UPDATE "AdminAnswerPreset"
      SET
        "name" = ${params.name ?? existing.name},
        "quickDiveAnswers" = ${params.quickDiveAnswers !== undefined ? JSON.stringify(params.quickDiveAnswers) : existing.quickDiveAnswers ? JSON.stringify(existing.quickDiveAnswers) : null}::jsonb,
        "deepDiveAnswers" = ${params.deepDiveAnswers !== undefined ? JSON.stringify(params.deepDiveAnswers) : existing.deepDiveAnswers ? JSON.stringify(existing.deepDiveAnswers) : null}::jsonb,
        "locale" = ${params.locale ?? existing.locale},
        "updatedAt" = NOW()
      WHERE "id" = ${existing.id}
    `;
    return existing.id;
  }

  // Create new preset
  const id = randomUUID();
  await sql`
    INSERT INTO "AdminAnswerPreset" ("id", "userId", "name", "quickDiveAnswers", "deepDiveAnswers", "locale")
    VALUES (
      ${id},
      ${params.userId},
      ${params.name ?? 'My Answers'},
      ${params.quickDiveAnswers ? JSON.stringify(params.quickDiveAnswers) : null}::jsonb,
      ${params.deepDiveAnswers ? JSON.stringify(params.deepDiveAnswers) : null}::jsonb,
      ${params.locale ?? 'en'}
    )
  `;
  return id;
}

/**
 * Delete the admin's answer preset.
 */
export async function deleteAdminPreset(userId: string): Promise<void> {
  await sql`
    DELETE FROM "AdminAnswerPreset" WHERE "userId" = ${userId}
  `;
}
