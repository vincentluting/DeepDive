import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPipeline } from "@/lib/db/pipeline";
import ProcessingClient from "./processing-client";

interface ProcessingPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readFirst(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

const UUID_RE = /^[0-9a-f-]{36}$/i;

export default async function ProcessingPage({
  params,
  searchParams,
}: ProcessingPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const rawPipelineId = readFirst(sp.pipelineId);

  // Validate the pipelineId before using it in any URL or DB lookup.
  // Prevents redirect-injection (unencoded `?pipelineId=foo&bar=evil` etc.)
  // and confines DB scans to well-formed UUIDs.
  const pipelineId =
    rawPipelineId && UUID_RE.test(rawPipelineId) ? rawPipelineId : null;
  // gate-redirect-ok: malformed URL param — not a business precondition.
  if (!pipelineId) {
    redirect(`/${locale}/dashboard`);
  }

  const user = await getCurrentUser();
  if (!user) {
    // Properly encode both the pipelineId and the nested redirect target so
    // the login flow round-trips the param back intact.
    const target = `/${locale}/processing?pipelineId=${encodeURIComponent(pipelineId)}`;
    redirect(`/${locale}/login?redirect=${encodeURIComponent(target)}`);
  }

  const pipeline = await getPipeline(pipelineId);
  // gate-redirect-ok: anti-enumeration — don't reveal whether another user's
  // pipelineId exists. A Gate here would leak that signal.
  if (!pipeline || pipeline.userId !== user.id) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <ProcessingClient
      locale={locale}
      pipelineId={pipelineId}
      assessmentId={pipeline.assessmentId}
    />
  );
}
