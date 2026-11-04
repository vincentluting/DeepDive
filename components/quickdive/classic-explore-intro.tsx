"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hapticMedium } from "@/lib/haptic";
import { getClientId } from "@/lib/auth/client-id";
import type { FunnelEvent } from "@/lib/analytics/funnel";
import { QuickDiveMonographShell } from "./quickdive-monograph-shell";

interface ClassicExploreIntroProps {
  onStart: () => void;
  t: Record<string, string>;
  locale: string;
}

export function ClassicExploreIntro({
  onStart,
  t,
  locale,
}: ClassicExploreIntroProps) {
  const mountTime = useRef(Date.now());
  // Track client-side hydration: under React 19 streaming SSR the button
  // is visible before its event handler is attached. Test runners (and
  // very fast users) can fire a click in that gap and have it dropped.
  // We expose `data-hydrated` on the CTA so E2E can wait for it; the
  // initial false also matches what SSR renders, avoiding a hydration
  // mismatch warning. UX is unchanged — useEffect runs synchronously
  // after first paint (typically < 50ms).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleStart = useCallback(() => {
    // Guard: ignore clicks before client hydration completes. Test
    // runners may click while the button is rendered but its handler
    // hasn't been attached yet — silently dropping that click rather
    // than acting on a partially-mounted state avoids analytics
    // double-counts and lets the user (or test) retry naturally.
    if (!hydrated) return;
    hapticMedium();

    const secondsOnPage = Math.round((Date.now() - mountTime.current) / 1000);
    try {
      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "intro_cta_clicked" satisfies FunnelEvent,
          clientId: getClientId(),
          metadata: { locale, secondsOnPage, exploreMode: "classic" },
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* non-critical */
    }

    onStart();
  }, [onStart, locale, hydrated]);

  return (
    <QuickDiveMonographShell
      phase="intro"
      t={t}
      eyebrow={t.introPublishingMeta}
      title={t.introHeroTagline}
      description={t.introHeroSubtext}
      side={
        <div className="dd-quickdive-monograph__intro-side">
          <p className="dd-quickdive-monograph__side-kicker">
            {t.monographChapterOverture}
          </p>
          <div className="dd-quickdive-monograph__lighthouse" aria-hidden />
          <p>{t.introArchetypeTeaseTitle}</p>
          <ul className="dd-quickdive-monograph__fact-list">
            <li>{t.trustTime}</li>
            <li>{t.itemCount}</li>
            <li>{t.trustPrivate}</li>
          </ul>
        </div>
      }
      action={
        <motion.button
          onClick={handleStart}
          data-testid="quickdive-intro-start"
          data-hydrated={hydrated ? "true" : "false"}
          className="dd-quickdive-monograph__primary-action"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
        >
          <span>{t.introCtaPrimary}</span>
          <small>{t.introCtaSub}</small>
        </motion.button>
      }
    >
      <motion.div
        className="dd-quickdive-monograph__intro-list"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {[t.introPreview1, t.introPreview2, t.introPreview3].map((item, i) => (
          <div key={item} className="dd-quickdive-monograph__intro-row">
            <span>{String(i + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </div>
        ))}
      </motion.div>
      <p className="dd-quickdive-monograph__source-note">{t.basedOnOnet}</p>
    </QuickDiveMonographShell>
  );
}
