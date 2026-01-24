import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { DatabaseClient } from './database-client'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'

interface DatabasePageProps {
  params: Promise<{ workspace: string }>
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock workspace
  if (isDevMode()) {
    return (
      <DatabaseClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
        }}
      />
    )
  }

  // Production: validate workspace exists via Convex
  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return <DatabaseClient workspace={{ id: workspace._id, name: workspace.name, slug: workspace.slug }} />
}
