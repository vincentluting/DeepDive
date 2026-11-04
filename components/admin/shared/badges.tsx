"use client";

import { Badge } from "@/components/ui/badge";
import { countryCodeToFlag } from "@/lib/utils/country-flags";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

/** Format a timestamp as "MM/DD HH:mm UTC" for compact admin tables. */
export function formatAdminDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes} UTC`;
}

export function UserAvatar({
  name,
  email,
}: {
  name: string | null;
  email: string;
}) {
  const initial = (name?.[0] || email[0] || "?").toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-medium text-foreground border border-primary/10 shrink-0">
      {initial}
    </div>
  );
}

export function CountryDisplay({ code }: { code: string | null }) {
  if (!code) return <span className="text-muted-foreground text-xs">—</span>;
  if (code === "LOCAL")
    return <span className="text-muted-foreground text-xs">LOCAL</span>;
  const flag = countryCodeToFlag(code);
  return (
    <span className="text-sm">
      {flag} {code}
    </span>
  );
}

export function CareerStageBadge({
  stage,
  locale,
}: {
  stage: string | null;
  locale: Locale;
}) {
  if (!stage) return <span className="text-muted-foreground text-xs">—</span>;
  const dict = getDictionaryClient(locale).admin as Record<string, unknown>;
  const stages = (dict.careerStages || {}) as Record<string, string>;
  const label = stages[stage] || stage;
  return (
    <Badge variant="secondary" className="text-xs whitespace-nowrap">
      {label}
    </Badge>
  );
}

export function ResearchGroupBadge({
  group,
  participantId,
}: {
  group: "classic" | "immersive" | null;
  participantId: string | null;
}) {
  if (!group) return null;
  const color =
    group === "classic"
      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900"
      : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${color}`}
    >
      {group === "classic" ? "Classic" : "Immersive"}
      {participantId && <span className="opacity-70">· {participantId}</span>}
    </span>
  );
}
