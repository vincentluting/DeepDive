"use client";

import { useMemo } from "react";
import { Compass } from "lucide-react";

import type { PreviewDictionary } from "../landing-dictionaries";
import { LandingSeal } from "../landing-shared";

export function ShowcaseFooter({ d }: { d: PreviewDictionary }) {
  // Two copies of the full archetype roll make a seamless -50% loop;
  // reduced-motion keeps the track parked (first copy fully readable).
  const track = useMemo(
    () => [...d.archetypes.marquee, ...d.archetypes.marquee],
    [d],
  );

  return (
    <footer
      className="dd-landing-footer dd-showcase-footer"
      data-depth-section="surfacing"
    >
      <div>
        <LandingSeal>
          <Compass />
        </LandingSeal>
        <p>
          <strong>{d.footer.tagline}</strong>
          <span>{d.privacy.note}</span>
        </p>
      </div>
      <div className="dd-showcase-footer-marquee" aria-hidden="true">
        <div className="dd-showcase-footer-marquee-track">
          {track.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>
      <p>{d.footer.motto}</p>
    </footer>
  );
}
