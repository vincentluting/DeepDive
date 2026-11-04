import { redirect } from "next/navigation";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import type { User } from "@/lib/auth";

/**
 * Server-side admin gate for admin pages.
 *
 * Every admin page.tsx MUST call this directly — the admin layout also
 * calls it as defense-in-depth, but App Router layouts do not re-render
 * on client navigation and are not a security boundary on their own.
 */
export async function requireAdminPage(
  locale: string,
): Promise<User & { isAdmin: boolean }> {
  const user = await getCurrentUserWithAdmin();

  // gate-redirect-ok: access control — admin pages must not leak their
  // existence to non-admins. A PrerequisiteGate would do exactly that.
  if (!user || !user.isAdmin) {
    redirect(!user ? `/${locale}/login` : `/${locale}`);
  }

  return user;
}
