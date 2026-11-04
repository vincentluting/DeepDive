import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CoachingClient from "./coaching-client";

function CoachingFallback() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="max-w-md w-full px-6 py-16 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted/40 animate-pulse" />
          <div className="h-5 w-40 rounded bg-muted/40 animate-pulse" />
          <div className="h-4 w-64 rounded bg-muted/30 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-muted/20 animate-pulse"
            />
          ))}
        </div>
        <div className="flex justify-center">
          <div className="h-12 w-48 rounded-full bg-muted/30 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default async function CoachingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/register?from=coaching`);
  }

  return (
    <Suspense fallback={<CoachingFallback />}>
      <CoachingClient userName={user.name ?? null} />
    </Suspense>
  );
}
