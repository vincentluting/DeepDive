import type { Locale } from "@/lib/i18n/config";
import type { PersonalProfileData } from "@/lib/types";
import {
  buildMonographMuseumModel,
  type MonographMuseumEvidenceBand,
  type MonographMuseumEvidenceBandLabels,
} from "./monograph-museum-model";

export type ProfileDepthStationId =
  | "surface"
  | "identity"
  | "inner-landscape"
  | "meaning"
  | "tensions"
  | "report-threshold";

export type ProfileDepthStationLabels = Partial<
  Record<ProfileDepthStationId, string>
>;

export interface ProfileDepthStation {
  id: ProfileDepthStationId;
  anchorId: string;
  depthMeters: number;
  depth: string;
  label: string;
}

export interface CinematicProfileModel {
  archetypeCode: string;
  archetypeName: string;
  archetypeInitial: string;
  tagline: string;
  heroQuote: string;
  anchors: string[];
  meta: {
    impression: string;
    minted: string;
  };
  evidenceBands: MonographMuseumEvidenceBand[];
  depthStations: ProfileDepthStation[];
}

const PROFILE_DEPTH_STATION_DEFS: ReadonlyArray<
  Omit<ProfileDepthStation, "label"> & { defaultLabel: string }
> = [
  {
    id: "surface",
    anchorId: "profile-cinematic-hero",
    depthMeters: 0,
    depth: "0m",
    defaultLabel: "Surface",
  },
  {
    id: "identity",
    anchorId: "ch-portrait",
    depthMeters: 120,
    depth: "120m",
    defaultLabel: "Identity",
  },
  {
    id: "inner-landscape",
    anchorId: "ch-inner-landscape",
    depthMeters: 260,
    depth: "260m",
    defaultLabel: "Inner Landscape",
  },
  {
    id: "meaning",
    anchorId: "ch-meaning",
    depthMeters: 420,
    depth: "420m",
    defaultLabel: "Meaning",
  },
  {
    id: "tensions",
    anchorId: "ch-tensions",
    depthMeters: 620,
    depth: "620m",
    defaultLabel: "Tensions",
  },
  {
    id: "report-threshold",
    anchorId: "profile-report-cta",
    depthMeters: 800,
    depth: "800m",
    defaultLabel: "Report Threshold",
  },
];

export function buildProfileDepthStations(
  labels: ProfileDepthStationLabels = {},
): ProfileDepthStation[] {
  return PROFILE_DEPTH_STATION_DEFS.map((station) => ({
    id: station.id,
    anchorId: station.anchorId,
    depthMeters: station.depthMeters,
    depth: station.depth,
    label: labels[station.id] ?? station.defaultLabel,
  }));
}

export function buildCinematicProfileModel({
  profile,
  locale,
  mintedDate,
  depthLabels,
  evidenceBandLabels,
}: {
  profile: PersonalProfileData;
  locale: Locale;
  mintedDate: string;
  depthLabels?: ProfileDepthStationLabels;
  evidenceBandLabels?: MonographMuseumEvidenceBandLabels;
}): CinematicProfileModel {
  const monograph = buildMonographMuseumModel({
    profile,
    locale,
    mintedDate,
    evidenceBandLabels,
  });

  return {
    archetypeCode: monograph.archetypeCode,
    archetypeName: monograph.archetypeName,
    archetypeInitial: monograph.archetypeInitial,
    tagline: monograph.tagline,
    heroQuote: monograph.quote,
    anchors: monograph.anchors,
    meta: monograph.meta,
    evidenceBands: monograph.evidenceBands,
    depthStations: buildProfileDepthStations(depthLabels),
  };
}
