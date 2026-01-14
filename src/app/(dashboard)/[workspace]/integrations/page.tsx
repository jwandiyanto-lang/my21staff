import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IntegrationsClient } from './integrations-client'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'
import type { Workspace } from '@/types/database'

interface IntegrationsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function IntegrationsPage({ params }: IntegrationsPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock data
  if (isDevMode()) {
    return (
      <IntegrationsClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
          kapso_phone_id: MOCK_WORKSPACE.kapso_phone_id,
          settings: MOCK_WORKSPACE.settings,
        }}
      />
    )
  }

  // Production mode: use Supabase
  const supabase = await createClient()

  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, slug, kapso_phone_id, settings')
    .eq('slug', workspaceSlug)
    .single()

  if (workspaceError || !workspaceData) {
    notFound()
  }

  const workspace = workspaceData as Pick<Workspace, 'id' | 'name' | 'slug' | 'kapso_phone_id' | 'settings'>

  return <IntegrationsClient workspace={workspace} />
}
