"use client";

import { useEffect, useState } from "react";

/**
 * useActiveSection — shared in-page scrollspy.
 *
 * Observes the given section ids with one IntersectionObserver and returns the
 * id of the topmost intersecting section. Powers both the desktop Expedition
 * Rail and the mobile section nav so the two never drift apart.
 *
 * The default rootMargin biases toward the section currently under the upper
 * third of the viewport — matches the Meridian rail behaviour.
 *
 * Spec: `.claude/skills/deepdive-design/references/layout-shell.md` §2.
 */
export function useActiveSection(
  ids: string[],
  rootMargin = "-20% 0px -65% 0px",
): string | null {
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);
  // Stable dependency key so the effect re-runs only when the id set changes,
  // not on every render that passes a fresh array literal.
  const key = ids.join("|");

  useEffect(() => {
    if (ids.length === 0) return;
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // Persist every section's intersection state across callbacks — an
    // IntersectionObserver callback only reports the entries that *changed*,
    // so deciding the active section from `entries` alone can stick to a stale
    // section (e.g. a tick that only reports sections leaving the viewport).
    // We keep a full map and pick the topmost section still intersecting, in
    // document (id) order.
    const intersecting = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          intersecting.set(e.target.id, e.isIntersecting);
        }
        const topmost = ids.find((id) => intersecting.get(id));
        if (topmost) setActiveId(topmost);
      },
      { rootMargin },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // Re-run only when the id set (via `key`) or rootMargin changes — not on
    // every render that passes a fresh `ids` array literal.
  }, [key, rootMargin]);

  return activeId;
}

/**
 * smoothScrollToId — scroll a section to just below the fixed header (and the
 * sticky mobile section nav, if present), honouring reduced-motion. Computing
 * the offset manually is more reliable than per-section scroll-margin because
 * the overlay height differs between desktop (header only) and mobile
 * (header + sticky section bar). Updates the hash so deep links / back work.
 */
export function smoothScrollToId(id: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;

  const headerH =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--header-height",
      ),
    ) || 64;
  const stickyNav = document.querySelector<HTMLElement>(".md-section-nav");
  const navH = stickyNav ? stickyNav.getBoundingClientRect().height : 0;
  const top =
    el.getBoundingClientRect().top + window.scrollY - headerH - navH - 12;

  const prefersReduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReduced ? "auto" : "smooth",
  });
  if (history.replaceState) {
    history.replaceState(null, "", `#${id}`);
  }
}
