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

  // Get ticket with requester and assignee info
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      requester:users!tickets_requester_id_fkey(id, full_name, email),
      assignee:users!tickets_assigned_to_fkey(id, full_name, email)
    `)
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    notFound()
  }

  // Verify ticket belongs to this workspace
  if (ticket.workspace_id !== workspace.id) {
    notFound()
  }

  // Get comments with author info
  const { data: comments } = await supabase
    .from('ticket_comments')
    .select(`
      *,
      author:users!ticket_comments_author_id_fkey(id, full_name, email)
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
      role: m.role,
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
    />
  )
}
