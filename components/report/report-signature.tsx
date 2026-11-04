"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import type { ReportDict } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { pickLocaleText } from "@/lib/i18n/localize";
import { BIG_FIVE_LABELS } from "@/lib/scoring/constants";
import {
  buildFacetPairs,
  getFacetLabel,
} from "@/lib/profile-generation/facet-display";
import { detectIntraDomainTensions } from "@/lib/profile-generation/detect-facet-tensions";

interface ReportSignatureProps {
  /** Raw Big Five facet scores (30 keys, 1-5 scale). */
  facets?: Record<string, number> | null;
  locale: Locale;
  t: ReportDict;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * "Beneath the Surface" — surfaces facet-level nuance in the report that the
 * five domain scores hide: the strongest intra-domain tension (a contrast) plus
 * the most distinctive facets. Previously computed (profile) but never shown in
 * the report. Anti-Barnum: these contrasts are specific to the reader's pattern.
 */
export function ReportSignature({ facets, locale, t }: ReportSignatureProps) {
  if (!facets || Object.keys(facets).length < 5) return null;

  const pairs = buildFacetPairs(facets);
  if (pairs.length === 0) return null;

  const distinctive = [...pairs]
    .sort(
      (a, b) => Math.abs(b.deviationFromMean) - Math.abs(a.deviationFromMean),
    )
    .slice(0, 3);

  const tension = detectIntraDomainTensions(pairs, 1)[0] ?? null;

  let tensionLine: string | null = null;
  if (tension && t.signatureTensionFrame) {
    const domainEntry =
      BIG_FIVE_LABELS[tension.domain as keyof typeof BIG_FIVE_LABELS];
    const domainLabel = domainEntry
      ? pickLocaleText(domainEntry, locale)
      : tension.domain;
    tensionLine = t.signatureTensionFrame
      .replace("{{domain}}", domainLabel)
      .replace("{{high}}", getFacetLabel(tension.high.facet, locale))
      .replace("{{low}}", getFacetLabel(tension.low.facet, locale));
  }

  if (!tensionLine && distinctive.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 mt-4"
    >
      <div
        className="rounded-xl p-4 sm:p-5"
        style={{
          background: "var(--report-card-bg)",
          backdropFilter: "var(--report-card-backdrop)",
          border: "1px solid var(--report-card-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Layers
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "var(--report-tag-label)" }}
          />
          <span
            className="text-[10px] font-medium uppercase tracking-[0.15em]"
            style={{ color: "var(--report-tag-label)" }}
          >
            {t.signatureEyebrow}
          </span>
        </div>

        {tensionLine && (
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--report-text-secondary)" }}
          >
            {tensionLine}
          </p>
        )}

        {distinctive.length > 0 && (
          <div className="mt-3">
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "var(--report-tag-label)", opacity: 0.6 }}
            >
              {t.signatureDistinctiveLabel}
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {distinctive.map((f) => (
                <span
                  key={f.facet}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    background: "var(--report-card-bg)",
                    border: "1px solid var(--report-card-border)",
                    color: "var(--report-text-primary)",
                  }}
                >
                  {getFacetLabel(f.facet, locale)}{" "}
                  {f.deviationFromMean >= 0 ? "↑" : "↓"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
