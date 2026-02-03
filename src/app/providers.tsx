'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Dev mode uses plain Convex (no auth), hooks use safe wrappers
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

  // Dev mode: Skip ClerkProvider entirely (use safe hook wrappers)
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

  // Ensure Clerk keys are available
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    console.error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
    // Fallback to unauthenticated mode if Clerk is not configured
    return (
      <ConvexProvider client={convex}>
        <QueryClientProvider client={queryClient}>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
            <p className="text-muted-foreground">
              Clerk authentication is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
            </p>
          </div>
        </QueryClientProvider>
      </ConvexProvider>
    )
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
