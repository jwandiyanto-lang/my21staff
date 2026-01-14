export type LeadStatus = 'new' | 'hot' | 'warm' | 'cold' | 'converted' | 'lost'

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: '#6B7280', bgColor: '#F3F4F6' },
  hot: { label: 'Hot', color: '#DC2626', bgColor: '#FEE2E2' },
  warm: { label: 'Warm', color: '#F59E0B', bgColor: '#FEF3C7' },
  cold: { label: 'Cold', color: '#3B82F6', bgColor: '#DBEAFE' },
  converted: { label: 'Converted', color: '#10B981', bgColor: '#D1FAE5' },
  lost: { label: 'Lost', color: '#6B7280', bgColor: '#E5E7EB' },
}

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]
