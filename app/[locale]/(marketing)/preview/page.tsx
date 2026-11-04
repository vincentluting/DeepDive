"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { useHeaderUser } from "@/components/layout/_shared/use-header-user";
import { PageArtLayer } from "@/components/design/meridian/page-art-layer";
import { getClientId } from "@/lib/auth/client-id";
import type { FunnelEvent } from "@/lib/analytics/funnel";

import {
  FALLBACK_PREVIEW_DICT,
  PREVIEW_DICTS,
  getLocaleFromParams,
} from "@/components/features/landing/landing-dictionaries";
import {
  readIsReturning,
  resolveCtaHref,
} from "@/components/features/landing/landing-cta";
import {
  useDiveScroll,
  useLandingReveal,
} from "@/components/features/landing/use-dive-scroll";
import { DepthRail } from "@/components/features/landing/depth-rail";
import { DiveParticles } from "@/components/features/landing/dive-particles";
import { WebGLOcean } from "@/components/features/landing/webgl-ocean";
import { LandingHero } from "@/components/features/landing/sections/landing-hero";
import { DiveChoiceBand } from "@/components/features/landing/sections/dive-choice-band";
import { DiveCompartments } from "@/components/features/landing/sections/dive-compartments";
import { TrustShelf } from "@/components/features/landing/sections/trust-shelf";
import { FinalCta } from "@/components/features/landing/sections/final-cta";
import { ShowcaseFooter } from "@/components/features/landing/sections/landing-footer";

// ============================================================
// Landing v8 — The Descent
//
// Scrolling IS diving: the painted noon recedes, a water veil deepens by
// narrative band (surface → photic → twilight → abyss), the depth rail
// tracks the descent, and the final CTA opens a midnight window. Copy
// stays in preview dictionaries; visual tokens live in globals.css.
// Sections live in components/features/landing/sections/.
// ============================================================

export default function LandingV8() {
  const params = useParams();
  const locale = getLocaleFromParams(params?.locale);
  const d = PREVIEW_DICTS[locale] ?? FALLBACK_PREVIEW_DICT;
  const rootRef = useRef<HTMLDivElement>(null);
  const mountTime = useRef(Date.now());
  const { user } = useHeaderUser();
  const isLoggedIn = !!user;

  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    try {
      setIsReturning(readIsReturning(localStorage));
    } catch {
      setIsReturning(false);
    }
  }, []);

  useEffect(() => {
    try {
      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "landing_viewed" satisfies FunnelEvent,
          clientId: getClientId(),
          metadata: {
            locale,
            referrer: document.referrer || undefined,
          },
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* non-critical */
    }
  }, [locale]);

  const ctaHref = resolveCtaHref({ isReturning, isLoggedIn, locale });

  const trackCta = useCallback(
    (source: string, targetHref = ctaHref) => {
      try {
        fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "intro_cta_clicked" satisfies FunnelEvent,
            clientId: getClientId(),
            metadata: {
              locale,
              source,
              targetHref,
              surface: "landing_v8",
              secondsOnPage: Math.round(
                (Date.now() - mountTime.current) / 1000,
              ),
            },
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* non-critical */
      }
    },
    [ctaHref, locale],
  );

  const { activeStation, depthRef } = useDiveScroll(rootRef);
  useLandingReveal(rootRef);

  const railStations = (["0m", "200m", "1000m", "4000m"] as const).map(
    (depth, index) => ({
      depth,
      label: d.showcase.meter[index] ?? d.showcase.meter[0],
      targetId: `depth-${index === 0 ? 0 : index * 200}`,
    }),
  );

  return (
    <div
      ref={rootRef}
      className="dd-landing dd-landing-showcase"
      data-surface="dive"
      data-depth-band="surface"
    >
      {/* Meridian painted ocean — Monet noon / midnight (LCP priority) */}
      <PageArtLayer route="landing" priority />
      <div className="dd-landing-depth" aria-hidden="true" />
      {/* Living-water shader — Tier-3 desktops only; composites over the
          static Tyndall shafts and under the veil. Tier 0–2 → renders null. */}
      <WebGLOcean depthRef={depthRef} />
      {/* Water veil — deepens by narrative band as the visitor descends */}
      <div className="dd-landing-water" aria-hidden="true" />
      {/* Living depth gauge — sunlit dust by noon, plankton by midnight */}
      <DiveParticles depthRef={depthRef} />

      <DepthRail
        stations={railStations}
        activeIndex={activeStation}
        ariaLabel={d.showcase.railLabel}
      />

      <div className="dd-landing-main">
        <LandingHero
          d={d}
          locale={locale}
          ctaHref={ctaHref}
          isReturning={isReturning}
          isLoggedIn={isLoggedIn}
          onTrack={trackCta}
        />

        <DiveChoiceBand
          d={d}
          locale={locale}
          isReturning={isReturning}
          isLoggedIn={isLoggedIn}
          onTrack={trackCta}
        />
        <DiveCompartments d={d} locale={locale} onTrack={trackCta} />
        <TrustShelf d={d} />
        <FinalCta
          d={d}
          ctaHref={ctaHref}
          isReturning={isReturning}
          onTrack={trackCta}
        />
      </div>

      <ShowcaseFooter d={d} />
    </div>
  );
}
