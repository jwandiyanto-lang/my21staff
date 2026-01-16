'use client'

import { useMemo, useState, useCallback } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { createColumns } from './columns'
import { ContactDetailSheet } from './contact-detail-sheet'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, Filter, Tag, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Contact, Workspace } from '@/types/database'

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'lead_status', label: 'Status' },
  { id: 'tags', label: 'Tags' },
  { id: 'assigned_to', label: 'Assigned to' },
  { id: 'lead_score', label: 'Score' },
  { id: 'created_at', label: 'Created' },
] as const

interface DatabaseClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  contacts: Contact[]
}

export function DatabaseClient({ workspace, contacts: initialContacts }: DatabaseClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [activeStatus, setActiveStatus] = useState<LeadStatus | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    COLUMN_OPTIONS.map((col) => col.id)
  )
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Handle inline status change
  const handleStatusChange = useCallback(async (contactId: string, newStatus: LeadStatus) => {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, lead_status: newStatus } : c
      )
    )

    // Call API
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update contact status:', error)
      // Revert on error
      setContacts(initialContacts)
    }
  }, [initialContacts])

  // Create columns with status change handler, filtered by visibility
  const allColumns = useMemo(
    () => createColumns({ onStatusChange: handleStatusChange }),
    [handleStatusChange]
  )

  const columns = useMemo(
    () => allColumns.filter((col) => {
      const colId = 'accessorKey' in col ? col.accessorKey : col.id
      if (colId === 'actions') return true // Always show actions
      return visibleColumns.includes(colId as string)
    }),
    [allColumns, visibleColumns]
  )

  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    )
  }

  // Count contacts by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contacts.length }
    LEAD_STATUSES.forEach((status) => {
      counts[status] = contacts.filter((c) => c.lead_status === status).length
    })
    return counts
  }, [contacts])

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    contacts.forEach((contact) => {
      contact.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [contacts])

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const filteredContacts = useMemo(() => {
    let filtered = contacts

    // Filter by status
    if (activeStatus !== 'all') {
      filtered = filtered.filter((contact) => contact.lead_status === activeStatus)
    }

    // Filter by tags (contact must have ALL selected tags)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((contact) =>
        selectedTags.every((tag) => contact.tags?.includes(tag))
      )
    }

    return filtered
  }, [contacts, activeStatus, selectedTags])

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact)
    setIsDetailOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lead Management</h1>
          <p className="text-muted-foreground">
            {filteredContacts.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Compact Filter Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              {activeStatus === 'all' ? 'All Status' : LEAD_STATUS_CONFIG[activeStatus].label}
              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                {activeStatus === 'all' ? statusCounts.all : statusCounts[activeStatus]}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuCheckboxItem
              checked={activeStatus === 'all'}
              onCheckedChange={() => setActiveStatus('all')}
            >
              All Status
              <span className="ml-auto text-xs text-muted-foreground">{statusCounts.all}</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {LEAD_STATUSES.map((status) => {
              const config = LEAD_STATUS_CONFIG[status]
              return (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={activeStatus === status}
                  onCheckedChange={() => setActiveStatus(status)}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {statusCounts[status]}
                  </span>
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags Filter Dropdown */}
        {allTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Tag className="h-4 w-4 mr-2" />
                Tags
                {selectedTags.length > 0 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    {selectedTags.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="space-y-1">
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <div
                      key={tag}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      <Checkbox checked={isSelected} />
                      <span className="text-sm">{tag}</span>
                    </div>
                  )
                })}
                {selectedTags.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <button
                      onClick={() => setSelectedTags([])}
                      className="w-full text-xs text-muted-foreground hover:text-foreground text-left px-2 py-1"
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Column Visibility Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Columns
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-2">
            <div className="space-y-1">
              {COLUMN_OPTIONS.map((col) => {
                const isVisible = visibleColumns.includes(col.id)
                return (
                  <div
                    key={col.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                    onClick={() => toggleColumn(col.id)}
                  >
                    <Checkbox checked={isVisible} />
                    <span className="text-sm">{col.label}</span>
                  </div>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active filter badges */}
        {(activeStatus !== 'all' || selectedTags.length > 0) && (
          <div className="flex items-center gap-2 ml-2">
            {activeStatus !== 'all' && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: LEAD_STATUS_CONFIG[activeStatus].bgColor,
                  color: LEAD_STATUS_CONFIG[activeStatus].color,
                }}
              >
                {LEAD_STATUS_CONFIG[activeStatus].label}
                <X
                  className="h-3 w-3 cursor-pointer hover:opacity-70"
                  onClick={() => setActiveStatus('all')}
                />
              </span>
            )}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:opacity-70"
                  onClick={() => toggleTag(tag)}
                />
              </span>
            ))}
          </div>
        )}
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
