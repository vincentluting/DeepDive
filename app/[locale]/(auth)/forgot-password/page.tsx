import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import Link from "next/link";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const t = dictionary.forgotPasswordPage;

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
              <h2 className="font-display text-[1.75rem] font-bold tracking-[-0.01em] text-foreground mb-2">
                {t.title}
              </h2>
              <p className="text-muted-foreground text-sm">{t.description}</p>
            </div>

            <ForgotPasswordForm dictionary={t.form} />

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                href={`/${locale}/login`}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t.backToLogin}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
