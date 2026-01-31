import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { LeadsContent } from './leads-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface LeadsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function LeadsPage({ params }: LeadsPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock workspace
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <Suspense fallback={<LeadsSkeleton />}>
        <LeadsContent workspaceId={MOCK_CONVEX_WORKSPACE._id as Id<'workspaces'>} />
      </Suspense>
    )
  }

  // Production: fetch real workspace
  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return (
    <Suspense fallback={<LeadsSkeleton />}>
      <LeadsContent workspaceId={workspace._id} />
    </Suspense>
  )
}

function LeadsSkeleton() {
  return (
    <div className="h-full p-8">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  )
}
