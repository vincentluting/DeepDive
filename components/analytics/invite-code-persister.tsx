'use client'

import { useEffect } from 'react'

const INVITE_CODE_STORAGE_KEY = 'deep-dive-pending-invite-code'

/**
 * Persists ?invite=CODE from URL to localStorage on first load.
 * This ensures the invite code survives navigation through Quick Dive
 * and reaches InlineRegisterPanel or the register page.
 */
export function InviteCodePersister() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const invite = params.get('invite')
    if (invite) {
      localStorage.setItem(INVITE_CODE_STORAGE_KEY, invite.trim().toUpperCase())
    }
  }, [])

  return null
}
