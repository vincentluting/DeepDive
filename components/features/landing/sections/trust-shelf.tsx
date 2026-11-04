"use client";

import { BadgeCheck, Feather, Shield, type LucideIcon } from "lucide-react";

import type { PreviewDictionary } from "../landing-dictionaries";
import { LandingSeal } from "../landing-shared";

const TRIO_ICONS: LucideIcon[] = [Shield, BadgeCheck, Feather];

/**
 * TrustShelf — "Private by design" reassurance at ~550m.
 *
 * Three columns (journey is yours / evidence-based / built for reflection)
 * ride a clearer reading shelf under the twilight veil. Titles come from the
 * `panels.trio` namespace; the supporting lines + the University of Amsterdam
 * affiliation reuse existing localized privacy/science copy.
 */
export function TrustShelf({ d }: { d: PreviewDictionary }) {
  const descs = [d.privacy.note, d.science.foundations, d.glassCard.subtitle];

  return (
    <section
      className="dd-trust-shelf dd-landing-reveal"
      data-depth-section="twilight"
      aria-labelledby="landing-privacy"
    >
      <h2 id="landing-privacy" className="dd-privacy-heading">
        {d.panels.privacyHeading}
      </h2>
      <div className="dd-privacy-trio dd-landing-shelf">
        {d.panels.trio.map((title, i) => {
          const Icon = TRIO_ICONS[i] ?? Shield;
          return (
            <div key={title} className="dd-privacy-col">
              <LandingSeal>
                <Icon aria-hidden="true" />
              </LandingSeal>
              <h3>{title}</h3>
              <p>{descs[i]}</p>
            </div>
          );
        })}
      </div>
      <p className="dd-privacy-foot">{d.science.affiliation}</p>
    </section>
  );
}
