import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { SettingsClient } from './settings-client'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'

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

  // Dev mode: use mock workspace
  if (isDevMode()) {
    return (
      <SettingsClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
          kapso_phone_id: MOCK_WORKSPACE.kapso_phone_id || null,
          settings: (MOCK_WORKSPACE.settings as WorkspaceSettings) || null,
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
