"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, type LucideIcon } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { PreviewDictionary } from "../landing-dictionaries";
import { CoachBubbles } from "./landing-viz-mini";

// ============================================================
// Dive Compartments — minimal healing-ocean product chapters
//
// The first two chapters use generated webp artwork so the page reads as a
// premium ocean-healing experience instead of a dense instrument dashboard.
// Later chapters keep only essential product hints: a milestone line and a
// quiet coach conversation preview.
// ============================================================

const PORTRAIT_ART = "/brand/landing-portrait-field-v3.webp";
const REPORT_ART = "/brand/landing-career-sea-chart-v3.webp";

function CompartmentShell({
  index,
  depthTag,
  title,
  lead,
  linkHref,
  linkLabel,
  LinkIcon = ArrowRight,
  anchorId,
  depthSection,
  source,
  onTrack,
  children,
}: {
  index: string;
  depthTag: string;
  title: string;
  lead: string;
  linkHref: string;
  linkLabel: string;
  LinkIcon?: LucideIcon;
  anchorId?: string;
  depthSection?: string;
  source?: string;
  onTrack?: (source: string, targetHref: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className="dd-dive-compartment dd-landing-reveal"
      id={anchorId}
      data-depth-section={depthSection}
      aria-labelledby={`compartment-${index}`}
    >
      <p className="dd-compartment-depth">
        <span>{depthTag}</span>
      </p>
      <div className="dd-compartment-grid">
        <header className="dd-compartment-head dd-landing-shelf">
          <p className="dd-compartment-no">
            <i>{index}</i>
            <b aria-hidden="true" />
          </p>
          <h2 id={`compartment-${index}`}>{title}</h2>
          <p className="dd-compartment-lead">{lead}</p>
          <Link
            href={linkHref}
            className="dd-compartment-link"
            onClick={
              source && onTrack ? () => onTrack(source, linkHref) : undefined
            }
          >
            {linkLabel}
            <LinkIcon aria-hidden="true" />
          </Link>
        </header>
        <div className="dd-compartment-viz">{children}</div>
      </div>
    </section>
  );
}

function ArtworkPanel({
  src,
  kind,
}: {
  src: typeof PORTRAIT_ART | typeof REPORT_ART;
  kind: "portrait" | "report";
}) {
  return (
    <div
      className={`dd-compartment-instrument dd-compartment-instrument--art dd-compartment-instrument--${kind}`}
    >
      <div className={`dd-compartment-art dd-compartment-art--${kind}`}>
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 760px) 100vw, 58vw"
          className="dd-compartment-art__img"
        />
      </div>
    </div>
  );
}

function ActionViz({ d }: { d: PreviewDictionary }) {
  const steps = d.journey.items.slice(0, 4);

  return (
    <div
      className="dd-compartment-instrument dd-action-instrument"
      aria-hidden="true"
    >
      <div className="dd-action-instrument__focus">
        <span>{d.panels.caps.nextStep}</span>
        <strong>{steps[0]?.t}</strong>
        <ArrowRight aria-hidden="true" />
      </div>
      <div className="dd-minimal-progress">
        <div className="dd-minimal-progress__line" />
        <ol>
          {steps.map((step, index) => (
            <li key={step.t} data-active={index === 0 || index === 3}>
              <span />
              <p>{step.t}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="dd-action-instrument__metric">
        <span>{d.panels.caps.decisionClarity}</span>
        <strong>72%</strong>
        <i />
      </div>
    </div>
  );
}

function CoachViz({ d }: { d: PreviewDictionary }) {
  const coach = d.showcase.instruments.coach;
  const turns = [
    { role: "assistant" as const, text: coach.user },
    { role: "user" as const, text: coach.reply },
  ];

  return (
    <div className="dd-compartment-instrument dd-coach-instrument">
      <div className="dd-coach-minimal">
        <CoachBubbles turns={turns} />
        <div className="dd-coach-typing" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="dd-coach-instrument__aside" aria-hidden="true">
        {d.panels.trio.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export function DiveCompartments({
  d,
  locale,
  onTrack,
}: {
  d: PreviewDictionary;
  locale: Locale;
  onTrack?: (source: string, targetHref: string) => void;
}) {
  const clarityTag = `— 200m · ${d.showcase.meter[1] ?? ""}`;
  const directionTag = `— 400m · ${d.showcase.meter[2] ?? ""}`;
  const discoverTag = `— 600m · ${d.showcase.meter[3] ?? ""}`;

  return (
    <div className="dd-dive-compartments" aria-label={d.features.label}>
      <CompartmentShell
        index="01"
        depthTag={clarityTag}
        title={d.journey.items[2]?.t ?? d.features.items[3].t}
        lead={d.features.items[3].d}
        linkHref={`/${locale}/profile`}
        linkLabel={d.footer.nav[1] ?? d.features.items[3].t}
        anchorId="depth-200"
        depthSection="photic"
        source="compartment_01_profile"
        onTrack={onTrack}
      >
        <ArtworkPanel src={PORTRAIT_ART} kind="portrait" />
      </CompartmentShell>

      <CompartmentShell
        index="02"
        depthTag={directionTag}
        title={d.features.items[0].t}
        lead={d.features.items[0].d}
        linkHref={`/${locale}/reports`}
        linkLabel={d.footer.nav[0] ?? d.features.items[0].t}
        depthSection="photic"
        source="compartment_02_report"
        onTrack={onTrack}
      >
        <ArtworkPanel src={REPORT_ART} kind="report" />
      </CompartmentShell>

      <CompartmentShell
        index="03"
        depthTag={discoverTag}
        title={d.features.items[1].t}
        lead={d.features.items[1].d}
        linkHref={`/${locale}/action-hub`}
        linkLabel={d.features.items[1].t}
        anchorId="depth-400"
        depthSection="photic"
        source="compartment_03_action"
        onTrack={onTrack}
      >
        <ActionViz d={d} />
      </CompartmentShell>

      <CompartmentShell
        index="04"
        depthTag={discoverTag}
        title={d.features.items[2].t}
        lead={d.features.items[2].d}
        linkHref={`/${locale}/coaching`}
        linkLabel={d.features.items[2].t}
        LinkIcon={MessageCircle}
        depthSection="photic"
        source="compartment_04_coach"
        onTrack={onTrack}
      >
        <CoachViz d={d} />
      </CompartmentShell>
    </div>
  );
}
