// Barrel re-export — all symbols from lib/auth.ts are re-exported here
// for backward compatibility with existing `import { ... } from '@/lib/auth'`

export { hashPassword, verifyPassword, upgradePasswordHash } from "./passwords"
export { createSession, getSession, deleteSession, setSessionCookie, clearSessionCookie } from "./sessions"
export type { Session } from "./sessions"
export { getCurrentUser, getCurrentUserWithAdmin } from "./guards"
export { createUser, createOAuthUser, authenticateUser, getUserById, emailExists, findUserByEmail, resolveIpCountry, updateUserRegistrationCountry } from "./users"
export type { User } from "./users"
export { isUserAdmin } from "./admin"
