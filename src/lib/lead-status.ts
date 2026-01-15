export type LeadStatus = 'prospect' | 'cold_lead' | 'hot_lead' | 'client' | 'student' | 'alumni' | 'lost'

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  prospect: { label: 'Prospect', color: '#6B7280', bgColor: '#F3F4F6' },
  cold_lead: { label: 'Cold Lead', color: '#3B82F6', bgColor: '#DBEAFE' },
  hot_lead: { label: 'Hot Lead', color: '#DC2626', bgColor: '#FEE2E2' },
  client: { label: 'Client', color: '#10B981', bgColor: '#D1FAE5' },
  student: { label: 'Student', color: '#8B5CF6', bgColor: '#EDE9FE' },
  alumni: { label: 'Alumni', color: '#14B8A6', bgColor: '#CCFBF1' },
  lost: { label: 'Lost', color: '#4B5563', bgColor: '#E5E7EB' },
}

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]

// Default status for new contacts
export const DEFAULT_LEAD_STATUS: LeadStatus = 'prospect'
