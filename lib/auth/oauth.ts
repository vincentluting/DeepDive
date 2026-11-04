// ============================================================
// OAuth — Google + Apple OAuth 2.0 flow helpers.
//
// Each provider has:
//   getAuthUrl()    → redirect URL to start OAuth flow
//   exchangeCode()  → exchange auth code for user info
// ============================================================

import { createSign } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { OAuthProvider } from "@/lib/db/oauth";

const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

// ── Google ──────────────────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function getGoogleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<OAuthUserInfo> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${tokenRes.status}`);
  }

  const tokens = await tokenRes.json();

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error(`Google userinfo failed: ${userRes.status}`);
  }

  const user = await userRes.json();

  return {
    provider: "google",
    providerAccountId: user.sub,
    email: user.email,
    name: user.name,
    avatarUrl: user.picture || null,
  };
}

// ── Apple ───────────────────────────────────────────────────

const APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";

function getAppleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "name email",
    state,
    response_mode: "form_post",
  });
  return `${APPLE_AUTH_URL}?${params}`;
}

async function exchangeAppleCode(
  code: string,
  redirectUri: string,
): Promise<OAuthUserInfo> {
  const clientSecret = generateAppleClientSecret();

  const tokenRes = await fetch(APPLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.APPLE_CLIENT_ID!,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Apple token exchange failed: ${tokenRes.status}`);
  }

  const tokens = await tokenRes.json();

  // Verify Apple's id_token JWT signature + claims using Apple's JWKS
  const { payload } = await jwtVerify(tokens.id_token, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: process.env.APPLE_CLIENT_ID!,
  });

  return {
    provider: "apple",
    providerAccountId: payload.sub!,
    email: (payload.email as string) || null,
    name: null, // Apple only sends name on first authorization
    avatarUrl: null,
  };
}

/** Generate Apple client secret JWT (valid for 6 months). */
function generateAppleClientSecret(): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: process.env.APPLE_KEY_ID! };
  const claims = {
    iss: process.env.APPLE_TEAM_ID!,
    iat: now,
    exp: now + 86400 * 180,
    aud: "https://appleid.apple.com",
    sub: process.env.APPLE_CLIENT_ID!,
  };

  // Simple JWT construction — Apple requires ES256 signing
  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const headerB64 = encode(header);
  const claimsB64 = encode(claims);
  const signingInput = `${headerB64}.${claimsB64}`;

  const privateKey = (process.env.APPLE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );
  const sign = createSign("SHA256");
  sign.update(signingInput);
  const signature = sign.sign(
    { key: privateKey, dsaEncoding: "ieee-p1363" },
    "base64url",
  );

  return `${signingInput}.${signature}`;
}

// ── Shared types ────────────────────────────────────────────

export interface OAuthUserInfo {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

/** Get auth URL for a given provider. */
export function getOAuthUrl(
  provider: OAuthProvider,
  state: string,
  redirectUri: string,
): string {
  switch (provider) {
    case "google":
      return getGoogleAuthUrl(state, redirectUri);
    case "apple":
      return getAppleAuthUrl(state, redirectUri);
  }
}

/** Exchange auth code for user info. */
export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
): Promise<OAuthUserInfo> {
  switch (provider) {
    case "google":
      return exchangeGoogleCode(code, redirectUri);
    case "apple":
      return exchangeAppleCode(code, redirectUri);
  }
}
