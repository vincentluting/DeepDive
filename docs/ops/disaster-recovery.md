# Disaster Recovery — Database Restore Guide

> Last verified: 2026-03-08
> Database: Neon Serverless Postgres (project: holy-wildflower-95809875)

## Backup Status

Neon Free Tier includes **6-hour point-in-time recovery** (automatic, zero config).
This means you can restore the database to any second within the past 6 hours.
Verified on 2026-03-08 via Neon Dashboard (Backup & Restore page).

## When to Use

- Accidentally deleted user data
- Bad migration corrupted a table
- Need to recover from a bug that wrote wrong data

## How to Restore

### Option 1: Restore via Neon Dashboard (Recommended)

1. Go to [console.neon.tech](https://console.neon.tech)
2. Open project **neon-green-river**
3. Click **"Backup & Restore"** in the left menu (under main branch)
4. Set the date/time you want to restore to (must be within the past 6 hours)
5. Click **"Preview data"** to verify before restoring
6. Click **"Restore to point in time"**
7. This restores the main branch in-place

### Option 2: Export specific tables

If you only need to recover specific data (not a full restore):

1. Create a point-in-time branch (steps 1-6 above)
2. Connect to the restored branch using its connection string
3. Export the tables you need:
   ```sql
   -- Example: export all reports from restored branch
   COPY (SELECT * FROM "CareerReport") TO STDOUT WITH CSV HEADER;
   ```
4. Import into your main branch

## Prevention Checklist

- [ ] Never run `DROP TABLE` or `DELETE` without a WHERE clause
- [ ] Always use `--dry-run` flag for migrations first: `npm run db:migrate:dry-run`
- [ ] Check migration status before deploying: `npm run db:migrate:status`

## Important Notes

- Free tier retention is **6 hours** — if you discover a problem after 6 hours, data is unrecoverable
- Neon Launch plan ($19/month) extends to 7 days; Scale plan to 30 days
- Consider upgrading when you have paying users or critical data
- Vercel deployments don't affect backups — Neon handles backups independently
