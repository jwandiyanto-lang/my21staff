'use client'

/**
 * Safe Clerk hook wrappers for dev mode
 *
 * In dev mode, ClerkProvider is not mounted (no API keys needed),
 * so we provide mock implementations that return safe defaults.
 */

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock return values for dev mode
const mockAuth = {
  userId: 'dev-user-001',
  isLoaded: true,
  isSignedIn: true,
  sessionId: 'dev-session',
  orgId: null,
  orgRole: null,
  orgSlug: null,
  has: () => false,
  signOut: async () => {},
  getToken: async () => null,
}

const mockUser = {
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: 'dev-user-001',
    fullName: 'Dev User',
    firstName: 'Dev',
    lastName: 'User',
    primaryEmailAddress: {
      emailAddress: 'dev@localhost',
    },
    imageUrl: null,
    username: null,
  },
}

/**
 * Safe wrapper for useAuth that works in dev mode without ClerkProvider
 */
export function useAuth() {
  // Return mock data in dev mode without calling Clerk hooks
  if (isDevMode) {
    return mockAuth
  }

  // In production, dynamically import and call the real hook
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAuth: useClerkAuth } = require('@clerk/nextjs')
  return useClerkAuth()
}

/**
 * Safe wrapper for useUser that works in dev mode without ClerkProvider
 */
export function useUser() {
  // Return mock data in dev mode without calling Clerk hooks
  if (isDevMode) {
    return mockUser
  }

  // In production, dynamically import and call the real hook
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useUser: useClerkUser } = require('@clerk/nextjs')
  return useClerkUser()
}
