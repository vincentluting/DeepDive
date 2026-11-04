# Scripts

Database management scripts for the Deep Dive application.

## reset-database.ts — Clear All User Data

Clears all historical user data from every table while preserving table schemas and seed data (`DailyQuestion`).

### Prerequisites

- Node.js 18+
- Install dependencies first (`npm install`). TypeScript scripts run via `node --import tsx`, using the repo-local `tsx` devDependency.
- A database connection string in one of these environment variables:
  - `POSTGRES_URL`
  - `DATABASE_URL`
  - `POSTGRES_PRISMA_URL`
  - `POSTGRES_URL_NON_POOLING`

### Usage

```bash
# Dry run — shows what would be deleted, modifies nothing
node --import tsx scripts/reset-database.ts

# Execute — actually clears all data
node --import tsx scripts/reset-database.ts --confirm

# Execute against production (requires explicit override)
node --import tsx scripts/reset-database.ts --confirm --force-production
```

### Safety Features

| Feature                    | Description                                                                     |
| -------------------------- | ------------------------------------------------------------------------------- |
| Dry run by default         | Without `--confirm`, only prints row counts                                     |
| Production guard           | Refuses to run when `NODE_ENV=production` unless `--force-production` is passed |
| Pre-deletion report        | Prints every table and its row count before any changes                         |
| Post-deletion verification | Re-counts every table to confirm all data was removed                           |
| Idempotent                 | Safe to run multiple times — already-empty tables are skipped                   |

### Tables Cleared (15)

| Group             | Tables                                                               |
| ----------------- | -------------------------------------------------------------------- |
| Report & profile  | PersonalProfile, CareerReport, RealConditions                        |
| Assessment        | AssessmentResult, QuestionnaireSession, QuickDiveResult              |
| Platform features | CoachingSession, DailyQuestionResponse, JobApplication, UserProgress |
| Core              | UserProfile, UserSession, User                                       |

### Tables Preserved

| Table         | Reason                                                                         |
| ------------- | ------------------------------------------------------------------------------ |
| DailyQuestion | Contains seed data (10 daily prompts) required for the application to function |

---

## reset-database.sql — SQL Version

A pure SQL alternative for running directly in the Neon SQL Editor or any PostgreSQL client.

Contains two sections:

- **Section A**: `TRUNCATE` only — clears data, keeps schemas + seed data
- **Section B**: `DROP ALL` — destroys tables entirely (commented out by default, requires `schema.sql` to rebuild)

### Usage

1. Open the Neon dashboard SQL Editor
2. Paste the contents of `reset-database.sql`
3. Run Section A for data-only clearing
4. (Optional) Uncomment and run Section B for a full table drop

---

## schema.sql — Full Schema Creation

Creates all tables with indexes, constraints, and seed data. Used after a full `DROP ALL` reset or for initial database setup.

Run in the Neon SQL Editor or via the `POST /api/init-db` endpoint.
