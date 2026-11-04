"use client";

import type { PreviewDictionary } from "../landing-dictionaries";
import { SixLights, SixLightsStatic } from "../six-lights";

/**
 * SixLightsInterlude — a stretch of open water at ~500m.
 *
 * No cards, no CTAs, no grid: six archetype glyphs breathing around a
 * single serif line. The glyphs ARE the content here — bright enough to
 * register, named on approach. Mobile gets a static trio instead of the
 * pointer reactor.
 */
export function SixLightsInterlude({ d }: { d: PreviewDictionary }) {
  const captions = d.archetypes.items.map((item) => item.name);

  return (
    <section
      className="dd-six-interlude dd-landing-reveal"
      data-depth-section="twilight"
      aria-labelledby="landing-archetypes"
    >
      <SixLights captions={captions} hoverCaption={d.archetypes.hoverCaption} />
      <div className="dd-six-interlude-copy">
        <p className="dd-landing-eyebrow">{d.archetypes.label}</p>
        <h2 id="landing-archetypes">
          {d.archetypes.heading}
          {d.archetypes.headingAccent && (
            <span>{d.archetypes.headingAccent}</span>
          )}
        </h2>
        <p className="dd-six-interlude-lead">{d.archetypes.description}</p>
        <p className="dd-six-interlude-note">{d.archetypes.moreNote}</p>
      </div>
      <SixLightsStatic captions={captions} />
    </section>
  );
}
