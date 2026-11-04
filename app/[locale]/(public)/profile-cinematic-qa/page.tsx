import { PageArtLayer } from "@/components/design/meridian/page-art-layer";
import { ProfileCinematicQaClient } from "./profile-cinematic-qa-client";

export default async function ProfileCinematicQaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div
      data-surface="revelation"
      className="dd-profile-page min-h-dvh text-rev-ink relative isolate"
    >
      <PageArtLayer route="profile" priority />
      <ProfileCinematicQaClient locale={locale} />
    </div>
  );
}
