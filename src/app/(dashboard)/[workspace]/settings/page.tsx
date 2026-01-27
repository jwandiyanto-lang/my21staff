import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { SettingsClient } from './settings-client'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface SettingsPageProps {
  params: Promise<{ workspace: string }>
}

// Settings type matching SettingsClient interface
interface WorkspaceSettings {
  kapso_api_key?: string
  quick_replies?: { id: string; label: string; text: string }[]
  contact_tags?: string[]
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode + demo: use mock data (fully offline, no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <SettingsClient
        workspace={{
          id: MOCK_CONVEX_WORKSPACE._id as Id<'workspaces'>,
          name: MOCK_CONVEX_WORKSPACE.name,
          slug: MOCK_CONVEX_WORKSPACE.slug,
          kapso_phone_id: MOCK_CONVEX_WORKSPACE.kapso_phone_id,
          settings: MOCK_CONVEX_WORKSPACE.settings as WorkspaceSettings,
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

  return (
    <SettingsClient
      workspace={{
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        kapso_phone_id: workspace.kapso_phone_id || null,
        settings: (workspace.settings as WorkspaceSettings) || null,
      }}
    />
  )
}
