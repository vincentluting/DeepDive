import { redirect } from "next/navigation";

/**
 * Profile Reveal page — DEPRECATED.
 * Redirects to the full profile page. Kept to avoid 404s from
 * bookmarks or external links.
 */
export default async function ProfileRevealPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // gate-redirect-ok: DEPRECATED legacy alias kept to avoid 404s on
  // bookmarks/external links. Not a business precondition check.
  redirect(`/${locale}/profile`);
}
