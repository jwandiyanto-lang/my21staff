'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, MessageCircle, ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface TeamMember {
  id: string
  name: string | null
}

interface ColumnsConfig {
  onStatusChange?: (contactId: string, newStatus: LeadStatus) => void
  onAssigneeChange?: (contactId: string, assigneeId: string | null) => void
  onTagsChange?: (contactId: string, tags: string[]) => void
  onDelete?: (contact: Contact) => void
  teamMembers?: TeamMember[]
  contactTags?: string[]
}

export function createColumns({ onStatusChange, onAssigneeChange, onTagsChange, onDelete, teamMembers = [], contactTags = [] }: ColumnsConfig = {}): ColumnDef<Contact>[] {
  return [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue('name') as string | null
      const phone = row.original.phone
      return (
        <div>
          <div className="font-medium">{name || 'Unknown'}</div>
          <div className="text-sm text-muted-foreground">{phone}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('email') as string | null
      return email ? (
        <span className="text-sm">{email}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'lead_status',
    header: 'Status',
    cell: ({ row }) => {
      const contact = row.original
      const status = row.getValue('lead_status') as LeadStatus
      const config = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.prospect
      const isDefaultStatus = status === 'prospect'

      if (!onStatusChange) {
        // Show "---" for prospect (default/unassigned status)
        if (isDefaultStatus) {
          return <span className="text-muted-foreground">---</span>
        }
        return (
          <Badge
            style={{
              backgroundColor: config.bgColor,
              color: config.color,
            }}
          >
            {config.label}
          </Badge>
        )
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            {isDefaultStatus ? (
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                ---
                <ChevronDown className="h-3 w-3" />
              </button>
            ) : (
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: config.bgColor,
                  color: config.color,
                }}
              >
                {config.label}
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            {LEAD_STATUSES.map((s) => {
              const sConfig = LEAD_STATUS_CONFIG[s]
              const isSelected = s === status
              return (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onStatusChange(contact.id, s)}
                  className={isSelected ? 'bg-muted' : ''}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: sConfig.color }}
                  />
                  {sConfig.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const contact = row.original
      const tags = row.getValue('tags') as string[] || []

      if (!onTagsChange || contactTags.length === 0) {
        // Read-only display - compact
        if (tags.length === 0) {
          return <span className="text-muted-foreground">-</span>
        }
        if (tags.length === 1) {
          return (
            <Badge variant="secondary" className="text-xs">
              {tags[0]}
            </Badge>
          )
        }
        // 2+ tags: just show count
        return (
          <Badge variant="outline" className="text-xs">
            +{tags.length}
          </Badge>
        )
      }

      // Editable dropdown
      const toggleTag = (tag: string) => {
        const newTags = tags.includes(tag)
          ? tags.filter(t => t !== tag)
          : [...tags, tag]
        onTagsChange(contact.id, newTags)
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            {tags.length === 0 ? (
              <button className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors">
                ---
                <ChevronDown className="h-3 w-3" />
              </button>
            ) : (
              <button className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-muted transition-colors">
                {tags.length === 1 ? (
                  <Badge variant="secondary" className="text-xs">
                    {tags[0]}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    +{tags.length}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            {contactTags.map((tag) => {
              const isSelected = tags.includes(tag)
              return (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="flex items-center gap-2"
                >
                  <Checkbox checked={isSelected} className="h-4 w-4" />
                  <span>{tag}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'assigned_to',
    header: 'Assigned to',
    cell: ({ row }) => {
      const contact = row.original
      const assignedTo = row.getValue('assigned_to') as string | null
      const assignedMember = teamMembers.find((m) => m.id === assignedTo)

      if (!onAssigneeChange) {
        return assignedMember ? (
          <Badge variant="outline" className="text-xs">
            {assignedMember.name || 'Unnamed'}
          </Badge>
        ) : (
          <span className="text-muted-foreground">---</span>
        )
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            {assignedTo && assignedMember ? (
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted text-foreground hover:opacity-80 transition-opacity"
              >
                {assignedMember.name || 'Unnamed'}
                <ChevronDown className="h-3 w-3" />
              </button>
            ) : (
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                ---
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={() => onAssigneeChange(contact.id, null)}
              className={!assignedTo ? 'bg-muted' : ''}
            >
              <span className="w-2 h-2 rounded-full mr-2 bg-muted-foreground" />
              Unassigned
            </DropdownMenuItem>
            {teamMembers.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                {teamMembers.map((member) => (
                  <DropdownMenuItem
                    key={member.id}
                    onClick={() => onAssigneeChange(contact.id, member.id)}
                    className={assignedTo === member.id ? 'bg-muted' : ''}
                  >
                    <span className="w-2 h-2 rounded-full mr-2 bg-primary" />
                    {member.name || 'Unnamed'}
                  </DropdownMenuItem>
                ))}
              </>
            ) : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                  No team members. Add in Settings.
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'lead_score',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const score = row.getValue('lead_score') as number
      let color = '#6B7280' // gray
      if (score >= 80) color = '#10B981' // green
      else if (score >= 60) color = '#F59E0B' // yellow
      else if (score >= 40) color = '#3B82F6' // blue

      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(score, 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="text-sm font-medium" style={{ color }}>
            {score}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const createdAt = row.getValue('created_at') as string
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const contact = row.original
      const phone = contact.phone.replace(/\D/g, '')

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://wa.me/${phone}`, '_blank')
            }}
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(contact.phone)
                }}
              >
                Copy phone number
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://wa.me/${phone}`, '_blank')
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Open WhatsApp
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(contact)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete contact
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
  ]
}

// Backward compatible export
export const columns = createColumns()
