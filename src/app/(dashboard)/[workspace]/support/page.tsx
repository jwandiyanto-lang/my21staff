import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SupportClient, type TicketData } from './support-client'
import { type WorkspaceRole } from '@/lib/permissions/types'

interface Props {
  params: Promise<{ workspace: string }>
}

export default async function SupportPage({ params }: Props) {
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

  // Get tickets with requester and assignee info
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      *,
      requester:users!tickets_requester_id_fkey(id, full_name, email),
      assignee:users!tickets_assigned_to_fkey(id, full_name, email)
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return (
    <SupportClient
      workspace={workspace}
      tickets={(tickets || []) as unknown as TicketData[]}
      currentUserRole={currentUserRole}
      currentUserId={user.id}
    />
  )
}
