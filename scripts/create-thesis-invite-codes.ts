// ============================================================
// Create a clean, fixed-assignment thesis invite code set.
//
// Dry run:
//   node --env-file=.env.local --import tsx scripts/create-thesis-invite-codes.ts
//
// Apply:
//   node --env-file=.env.local --import tsx scripts/create-thesis-invite-codes.ts --apply --deactivate-unassigned
// ============================================================

import { randomUUID } from "crypto";
import { config } from "dotenv";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

config({ path: ".env.local" });

type SqlFn = NeonQueryFunction<false, false>;
type ResearchGroup = "classic" | "immersive";

interface Options {
  apply: boolean;
  deactivateUnassigned: boolean;
  cohortId: string;
  prefix: string;
  perGroup: number;
  maxUses: number;
  expiresAt: Date | null;
}

interface DesiredInviteCode {
  code: string;
  researchGroup: ResearchGroup;
}

interface ExistingInviteCode {
  code: string;
  cohortId: string;
  researchGroup: ResearchGroup | null;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
}

const GROUPS: Array<{ researchGroup: ResearchGroup; token: string }> = [
  { researchGroup: "classic", token: "C" },
  { researchGroup: "immersive", token: "I" },
];

function readArg(args: string[], name: string): string | null {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid positive integer: ${raw}`);
  }
  return value;
}

function parseOptions(args: string[]): Options {
  const expiresAtRaw = readArg(args, "--expires-at");
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new Error(`Invalid --expires-at value: ${expiresAtRaw}`);
  }

  return {
    apply: args.includes("--apply"),
    deactivateUnassigned: args.includes("--deactivate-unassigned"),
    cohortId: readArg(args, "--cohort") ?? "thesis_2026",
    prefix: (readArg(args, "--prefix") ?? "TH26").toUpperCase(),
    perGroup: parsePositiveInt(readArg(args, "--per-group"), 25),
    maxUses: parsePositiveInt(readArg(args, "--max-uses"), 1),
    expiresAt,
  };
}

function getConnectionString(): string {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "Database connection string not found. Set POSTGRES_URL or DATABASE_URL.",
    );
  }
  return connectionString;
}

function buildDesiredCodes(options: Options): DesiredInviteCode[] {
  return GROUPS.flatMap(({ researchGroup, token }) =>
    Array.from({ length: options.perGroup }, (_, i) => ({
      code: `${options.prefix}-${token}-${String(i + 1).padStart(3, "0")}`,
      researchGroup,
    })),
  );
}

async function resolveCreatedBy(sql: SqlFn): Promise<string | null> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    const rows = (await sql`
      SELECT "id"
      FROM "User"
      WHERE LOWER("email") = ANY(${adminEmails})
      ORDER BY "createdAt" ASC
      LIMIT 1
    `) as unknown as Array<{ id: string }>;
    if (rows[0]?.id) return rows[0].id;
  }

  const adminRows = (await sql`
    SELECT "id"
    FROM "User"
    WHERE "isAdmin" = TRUE
    ORDER BY "createdAt" ASC
    LIMIT 1
  `) as unknown as Array<{ id: string }>;

  return adminRows[0]?.id ?? null;
}

async function fetchExistingDesired(
  sql: SqlFn,
  desiredCodes: string[],
): Promise<Map<string, ExistingInviteCode>> {
  if (desiredCodes.length === 0) return new Map();
  const rows = (await sql`
    SELECT "code", "cohortId", "researchGroup", "usedCount", "maxUses", "isActive"
    FROM "InviteCode"
    WHERE "code" = ANY(${desiredCodes})
  `) as unknown as ExistingInviteCode[];
  return new Map(rows.map((row) => [row.code, row]));
}

async function countActiveUnassigned(sql: SqlFn, cohortId: string): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS count
    FROM "InviteCode"
    WHERE "cohortId" = ${cohortId}
      AND "researchGroup" IS NULL
      AND "usedCount" = 0
      AND "isActive" = TRUE
      AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
  `) as unknown as Array<{ count: number }>;
  return Number(rows[0]?.count ?? 0);
}

