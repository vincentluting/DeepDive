// ============================================================
// Admin — Barrel Re-export
//
// This file re-exports all admin sub-modules so that existing
// imports like `from '@/lib/db/admin'` continue to work unchanged.
//
// Sub-modules:
//   admin-bootstrap.ts      — ensureAdminColumn, bootstrapAdmin
//   admin-users.ts          — listUsersWithStats
//   admin-thesis-export.ts  — getThesisExportData, ThesisExportRow
//   admin-research-export.ts — getResearchExportData/Count, ResearchExportRow/Filters
//   admin-deepdive-export.ts — getDeepDiveExportData/Count, DeepDiveExportRecord, etc.
// ============================================================

export * from "./admin-bootstrap";
export * from "./admin-users";
export * from "./admin-thesis-export";
export * from "./admin-research-export";
export * from "./admin-deepdive-export";
