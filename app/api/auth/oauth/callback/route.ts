import { NextResponse, NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { exchangeOAuthCode, type OAuthUserInfo } from "@/lib/auth/oauth";
import {
  findOAuthAccount,
  createOAuthAccount,
  type OAuthProvider,
} from "@/lib/db/oauth";
import {
  createOAuthUser,
  createSession,
  setSessionCookie,
  findUserByEmail,
} from "@/lib/auth";
import { trackFunnelEvent } from "@/lib/analytics/funnel";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deepdive.app";

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  const locale = cookieStore.get("oauth_locale")?.value || "en";

  // Clean up OAuth cookies
  cookieStore.delete("oauth_state");
  cookieStore.delete("oauth_locale");

  // Error or user cancelled
  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/${locale}/login`);
  }

  // CSRF state verification (timing-safe to prevent side-channel)
  if (
    !state ||
    !savedState ||
    state.length !== savedState.length ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(savedState))
  ) {
    console.error("[OAuth] State mismatch");
    return NextResponse.redirect(`${appUrl}/${locale}/login`);
  }

  // Determine provider from the auth URL pattern
  // Google sends to /callback with state, Apple sends via form_post
  const redirectUri = `${appUrl}/api/auth/oauth/callback`;

  let userInfo: OAuthUserInfo;
  try {
    // Try Google first (most common), detect by checking if we can exchange
    // The provider is encoded in the state or we detect from the response
    const provider = detectProvider(request);
    userInfo = await exchangeOAuthCode(provider, code, redirectUri);
  } catch (err) {
    console.error("[OAuth] Code exchange failed:", err);
    return NextResponse.redirect(`${appUrl}/${locale}/login`);
  }

  try {
    // Check if this OAuth identity is already linked
    const existingOAuth = await findOAuthAccount(
      userInfo.provider,
      userInfo.providerAccountId,
    );

    let userId: string;

    if (existingOAuth) {
      // Returning user — log them in
      userId = existingOAuth.userId;
    } else if (userInfo.email) {
      // Check if a user with this email already exists (registered via password)
      const existingUser = await findUserByEmail(userInfo.email);

      if (existingUser) {
        // Link OAuth to existing account
        userId = existingUser.id;
        await createOAuthAccount({
          userId,
          provider: userInfo.provider,
          providerAccountId: userInfo.providerAccountId,
          email: userInfo.email,
          name: userInfo.name,
          avatarUrl: userInfo.avatarUrl,
        });
      } else {
        // New user — create account without password
        const user = await createOAuthUser(userInfo.email, userInfo.name);
        userId = user.id;
        await createOAuthAccount({
          userId,
          provider: userInfo.provider,
          providerAccountId: userInfo.providerAccountId,
          email: userInfo.email,
          name: userInfo.name,
          avatarUrl: userInfo.avatarUrl,
        });

        // Track registration (non-blocking)
        trackFunnelEvent("registered", {
          userId,
          metadata: { provider: userInfo.provider },
        }).catch(() => {});

        // Send welcome email (non-blocking)
        try {
          const { sendEmail } = await import("@/lib/email/client");
          const { buildWelcomeEmail } =
            await import("@/lib/email/templates/welcome");
          const { subject, html } = buildWelcomeEmail({
            name: userInfo.name,
            locale,
            appUrl,
          });
          // category: transactional — OAuth welcome email; suppressed in beta mode.
          sendEmail({
            to: userInfo.email,
            subject,
            html,
            category: "transactional",
          }).catch(() => {});
        } catch {
          // Email failure is non-blocking
        }
      }
    } else {
      // No email from provider (rare — Apple with private relay but no email shared)
      console.error("[OAuth] No email from provider");
      return NextResponse.redirect(`${appUrl}/${locale}/login`);
    }

    // Create session
    const session = await createSession(userId);
    await setSessionCookie(session.id);

    // Track login (non-blocking)
    trackFunnelEvent("login", {
      userId,
      metadata: { provider: userInfo.provider },
    }).catch(() => {});

    return NextResponse.redirect(`${appUrl}/${locale}/dashboard`);
  } catch (err) {
    console.error("[OAuth] Callback processing failed:", err);
    return NextResponse.redirect(`${appUrl}/${locale}/login`);
  }
}

// Apple uses form_post — handle POST callback
export async function POST(request: NextRequest) {
  // Apple sends the callback as a form POST with code + state in the body
  const formData = await request.formData();
  const code = formData.get("code") as string;
  const state = formData.get("state") as string;

  // Reconstruct as URL params and delegate to GET handler
  const url = new URL(request.url);
  url.searchParams.set("code", code || "");
  url.searchParams.set("state", state || "");

  const reconstructedRequest = new NextRequest(url, {
    headers: request.headers,
  });

  return GET(reconstructedRequest);
}

/** Detect OAuth provider from the callback request context. */
function detectProvider(request: NextRequest): OAuthProvider {
  // Apple callbacks come as POST with form data
  if (request.method === "POST") return "apple";

  // Google callbacks come as GET with code + scope params
  const url = new URL(request.url);
  if (url.searchParams.has("scope")) return "google";

  // Default to Google (most common)
  return "google";
}
