import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { type TicketStage, STAGE_CONFIG, PRIORITY_CONFIG, type TicketPriority } from '@/lib/tickets'

interface TicketCardProps {
  ticket: {
    id: string
    title: string
    stage: string
    priority: string
    created_at: string | null
    updated_at: string | null
  }
}

export function TicketCard({ ticket }: TicketCardProps) {
  const stage = ticket.stage as TicketStage
  const priority = ticket.priority as TicketPriority

  return (
    <Link href={`/portal/support/${ticket.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{ticket.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Updated {ticket.updated_at ? formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true }) : 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={stage === 'closed' ? 'secondary' : 'default'}>
                {STAGE_CONFIG[stage].label}
              </Badge>
              <Badge variant={priority === 'high' ? 'destructive' : 'outline'}>
                {PRIORITY_CONFIG[priority].label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
