'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { createColumns } from './columns'
import { ContactDetailSheet } from './contact-detail-sheet'
import { MergeContactsDialog } from './merge-contacts-dialog'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Tag, SlidersHorizontal, X, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import { useContacts, useUpdateContact, useDeleteContact } from '@/lib/queries/use-contacts'
import { useWorkspaceSettings } from '@/lib/queries/use-workspace-settings'
import type { Contact, Workspace, WorkspaceMember, Profile } from '@/types/database'

type TeamMember = WorkspaceMember & { profile: Profile | null }

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'lead_status', label: 'Status' },
  { id: 'tags', label: 'Tags' },
  { id: 'assigned_to', label: 'Assigned to' },
  { id: 'lead_score', label: 'Score' },
  { id: 'created_at', label: 'Created' },
] as const

const STORAGE_KEY = 'my21staff-database-filters'
const DEFAULT_COLUMNS = COLUMN_OPTIONS.map((col) => col.id)

interface DatabaseFilters {
  activeStatus: LeadStatus | 'all'
  selectedTags: string[]
  assignedTo: string // 'all' | 'unassigned' | user_id
  visibleColumns: string[]
}

function loadFiltersFromStorage(): DatabaseFilters {
  if (typeof window === 'undefined') {
    return { activeStatus: 'all', selectedTags: [], assignedTo: 'all', visibleColumns: DEFAULT_COLUMNS }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        activeStatus: parsed.activeStatus || 'all',
        selectedTags: parsed.selectedTags || [],
        assignedTo: parsed.assignedTo || 'all',
        visibleColumns: parsed.visibleColumns || DEFAULT_COLUMNS,
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { activeStatus: 'all', selectedTags: [], assignedTo: 'all', visibleColumns: DEFAULT_COLUMNS }
}

interface DatabaseClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
}

const PAGE_SIZE = 25

