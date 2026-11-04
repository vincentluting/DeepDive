"use client";

import { Compass } from "lucide-react";

import type { PreviewDictionary } from "../landing-dictionaries";
import { CtaLink } from "../landing-shared";

/**
 * FinalCta — the 4000m revelation.
 *
 * In light mode the panel carries the `dark` class: a framed window of
 * midnight inside the Monet noon ("looking into the trench from the boat"),
 * inheriting the already-verified dark token contrast. In page-level dark
 * mode the frame dissolves and the CTA floats on the open abyss.
 */
export function FinalCta({
  d,
  ctaHref,
  isReturning,
  onTrack,
}: {
  d: PreviewDictionary;
  ctaHref: string;
  isReturning: boolean;
  onTrack: (source: string, targetHref?: string) => void;
}) {
  return (
    <section
      className="dd-final-cta dd-landing-reveal"
      id="depth-600"
      data-depth-section="abyss"
      aria-labelledby="landing-final-cta"
    >
      <div className="dd-final-window dark">
        <p className="dd-final-quote">{d.breathQuote}</p>
        <i className="dd-final-rule" aria-hidden="true" />
        <h2 id="landing-final-cta">
          {d.cta.heading}
          {d.cta.headingAccent && (
            <span className="dd-final-accent">{d.cta.headingAccent}</span>
          )}
        </h2>
        <p className="dd-final-desc">{d.cta.description}</p>
        <div className="dd-final-actions">
          <CtaLink
            href={ctaHref}
            leadingIcon={Compass}
            onClick={() => onTrack("final_cta")}
          >
            {isReturning ? d.cta.buttonReturning : d.cta.button}
          </CtaLink>
        </div>
        <p className="dd-final-note">
          {isReturning ? d.cta.noteReturning : d.cta.note}
        </p>
      </div>
      <div className="dd-final-coda">
        <p className="dd-final-coda-line">{d.panels.coda.line}</p>
        <p className="dd-final-coda-sub">{d.panels.coda.sub}</p>
      </div>
    </section>
  );
}
