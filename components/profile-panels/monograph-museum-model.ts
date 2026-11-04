import type { Locale } from "@/lib/i18n/config";
import { getLocalizedField, pickLocaleText } from "@/lib/i18n/localize";
import {
  COLLAB_STYLE_COLORS,
  SCHWARTZ_VALUE_LABELS,
} from "@/lib/scoring/constants";
import type { PersonalProfileData, RIASECDimension } from "@/lib/types";

type EvidenceBandId = "pattern" | "style" | "values";

export type MonographMuseumEvidenceBandLabels = Record<EvidenceBandId, string>;

export interface MonographMuseumEvidenceBand {
  id: EvidenceBandId;
  label: string;
  value: number;
}

export interface MonographMuseumModel {
  archetypeCode: string;
  archetypeName: string;
  archetypeInitial: string;
  tagline: string;
  quote: string;
  anchors: string[];
  meta: {
    impression: string;
    minted: string;
  };
  evidenceBands: MonographMuseumEvidenceBand[];
}

const RIASEC_ANCHOR_LABELS: Record<
  RIASECDimension,
  { zh: string; en: string }
> = {
  R: { zh: "实干派", en: "Hands-On" },
  I: { zh: "探究派", en: "Analytical" },
  A: { zh: "创作派", en: "Creative" },
  S: { zh: "助人派", en: "People-First" },
  E: { zh: "进取派", en: "Driven" },
  C: { zh: "规则派", en: "Systematic" },
};

const DEFAULT_EVIDENCE_BAND_LABELS: MonographMuseumEvidenceBandLabels = {
  pattern: "Core Pattern",
  style: "Working Style",
  values: "Values",
};

export function buildMonographMuseumModel({
  profile,
  locale,
  mintedDate,
  evidenceBandLabels,
}: {
  profile: PersonalProfileData;
  locale: Locale;
  mintedDate: string;
  evidenceBandLabels?: MonographMuseumEvidenceBandLabels;
}): MonographMuseumModel {
  const labels = evidenceBandLabels ?? DEFAULT_EVIDENCE_BAND_LABELS;
  const narrative = profile.narrativeSnapshots;
  const archetypeName =
    getLocalizedField(profile.archetype, "label", locale) ||
    profile.archetype.code;
  const tagline = getLocalizedField(profile.archetype, "tagline", locale);
  const quote =
    firstSentence(narrative?.coreInsight) ||
    firstSentence(narrative?.identitySummary) ||
    tagline ||
    archetypeName;

  return {
    archetypeCode: profile.archetype.code,
    archetypeName,
    archetypeInitial: archetypeName.slice(0, 1).toLocaleUpperCase(locale),
    tagline,
    quote,
    anchors: buildAnchors(profile, locale),
    meta: {
      impression: profile.id || profile.assessmentId,
      minted: mintedDate,
    },
    // Evidence bands are a pure numeric "instrument" signature on the cover —
    // confidence readings only, no prose. The full narrative for each axis
    // lives exactly once in Chapter 01 (NarrativeSynthesis), so the cover no
    // longer repeats the opening sentences it used to carry here.
    evidenceBands: [
      {
        id: "pattern",
        label: labels.pattern,
        value: confidenceToPercent(profile.archetype.confidence),
      },
      {
        id: "style",
        label: labels.style,
        value: confidenceToPercent(
          profile.collabMapping?.confidence ?? profile.cognitiveStyleConfidence,
        ),
      },
      {
        id: "values",
        label: labels.values,
        value: confidenceToPercent(profile.schwartzAnchors?.confidence),
      },
    ],
  };
}

function buildAnchors(profile: PersonalProfileData, locale: Locale): string[] {
  const anchors: string[] = [];
  const riasec = RIASEC_ANCHOR_LABELS[profile.archetype.primary];
  const topValue = profile.schwartzAnchors?.top3?.[0];
  const collab = profile.collabMapping?.primary
    ? COLLAB_STYLE_COLORS[profile.collabMapping.primary]
    : undefined;

  if (riasec) anchors.push(pickLocaleText(riasec, locale));
  if (topValue) {
    anchors.push(pickLocaleText(SCHWARTZ_VALUE_LABELS[topValue], locale));
  }
  if (collab) {
    anchors.push(
      pickLocaleText({ en: collab.name_en, zh: collab.name_zh }, locale),
    );
  }

  return anchors.filter(Boolean).slice(0, 3);
}

function confidenceToPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  if (value <= 1) return Math.round(value * 100);
  return Math.round(Math.min(100, Math.max(0, value)));
}

function firstSentence(raw: string | null | undefined): string {
  const text = raw?.trim();
  if (!text) return "";
  const match = text.match(/^.+?[.!?。！？](?=\s|$)/u);
  return (match?.[0] ?? text).trim();
}
