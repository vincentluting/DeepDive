import type { Metadata } from "next";

import { ExploreHub } from "@/components/features/explore-hub";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCompletionStatus } from "@/lib/db/assessment-completion";
import { getDeepDiveStatusForUser } from "@/lib/db/sessions";
import { sql } from "@/lib/db/connection";
import { getQuickDiveModeAliases } from "@/lib/quickdive/explore-mode";

interface ExplorePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ gate?: string }>;
}

export async function generateMetadata({
  params,
}: ExplorePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);
  const ep = t.explorePage;
  return {
    title: ep.title,
    description: ep.subtitle,
  };
}

export default async function ExplorePage({
  params,
  searchParams,
}: ExplorePageProps) {
  const { locale } = await params;
  const { gate } = await searchParams;
  const user = await getCurrentUser();
  const researchGroup = user?.researchGroup ?? null;

  let serverStatus: {
    quickDive: { hasResults: boolean };
    immersiveDive: { hasResults: boolean };
    deepDive: { hasResults: boolean; inProgress: boolean };
  } | null = null;

  if (user) {
    const [completionMap, ddStatus] = await Promise.all([
      getCompletionStatus(user.id, [
        "quick_dive",
        "immersive_dive",
        "deep_dive",
      ]).catch(() => ({
        quick_dive: false,
        immersive_dive: false,
        deep_dive: false,
      })),
      getDeepDiveStatusForUser(user.id).catch(() => ({
        hasResults: false,
        inProgress: false,
      })),
    ]);
    // Fallback: if AssessmentCompletion has no immersive record,
    // check QuickDiveResult table directly (fire-and-forget may have failed).
    // Historical immersive sessions may still be stored as "narrative".
    let immersiveHasResults = completionMap.immersive_dive;
    if (!immersiveHasResults) {
      const immersiveModes = getQuickDiveModeAliases("immersive");
      const fallback = await sql`
        SELECT 1 FROM "QuickDiveResult"
        WHERE "userId" = ${user.id}
          AND "exploreMode" = ANY(${immersiveModes})
        LIMIT 1
      `.catch(() => []);
      immersiveHasResults = fallback.length > 0;
    }

    serverStatus = {
      quickDive: { hasResults: completionMap.quick_dive },
      immersiveDive: { hasResults: immersiveHasResults },
      deepDive: ddStatus,
    };
  }

  return (
    <ExploreHub
      locale={locale as Locale}
      researchGroup={researchGroup}
      cohort={user?.cohort ?? null}
      gate={gate}
      serverStatus={serverStatus}
      isAdmin={user?.isAdmin ?? false}
    />
  );
}
