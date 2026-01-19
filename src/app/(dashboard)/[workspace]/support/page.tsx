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

  // Fetch internal tickets (created in this workspace, not routed elsewhere)
  const { data: internalTickets } = await supabase
    .from('tickets')
    .select(`
      *,
      requester:profiles!tickets_requester_id_fkey(id, full_name, email),
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, email)
    `)
    .eq('workspace_id', workspace.id)
    .is('admin_workspace_id', null)
    .order('created_at', { ascending: false })

  // Fetch client tickets routed to this admin workspace
  const { data: clientTickets } = await supabase
    .from('tickets')
    .select(`
      *,
      requester:profiles!tickets_requester_id_fkey(id, full_name, email),
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, email),
      source_workspace:workspaces!tickets_workspace_id_fkey(id, name, slug)
    `)
    .eq('admin_workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  // Combine and sort by created_at descending
  const allTickets = [
    ...(internalTickets || []).map(t => ({ ...t, isClientTicket: false, source_workspace: null })),
    ...(clientTickets || []).map(t => ({ ...t, isClientTicket: true }))
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

  return (
    <SupportClient
      workspace={workspace}
      tickets={allTickets as unknown as TicketData[]}
      currentUserRole={currentUserRole}
      currentUserId={user.id}
    />
  )
}
