import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SettingsClient } from './settings-client'

interface Props {
  params: Promise<{ workspace: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get workspace with settings
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug, kapso_phone_id, settings')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    notFound()
  }

  // Cast settings to expected type
  const workspaceWithSettings = {
    ...workspace,
    settings: workspace.settings as { kapso_api_key?: string } | null,
  }

  return <SettingsClient workspace={workspaceWithSettings} />
}
