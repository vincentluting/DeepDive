import { SoundingLanding } from "@/components/features/landing/sounding/sounding-landing";

/**
 * Parallel preview route for the Sounding landing rebuild. Lives outside the
 * (marketing) group so it never disturbs the production landing. Once verified,
 * the (marketing)/page.tsx entry switches to <SoundingLanding /> and this route
 * can be retired.
 */
export default function SoundingPreviewRoute() {
  return <SoundingLanding />;
}
