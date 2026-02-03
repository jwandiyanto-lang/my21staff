import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { LeadsClient } from './leads-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface LeadsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function LeadsPage({ params }: LeadsPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode + demo: use mock data (fully offline, no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <LeadsClient
        workspace={{
          id: MOCK_CONVEX_WORKSPACE._id as Id<'workspaces'>,
          name: MOCK_CONVEX_WORKSPACE.name,
          slug: MOCK_CONVEX_WORKSPACE.slug,
        }}
      />
    )
  }

  // Production: fetch real workspace from Convex
  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return <LeadsClient workspace={{ id: workspace._id, name: workspace.name, slug: workspace.slug }} />
}
