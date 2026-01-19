import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TicketCard } from '@/components/portal/ticket-card'
import { Plus, Ticket } from 'lucide-react'

export default async function PortalSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, title, stage, priority, created_at, updated_at')
    .eq('requester_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your support requests
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/support/new">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </div>

      {tickets && tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No tickets yet</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Create your first support ticket to get help.
          </p>
          <Button asChild>
            <Link href="/portal/support/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
