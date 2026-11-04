import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Suspense } from "react";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const t = dictionary.resetPasswordPage;

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

            <Suspense>
              <ResetPasswordForm dictionary={t.form} />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
