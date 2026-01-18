export type TicketStage = 'report' | 'discuss' | 'outcome' | 'implementation' | 'closed'
export type TicketCategory = 'bug' | 'feature' | 'question'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface Ticket {
  id: string
  workspace_id: string
  requester_id: string
  assigned_to: string | null
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  stage: TicketStage
  pending_approval: boolean
  pending_stage: TicketStage | null
  approval_requested_at: string | null
  reopen_token: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  requester?: { id: string; full_name: string | null; email: string }
  assignee?: { id: string; full_name: string | null; email: string } | null
}

export interface TicketComment {
  id: string
  ticket_id: string
  author_id: string
  content: string
  is_stage_change: boolean
  created_at: string
  // Joined data
  author?: { id: string; full_name: string | null; email: string }
}

export interface TicketStatusHistory {
  id: string
  ticket_id: string
  changed_by: string
  from_stage: TicketStage | null
  to_stage: TicketStage
  reason: string | null
  created_at: string
}
