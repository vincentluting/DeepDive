"use client"

const CLIENT_ID_KEY = "deep_dive_client_id"

// In-memory fallback for environments where localStorage is unavailable
// (e.g., Safari private browsing, storage quota exceeded)
let memoryClientId: string | null = null

export function getClientId(): string {
  if (typeof window === "undefined") return ""

  try {
    let clientId = localStorage.getItem(CLIENT_ID_KEY)
    if (!clientId) {
      clientId = crypto.randomUUID()
      localStorage.setItem(CLIENT_ID_KEY, clientId)
    }
    return clientId
  } catch {
    // localStorage unavailable (Safari private mode, quota exceeded)
    if (!memoryClientId) {
      memoryClientId = crypto.randomUUID()
    }
    return memoryClientId
  }
}

