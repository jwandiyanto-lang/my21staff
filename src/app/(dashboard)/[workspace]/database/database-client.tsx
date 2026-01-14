'use client'

import { useMemo, useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Filter } from 'lucide-react'
import { columns } from './columns'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import type { Contact, Workspace } from '@/types/database'

interface DatabaseClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  contacts: Contact[]
}

export function DatabaseClient({ workspace, contacts }: DatabaseClientProps) {
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const filteredContacts = useMemo(() => {
    if (statusFilter.length === 0) return contacts
    return contacts.filter((contact) =>
      statusFilter.includes(contact.lead_status as LeadStatus)
    )
  }, [contacts, statusFilter])

  const handleStatusToggle = (status: LeadStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact)
    console.log('Selected contact:', contact)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Database</h1>
          <p className="text-muted-foreground">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Status
                {statusFilter.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {statusFilter.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <p className="font-medium text-sm">Filter by status</p>
                {LEAD_STATUSES.map((status) => {
                  const config = LEAD_STATUS_CONFIG[status]
                  return (
                    <label
                      key={status}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={statusFilter.includes(status)}
                        onCheckedChange={() => handleStatusToggle(status)}
                      />
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: config.bgColor,
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </span>
                    </label>
                  )
                })}
                {statusFilter.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setStatusFilter([])}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredContacts}
        searchPlaceholder="Search contacts..."
        onRowClick={handleRowClick}
      />
    </div>
  )
}
