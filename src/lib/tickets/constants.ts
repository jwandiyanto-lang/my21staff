import { type TicketStage, type TicketCategory, type TicketPriority } from './types'

export const STAGE_CONFIG: Record<TicketStage, { label: string; labelId: string; next: TicketStage | null }> = {
  report: { label: 'Report', labelId: 'Laporan', next: 'discuss' },
  discuss: { label: 'Discuss', labelId: 'Diskusi', next: 'outcome' },
  outcome: { label: 'Outcome', labelId: 'Keputusan', next: 'implementation' },
  implementation: { label: 'Implementation', labelId: 'Implementasi', next: 'closed' },
  closed: { label: 'Closed', labelId: 'Selesai', next: null }
}

export const CATEGORY_CONFIG: Record<TicketCategory, { label: string; labelId: string }> = {
  bug: { label: 'Bug', labelId: 'Bug' },
  feature: { label: 'Feature', labelId: 'Fitur' },
  question: { label: 'Question', labelId: 'Pertanyaan' }
}

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; labelId: string; color: string }> = {
  low: { label: 'Low', labelId: 'Rendah', color: 'text-gray-500' },
  medium: { label: 'Medium', labelId: 'Sedang', color: 'text-amber-500' },
  high: { label: 'High', labelId: 'Tinggi', color: 'text-red-500' }
}

// Normal progression: each stage can only go to its next stage
export const VALID_TRANSITIONS: Record<TicketStage, TicketStage[]> = {
  report: ['discuss'],
  discuss: ['outcome'],
  outcome: ['implementation'],
  implementation: ['closed'],
  closed: ['report'] // Reopen goes back to report
}

export const STAGES_ORDER: TicketStage[] = ['report', 'discuss', 'outcome', 'implementation', 'closed']
