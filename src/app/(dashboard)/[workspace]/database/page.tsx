import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { DatabaseClient } from './database-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface DatabasePageProps {
  params: Promise<{ workspace: string }>
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode + demo: use mock data (fully offline, no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <DatabaseClient
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

  return <DatabaseClient workspace={{ id: workspace._id, name: workspace.name, slug: workspace.slug }} />
}
