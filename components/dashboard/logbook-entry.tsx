// ============================================================
// LogbookEntry — Editorial dashboard hero block.
//
// Replaces the gradient/blur SaaS banners that opened each user-level
// section in the dashboard. The Dashboard sits in the Utility surface, but
// the Logbook injects an editorial moment — like opening today's page in a
// captain's private journal — to extend the Revelation language family
// across the whole product.
//
// Stays light-mode + dark-mode safe by relying on `text-foreground` /
// `text-muted-foreground`; no paper background, no rounded card chrome.
// The hairline divider uses `border-border` so it adapts automatically.
// ============================================================

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { toDateLocaleOrDefault } from "@/lib/i18n/config";

interface CtaSpec {
  label: string;
  href: string;
  variant?: "primary" | "ghost";
}

interface LogbookEntryProps {
  /** ISO date or Date — formatted to "APRIL 23, 2026" style. */
  date: Date | string;
  /** "Day 17 of descent" — pre-localised by the caller. */
  dayLabel: string;
  /** Editorial eyebrow noun, e.g. "TODAY'S ENTRY". */
  eyebrowLabel: string;
  /** Fraunces italic narrator line — the voice in the captain's head. */
  narratorLine: string;
  /** Big editorial title, may include archetype name etc. */
  title: ReactNode;
  /** Optional Source Serif italic tagline under the title. */
  tagline?: string;
  /** Plain-prose body explaining the next step. */
  body?: string;
  /** Primary CTA — link button. */
  primaryCta: CtaSpec;
  /** Optional secondary CTA — ghost link. */
  secondaryCta?: CtaSpec;
  /** "en" | "zh" — controls date formatting. */
  locale: string;
}

function formatDate(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const lang = toDateLocaleOrDefault(locale);
  return d
    .toLocaleDateString(lang, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();
}

export function LogbookEntry({
  date,
  dayLabel,
  eyebrowLabel,
  narratorLine,
  title,
  tagline,
  body,
  primaryCta,
  secondaryCta,
  locale,
}: LogbookEntryProps) {
  const dateText = formatDate(date, locale);

  return (
    <section
      data-slot="logbook-entry"
      className="relative mb-10 sm:mb-12 animate-fade-in-up"
    >
      {/* Editorial eyebrow — date + day count */}
      <p className="font-sans uppercase font-medium tracking-[0.22em] text-[10px] sm:text-[11px] text-muted-foreground/85 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>{eyebrowLabel}</span>
        <span aria-hidden="true" className="text-primary/60 text-[8px]">
          ✦
        </span>
        <span className="text-foreground">{dateText}</span>
        <span aria-hidden="true" className="text-primary/60 text-[8px]">
          ✦
        </span>
        <span className="font-serif italic normal-case tracking-normal text-muted-foreground">
          {dayLabel}
        </span>
      </p>

      {/* Hairline divider — adapts dark/light via border-border */}
      <div className="mt-4 h-px w-16 bg-border" />

      {/* Narrator line — Fraunces italic, the captain's voice */}
      <p
        className="mt-7 font-display italic text-foreground/80 leading-[1.5] max-w-[42ch]"
        style={{ fontSize: "clamp(15px, 1.4vw, 18px)" }}
      >
        {narratorLine}
      </p>

      {/* Big title — Fraunces normal weight */}
      <h2
        className="mt-7 font-display font-normal text-foreground leading-[1.1] tracking-[-0.015em]"
        style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
      >
        {title}
      </h2>

      {tagline && (
        <p className="mt-3 font-serif italic text-muted-foreground text-[14px] sm:text-[15px] leading-[1.55]">
          {tagline}
        </p>
      )}

      {body && (
        <p className="mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[58ch]">
          {body}
        </p>
      )}

      {/* CTA row */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {primaryCta.variant === "ghost" ? (
          <GhostLink {...primaryCta} />
        ) : (
          <PrimaryLink {...primaryCta} />
        )}
        {secondaryCta &&
          (secondaryCta.variant === "primary" ? (
            <PrimaryLink {...secondaryCta} />
          ) : (
            <GhostLink {...secondaryCta} />
          ))}
      </div>
    </section>
  );
}

function PrimaryLink({ label, href }: CtaSpec) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function GhostLink({ label, href }: CtaSpec) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-serif italic text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <span
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}
