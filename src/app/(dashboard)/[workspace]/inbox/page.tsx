import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { InboxContent } from './inbox-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface InboxPageProps {
  params: Promise<{ workspace: string }>
}

export default async function InboxPage({ params }: InboxPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock workspace
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <Suspense fallback={<InboxSkeleton />}>
        <InboxContent workspaceId={MOCK_CONVEX_WORKSPACE._id as Id<'workspaces'>} />
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
    <Suspense fallback={<InboxSkeleton />}>
      <InboxContent workspaceId={workspace._id} />
    </Suspense>
  )
}

function InboxSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="w-80 border-r border-border animate-pulse bg-muted/20" />
      <div className="flex-1 animate-pulse bg-muted/10" />
    </div>
  )
}
