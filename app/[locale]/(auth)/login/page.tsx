import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import type { Locale } from "@/lib/i18n/config";

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
    title: m.loginTitle,
    description: m.loginDescription,
  };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const { redirect: redirectTo } = await searchParams;
  const dictionary = await getDictionary(locale as Locale);
  const t = dictionary.loginPage;

  return (
    <div className="dd-auth-page min-h-dvh flex flex-col">
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center p-4 sm:p-8"
        style={{ paddingTop: "var(--header-height, 64px)" }}
      >
        {/* Ambient backdrop is provided by <AmbientField> in (auth)/layout.tsx */}
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="dd-auth-card bg-card card-shadow border border-border rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.01em] text-foreground mb-2">
                {t.welcomeBack}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t.continueJourney}
              </p>
            </div>

            <LoginForm locale={locale} redirectTo={redirectTo} />

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t.newToDeepDive}{" "}
              <Link
                href={`/${locale}/register`}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t.createAccount}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