async function deactivateUnassigned(sql: SqlFn, cohortId: string): Promise<number> {
  const rows = (await sql`
    UPDATE "InviteCode"
    SET "isActive" = FALSE, "updatedAt" = NOW()
    WHERE "cohortId" = ${cohortId}
      AND "researchGroup" IS NULL
      AND "usedCount" = 0
      AND "isActive" = TRUE
    RETURNING "id"
  `) as unknown as Array<{ id: string }>;
  return rows.length;
}

async function upsertDesiredCodes(
  sql: SqlFn,
  options: Options,
  desired: DesiredInviteCode[],
  existing: Map<string, ExistingInviteCode>,
  createdBy: string | null,
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;
  const expiresAtIso = options.expiresAt?.toISOString() ?? null;

  for (const item of desired) {
    const existingCode = existing.get(item.code);
    if (existingCode) {
      await sql`
        UPDATE "InviteCode"
        SET
          "cohortId" = ${options.cohortId},
          "researchGroup" = ${item.researchGroup},
          "maxUses" = ${options.maxUses},
          "expiresAt" = ${expiresAtIso},
          "isActive" = TRUE,
          "updatedAt" = NOW()
        WHERE "code" = ${item.code}
      `;
      updated += 1;
      continue;
    }

    await sql`
      INSERT INTO "InviteCode" (
        "id", "code", "cohortId", "createdBy", "maxUses", "expiresAt", "researchGroup"
      )
      VALUES (
        ${randomUUID()},
        ${item.code},
        ${options.cohortId},
        ${createdBy},
        ${options.maxUses},
        ${expiresAtIso},
        ${item.researchGroup}
      )
    `;
    inserted += 1;
  }

  return { inserted, updated };
}

async function summarize(sql: SqlFn, cohortId: string): Promise<unknown[]> {
  return (await sql`
    SELECT
      "cohortId",
      COALESCE("researchGroup", 'unassigned') AS "researchGroup",
      COUNT(*)::int AS "totalCodes",
      COUNT(*) FILTER (
        WHERE "isActive" = TRUE
          AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
          AND "usedCount" < "maxUses"
      )::int AS "usableCodes",
      SUM(
        CASE
          WHEN "isActive" = TRUE
            AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
          THEN GREATEST("maxUses" - "usedCount", 0)
          ELSE 0
        END
      )::int AS "remainingUsableUses",
      SUM("usedCount")::int AS "usedCount"
    FROM "InviteCode"
    WHERE "cohortId" = ${cohortId}
    GROUP BY "cohortId", COALESCE("researchGroup", 'unassigned')
    ORDER BY "cohortId", "researchGroup"
  `) as unknown[];
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const sql = neon(getConnectionString()) as SqlFn;
  const desired = buildDesiredCodes(options);
  const desiredCodeStrings = desired.map((item) => item.code);
  const existing = await fetchExistingDesired(sql, desiredCodeStrings);
  const claimedConflicts = [...existing.values()].filter((row) => row.usedCount > 0);
  const activeUnassigned = await countActiveUnassigned(sql, options.cohortId);

  if (claimedConflicts.length > 0) {
    throw new Error(
      `Refusing to overwrite claimed desired codes: ${claimedConflicts
        .map((row) => row.code)
        .join(", ")}`,
    );
  }

  const dryRunSummary = {
    mode: options.apply ? "apply" : "dry-run",
    cohortId: options.cohortId,
    prefix: options.prefix,
    perGroup: options.perGroup,
    maxUses: options.maxUses,
    desiredCodes: desired.length,
    existingDesiredCodes: existing.size,
    activeUnassignedCodesToDeactivate: options.deactivateUnassigned
      ? activeUnassigned
      : 0,
    note: options.apply
      ? "Writing changes to the database."
      : "No database changes made. Re-run with --apply to write.",
  };

  if (!options.apply) {
    console.log(JSON.stringify(dryRunSummary, null, 2));
    return;
  }

  const createdBy = await resolveCreatedBy(sql);
  const deactivated = options.deactivateUnassigned
    ? await deactivateUnassigned(sql, options.cohortId)
    : 0;
  const result = await upsertDesiredCodes(sql, options, desired, existing, createdBy);
  const finalSummary = await summarize(sql, options.cohortId);

  console.log(
    JSON.stringify(
      {
        ...dryRunSummary,
        createdBy: createdBy ? "admin-user" : null,
        deactivated,
        ...result,
        finalSummary,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
