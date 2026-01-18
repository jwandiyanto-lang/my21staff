'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Ticket } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { TicketFormSheet } from './ticket-form-sheet'
import { type WorkspaceRole } from '@/lib/permissions/types'
import {
  type TicketStage,
  type TicketCategory,
  type TicketPriority,
  STAGE_CONFIG,
  CATEGORY_CONFIG,
  PRIORITY_CONFIG
} from '@/lib/tickets'

export interface TicketData {
  id: string
  title: string
  description: string
  category: string
  priority: string
  stage: string
  pending_approval: boolean
  created_at: string
  requester: { id: string; full_name: string | null; email: string } | null
  assignee: { id: string; full_name: string | null; email: string } | null
}

interface SupportClientProps {
  workspace: {
    id: string
    name: string
    slug: string
  }
  tickets: TicketData[]
  currentUserRole: WorkspaceRole
  currentUserId: string
}

const stageFilters: { value: TicketStage | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'report', label: 'Laporan' },
  { value: 'discuss', label: 'Diskusi' },
  { value: 'outcome', label: 'Keputusan' },
  { value: 'implementation', label: 'Implementasi' },
  { value: 'closed', label: 'Selesai' },
]

function getPriorityBadgeVariant(priority: TicketPriority): 'default' | 'secondary' | 'destructive' {
  switch (priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'secondary'
  }
}

function getStageBadgeVariant(stage: TicketStage): 'default' | 'secondary' | 'outline' {
  if (stage === 'closed') return 'secondary'
  if (stage === 'report') return 'outline'
  return 'default'
}

export function SupportClient({
  workspace,
  tickets,
  currentUserRole,
  currentUserId,
}: SupportClientProps) {
  const router = useRouter()
  const [stageFilter, setStageFilter] = useState<TicketStage | 'all'>('all')
  const [sheetOpen, setSheetOpen] = useState(false)

  const filteredTickets = stageFilter === 'all'
    ? tickets
    : tickets.filter(t => t.stage as TicketStage === stageFilter)

  const handleTicketCreated = () => {
    setSheetOpen(false)
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dukungan</h1>
          <p className="text-muted-foreground mt-1">
            Kelola tiket dukungan dan permintaan layanan
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tiket Baru
        </Button>
      </div>

      {/* Stage Filter Tabs */}
      <Tabs value={stageFilter} onValueChange={(v) => setStageFilter(v as TicketStage | 'all')} className="mb-6">
        <TabsList>
          {stageFilters.map(filter => (
            <TabsTrigger key={filter.value} value={filter.value}>
              {filter.label}
              {filter.value !== 'all' && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({tickets.filter(t => t.stage as TicketStage === filter.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Ticket List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Tiket</CardTitle>
          <CardDescription>
            {filteredTickets.length} tiket{stageFilter !== 'all' ? ` dalam tahap ${STAGE_CONFIG[stageFilter].labelId}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Belum ada tiket</h3>
              <p className="text-muted-foreground mt-2">
                {stageFilter === 'all'
                  ? 'Buat tiket pertama untuk memulai.'
                  : `Tidak ada tiket dalam tahap ${STAGE_CONFIG[stageFilter].labelId}.`}
              </p>
              {stageFilter === 'all' && (
                <Button onClick={() => setSheetOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Tiket
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Tahap</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Ditugaskan ke</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        href={`/${workspace.slug}/support/${ticket.id}`}
                        className="font-medium hover:underline"
                      >
                        {ticket.title}
                      </Link>
                      {ticket.pending_approval && (
                        <Badge variant="outline" className="ml-2 text-xs text-amber-600 border-amber-300">
                          Menunggu Persetujuan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_CONFIG[ticket.category as TicketCategory].labelId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority as TicketPriority)}>
                        {PRIORITY_CONFIG[ticket.priority as TicketPriority].labelId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStageBadgeVariant(ticket.stage as TicketStage)}>
                        {STAGE_CONFIG[ticket.stage as TicketStage].labelId}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.requester?.full_name || ticket.requester?.email || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.assignee?.full_name || ticket.assignee?.email || 'Belum ditugaskan'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Ticket Form Sheet */}
      <TicketFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        workspaceId={workspace.id}
        onSuccess={handleTicketCreated}
      />
    </div>
  )
}
