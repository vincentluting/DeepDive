import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { getOAuthUrl } from '@/lib/auth/oauth';
import type { OAuthProvider } from '@/lib/db/oauth';

const VALID_PROVIDERS = new Set<OAuthProvider>(['google', 'apple']);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!VALID_PROVIDERS.has(provider as OAuthProvider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  // Generate CSRF state token
  const state = randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // Store locale for post-callback redirect
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';
  cookieStore.set('oauth_locale', locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deepdive.app';
  const redirectUri = `${appUrl}/api/auth/oauth/callback`;
  const authUrl = getOAuthUrl(provider as OAuthProvider, state, redirectUri);

  return NextResponse.redirect(authUrl);
}
