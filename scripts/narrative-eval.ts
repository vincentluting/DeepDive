#!/usr/bin/env -S node --import tsx

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import {
  buildEvalInputFromPayload,
  evaluateNarrative,
  summarizeEvalResult,
  type NarrativeEvalInput,
  type NarrativeEvalKind,
  type NarrativeEvalLocale,
  type NarrativeEvalResult,
} from "../lib/evals/narrative-eval";
import {
  NARRATIVE_EVAL_BASELINE_CASES,
  NARRATIVE_EVAL_BASELINE_VERSION,
} from "../lib/evals/narrative-eval-baseline";

type CliOptions = {
  mode: "baseline" | "file" | "db";
  kind?: NarrativeEvalKind | "all";
  inputPath?: string;
  userId?: string;
  outputPath?: string;
  locale?: NarrativeEvalLocale;
};

type DbPayload = {
  id: string;
  title: string;
  kind: NarrativeEvalKind;
  payload: unknown;
  locale?: NarrativeEvalLocale;
  source: string;
};

type SqlTag = typeof import("../lib/db/connection").sql;

let sqlInstance: SqlTag | null = null;

async function getSql(): Promise<SqlTag> {
  if (!sqlInstance) {
    const mod = await import("../lib/db/connection");
    sqlInstance = mod.sql;
  }
  return sqlInstance;
}

function printHelp(): void {
  console.log(`Narrative Eval Baseline (v${NARRATIVE_EVAL_BASELINE_VERSION})

Usage:
  npm run eval:narratives
  node --import tsx scripts/narrative-eval.ts --input ./output/profile.json --kind profile
  node --import tsx scripts/narrative-eval.ts --db all --user-id USER_ID
  node --import tsx scripts/narrative-eval.ts --db report --user-id USER_ID --output ./output/report-eval.json

Options:
  --input <path>        Evaluate a local JSON file
  --kind <kind>         profile | report | coaching
  --db <kind|all>       Evaluate latest payload from DB
  --user-id <id>        Optional user filter for DB mode
  --locale <en|zh>      Override locale for file mode
  --output <path>       Write JSON results to disk
  --help                Show this message
`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { mode: "baseline" };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--help":
        printHelp();
        process.exit(0);
        return options;
      case "--input":
        if (!next) throw new Error("--input requires a file path");
        options.mode = "file";
        options.inputPath = next;
        index++;
        break;
      case "--kind":
        if (!next) throw new Error("--kind requires a value");
        if (!["profile", "report", "coaching"].includes(next)) {
          throw new Error(`Invalid --kind: ${next}`);
        }
        options.kind = next as NarrativeEvalKind;
        index++;
        break;
      case "--db":
        if (!next) throw new Error("--db requires a value");
        if (!["profile", "report", "coaching", "all"].includes(next)) {
          throw new Error(`Invalid --db target: ${next}`);
        }
        options.mode = "db";
        options.kind = next as NarrativeEvalKind | "all";
        index++;
        break;
      case "--user-id":
        if (!next) throw new Error("--user-id requires a value");
        options.userId = next;
        index++;
        break;
      case "--output":
        if (!next) throw new Error("--output requires a path");
        options.outputPath = next;
        index++;
        break;
      case "--locale":
        if (!next) throw new Error("--locale requires a value");
        if (!["en", "zh"].includes(next)) {
          throw new Error(`Invalid --locale: ${next}`);
        }
        options.locale = next as NarrativeEvalLocale;
        index++;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.mode === "file" && !options.kind) {
    throw new Error("--kind is required in file mode");
  }

  return options;
}

function parseUnknownJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON input: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      },
    );
  }
}

function toPayload(raw: unknown): unknown {
  if (typeof raw === "string") {
    return parseUnknownJson(raw);
  }
  return raw;
}

async function fetchLatestProfilePayload(userId?: string): Promise<DbPayload | null> {
  const sql = await getSql();
  const rows = userId
    ? await sql`
        SELECT "id", "assessmentId", "userId", "updatedAt", "profileJson"
        FROM "PersonalProfile"
        WHERE "userId" = ${userId}
        ORDER BY "updatedAt" DESC
        LIMIT 1
      `
    : await sql`
        SELECT "id", "assessmentId", "userId", "updatedAt", "profileJson"
        FROM "PersonalProfile"
        ORDER BY "updatedAt" DESC
        LIMIT 1
      `;

  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  const payload = toPayload(row.profileJson);

  return {
    id: String(row.assessmentId ?? row.id),
    title: `Latest profile ${row.assessmentId ?? row.id}`,
    kind: "profile",
    payload,
    source: userId ? `db:user:${userId}` : "db:latest-profile",
  };
}

