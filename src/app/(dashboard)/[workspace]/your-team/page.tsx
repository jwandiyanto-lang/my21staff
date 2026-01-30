import { notFound, redirect } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { YourTeamClient } from './your-team-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE, MOCK_TEAM_MEMBERS } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface YourTeamPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function YourTeamPage({ params, searchParams }: YourTeamPageProps) {
  const { workspace: workspaceSlug } = await params
  const { tab } = await searchParams

  // Redirect old knowledge-base route to new your-team route
  // This is handled in knowledge-base/page.tsx, but double-check here for direct access
  const validTabs = ['intern', 'brain']
  const activeTab = tab && validTabs.includes(tab) ? tab : 'intern'

  // Dev mode + demo: use mock data (fully offline, no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <YourTeamClient
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
        activeTab={activeTab}
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
      teamMembers={[]}
      activeTab={activeTab}
    />
  )
}
