// ============================================================
// Research recruitment landing — /[locale]/research
//
// Public entry point for the master's-thesis study. Optimised for:
//   1. trust  (UvA branding, GDPR, named researcher, real email)
//   2. clarity (what you do, what you get, ~time)
//   3. data   (?source= for channel attribution, ?invite= prefill)
//
// Funnel event: `recruitment_landing_viewed` (client-side on mount).
// No auth required.
// ============================================================

import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { ResearchLandingClient } from "./research-landing-client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ invite?: string; source?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.researchLanding.meta;
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function ResearchLandingPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { invite, source } = await searchParams;
  const dict = await getDictionary(locale as Locale);

  return (
    <main className="dd-public-page min-h-screen bg-background">
      <ResearchLandingClient
        locale={locale as Locale}
        invite={invite ?? null}
        source={source ?? null}
        dict={dict.researchLanding}
      />
    </main>
  );
}
