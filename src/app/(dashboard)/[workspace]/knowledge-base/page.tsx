import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { KnowledgeBaseClient } from './knowledge-base-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE, MOCK_TEAM_MEMBERS } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface KnowledgeBasePageProps {
  params: Promise<{ workspace: string }>
}

export default async function KnowledgeBasePage({ params }: KnowledgeBasePageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode + demo: use mock data (fully offline, no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <KnowledgeBaseClient
        workspace={{
          id: MOCK_CONVEX_WORKSPACE._id as Id<'workspaces'>,
          name: MOCK_CONVEX_WORKSPACE.name,
          slug: MOCK_CONVEX_WORKSPACE.slug,
        }}
        teamMembers={MOCK_TEAM_MEMBERS.map((member) => ({
          id: member.id,
          email: member.profile?.email || '',
          full_name: member.profile?.full_name || '',
        }))}
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
    <KnowledgeBaseClient
      workspace={{
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
      }}
      teamMembers={[]}
    />
  )
}
