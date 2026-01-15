'use client'

import { useMemo, useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { ContactDetailSheet } from './contact-detail-sheet'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import type { Contact, Workspace } from '@/types/database'

interface DatabaseClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  contacts: Contact[]
}

export function DatabaseClient({ workspace, contacts }: DatabaseClientProps) {
  const [activeStatus, setActiveStatus] = useState<LeadStatus | 'all'>('all')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Count contacts by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contacts.length }
    LEAD_STATUSES.forEach((status) => {
      counts[status] = contacts.filter((c) => c.lead_status === status).length
    })
    return counts
  }, [contacts])

  const filteredContacts = useMemo(() => {
    if (activeStatus === 'all') return contacts
    return contacts.filter((contact) => contact.lead_status === activeStatus)
  }, [contacts, activeStatus])

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact)
    setIsDetailOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Lead Management</h1>
        <p className="text-muted-foreground">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* All Tab */}
        <button
          onClick={() => setActiveStatus('all')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all',
            activeStatus === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          )}
        >
          All
          <span className="ml-2 text-xs opacity-80">{statusCounts.all}</span>
        </button>

        {/* Status Tabs */}
        {LEAD_STATUSES.map((status) => {
          const config = LEAD_STATUS_CONFIG[status]
          const count = statusCounts[status]
          const isActive = activeStatus === status

          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                isActive
                  ? 'shadow-sm'
                  : 'hover:opacity-80'
              )}
              style={{
                backgroundColor: isActive ? config.color : config.bgColor,
                color: isActive ? 'white' : config.color,
              }}
            >
              {config.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-white/20' : 'bg-black/10'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredContacts}
        searchPlaceholder="Search contacts..."
        onRowClick={handleRowClick}
      />

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        workspace={{ slug: workspace.slug }}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}
