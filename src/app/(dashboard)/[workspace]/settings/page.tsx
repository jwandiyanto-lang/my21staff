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

  // Get workspace members with their profiles
  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, user_id, role, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  // Get profiles for each member
  const memberIds = members?.map((m) => m.user_id).filter(Boolean) || []
  const { data: profiles } = memberIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', memberIds)
    : { data: [] }

  // Combine members with their profiles
  const membersWithProfiles = (members || []).map((member) => ({
    ...member,
    role: member.role || 'member',
    created_at: member.created_at || new Date().toISOString(),
    profiles: profiles?.find((p) => p.id === member.user_id) || null,
  }))

  // Get pending invitations
  const { data: invitationsRaw } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Normalize invitation types
  const invitations = (invitationsRaw || []).map((inv) => ({
    ...inv,
    status: inv.status || 'pending',
    role: inv.role || 'member',
    created_at: inv.created_at || new Date().toISOString(),
  }))

  // Cast settings to expected type
  const workspaceWithSettings = {
    ...workspace,
    settings: workspace.settings as { kapso_api_key?: string } | null,
  }

  return (
    <SettingsClient
      workspace={workspaceWithSettings}
      members={membersWithProfiles}
      invitations={invitations}
    />
  )
}
