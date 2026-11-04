import Link from "next/link";
import { Sparkles, Users } from "lucide-react";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

interface CompanionCardDashboardProps {
  locale: Locale;
  /** Per-user opt-in flag (User.socialEnabled). When false, card invites them to enable in Settings. */
  enabled: boolean;
  /** Count of incoming pending requests — surfaces a "you have N requests" prompt when > 0. */
  incomingPendingCount: number;
  t: {
    title: string;
    subtitle: string;
    subtitleEmpty: string;
    subtitlePending: string;
    ctaOpen: string;
    ctaEnable: string;
  };
}

/**
 * Dashboard entry card for Archetype Companion. Server component — receives
 * already-resolved gating state from the parent (cohort entitlement is
 * checked in dashboard/page.tsx before rendering).
 *
 * Three states:
 *   - !enabled                      → invite to enable (links to Settings)
 *   - enabled + incomingPending > 0 → "you have N pending requests"
 *   - enabled + 0 pending           → generic discovery prompt
 */
export function CompanionCardDashboard({
  locale,
  enabled,
  incomingPendingCount,
  t,
}: CompanionCardDashboardProps) {
  const href = enabled ? `/${locale}/companions` : `/${locale}/settings`;
  const cta = enabled ? t.ctaOpen : t.ctaEnable;

  const subtitle = !enabled
    ? t.subtitleEmpty
    : incomingPendingCount > 0
      ? interpolate(t.subtitlePending, {
          count: String(incomingPendingCount),
        })
      : t.subtitleEmpty;

  return (
    <Link
      href={href}
      className="group flex min-h-[112px] flex-col items-start gap-3 p-4 rounded-xl bg-card border border-border hover-lift card-inset-highlight active:scale-[0.97] active:bg-white/[0.03] sm:min-h-0 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 items-center gap-3 self-stretch sm:flex-1">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
          <Users className="h-5 w-5 text-primary" />
          {incomingPendingCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold h-4 min-w-[16px] px-1 ring-2 ring-card">
              {incomingPendingCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground block flex items-center gap-1">
            {t.title}
            {!enabled && <Sparkles className="h-3 w-3 text-primary/70" />}
          </span>
          <span className="text-xs text-muted-foreground line-clamp-2">
            {subtitle}
          </span>
        </div>
      </div>
      <span className="ml-[52px] text-xs font-medium text-primary sm:ml-0 sm:shrink-0">
        {cta}
      </span>
    </Link>
  );
}
