"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock, Clock, Mail } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { csrfFetch } from "@/lib/auth/csrf-client";

type Copy = Dictionary["researchLanding"];

interface Props {
  readonly locale: Locale;
  readonly invite: string | null;
  readonly source: string | null;
  readonly dict: Copy;
}

export function ResearchLandingClient({ locale, invite, source, dict }: Props) {
  // Fire recruitment-funnel event once on mount. Source segments channels
  // (UvA / linkedin / xiaohongshu / referral) so we can compare conversion.
  useEffect(() => {
    csrfFetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "recruitment_landing_viewed",
        metadata: {
          source: source ?? "direct",
          hasInvite: !!invite,
          locale,
        },
      }),
    }).catch(() => {
      // Analytics must never break the page.
    });
  }, [invite, source, locale]);

  const registerHref = invite
    ? `/${locale}/register?invite=${encodeURIComponent(invite)}&from=research`
    : `/${locale}/register?from=research`;

  const primaryLabel = invite ? dict.cta.primary : dict.cta.primaryNoInvite;
  const primaryHint = invite ? dict.cta.inviteHint : dict.cta.noInviteHint;

  return (
    <article className="mx-auto max-w-2xl px-6 sm:px-8 py-16 sm:py-24 space-y-12">
      {/* Hero */}
      <header className="space-y-5">
        <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
          {dict.eyebrow}
        </p>
        <h1 className="text-[clamp(2rem,5vw,3rem)] leading-[1.1] tracking-tight text-foreground">
          {dict.headline}
        </h1>
        <p className="text-[16px] leading-[1.6] text-muted-foreground">
          {dict.subhead}
        </p>
        <p className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {dict.estimatedTime}
        </p>
      </header>

      {/* Primary CTA — visible before the long copy too */}
      <section
        aria-label="Primary action"
        className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-3 card-inset-highlight"
      >
        <Link
          href={registerHref}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 h-11 text-[14.5px] font-medium w-full sm:w-auto"
        >
          {primaryLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <p className="text-[13px] text-muted-foreground">{primaryHint}</p>
      </section>

      {/* What the study tests */}
      <Section title={dict.study.title}>
        <p className="text-[15px] leading-[1.65] text-muted-foreground">
          {dict.study.body}
        </p>
      </Section>

      {/* What you get */}
      <Section title={dict.whatYouGet.title}>
        <ul className="space-y-3">
          {dict.whatYouGet.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 items-start text-[15px] leading-[1.6] text-foreground"
            >
              <Check
                className="size-4 mt-1 shrink-0 text-emerald-500"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Eligibility */}
      <Section title={dict.eligibility.title}>
        <ul className="space-y-2 text-[15px] leading-[1.6] text-muted-foreground list-disc list-inside marker:text-muted-foreground/60">
          {dict.eligibility.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      {/* Privacy & ethics — highlight visually for trust */}
      <section
        aria-labelledby="research-privacy-title"
        className="rounded-2xl border border-border bg-secondary/30 p-6 sm:p-7 space-y-2"
      >
        <h2
          id="research-privacy-title"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-foreground"
        >
          <Lock className="size-4 text-primary" aria-hidden />
          {dict.privacy.title}
        </h2>
        <p className="text-[14px] leading-[1.6] text-muted-foreground">
          {dict.privacy.body}
        </p>
      </section>

      {/* Trust footer — named researcher, supervisor, contact */}
      <section
        aria-label="Researcher info"
        className="border-t border-border pt-6 space-y-2 text-[13px] text-muted-foreground"
      >
        <p>
          <span className="text-foreground/80">{dict.trust.researcher}:</span>{" "}
          {dict.trust.researcherName}
        </p>
        <p>
          <span className="text-foreground/80">{dict.trust.supervisor}:</span>{" "}
          {dict.trust.supervisorName}
        </p>
        <p className="inline-flex items-center gap-1.5">
          <Mail className="size-3.5" aria-hidden />
          {dict.trust.contact}
        </p>
      </section>

      {/* Secondary CTA at the bottom for scrollers */}
      <div className="flex justify-center pt-4">
        <Link
          href={registerHref}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 h-11 text-[14.5px] font-medium"
        >
          {primaryLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[14px] uppercase tracking-[0.12em] font-medium text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
