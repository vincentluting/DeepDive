// ============================================================
// SealedCareersChapter — Revelation wrapper around ClaimProfileWall.
//
// Conversion-critical region. The wax-seal aesthetic and the RevArtifact
// frame replace glassmorphism, but the orange "Claim Your Profile" CTA
// inside ClaimProfileWall is the highest-contrast pixel on the page and
// stays untouched (founder decision in plan §P1.3).
//
// Authenticated:    ClaimProfileWall renders the three career lists directly.
// Unauthenticated:  ClaimProfileWall renders the blurred wall + orange CTA;
//                   we surround it with a RevArtifact frame and a small
//                   sealed-caption italic line under the artifact.
// ============================================================

"use client";

import { ClaimProfileWall } from "@/components/quickdive/claim-profile-wall";
import { RevArtifact, RevFleuron } from "@/components/profile-panels/editorial";
import type { CareerItem } from "@/components/quickdive/quickdive-data";

interface SealedCareersChapterProps {
  careers: {
    topCareers: CareerItem[];
    fitCareers: CareerItem[];
    drainCareers?: CareerItem[];
  };
  archetypeCode: string;
  archetypeTitle: string;
  archetypeTitleEn: string;
  locale: string;
  isLoggedIn: boolean | null;
  onClaimClick: () => void;
  /** Localised "Sealed Chapter · Careers" label */
  artifactEyebrow: string;
  /** Localised italic caption shown under the artifact for unauth users */
  sealedCaption: string;
}

export function SealedCareersChapter({
  careers,
  archetypeCode,
  archetypeTitle,
  archetypeTitleEn,
  locale,
  isLoggedIn,
  onClaimClick,
  artifactEyebrow,
  sealedCaption,
}: SealedCareersChapterProps) {
  const showSealedCaption = isLoggedIn === false;

  return (
    <div className="mx-auto max-w-[var(--rev-measure)]">
      <RevArtifact
        eyebrow={artifactEyebrow}
        tone="paper"
        className="px-4 py-6 sm:px-8 sm:py-9"
      >
        {/* Wax-seal ornament — only visible while sealed (unauth) */}
        {showSealedCaption && (
          <div className="absolute right-4 top-4 pointer-events-none opacity-50">
            <RevFleuron glyph="lozenge" className="!mt-0 !mb-0" />
          </div>
        )}

        {/* ClaimProfileWall does its own auth branching:
            - logged in → NormalCareerCard list
            - not logged in → masked preview + orange "Claim" CTA (untouched) */}
        <ClaimProfileWall
          careers={careers}
          archetypeCode={archetypeCode}
          archetypeTitle={archetypeTitle}
          archetypeTitleEn={archetypeTitleEn}
          locale={locale}
          onClaimClick={onClaimClick}
          isLoggedIn={isLoggedIn ?? false}
          immersive={false}
        />
      </RevArtifact>

      {showSealedCaption && (
        <p className="mt-6 mx-auto max-w-[44ch] text-center font-serif italic text-rev-ink-soft text-[14px] sm:text-[15px] leading-[1.55]">
          {sealedCaption}
        </p>
      )}
    </div>
  );
}
