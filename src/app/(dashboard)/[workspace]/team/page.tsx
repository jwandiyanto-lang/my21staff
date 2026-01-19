import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TeamClient } from './team-client'
import { type WorkspaceRole } from '@/lib/permissions/types'

interface Props {
  params: Promise<{ workspace: string }>
}

export default async function TeamPage({ params }: Props) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    notFound()
  }

  // Get current user's role in this workspace
  const { data: currentMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  const currentUserRole = (currentMembership?.role || 'member') as WorkspaceRole

  // Get workspace members with their profiles
  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, user_id, role, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  // Get profiles for each member
  const memberIds = members?.map((m) => m.user_id).filter(Boolean) || []
  const { data: profiles } =
    memberIds.length > 0
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

  return (
    <TeamClient
      workspace={workspace}
      members={membersWithProfiles}
      currentUserRole={currentUserRole}
    />
  )
}
