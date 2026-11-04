import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import type { PrePostAssessmentType } from "@/lib/types/platform";

type QueryParam = string | string[] | null | undefined;

function firstQueryParam(value: QueryParam): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function normalizePrePostAssessmentType(
  value: QueryParam,
): PrePostAssessmentType {
  const raw = firstQueryParam(value);
  if (raw === "pre" || raw === "post_1week") return raw;
  return "post_immediate";
}

export function getPostAssessmentDestination(
  redirect: QueryParam,
  locale: string,
): string {
  return safeRedirectPath(firstQueryParam(redirect), `/${locale}/dashboard`);
}

export function getPostAssessmentCompletionDestination({
  type,
  redirect,
  locale,
}: {
  type: QueryParam;
  redirect: QueryParam;
  locale: string;
}): string {
  const assessmentType = normalizePrePostAssessmentType(type);
  if (assessmentType !== "pre") return `/${locale}/dashboard`;
  return getPostAssessmentDestination(redirect, locale);
}

export function buildPostAssessmentHref({
  locale,
  type,
  redirect,
}: {
  locale: string;
  type: QueryParam;
  redirect?: QueryParam;
}): string {
  const assessmentType = normalizePrePostAssessmentType(type);
  const dashboardPath = `/${locale}/dashboard`;
  const destination = getPostAssessmentCompletionDestination({
    type: assessmentType,
    redirect,
    locale,
  });
  const params = new URLSearchParams({ type: assessmentType });

  if (destination !== dashboardPath) {
    params.set("redirect", destination);
  }

  return `/${locale}/post-assessment?${params.toString()}`;
}
