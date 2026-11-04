// ============================================================
// Profile Cinematic Hero — Bathymetric monograph shell
//
// Renders the restrained cinematic profile opener and scroll-linked depth
// navigation used by both the QA route and the production profile page.
// ============================================================
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type {
  CinematicProfileModel,
  ProfileDepthStation,
} from "./cinematic-profile-model";

interface ProfileCinematicCopy {
  surfaceKicker: string;
  title: string;
  subtitle: string;
  routeLabel: string;
  anchorsLabel: string;
  evidenceLabel: string;
  currentDepthLabel: string;
  depthAriaLabel: string;
}

interface ProfileCinematicHeroProps {
  model: CinematicProfileModel;
  copy: ProfileCinematicCopy;
  reportHref: string;
  reportLabel: string;
}

interface ProfileCinematicDepthNavProps {
  stations: ProfileDepthStation[];
  activeAnchorId: string;
  ariaLabel: string;
  currentDepthLabel: string;
}

export function ProfileCinematicHero({
  model,
  copy,
  reportHref,
  reportLabel,
}: ProfileCinematicHeroProps) {
  return (
    <section
      id="profile-cinematic-hero"
      data-slot="profile-cinematic-hero"
      className="dd-profile-cinematic-hero"
      aria-labelledby="profile-cinematic-title"
    >
      <div className="dd-profile-cinematic-hero__intro">
        <p className="dd-profile-cinematic-kicker">{copy.surfaceKicker}</p>
        <p className="dd-profile-cinematic-route">{copy.routeLabel}</p>
      </div>

      <div className="dd-profile-cinematic-hero__grid">
        <header className="dd-profile-cinematic-hero__headline">
          <p className="dd-profile-cinematic-kicker">{model.meta.minted}</p>
          <h1 id="profile-cinematic-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </header>

        <article className="dd-profile-cinematic-plate">
          <div className="dd-profile-cinematic-plate__rule" aria-hidden />
          <p className="dd-profile-cinematic-kicker">{model.archetypeCode}</p>
          <blockquote>{model.heroQuote}</blockquote>
          <div className="dd-profile-cinematic-plate__meta">
            <div>
              <span>{copy.anchorsLabel}</span>
              <strong>{model.anchors.join(" · ")}</strong>
            </div>
            <div>
              <span>{copy.currentDepthLabel}</span>
              <strong>{model.depthStations[0]?.depth ?? "0m"}</strong>
            </div>
          </div>
        </article>

        <aside className="dd-profile-cinematic-artifact">
          <div className="dd-profile-cinematic-seal" aria-hidden="true">
            {model.archetypeInitial}
          </div>
          <div>
            <p className="dd-profile-cinematic-kicker">{copy.evidenceLabel}</p>
            <h2>{model.archetypeName}</h2>
            {model.tagline && <p>{model.tagline}</p>}
          </div>
          <div className="dd-profile-cinematic-evidence">
            {model.evidenceBands.map((band) => (
              <div key={band.id} className="dd-profile-cinematic-band">
                <div>
                  <span>{band.label}</span>
                  <b>{band.value}</b>
                </div>
                <i aria-hidden="true">
                  <em style={{ width: `${band.value}%` } as CSSProperties} />
                </i>
              </div>
            ))}
          </div>
          <Link className="dd-profile-cinematic-cta" href={reportHref}>
            <span>{reportLabel}</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </section>
  );
}

export function ProfileCinematicDepthNav({
  stations,
  activeAnchorId,
  ariaLabel,
  currentDepthLabel,
}: ProfileCinematicDepthNavProps) {
  const activeIndex = Math.max(
    0,
    stations.findIndex((station) => station.anchorId === activeAnchorId),
  );
  const activeStation = stations[activeIndex] ?? stations[0];
  const progress =
    stations.length <= 1 ? 0 : activeIndex / Math.max(1, stations.length - 1);

  return (
    <>
      <nav
        className="dd-profile-cinematic-depth"
        aria-label={ariaLabel}
        style={{ "--profile-depth-progress": progress } as CSSProperties}
      >
        <p>{currentDepthLabel}</p>
        <ol>
          {stations.map((station) => {
            const active = station.anchorId === activeAnchorId;
            return (
              <li key={station.id}>
                <a
                  href={`#${station.anchorId}`}
                  aria-current={active ? "location" : undefined}
                  className={active ? "is-active" : undefined}
                >
                  <span className="dd-profile-cinematic-depth__dot" />
                  <span>
                    <b>{station.depth}</b>
                    <small>{station.label}</small>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      {activeStation && (
        <div
          className="dd-profile-cinematic-depth-mobile"
          aria-label={`${currentDepthLabel}: ${activeStation.depth} ${activeStation.label}`}
        >
          <div>
            <span>{activeStation.depth}</span>
            <b>{activeStation.label}</b>
          </div>
          <i aria-hidden="true">
            <em style={{ width: `${progress * 100}%` }} />
          </i>
        </div>
      )}
    </>
  );
}
