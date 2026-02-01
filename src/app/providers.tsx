'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Dev mode uses plain Convex (no auth), but keeps ClerkProvider for hooks
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: how long data is considered fresh
            staleTime: 60 * 1000, // 1 minute default
            // Don't refetch on window focus for dashboard apps
            refetchOnWindowFocus: false,
            // Retry once on failure
            retry: 1,
          },
        },
      })
  )

  // Dev mode: Skip ClerkProvider entirely (no production keys needed)
  // Production: use Clerk + Convex with auth
  if (isDevMode) {
    return (
      <ConvexProvider client={convex}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConvexProvider>
    )
  }

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
