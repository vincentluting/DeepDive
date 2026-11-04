// ============================================================
// CSRF Client Utility
// Reads the CSRF token from the cookie and provides it for
// inclusion in fetch request headers.
// ============================================================

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Read the CSRF token from the cookie.
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Get headers object with the CSRF token included.
 * Merges with any existing headers.
 */
export function csrfHeaders(headers?: Record<string, string>): Record<string, string> {
  const token = getCsrfToken()
  return {
    ...headers,
    ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
  }
}

/**
 * Wrapper around fetch that automatically includes the CSRF token header
 * for state-changing requests (POST, PUT, DELETE, PATCH).
 */
export async function csrfFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase()
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)

  if (!isStateChanging) {
    return fetch(input, init)
  }

  const existingHeaders = init?.headers instanceof Headers
    ? Object.fromEntries(init.headers.entries())
    : (init?.headers as Record<string, string>) || {}

  return fetch(input, {
    ...init,
    headers: csrfHeaders({
      ...existingHeaders,
    }),
  })
}
