"use client";

import { useEffect, useRef } from "react";

import {
  useActiveSection,
  smoothScrollToId,
} from "@/lib/hooks/use-active-section";

import type { RailSection } from "./expedition-rail";

/**
 * MobileSectionNav — the in-page scrollspy for < lg, where the Expedition Rail
 * is hidden. A sticky hairline bar of section chips: the active chip lights up
 * as the user scrolls AND auto-scrolls itself into view, so the nav tracks the
 * content on long pages. Tapping a chip smooth-scrolls to that section.
 *
 * Pair it with <ExpeditionRail> using the same `sections` so desktop and mobile
 * stay in lockstep. Mirror behaviour of the rail's IntersectionObserver via the
 * shared useActiveSection hook.
 *
 * Spec: `.claude/skills/deepdive-design/references/layout-shell.md` §2.
 */
export interface MobileSectionNavProps {
  sections: RailSection[];
  /** Accessible label for the nav landmark (localized by caller). */
  label: string;
  className?: string;
}

export function MobileSectionNav({
  sections,
  label,
  className,
}: MobileSectionNavProps) {
  const ids = sections.map((s) => s.id);
  const activeId = useActiveSection(ids);
  const trackRef = useRef<HTMLDivElement>(null);

  // Keep the active chip in view as the user scrolls the page.
  useEffect(() => {
    if (!activeId) return;
    const chip = trackRef.current?.querySelector<HTMLElement>(
      `[data-section="${activeId}"]`,
    );
    if (!chip) return;
    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    chip.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeId]);

  if (sections.length === 0) return null;

  return (
    <nav
      className={["md-section-nav", className].filter(Boolean).join(" ")}
      aria-label={label}
    >
      <div className="md-section-nav__track" ref={trackRef}>
        {sections.map((section, i) => {
          const isActive = activeId === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              data-section={section.id}
              aria-current={isActive ? "true" : undefined}
              className={`md-section-nav__chip${isActive ? " is-active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                smoothScrollToId(section.id);
              }}
            >
              <b>{String(i + 1).padStart(2, "0")}</b>
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
