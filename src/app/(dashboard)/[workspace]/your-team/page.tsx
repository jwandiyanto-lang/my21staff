import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { YourTeamClient } from './your-team-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface YourTeamPageProps {
  params: Promise<{ workspace: string }>
}

export default async function YourTeamPage({ params }: YourTeamPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode + demo: use mock data (fully offline, no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <YourTeamClient
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

  // Note: We don't call auth-protected queries (like api.ari.getAriConfig) here.
  // The client tabs handle their own data fetching via API routes.

  return (
    <YourTeamClient
      workspace={{
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
      }}
    />
  )
}
