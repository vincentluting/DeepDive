import { randomUUID } from "crypto";
import { sql } from "./connection";
import {
  CONSENT_VERSION,
  computeConsentTextHash,
} from "@/lib/cdse/consent-version";

export async function recordResearchConsent(data: {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
}): Promise<{ timestampBackfilled: boolean; auditInserted: boolean }> {
  const timestampRows = await sql<{ id: string }>`
    UPDATE "User"
    SET "researchConsentAt" = NOW()
    WHERE "id" = ${data.userId}
      AND "researchGroup" IS NOT NULL
      AND "researchConsentAt" IS NULL
    RETURNING "id"
  `;

  const textHash = computeConsentTextHash();
  const auditRows = await sql<{ id: string }>`
    INSERT INTO "ConsentRecord" (
      "id", "userId", "consentVersion", "consentTextHash",
      "ipAddress", "userAgent", "sessionId", "agreedAt"
    )
    SELECT
      ${randomUUID()}, u."id", ${CONSENT_VERSION}, ${textHash},
      ${data.ipAddress ?? null}, ${data.userAgent ?? null},
      ${data.sessionId ?? null}, NOW()
    FROM "User" u
    WHERE u."id" = ${data.userId}
      AND u."researchGroup" IS NOT NULL
    ON CONFLICT ("userId", "consentVersion") DO NOTHING
    RETURNING "id"
  `;

  return {
    timestampBackfilled: timestampRows.length > 0,
    auditInserted: auditRows.length > 0,
  };
}

export async function hasResearchConsent(userId: string): Promise<boolean> {
  const rows = await sql<{ hasConsent: boolean }>`
    SELECT (
      u."researchConsentAt" IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM "ConsentRecord" cr
        WHERE cr."userId" = u."id"
          AND cr."withdrawnAt" IS NULL
      )
    ) AS "hasConsent"
    FROM "User" u
    WHERE u."id" = ${userId}
      AND u."researchGroup" IS NOT NULL
    LIMIT 1
  `;

  return rows[0]?.hasConsent === true;
}
