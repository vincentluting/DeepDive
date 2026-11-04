// ============================================================
// Email Client — Resend wrapper with beta-mode kill switch.
//
// All outbound emails go through sendEmail() with a required `category`:
//   - "critical"      → user-initiated (password reset). ALWAYS sent,
//                       even when EMAIL_MODE=beta. Users expect these
//                       and cannot recover their account without them.
//   - "transactional" → system-initiated (welcome, reminders, notifications).
//                       Suppressed when EMAIL_MODE=beta to avoid bothering
//                       users while the product isn't ready.
//
// EMAIL_MODE env var values:
//   - unset / "production" → send all (default, backward-compatible)
//   - "beta"               → send only critical; suppress transactional
//
// Templates are plain HTML strings (no React Email dependency
// to keep the bundle lean).
// ============================================================

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const DEFAULT_FROM =
  process.env.EMAIL_FROM_ADDRESS ?? "Deep Dive <noreply@deepdive.app>";

/**
 * Email delivery category — determines whether an email is suppressed
 * when `EMAIL_MODE=beta` is set.
 */
export type EmailCategory = "critical" | "transactional";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /**
   * Delivery category. REQUIRED so every email site has to explicitly
   * declare whether it's user-initiated (critical) or system-initiated
   * (transactional). No implicit defaults — prevents silently bothering
   * users in beta mode.
   */
  category: EmailCategory;
  /** Optional plain-text fallback */
  text?: string;
}

/**
 * Send an email via Resend.
 *
 * Returns:
 *   - `true`  when successfully sent OR suppressed by beta mode
 *   - `false` when Resend is not configured or the send failed
 *
 * Beta mode (`EMAIL_MODE=beta`):
 *   - `transactional` emails are silently dropped (logged + returns `true`
 *     so callers don't treat it as a failure)
 *   - `critical` emails send normally
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { category } = options;

  // ── Beta mode kill switch ──
  // Suppress transactional emails when the product is in beta to avoid
  // bothering users. Critical emails (password reset) still send because
  // users cannot recover their account without them.
  if (process.env.EMAIL_MODE === "beta" && category === "transactional") {
    console.log(
      `[email:suppressed] Beta mode: skipped ${category} email "${options.subject}" → ${options.to}`,
    );
    return true; // Pretend success so callers don't treat it as failure.
  }

  const resend = getResend();
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[email] Skipped (no RESEND_API_KEY):",
        options.subject,
        "→",
        options.to,
      );
    }
    return false;
  }

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("[email] Failed to send:", options.subject, error);
    return false;
  }
}
