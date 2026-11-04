import { sql } from "@/lib/db/connection"

export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS
  if (!adminEmails) return false
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase())
}

export async function isUserAdmin(userId: string, email?: string): Promise<boolean> {
  // Check ADMIN_EMAILS env var first (no DB query needed)
  if (email && isAdminEmail(email)) return true

  // Fall back to DB isAdmin column
  try {
    const result = await sql`
      SELECT "isAdmin" FROM "User" WHERE "id" = ${userId}
    `
    return result.length > 0 && result[0].isAdmin === true
  } catch {
    // If isAdmin column doesn't exist yet, no one is admin
    return false
  }
}
