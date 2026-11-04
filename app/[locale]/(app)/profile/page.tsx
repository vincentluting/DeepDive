import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/profile`);
  }

  // gate-redirect-ok: /profile is a thin index that always resolves to
  // /profile/[user.id]; no business precondition is being checked here.
  redirect(`/${locale}/profile/${user.id}`);
}
