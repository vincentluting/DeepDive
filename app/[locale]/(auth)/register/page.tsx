import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import type { Locale } from "@/lib/i18n/config";
import { Shield, Compass, MessageCircle, Brain } from "lucide-react";

import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const m = dictionary.metadata;
  return {
    title: m.registerTitle,
    description: m.registerDescription,
  };
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const from =
    typeof resolvedSearchParams.from === "string"
      ? resolvedSearchParams.from
      : undefined;
  const inviteCode =
    typeof resolvedSearchParams.invite === "string"
      ? resolvedSearchParams.invite
      : undefined;
  const dictionary = await getDictionary(locale as Locale);
  const t = dictionary.registerPage;

  return (
    <div className="dd-auth-page min-h-dvh flex flex-col">
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center p-4 sm:p-6"
        style={{ paddingTop: "var(--header-height, 64px)" }}
      >
        {/* Ambient backdrop is provided by <AmbientField> in (auth)/layout.tsx */}
        <div className="w-full max-w-4xl animate-fade-in-up">
          <div className="dd-auth-register-shell flex flex-col md:flex-row rounded-2xl overflow-hidden card-shadow border border-border">
            {/* Left: Brand panel — desktop only */}
            <div
              className="dd-auth-brand-panel hidden md:flex flex-col md:w-[45%] p-10 relative overflow-hidden"
            >
              <div className="dd-auth-brand-thread" aria-hidden="true" />

              {/* Brand name */}
              <div className="relative z-10">
                <div className="font-display text-white font-bold text-lg tracking-wide">
                  Deep Dive
                </div>
                <div className="mt-3 w-8 h-px bg-[var(--rev-glow-cold)]/70" />
              </div>

              {/* Tagline + value props */}
              <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
                <h2 className="font-display text-white text-[1.6rem] font-bold leading-tight tracking-[-0.01em]">
                  {t.brandTagline}
                </h2>

                <div className="mt-10 space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.10] flex items-center justify-center shrink-0">
                      <Compass className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {t.valueProp1}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.10] flex items-center justify-center shrink-0">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {t.valueProp2}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.10] flex items-center justify-center shrink-0">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {t.valueProp3}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form panel */}
            <div className="dd-auth-card flex-1 bg-card p-8 md:p-10">
              {/* Mobile: minimal brand tagline */}
              <div className="md:hidden text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  {t.brandTagline}
                </p>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.01em] text-foreground mb-2">
                  {t.beginJourney}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t.createAccountDesc}
                </p>
              </div>

              <RegisterForm
                locale={locale}
                from={from}
                inviteCode={inviteCode}
              />

              {/* Data usage notice */}
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <Shield className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.dataUsageNotice}{" "}
                  <Link
                    href={`/${locale}/legal/privacy`}
                    className="inline-flex min-h-5 items-center align-baseline font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    {t.learnMore}
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t.alreadyHaveAccount}{" "}
                <Link
                  href={
                    from
                      ? `/${locale}/login?redirect=/${locale}/${from}`
                      : `/${locale}/login`
                  }
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {t.signIn}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
