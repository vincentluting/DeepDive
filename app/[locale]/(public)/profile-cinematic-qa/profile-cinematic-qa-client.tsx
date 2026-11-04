// ============================================================
// Profile Cinematic QA — public visual prototype
//
// Uses mock PersonalProfileData to render the selected Bathymetric Monograph
// direction without touching authenticated profile data.
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { defaultLocale, isValidLocale, toDateLocaleOrDefault } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { PersonalProfileData } from "@/lib/types";
import { RevChapter, RevHandRule } from "@/components/profile-panels/editorial";
import {
  buildCinematicProfileModel,
  type ProfileDepthStationLabels,
} from "@/components/profile-panels/cinematic-profile-model";
import {
  ProfileCinematicDepthNav,
  ProfileCinematicHero,
} from "@/components/profile-panels/profile-cinematic-hero";

function useActiveAnchor(anchorIds: string[], initialId: string): string {
  const [activeId, setActiveId] = useState(initialId);
  const key = anchorIds.join("|");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId = initialId;
        let bestRatio = 0;
        for (const [id, ratio] of ratios.entries()) {
          if (ratio > bestRatio) {
            bestId = id;
            bestRatio = ratio;
          }
        }
        setActiveId(bestId);
      },
      {
        rootMargin: "-22% 0px -54% 0px",
        threshold: [0, 0.1, 0.3, 0.6, 1],
      },
    );

    for (const id of key.split("|")) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [initialId, key]);

  return activeId;
}

