import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { InboxClient } from './inbox-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface InboxPageProps {
  params: Promise<{ workspace: string }>
}

export default async function InboxPage({ params }: InboxPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode + demo: use mock data (fully offline, no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return <InboxClient workspaceId={MOCK_CONVEX_WORKSPACE._id as Id<'workspaces'>} />
  }

  // Production: fetch real workspace from Convex
  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return <InboxClient workspaceId={workspace._id} />
}
