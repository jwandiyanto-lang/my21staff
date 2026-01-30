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
  contact_tags?: string[]
  main_form_fields?: string[]
  form_field_scores?: Record<string, number>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode + demo: use mock data (fully offline, no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <SettingsClient
        workspaceId={MOCK_CONVEX_WORKSPACE._id}
        workspaceSlug={MOCK_CONVEX_WORKSPACE.slug}
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
      workspaceId={workspace._id}
      workspaceSlug={workspace.slug}
    />
  )
}
