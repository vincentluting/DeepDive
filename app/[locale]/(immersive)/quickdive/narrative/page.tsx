import { redirect } from "next/navigation";

// Legacy redirect: /quickdive/narrative → /immersive-dive
export default async function NarrativeExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // gate-redirect-ok: legacy URL alias; not a business precondition.
  redirect(`/${locale}/immersive-dive`);
}
