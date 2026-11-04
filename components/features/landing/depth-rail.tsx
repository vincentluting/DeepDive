"use client";

import { useCallback } from "react";

export interface DepthRailStation {
  /** Depth reading, e.g. "0m". */
  depth: string;
  /** Localized stage label (from showcase.meter). */
  label: string;
  /** DOM id of the anchor target (without #). */
  targetId: string;
}

/**
 * DepthRail — fixed right-edge dive gauge that doubles as page navigation.
 * Desktop (lg+) only; the mobile hero keeps its horizontal stage meter.
 * Visual grammar mirrors `md-depth-gauge` (hairline, hollow dots, gold
 * active point) with a slow signature pulse on the current station.
 */
export function DepthRail({
  stations,
  activeIndex,
  ariaLabel,
}: {
  stations: DepthRailStation[];
  activeIndex: number;
  ariaLabel: string;
}) {
  const jumpTo = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      const target = document.getElementById(targetId);
      if (!target) return; // fall through to default hash navigation
      event.preventDefault();
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [],
  );

  return (
    <nav className="dd-landing-rail" aria-label={ariaLabel}>
      <ol>
        {stations.map((station, index) => (
          <li
            key={station.depth}
            className={index === activeIndex ? "is-active" : undefined}
          >
            <a
              href={`#${station.targetId}`}
              onClick={(event) => jumpTo(event, station.targetId)}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <span className="dd-landing-rail-dot" aria-hidden="true" />
              <span className="dd-landing-rail-label">
                <b>{station.depth}</b>
                <small>{station.label}</small>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
