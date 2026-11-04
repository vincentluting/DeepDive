"use client";

import type { Surface } from "@/lib/design/surfaces";
import {
  useActiveSection,
  smoothScrollToId,
} from "@/lib/hooks/use-active-section";

import { DepthGauge, type DepthStation } from "./depth-gauge";

/**
 * ExpeditionRail — the Meridian left rail (desktop lg+ only).
 * Surface kicker → serif page title → intro → signature card → in-page
 * section anchors (IntersectionObserver highlight) → optional depth gauge.
 *
 * Anchors are IN-PAGE sections, never site navigation (that's AppHeader's job).
 * Spec: `.claude/skills/deepdive-design/references/layout-shell.md` §2.
 */

const SIGNATURE: Record<Surface, { mark: string; name: string }> = {
  dive: { mark: "D", name: "Descent atlas" },
  revelation: { mark: "R", name: "Monograph plate" },
  sanctuary: { mark: "S", name: "Reflection room" },
  utility: { mark: "U", name: "Surface instrument" },
};

export interface RailSection {
  /** DOM id of the target section (without #). */
  id: string;
  label: string;
}

export interface ExpeditionRailProps {
  surface: Surface;
  /** Small-caps kicker, e.g. "Utility surface" (localized by caller). */
  kicker: string;
  /** Serif page title. */
  title: string;
  /** One-line intro under the title. */
  intro?: string;
  /** Localized signature-card name (falls back to the English instrument name). */
  signatureName?: string;
  sections?: RailSection[];
  depthStations?: DepthStation[];
  depthActiveIndex?: number;
  className?: string;
}

export function ExpeditionRail({
  surface,
  kicker,
  title,
  intro,
  signatureName,
  sections = [],
  depthStations,
  depthActiveIndex = 0,
  className,
}: ExpeditionRailProps) {
  const activeId = useActiveSection(sections.map((s) => s.id));

  const sig = SIGNATURE[surface];

  return (
    <aside
      className={["md-rail", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <p className="md-eyebrow md-rail__kicker">{kicker}</p>
      <h1 className="md-rail__title">{title}</h1>
      {intro ? <p className="md-rail__intro">{intro}</p> : null}

      <div className="md-rail__signature">
        <span className="md-orb md-rail__mark" aria-hidden="true">
          {sig.mark}
        </span>
        <span className="md-rail__sig-text">
          <strong>{signatureName ?? sig.name}</strong>
          <span>{kicker}</span>
        </span>
      </div>

      {sections.length > 0 ? (
        <nav className="md-rail__nav" aria-label={title}>
          {sections.map((section, i) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={activeId === section.id ? "true" : undefined}
              className={`md-rail__link${activeId === section.id ? " is-active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                smoothScrollToId(section.id);
              }}
            >
              {section.label}
              <b>{String(i + 1).padStart(2, "0")}</b>
            </a>
          ))}
        </nav>
      ) : null}

      {depthStations && depthStations.length > 0 ? (
        <DepthGauge
          stations={depthStations}
          activeIndex={depthActiveIndex}
          className="md-rail__gauge"
        />
      ) : null}
    </aside>
  );
}