export function DatabaseClient({ workspace }: DatabaseClientProps) {
  const [activeStatus, setActiveStatus] = useState<LeadStatus | 'all'>(() => loadFiltersFromStorage().activeStatus)
  const [selectedTags, setSelectedTags] = useState<string[]>(() => loadFiltersFromStorage().selectedTags)
  const [assignedTo, setAssignedTo] = useState<string>(() => loadFiltersFromStorage().assignedTo)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => loadFiltersFromStorage().visibleColumns)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [mergeMode, setMergeMode] = useState(false)
  const [selectedForMerge, setSelectedForMerge] = useState<Contact[]>([])
  const [showMergeDialog, setShowMergeDialog] = useState(false)

  // TanStack Query for contacts with pagination
  const { data: contactsData, isLoading: isLoadingContacts, isFetching } = useContacts(workspace.id, currentPage)

  // TanStack Query for workspace settings (team members, tags)
  const { data: settingsData, isLoading: isLoadingSettings } = useWorkspaceSettings(workspace.id)

  // Extract data from queries
  const contacts = contactsData?.contacts ?? []
  const totalCount = contactsData?.total ?? 0
  const teamMembers = settingsData?.teamMembers ?? []
  const contactTags = settingsData?.contactTags ?? ['Community', '1on1']

  // TanStack Query mutations
  const updateMutation = useUpdateContact(workspace.id)
  const deleteMutation = useDeleteContact(workspace.id)

  // Persist filters to localStorage
  useEffect(() => {
    const filters: DatabaseFilters = { activeStatus, selectedTags, assignedTo, visibleColumns }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, [activeStatus, selectedTags, assignedTo, visibleColumns])

  // Handle inline status change using mutation
  const handleStatusChange = useCallback((contactId: string, newStatus: LeadStatus) => {
    updateMutation.mutate(
      { contactId, updates: { lead_status: newStatus } },
      {
        onError: () => {
          toast.error('Failed to update status')
        },
      }
    )
  }, [updateMutation])

  // Handle inline assignee change using mutation
  const handleAssigneeChange = useCallback((contactId: string, assigneeId: string | null) => {
    updateMutation.mutate(
      { contactId, updates: { assigned_to: assigneeId } },
      {
        onSuccess: () => {
          toast.success(assigneeId ? 'Contact assigned' : 'Contact unassigned')
        },
        onError: () => {
          toast.error('Failed to update assignee')
        },
      }
    )
  }, [updateMutation])

  // Handle inline tags change using mutation
  const handleTagsChange = useCallback((contactId: string, newTags: string[]) => {
    updateMutation.mutate(
      { contactId, updates: { tags: newTags } },
      {
        onSuccess: () => {
          toast.success('Tags updated')
        },
        onError: () => {
          toast.error('Failed to update tags')
        },
      }
    )
  }, [updateMutation])

  // Handle delete contact using mutation
  const handleDeleteContact = useCallback(() => {
    if (!contactToDelete) return

    deleteMutation.mutate(contactToDelete.id, {
      onSuccess: () => {
        toast.success('Contact deleted successfully')
        setContactToDelete(null)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to delete contact')
      },
    })
  }, [contactToDelete, deleteMutation])

  // Handle page navigation - just set the page, TanStack Query handles fetching
  const goToPage = useCallback((page: number) => {
    if (page === currentPage) return
    setCurrentPage(page)
  }, [currentPage])

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Loading state for page transitions (not initial load)
  const isLoadingPage = isFetching

  // Convert team members to column format
  const columnTeamMembers = useMemo(
    () => teamMembers.map((m) => ({
      id: m.user_id,
      name: m.profile?.full_name || m.profile?.email || null,
    })),
    [teamMembers]
  )

  // Create columns with status change handler, filtered by visibility
  const allColumns = useMemo(
    () => createColumns({
      onStatusChange: handleStatusChange,
      onAssigneeChange: handleAssigneeChange,
      onTagsChange: handleTagsChange,
      onDelete: setContactToDelete,
      teamMembers: columnTeamMembers,
      contactTags,
    }),
    [handleStatusChange, handleAssigneeChange, handleTagsChange, columnTeamMembers, contactTags]
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

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  // Get assigned member name helper
  const getAssignedMemberName = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId)
    return member?.profile?.full_name || member?.profile?.email || 'Unknown'
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

    // Filter by assigned to
    if (assignedTo !== 'all') {
      if (assignedTo === 'unassigned') {
        filtered = filtered.filter((contact) => !contact.assigned_to)
      } else {
        filtered = filtered.filter((contact) => contact.assigned_to === assignedTo)
      }
    }

    return filtered
  }, [contacts, activeStatus, selectedTags, assignedTo])

  const handleRowClick = (contact: Contact) => {
    if (mergeMode) {
      setSelectedForMerge(prev => {
        const isSelected = prev.some(c => c.id === contact.id)
        if (isSelected) {
          return prev.filter(c => c.id !== contact.id)
        } else if (prev.length < 2) {
          return [...prev, contact]
        }
        return prev
      })
    } else {
      // Normal behavior - open detail dialog
      setSelectedContact(contact)
      setIsDetailOpen(true)
    }
  }

  // Show skeleton only on initial load (not page transitions)
  if (isLoadingContacts && !contactsData) {
    return <TableSkeleton columns={7} rows={10} />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Database</h1>
          <p className="text-muted-foreground">
            {totalCount} contact{totalCount !== 1 ? 's' : ''}
            {filteredContacts.length !== contacts.length && ` (${filteredContacts.length} shown after filter)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={mergeMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              if (mergeMode) {
                // Cancel merge mode
                setMergeMode(false)
                setSelectedForMerge([])
              } else {
                setMergeMode(true)
              }
            }}
          >
            {mergeMode ? 'Cancel Merge' : 'Merge Duplicates'}
          </Button>

          {mergeMode && selectedForMerge.length === 2 && (
            <Button
              size="sm"
              onClick={() => setShowMergeDialog(true)}
            >
              Merge Selected ({selectedForMerge.length})
            </Button>
          )}
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
        {contactTags.length > 0 && (
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
                {contactTags.map((tag) => {
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

        {/* Assigned To Filter Dropdown */}
        {teamMembers.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <User className="h-4 w-4 mr-2" />
                {assignedTo === 'all' ? 'All Staff' : assignedTo === 'unassigned' ? 'Unassigned' : getAssignedMemberName(assignedTo)}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="space-y-1">
                <div
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                  onClick={() => setAssignedTo('all')}
                >
                  <Checkbox checked={assignedTo === 'all'} />
                  <span className="text-sm">All Staff</span>
                </div>
                <div
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                  onClick={() => setAssignedTo('unassigned')}
                >
                  <Checkbox checked={assignedTo === 'unassigned'} />
                  <span className="text-sm">Unassigned</span>
                </div>
                <DropdownMenuSeparator />
                {teamMembers.map((member) => {
                  const isSelected = assignedTo === member.user_id
                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                      onClick={() => setAssignedTo(member.user_id)}
                    >
                      <Checkbox checked={isSelected} />
                      <span className="text-sm">{member.profile?.full_name || member.profile?.email || 'Unknown'}</span>
                    </div>
                  )
                })}
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
        {(activeStatus !== 'all' || selectedTags.length > 0 || assignedTo !== 'all') && (
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
            {assignedTo !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <User className="h-3 w-3" />
                {assignedTo === 'unassigned' ? 'Unassigned' : getAssignedMemberName(assignedTo)}
                <X
                  className="h-3 w-3 cursor-pointer hover:opacity-70"
                  onClick={() => setAssignedTo('all')}
                />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Merge Mode Instructions */}
      {mergeMode && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Merge Mode:</strong> Select 2 contacts to merge.
            {selectedForMerge.length === 0 && ' Click on any contact to start.'}
            {selectedForMerge.length === 1 && ' Select 1 more contact to merge.'}
            {selectedForMerge.length === 2 && ' Click "Merge Selected" to continue.'}
          </p>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredContacts}
        searchPlaceholder="Search contacts..."
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoadingPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and adjacent pages
              const showPage = page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1

              // Show ellipsis
              const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
              const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2

              if (showEllipsisBefore || showEllipsisAfter) {
                return <span key={page} className="px-2 text-muted-foreground">...</span>
              }

              if (!showPage) return null

              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  className="w-9"
                  onClick={() => goToPage(page)}
                  disabled={isLoadingPage}
                >
                  {isLoadingPage && page === currentPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    page
                  )}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoadingPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground ml-2">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        workspace={{ slug: workspace.slug }}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        contactTags={contactTags}
        teamMembers={teamMembers}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{contactToDelete?.name || contactToDelete?.phone}</strong>?
              This will also delete all associated conversations and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge Contacts Dialog */}
      {showMergeDialog && selectedForMerge.length === 2 && (
        <MergeContactsDialog
          contact1={selectedForMerge[0] as Contact}
          contact2={selectedForMerge[1] as Contact}
          open={showMergeDialog}
          onOpenChange={setShowMergeDialog}
          onMergeComplete={() => {
            setMergeMode(false)
            setSelectedForMerge([])
          }}
        />
      )}
    </div>
  )
}
