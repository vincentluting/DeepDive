"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type KpiTone = "primary" | "green" | "blue" | "violet" | "amber" | "red";

export const ADMIN_KPI_TONE_CLASSES: Record<
  KpiTone,
  { accent: string; icon: string }
> = {
  primary: {
    accent: "dd-admin-kpi-accent--sea",
    icon: "dd-admin-kpi-icon--sea",
  },
  green: {
    accent: "dd-admin-kpi-accent--sea",
    icon: "dd-admin-kpi-icon--success",
  },
  blue: {
    accent: "dd-admin-kpi-accent--sea",
    icon: "dd-admin-kpi-icon--sea",
  },
  violet: {
    accent: "dd-admin-kpi-accent--gold",
    icon: "dd-admin-kpi-icon--gold",
  },
  amber: {
    accent: "dd-admin-kpi-accent--gold",
    icon: "dd-admin-kpi-icon--gold",
  },
  red: {
    accent: "dd-admin-kpi-accent--alert",
    icon: "dd-admin-kpi-icon--alert",
  },
};

/** CSS-only hover tooltip explaining the metric definition. */
export function KpiDefinitionTooltip({ text }: { text: string }) {
  return (
    <div className="group/kpi relative inline-flex ml-1">
      <Info className="w-3 h-3 text-muted-foreground/40 group-hover/kpi:text-muted-foreground transition-colors cursor-help" />
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-popover-foreground leading-relaxed w-52 opacity-0 invisible group-hover/kpi:opacity-100 group-hover/kpi:visible transition-all duration-150 z-50 pointer-events-none">
        {text}
      </div>
    </div>
  );
}

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  iconTone?: KpiTone;
  /** Metric definition shown in an info tooltip (data-precision transparency). */
  definition?: string;
  /** Secondary line below the value, e.g. "+12 this week". */
  sub?: ReactNode;
  /** Makes the whole card a link to the relevant admin section. */
  href?: string;
  loading?: boolean;
}

/**
 * Standard admin KPI stat card (Utility surface: flat white card,
 * 0.5px border, hover-only feedback).
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  iconTone = "primary",
  definition,
  sub,
  href,
  loading,
}: KpiCardProps) {
  const tone = ADMIN_KPI_TONE_CLASSES[iconTone];

  const body = (
    <Card
      className={`dd-admin-kpi-card ${tone.accent} bg-card border-border h-full ${
        href ? "transition-colors hover:border-primary/40" : ""
      }`}
    >
      <CardContent className="p-4 flex items-center gap-3">
        {Icon && (
          <div className={`dd-admin-kpi-icon ${tone.icon} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <span className="dd-admin-kpi-label text-xs text-muted-foreground flex items-center">
            <span className="dd-admin-kpi-label-text truncate">{label}</span>
            {definition && <KpiDefinitionTooltip text={definition} />}
          </span>
          {loading ? (
            <div className="h-8 w-16 mt-0.5 bg-muted/40 animate-pulse rounded" />
          ) : (
            <p className="dd-admin-kpi-value text-2xl font-bold text-primary truncate">
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block min-w-0">
        {body}
      </Link>
    );
  }
  return body;
}
