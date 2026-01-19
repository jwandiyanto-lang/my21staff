import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PortalTicketDetail } from './portal-ticket-detail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PortalTicketDetailPage({ params }: Props) {
  const { id: ticketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get ticket - must be user's own
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, title, description, category, priority, stage, created_at, updated_at, closed_at')
    .eq('id', ticketId)
    .eq('requester_id', user.id)
    .single()

  if (error || !ticket) {
    notFound()
  }

  // Get public comments
  const { data: comments } = await supabase
    .from('ticket_comments')
    .select(`
      id,
      content,
      is_stage_change,
      created_at,
      author:profiles!ticket_comments_author_id_fkey(id, full_name)
    `)
    .eq('ticket_id', ticketId)
    .or('is_internal.is.null,is_internal.eq.false')
    .order('created_at', { ascending: true })

  return (
    <PortalTicketDetail
      ticket={ticket}
      comments={comments || []}
      currentUserId={user.id}
    />
  )
}
