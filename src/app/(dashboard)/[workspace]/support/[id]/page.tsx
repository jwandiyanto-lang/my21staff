import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TicketDetailClient, type TicketDetailData, type CommentData, type WorkspaceMemberData } from './ticket-detail-client'
import { type WorkspaceRole } from '@/lib/permissions/types'

interface Props {
  params: Promise<{ workspace: string; id: string }>
}

export default async function TicketDetailPage({ params }: Props) {
  const { workspace: workspaceSlug, id: ticketId } = await params
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

  if (!currentMembership) {
    // User is not a member of this workspace
    redirect(`/${workspaceSlug}`)
  }

  const currentUserRole = (currentMembership.role || 'member') as WorkspaceRole

  // Get ticket with requester, assignee, and source workspace info
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      requester:profiles!tickets_requester_id_fkey(id, full_name, email),
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, email),
      source_workspace:workspaces!tickets_workspace_id_fkey(id, name, slug)
    `)
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    notFound()
  }

  // Verify access - either workspace member or admin workspace member
  const isWorkspaceMember = ticket.workspace_id === workspace.id
  const isAdminWorkspaceMember = ticket.admin_workspace_id === workspace.id

  if (!isWorkspaceMember && !isAdminWorkspaceMember) {
    notFound()
  }

  // Determine if this is a client ticket (has admin_workspace_id set)
  const isClientTicket = ticket.admin_workspace_id !== null

  // Get comments with author info
  const { data: comments } = await supabase
    .from('ticket_comments')
    .select(`
      *,
      author:profiles!ticket_comments_author_id_fkey(id, full_name, email)
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  // Get workspace members for assignment dropdown
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspace.id)

  // Get profiles for members
  const memberIds = members?.map(m => m.user_id) || []
  const { data: profiles } = memberIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', memberIds)
    : { data: [] }

  // Combine members with profiles
  const workspaceMembers: WorkspaceMemberData[] = (members || []).map(m => {
    const profile = profiles?.find(p => p.id === m.user_id)
    return {
      user_id: m.user_id,
      role: m.role || 'member',
      full_name: profile?.full_name || null,
      email: profile?.email || null,
    }
  })

  return (
    <TicketDetailClient
      workspace={workspace}
      ticket={ticket as unknown as TicketDetailData}
      comments={(comments || []) as unknown as CommentData[]}
      currentUserRole={currentUserRole}
      currentUserId={user.id}
      workspaceMembers={workspaceMembers}
      isClientTicket={isClientTicket}
    />
  )
}
