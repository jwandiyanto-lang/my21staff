'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Contact } from '@/types/database'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

interface ContactDetailSheetProps {
  contact: Contact | null
  workspace: { slug: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  contactTags?: string[]
  teamMembers?: unknown[]
}

/**
 * Contact Detail Dialog - 4-tab interface for contact management
 * Tabs: Profile, Documents, Conversations, Notes
 */
export function ContactDetailSheet({
  contact,
  workspace,
  open,
  onOpenChange,
  contactTags = [],
  teamMembers = [],
}: ContactDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [editedFields, setEditedFields] = useState<Partial<Contact>>({})
  const [newNote, setNewNote] = useState('')
  const queryClient = useQueryClient()

  // Fetch notes for this contact
  const { data: notesData } = useQuery({
    queryKey: ['contact-notes', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return { notes: [] }
      const res = await fetch(`/api/contacts/${contact.id}/notes`)
      if (!res.ok) throw new Error('Failed to fetch notes')
      return res.json()
    },
    enabled: !!contact?.id && activeTab === 'notes',
  })

  const notes = notesData?.notes || []

  // Mutation for updating contact
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Contact>) => {
      if (!contact?.id) return
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace: workspace.slug,
          ...updates,
        }),
      })
      if (!res.ok) throw new Error('Failed to update contact')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setEditedFields({})
    },
  })

  // Mutation for adding note
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!contact?.id) return
      const res = await fetch(`/api/contacts/${contact.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', contact?.id] })
      setNewNote('')
    },
  })

  const handleFieldChange = (field: keyof Contact, value: any) => {
    setEditedFields((prev) => ({ ...prev, [field]: value }))
  }

  const handleFieldBlur = (field: keyof Contact) => {
    if (editedFields[field] !== undefined && editedFields[field] !== contact?.[field]) {
      updateMutation.mutate({ [field]: editedFields[field] })
    }
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim())
    }
  }

  const getFieldValue = (field: keyof Contact) => {
    return editedFields[field] !== undefined ? editedFields[field] : contact?.[field]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {contact?.name || contact?.phone || 'Contact'}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            {/* Profile Tab */}
            <TabsContent value="profile" className="m-0 space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={String(getFieldValue('name') || '')}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    placeholder="Contact name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={String(getFieldValue('email') || '')}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs text-muted-foreground">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={contact?.phone || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="lead_status" className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <select
                    id="lead_status"
                    value={String(getFieldValue('lead_status') || 'new')}
                    onChange={(e) => handleFieldChange('lead_status', e.target.value)}
                    onBlur={() => handleFieldBlur('lead_status')}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="new">New</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(contact?.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                    {(!contact?.tags || contact.tags.length === 0) && (
                      <p className="text-sm text-muted-foreground">No tags</p>
                    )}
                  </div>
                </div>

                {contact?.lead_score !== undefined && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Lead Score</Label>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${contact.lead_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {contact.lead_score}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {contact?.metadata && typeof contact.metadata === 'object' && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Score Breakdown
                    </Label>
                    <div className="mt-2 space-y-1 text-sm">
                      {Object.entries(contact.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="m-0">
              <div className="text-sm text-muted-foreground p-8 text-center">
                <p>No documents yet</p>
                <p className="text-xs mt-2">Documents feature coming soon</p>
              </div>
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="m-0">
              <div className="text-sm text-muted-foreground p-8 text-center">
                <p>Conversations will appear here</p>
                <p className="text-xs mt-2">
                  Inbox integration will be rebuilt in next phase
                </p>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="m-0 space-y-4">
              {/* Add note form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </form>

              {/* Notes list */}
              <div className="space-y-3">
                {notes.map((note: any) => (
                  <div key={note._id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes yet
                  </p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
