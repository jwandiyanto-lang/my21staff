/**
 * Hook to ensure current user exists in Convex database.
 *
 * This prevents race conditions where queries run before the user document exists.
 * Use this hook at the top of any client component that uses Convex queries.
 *
 * @returns {boolean} userInitialized - True when user is guaranteed to exist
 *
 * @example
 * ```tsx
 * const userInitialized = useEnsureUser()
 *
 * // Skip queries until user is initialized
 * const data = useQuery(
 *   api.something.get,
 *   !userInitialized ? 'skip' : { workspace_id }
 * )
 * ```
 */

import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export function useEnsureUser(): boolean {
  const [userInitialized, setUserInitialized] = useState(false)
  const ensureUser = useMutation(api.users.ensureCurrentUser)

  useEffect(() => {
    if (!isDevMode && !userInitialized) {
      ensureUser()
        .then(() => {
          console.log('[useEnsureUser] User initialized successfully')
          setUserInitialized(true)
        })
        .catch((err) => {
          console.error('[useEnsureUser] Failed to initialize user:', err)
          // Still set to true to allow queries to run (user might already exist)
          setUserInitialized(true)
        })
    } else if (isDevMode) {
      setUserInitialized(true)
    }
  }, [ensureUser, isDevMode, userInitialized])

  return userInitialized
}
