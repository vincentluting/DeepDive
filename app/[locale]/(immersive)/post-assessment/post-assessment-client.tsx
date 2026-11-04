"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import {
  getPostAssessmentCompletionDestination,
  normalizePrePostAssessmentType,
} from "@/lib/pre-post-assessment/navigation";

const PostAssessmentSurvey = dynamic(
  () =>
    import("@/components/features/post-assessment-survey").then(
      (m) => m.PostAssessmentSurvey,
    ),
  { ssr: false },
);
import type { PrePostAssessmentType } from "@/lib/types/platform";

function PostAssessmentContent({
  locale,
  researchGroup,
  hasUsedCoaching,
}: {
  locale: string;
  researchGroup: "classic" | "immersive" | null;
  hasUsedCoaching: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const assessmentType: PrePostAssessmentType = normalizePrePostAssessmentType(
    searchParams.get("type"),
  );
  const completeDestination = getPostAssessmentCompletionDestination({
    type: assessmentType,
    redirect: searchParams.get("redirect"),
    locale,
  });

  const handleComplete = () => {
    router.push(completeDestination);
  };

  const handleSkip = () => {
    router.push(`/${locale}/dashboard`);
  };

  return (
    <PostAssessmentSurvey
      assessmentType={assessmentType}
      locale={locale as "en" | "zh"}
      onComplete={handleComplete}
      onSkip={handleSkip}
      researchGroup={researchGroup}
      hasUsedCoaching={hasUsedCoaching}
    />
  );
}

export function PostAssessmentClient({
  locale,
  researchGroup,
  hasUsedCoaching = true,
}: {
  locale: string;
  researchGroup: "classic" | "immersive" | null;
  hasUsedCoaching?: boolean;
}) {
  const dict = getDictionaryClient(locale as "en" | "zh");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            {dict.common.loading}
          </div>
        </div>
      }
    >
      <PostAssessmentContent
        locale={locale}
        researchGroup={researchGroup}
        hasUsedCoaching={hasUsedCoaching}
      />
    </Suspense>
  );
}