async function fetchLatestReportPayload(userId?: string): Promise<DbPayload | null> {
  const sql = await getSql();
  const rows = userId
    ? await sql`
        SELECT "id", "assessmentId", "createdAt", "reportJson"
        FROM "CareerReport"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT 1
      `
    : await sql`
        SELECT "id", "assessmentId", "createdAt", "reportJson"
        FROM "CareerReport"
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;

  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  const payload = toPayload(row.reportJson);
  const locale =
    typeof (payload as { locale?: unknown }).locale === "string" &&
    ((payload as { locale?: unknown }).locale === "en" ||
      (payload as { locale?: unknown }).locale === "zh")
      ? ((payload as { locale: NarrativeEvalLocale }).locale)
      : undefined;

  return {
    id: String(row.assessmentId ?? row.id),
    title: `Latest report ${row.assessmentId ?? row.id}`,
    kind: "report",
    payload,
    locale,
    source: userId ? `db:user:${userId}` : "db:latest-report",
  };
}

async function fetchLatestCoachingPayload(
  userId?: string,
): Promise<DbPayload | null> {
  const sql = await getSql();
  const rows = userId
    ? await sql`
        SELECT "id", "startedAt", "messagesJson"
        FROM "CoachingSession"
        WHERE "userId" = ${userId}
        ORDER BY "startedAt" DESC
        LIMIT 1
      `
    : await sql`
        SELECT "id", "startedAt", "messagesJson"
        FROM "CoachingSession"
        ORDER BY "startedAt" DESC
        LIMIT 1
      `;

  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;

  return {
    id: String(row.id),
    title: `Latest coaching session ${row.id}`,
    kind: "coaching",
    payload: toPayload(row.messagesJson),
    source: userId ? `db:user:${userId}` : "db:latest-coaching",
  };
}

async function buildDbInputs(
  kind: NarrativeEvalKind | "all",
  userId?: string,
): Promise<NarrativeEvalInput[]> {
  const payloads: Array<DbPayload | null> =
    kind === "all"
      ? await Promise.all([
          fetchLatestProfilePayload(userId),
          fetchLatestReportPayload(userId),
          fetchLatestCoachingPayload(userId),
        ])
      : [
          await (kind === "profile"
            ? fetchLatestProfilePayload(userId)
            : kind === "report"
              ? fetchLatestReportPayload(userId)
              : fetchLatestCoachingPayload(userId)),
        ];

  const missingKinds = payloads
    .map((payload) => payload?.kind ?? null)
    .filter((payloadKind) => payloadKind == null);
  if (payloads.every((payload) => payload == null)) {
    const label = userId ? ` for user ${userId}` : "";
    throw new Error(`No DB payload found${label}`);
  }
  if (missingKinds.length > 0 && kind !== "all") {
    const label = userId ? ` for user ${userId}` : "";
    throw new Error(`No ${kind} payload found${label}`);
  }

  return payloads
    .filter((payload): payload is DbPayload => payload !== null)
    .map((payload) =>
      buildEvalInputFromPayload({
        id: payload.id,
        kind: payload.kind,
        title: payload.title,
        payload: payload.payload,
        locale: payload.locale,
        source: payload.source,
      }),
    );
}

function buildFileInput(options: CliOptions): NarrativeEvalInput {
  const raw = readFileSync(resolve(options.inputPath!), "utf-8");
  const payload = parseUnknownJson(raw);
  return buildEvalInputFromPayload({
    id: options.inputPath!,
    kind: options.kind as NarrativeEvalKind,
    title: `File input ${options.inputPath}`,
    payload,
    locale: options.locale,
    source: `file:${options.inputPath}`,
  });
}

function printResult(result: NarrativeEvalResult): void {
  console.log(`\n${summarizeEvalResult(result)}`);
  console.log(
    `  source=${result.source ?? "n/a"} chars=${result.totalCharacters} segments=${result.segmentCount}`,
  );
  for (const [metricId, metric] of Object.entries(result.metrics)) {
    console.log(
      `  ${metricId.padEnd(12)} ${String(metric?.score ?? 0).padStart(3)}  ${
        metric?.notes.join(", ") ?? ""
      }`,
    );
  }
  if (result.issues.length > 0) {
    console.log("  issues:");
    for (const issue of result.issues) {
      console.log(`  - ${issue}`);
    }
  }
}

function writeResults(
  outputPath: string,
  results: NarrativeEvalResult[],
): void {
  const resolved = resolve(outputPath);
  mkdirSync(dirname(resolved), { recursive: true });
  writeFileSync(
    resolved,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baselineVersion: NARRATIVE_EVAL_BASELINE_VERSION,
        results,
      },
      null,
      2,
    ),
    "utf-8",
  );
  console.log(`\nSaved results to ${resolved}`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  const inputs =
    options.mode === "baseline"
      ? NARRATIVE_EVAL_BASELINE_CASES
      : options.mode === "file"
        ? [buildFileInput(options)]
        : await buildDbInputs(options.kind ?? "all", options.userId);

  if (inputs.some((input) => input.segments.length === 0)) {
    const empty = inputs.filter((input) => input.segments.length === 0);
    throw new Error(
      `No narrative segments extracted for: ${empty.map((input) => input.id).join(", ")}`,
    );
  }

  const results = inputs.map(evaluateNarrative);
  const passCount = results.filter((result) => result.passed).length;
  const averageScore =
    results.reduce((sum, result) => sum + result.overallScore, 0) /
    results.length;

  console.log(
    `Narrative Eval: ${passCount}/${results.length} passed, average=${Math.round(
      averageScore,
    )}`,
  );
  for (const result of results) {
    printResult(result);
  }

  if (options.outputPath) {
    writeResults(options.outputPath, results);
  }

  process.exit(results.some((result) => !result.passed) ? 1 : 0);
}

main().catch((error) => {
  console.error(
    `Narrative eval failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
});
