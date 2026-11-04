"use client";

import type { Locale } from "@/lib/i18n/config";
import { ResearchProgressPanel } from "./research-progress-panel";
import { ResearchExportPanel } from "./research-export-panel";
import { ThesisAnalyticsPanel } from "./thesis-analytics";

// NOTE: Section C "Post-1Week Reminders" (manual trigger button) was
// removed 2026-04-08 during beta phase to prevent accidentally emailing
// users. The API route at /api/admin/send-post1week-reminders still
// exists and can be invoked via curl with CRON_SECRET when needed.
// To restore the UI: see commit history for this file before 2026-04-08.

// ────────────────────────────────────────────────────────────
// Research Tab Container
// Consolidates all research-specific UI into a single deletable unit.
// Post-thesis: delete this file + the entire components/admin/research/ directory.
// ────────────────────────────────────────────────────────────

export function ResearchTabContainer({ locale }: { locale: Locale }) {
  return (
    <div className="space-y-6">
      {/* ═══ Section A: Sample & Progress ═══ */}
      <ResearchProgressPanel locale={locale} />

      {/* ═══ Section B: Thesis Analytics ═══ */}
      <ThesisAnalyticsPanel locale={locale} />

      {/* ═══ Section C: Post-1Week Reminders (removed during beta 2026-04-08) ═══ */}
      {/* Manual trigger button removed to prevent accidentally emailing users.    */}
      {/* Backend route /api/admin/send-post1week-reminders still exists.          */}

      {/* ═══ Section D: Data Export (Quick Dive / Deep Dive / Thesis) ═══ */}
      <ResearchExportPanel locale={locale} />
    </div>
  );
}
