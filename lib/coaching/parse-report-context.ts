// ============================================================
// Parse report summary data for coaching context
// ============================================================

interface ReportRole {
  role_title?: string;
  title_zh?: string;
  title_en?: string;
}

interface ReportTension {
  tension?: string;
  description?: string;
}

interface ParsedReportData {
  ideal_fit_summary?: {
    top_roles?: ReportRole[];
    top_3_primary_roles?: ReportRole[];
  };
  career_tensions?: {
    tensions?: ReportTension[];
  };
  archetype_synthesis?: {
    primary_archetype?: string;
    description?: string;
  };
  // Section-specific data
  careerMatch?: {
    directions?: Array<{
      title_zh?: string;
      title_en?: string;
      title?: string;
      fit_reason?: string;
      fitReason?: string;
    }>;
    coreInsight?: string;
  };
  careerPathway?: {
    realConditionsProvided?: boolean;
    jobDirections?: Array<{
      title_zh?: string;
      title_en?: string;
      title?: string;
    }>;
    jobSearchStrategy?: {
      positioning?: string;
    };
  };
  integration?: {
    coreInsight?: string;
    core_insight?: string;
  };
  header?: {
    archetypeLabel?: string;
    archetype_label?: string;
    tagline?: string;
  };
  meta?: {
    realConditionsProvided?: boolean;
  };
  raw?: unknown;
}

/** Report section context for targeted coaching conversations */
export interface ReportSectionContext {
  careerMatchSummary: string;
  profileSummary: string;
  pathwaySummary: string;
}

export interface ReportContext {
  topRoles: string[];
  tensions: string[];
  rawSummary: string;
  hasRealityConditions: boolean;
  coreInsight: string;
  sectionContext: ReportSectionContext;
}

