"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { PageArtLayer } from "@/components/design/meridian/page-art-layer";
import { useHeaderUser } from "@/components/layout/_shared/use-header-user";
import { getClientId } from "@/lib/auth/client-id";

import {
  FALLBACK_PREVIEW_DICT,
  PREVIEW_DICTS,
  getLocaleFromParams,
} from "../landing-dictionaries";
import { readIsReturning, resolveCtaHref } from "../landing-cta";
import { useDiveScroll } from "../use-dive-scroll";
import { SoundingHero } from "./sounding-hero";
import {
  SoundingChapters,
  SoundingChoiceBand,
  SoundingFinalCta,
  SoundingFooter,
  SoundingTrust,
} from "./sounding-sections";
import styles from "./sounding.module.css";

/**
 * SoundingLanding — clean rebuild of the landing page in the Sounding design
 * language. Reuses the real i18n dictionary, auth/returning state, funnel
 * analytics, dive-scroll engine, and painted-ocean background; the layout and
 * styling are a fresh single-source CSS Module (no globals.css landing debt).
 *
 * Full page: hero, choice band, four numbered chapters, trust, final CTA,
 * footer, over the static painted-ocean background (PageArtLayer: per-mode
 * painting + wash + grain). The dive-scroll engine drives the sounding gauge.
 */
export function SoundingLanding() {
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

  // Funnel: landing viewed
  useEffect(() => {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "landing_viewed",
        clientId: getClientId(),
        metadata: {
          locale,
          surface: "sounding",
          referrer:
            typeof document !== "undefined"
              ? document.referrer || undefined
              : undefined,
        },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [locale]);

  const ctaHref = resolveCtaHref({ isReturning, isLoggedIn, locale });

  const trackCta = useCallback(
    (source: string, targetHref = ctaHref) => {
      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "intro_cta_clicked",
          clientId: getClientId(),
          metadata: {
            locale,
            source,
            targetHref,
            surface: "sounding",
            secondsOnPage: Math.round((Date.now() - mountTime.current) / 1000),
          },
        }),
        keepalive: true,
      }).catch(() => {});
    },
    [ctaHref, locale],
  );

  const { activeStation } = useDiveScroll(rootRef);

  const stations = (["0m", "200m", "400m", "600m"] as const).map(
    (depth, i) => ({
      depth,
      label: d.showcase.meter[i] ?? d.showcase.meter[0],
    }),
  );

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-surface="dive"
      data-depth-band="surface"
    >
      <PageArtLayer route="landing" priority />

      <div className={styles.gauge} aria-hidden="true">
        <span className={styles.gaugeSpine} />
        {stations.map((s, i) => (
          <div
            key={s.depth}
            className={
              i === activeStation
                ? `${styles.gaugeRow} ${styles.gaugeActive}`
                : styles.gaugeRow
            }
          >
            <span className={styles.gaugeDot} />
            <span className={styles.gaugeLabel}>
              <b>{s.depth}</b> {s.label}
            </span>
          </div>
        ))}
      </div>

      <main className={styles.main}>
        <SoundingHero
          d={d}
          locale={locale}
          ctaHref={ctaHref}
          isReturning={isReturning}
          isLoggedIn={isLoggedIn}
          onTrack={trackCta}
        />
        <SoundingChoiceBand d={d} locale={locale} onTrack={trackCta} />
        <SoundingChapters d={d} locale={locale} onTrack={trackCta} />
        <SoundingTrust d={d} />
        <SoundingFinalCta
          d={d}
          ctaHref={ctaHref}
          isReturning={isReturning}
          onTrack={trackCta}
        />
      </main>

      <SoundingFooter d={d} />
    </div>
  );
}