export function ProfileCinematicQaClient({ locale }: { locale: string }) {
  const loc = isValidLocale(locale) ? locale : defaultLocale;
  const t = getDictionaryClient(loc).profile;
  const mintedDate = new Date(MOCK_PROFILE.updatedAt).toLocaleDateString(
    toDateLocaleOrDefault(loc),
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  const depthLabels: ProfileDepthStationLabels = {
    surface: String(t.cinematicDepthSurface),
    identity: String(t.cinematicDepthIdentity),
    "inner-landscape": String(t.cinematicDepthInnerLandscape),
    meaning: String(t.cinematicDepthMeaning),
    tensions: String(t.cinematicDepthTensions),
    "report-threshold": String(t.cinematicDepthReportThreshold),
  };
  const model = buildCinematicProfileModel({
    profile: MOCK_PROFILE,
    locale: loc,
    mintedDate,
    depthLabels,
    evidenceBandLabels: {
      pattern: String(t.monographEvidencePattern),
      style: String(t.monographEvidenceStyle),
      values: String(t.monographEvidenceValues),
    },
  });
  const activeAnchorId = useActiveAnchor(
    model.depthStations.map((station) => station.anchorId),
    model.depthStations[0]?.anchorId ?? "profile-cinematic-hero",
  );

  return (
    <main className="dd-profile-monograph min-h-dvh text-rev-ink relative">
      <ProfileCinematicDepthNav
        stations={model.depthStations}
        activeAnchorId={activeAnchorId}
        ariaLabel={String(t.cinematicDepthAria)}
        currentDepthLabel={String(t.cinematicCurrentDepth)}
      />
      <ProfileCinematicHero
        model={model}
        copy={{
          surfaceKicker: String(t.cinematicSurfaceKicker),
          title: String(t.cinematicTitle),
          subtitle: String(t.cinematicSubtitle),
          routeLabel: "/profile-cinematic-qa",
          anchorsLabel: String(t.cinematicAnchorsLabel),
          evidenceLabel: String(t.cinematicEvidenceLabel),
          currentDepthLabel: String(t.cinematicCurrentDepth),
          depthAriaLabel: String(t.cinematicDepthAria),
        }}
        reportHref="#profile-report-cta"
        reportLabel={String(t.reportCtaGenerateDirect)}
      />

      {model.depthStations.slice(1, 5).map((station, index) => (
        <RevChapter
          key={station.id}
          id={station.anchorId}
          eyebrow={`${station.depth} · ${station.label}`}
          title={QA_CHAPTERS[index]?.title ?? station.label}
          lead={QA_CHAPTERS[index]?.lead}
          tone={index % 2 === 0 ? "paper" : "warm"}
          ruleTone={index === 3 ? "attention" : "cold"}
        >
          <div className="max-w-5xl mx-auto grid gap-4 sm:grid-cols-3">
            {QA_CHAPTERS[index]?.cards.map((card) => (
              <article
                key={card.label}
                className="rounded-[8px] border border-rev-rule bg-rev-paper/70 p-5 backdrop-blur-sm"
              >
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-rev-signal-info">
                  {card.label}
                </p>
                <p className="mt-4 font-serif text-base italic leading-relaxed text-rev-ink-soft">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </RevChapter>
      ))}

      <section
        id="profile-report-cta"
        className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-20 scroll-mt-24"
      >
        <div className="rounded-[8px] border border-rev-rule bg-rev-paper/78 p-8 text-center backdrop-blur-md">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-rev-signal-info">
            {model.depthStations[5]?.depth} · {model.depthStations[5]?.label}
          </p>
          <div className="mt-5 flex justify-center">
            <RevHandRule tone="attention" width={44} />
          </div>
          <h2 className="mt-8 font-display text-3xl font-normal text-rev-ink sm:text-5xl">
            {t.generateStepTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-rev-ink-soft">
            {t.generateStepDesc}
          </p>
        </div>
      </section>
    </main>
  );
}

const QA_CHAPTERS = [
  {
    title: "Identity below the surface",
    lead: "The opener gives the profile a cinematic threshold before the full personal monograph begins.",
    cards: [
      { label: "Archetype", text: "Researcher, with a quiet drive toward truth." },
      { label: "Signal", text: "High pattern clarity and deliberate working style." },
      { label: "Anchor", text: "Meaning grows when discovery becomes useful." },
    ],
  },
  {
    title: "Inner landscape",
    lead: "The middle chapters become a navigable terrain instead of a flat dashboard.",
    cards: [
      { label: "Thinking", text: "Depth over display; signal over noise." },
      { label: "Energy", text: "Solitude restores the sharpness of attention." },
      { label: "Style", text: "Refining, naming, and making complex things legible." },
    ],
  },
  {
    title: "Meaning compass",
    lead: "Values read as a compass layer, not a diagnostic table.",
    cards: [
      { label: "North", text: "Universalism and self-direction are the strongest pull." },
      { label: "Current", text: "Autonomy needs a useful human consequence." },
      { label: "Bearing", text: "Work should reveal something true and usable." },
    ],
  },
  {
    title: "Tensions and becoming",
    lead: "The final profile chapter names the productive pressure inside the person.",
    cards: [
      { label: "Tension", text: "Needing independence while wanting the work to matter." },
      { label: "Shadow", text: "Intensity can become a strength when held with care." },
      { label: "Practice", text: "Choose roles where depth has room to compound." },
    ],
  },
];

const MOCK_PROFILE = {
  id: "profile-cinematic-qa",
  userId: "qa-user",
  assessmentId: "assessment-cinematic-qa",
  updatedAt: "2026-06-17T00:00:00.000Z",
  archetype: {
    primary: "I",
    orientation: "transcendence",
    code: "I-transcendence",
    label_en: "Researcher",
    label_zh: "科学家",
    tagline_en: "Relentless in the pursuit of truth",
    tagline_zh: "不到真相不罢休",
    confidence: 0.88,
    confidenceLevel: "high",
    isBoundary: false,
    derivedFrom: {
      primary: { dimension: "I", score: 91 },
      secondary: { dimension: "A", score: 74 },
      tertiary: { dimension: "C", score: 62 },
      gap12: 17,
      gap23: 12,
      relation: "adjacent",
    },
  },
  cognitiveStyleCode: "INTJ",
  cognitiveStyleDisplayMode: "normal",
  cognitiveStyleConfidence: 0.72,
  collabMapping: {
    primary: "C",
    secondary: "S",
    scores: { D: 12, I: 18, S: 28, C: 42 },
    cssGradient: "",
    derivedFrom: "big_five_mapping",
    approximationNote_en: "",
    approximationNote_zh: "",
    confidence: 0.73,
  },
  schwartzAnchors: {
    ranking: [
      "universalism",
      "self-direction",
      "benevolence",
      "stimulation",
      "achievement",
      "security",
      "conformity",
      "tradition",
      "power",
      "hedonism",
    ],
    top3: ["universalism", "self-direction", "benevolence"],
    scores: {
      achievement: 2,
      power: 1,
      stimulation: 4,
      "self-direction": 5,
      hedonism: 2,
      benevolence: 5,
      universalism: 6,
      conformity: 2,
      tradition: 2,
      security: 3,
    },
    conflictPair: null,
    conflictStatus: null,
    confidence: 0.64,
  },
  crossCultural: { type: null, label_zh: null },
  confidenceMap: {},
  narrativeSnapshots: {
    coreInsight: "You turn uncertainty into a question clear enough to pursue.",
    identitySummary:
      "You are most alive when a hidden pattern becomes legible.",
    archetypeNarrative:
      "You search until the work has a true center. Noise loses power when you can name the pattern.",
    bigFiveNarrative:
      "Your attention favors depth over display. You need enough solitude to hear the signal.",
    valueNarrative:
      "You care about truth that serves more than personal advantage. Meaning arrives when discovery becomes useful.",
  },
} as PersonalProfileData;