export function parseReportContext(
  reportSummary: string | Record<string, unknown> | null | undefined,
  profileData?: {
    archetype?: { label_en?: string; tagline_en?: string };
    cognitiveStyleCode?: string | null;
    narrativeSnapshots?: {
      archetypeNarrative?: string;
      identitySummary?: string;
    };
  } | null,
): ReportContext {
  if (!reportSummary) {
    return {
      topRoles: [],
      tensions: [],
      rawSummary: "",
      hasRealityConditions: false,
      coreInsight: "",
      sectionContext: {
        careerMatchSummary: "",
        profileSummary: "",
        pathwaySummary: "",
      },
    };
  }

  let reportData: ParsedReportData;
  try {
    reportData =
      typeof reportSummary === "string"
        ? JSON.parse(reportSummary)
        : reportSummary;
  } catch {
    reportData = { raw: reportSummary };
  }

  // Extract career directions from report (v5+ or legacy)
  let topRoles = (
    reportData?.ideal_fit_summary?.top_roles ||
    reportData?.ideal_fit_summary?.top_3_primary_roles ||
    []
  )
    .map((r: ReportRole) => r.role_title)
    .filter(Boolean) as string[];

  // v5+ fallback: extract from careerMatch.directions
  if (topRoles.length === 0 && reportData?.careerMatch?.directions) {
    topRoles = reportData.careerMatch.directions
      .map((d) => d.title_zh || d.title_en || d.title)
      .filter(Boolean)
      .slice(0, 3) as string[];
  }

  const tensions = (reportData?.career_tensions?.tensions || [])
    .map((t: ReportTension) => t.tension || t.description)
    .filter(Boolean) as string[];

  // v5+ archetype: read from header
  const archetype = reportData?.archetype_synthesis;
  const headerLabel =
    reportData?.header?.archetypeLabel || reportData?.header?.archetype_label;
  const archetypeDesc = archetype?.primary_archetype
    ? `${archetype.primary_archetype}: ${archetype.description || ""}`
    : headerLabel
      ? `${headerLabel}: ${reportData?.header?.tagline || ""}`
      : "";

  // Core insight
  const coreInsight =
    reportData?.integration?.coreInsight ||
    reportData?.integration?.core_insight ||
    "";

  // Reality conditions status
  const hasRealityConditions = !!(
    reportData?.careerPathway?.realConditionsProvided ||
    reportData?.meta?.realConditionsProvided
  );

  // Career match: Career directions summary
  const p1Directions = reportData?.careerMatch?.directions || [];
  const p1DirNames = p1Directions
    .map((d) => d.title_zh || d.title_en || d.title)
    .filter(Boolean)
    .slice(0, 3);
  const p1Reasons = p1Directions
    .map((d) => d.fit_reason || d.fitReason)
    .filter(Boolean)
    .slice(0, 2);
  const careerMatchSummary = [
    p1DirNames.length > 0 ? `Directions: ${p1DirNames.join(", ")}` : "",
    p1Reasons.length > 0 ? `Key reasons: ${p1Reasons.join("; ")}` : "",
    reportData?.careerMatch?.coreInsight || "",
  ]
    .filter(Boolean)
    .join("\n");

  // Profile: Personality profile summary
  // Personality context: read from PersonalProfile (v3.0+) or report header (legacy fallback).
  const p2Parts: string[] = [];
  if (profileData) {
    // v3.0: read personality context from PersonalProfile directly
    if (profileData.archetype?.label_en)
      p2Parts.push(`Archetype: ${profileData.archetype.label_en}`);
    if (profileData.archetype?.tagline_en)
      p2Parts.push(`Identity: ${profileData.archetype.tagline_en}`);
    if (profileData.cognitiveStyleCode)
      p2Parts.push(`Cognitive style: ${profileData.cognitiveStyleCode}`);
    if (profileData.narrativeSnapshots?.identitySummary)
      p2Parts.push(profileData.narrativeSnapshots.identitySummary);
    if (profileData.narrativeSnapshots?.archetypeNarrative) {
      const firstSentence =
        profileData.narrativeSnapshots.archetypeNarrative.split(/[.。!！]/)[0];
      if (firstSentence) p2Parts.push(firstSentence);
    }
  } else if (reportData?.header) {
    // Legacy fallback: extract identity info from report header
    const h = reportData.header as Record<string, unknown>;
    const archetype = h?.archetype as Record<string, string> | undefined;
    if (archetype?.label_en) p2Parts.push(`Archetype: ${archetype.label_en}`);
    if (archetype?.tagline_en)
      p2Parts.push(`Identity: ${archetype.tagline_en}`);
    if (h?.cognitiveStyleCode)
      p2Parts.push(`Cognitive style: ${h.cognitiveStyleCode}`);
  }
  const profileSummary = p2Parts.join("\n");

  // Pathway: Reality pathway summary
  const p3Parts: string[] = [];
  if (hasRealityConditions) {
    const p3Dirs = reportData?.careerPathway?.jobDirections || [];
    const p3DirNames = p3Dirs
      .map((d) => d.title_zh || d.title_en || d.title)
      .filter(Boolean)
      .slice(0, 3);
    if (p3DirNames.length > 0)
      p3Parts.push(`Actionable directions: ${p3DirNames.join(", ")}`);
    const positioning =
      reportData?.careerPathway?.jobSearchStrategy?.positioning;
    if (positioning) p3Parts.push(`Positioning: ${positioning}`);
  }
  const pathwaySummary = p3Parts.join("\n");

  const rawParts = [
    topRoles.length > 0 ? `Roles: ${topRoles.join(", ")}` : "",
    tensions.length > 0 ? `Tensions: ${tensions.join("; ")}` : "",
    archetypeDesc ? `Archetype: ${archetypeDesc}` : "",
  ].filter(Boolean);

  return {
    topRoles,
    tensions,
    rawSummary: rawParts.join("\n"),
    hasRealityConditions,
    coreInsight,
    sectionContext: { careerMatchSummary, profileSummary, pathwaySummary },
  };
}
