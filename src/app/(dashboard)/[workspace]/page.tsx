import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { DashboardClient } from './dashboard-client'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'

interface DashboardPageProps {
  params: Promise<{ workspace: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock workspace
  if (isDevMode()) {
    return <DashboardClient workspaceId={MOCK_WORKSPACE.id as any} workspaceSlug={MOCK_WORKSPACE.slug} />
  }

  // Production: validate workspace exists via Convex
  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return <DashboardClient workspaceId={workspace._id} workspaceSlug={workspace.slug} />
}
